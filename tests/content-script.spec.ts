import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const CONTENT_SCRIPT_PATH = path.resolve(process.cwd(), 'dist/content/index.js');

async function bootstrap(page: Page, html: string): Promise<void> {
  await page.addInitScript(() => {
    const storage: Record<string, unknown> = {};
    const listeners: Array<(...args: unknown[]) => void> = [];
    const runtime = {
      onMessage: {
        addListener(listener: (...args: unknown[]) => void) {
          listeners.push(listener);
        },
        removeListener(listener: (...args: unknown[]) => void) {
          const index = listeners.indexOf(listener);
          if (index >= 0) listeners.splice(index, 1);
        }
      },
      sendMessage() {}
    };
    (window as unknown as { chrome: unknown }).chrome = {
      storage: {
        sync: {
          get(keys: string[] | string, cb: (result: Record<string, unknown>) => void) {
            if (Array.isArray(keys)) {
              const result: Record<string, unknown> = {};
              for (const key of keys) result[key] = storage[key];
              cb(result);
              return;
            }
            cb({ [keys]: storage[keys] });
          },
          set(data: Record<string, unknown>, cb?: () => void) {
            Object.assign(storage, data);
            cb?.();
          }
        }
      },
      runtime
    };
  });

  await page.goto('about:blank');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: CONTENT_SCRIPT_PATH });
  await expect(page.locator('#virtually-blind-root')).toHaveCount(1);
}

async function hudSnapshot(page: Page): Promise<{ mode: string; target: string; subtitle: string }> {
  return page.evaluate(() => {
    const root = document.querySelector('#virtually-blind-root') as HTMLDivElement | null;
    const shadow = root?.shadowRoot;
    const badges = Array.from(shadow?.querySelectorAll('.badge') ?? []).map((badge) => badge.textContent?.trim() ?? '');
    const subtitle = shadow?.querySelector('.subtitle')?.textContent?.trim() ?? '';
    return {
      mode: badges[0] ?? '',
      target: badges[1] ?? '',
      subtitle
    };
  });
}

async function pressShortcut(page: Page, key: string, code: string): Promise<void> {
  await page.evaluate(({ value, keyCode }) => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: value,
        code: keyCode,
        altKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      })
    );
  }, { value: key, keyCode: code });
}

test('renders HUD in browse mode with first target announcement', async ({ page }) => {
  await bootstrap(
    page,
    `
    <h1>Welcome</h1>
    <a href="https://example.com/docs">Docs</a>
    <button>Launch</button>
    `
  );

  await expect
    .poll(async () => hudSnapshot(page), {
      message: 'HUD should render mode, target, and spoken text for first target'
    })
    .toMatchObject({ mode: 'mode: browse', target: 'target: heading Welcome' });

  await expect
    .poll(async () => (await hudSnapshot(page)).subtitle)
    .toContain('Welcome. heading. Heading level 1');
});

test('toggles between browse and focus mode with manual shortcut', async ({ page }) => {
  await bootstrap(
    page,
    `
    <h1>Top</h1>
    <a href="https://example.com/first">First Link</a>
    <button>Do Action</button>
    <a href="https://example.com/second">Second Link</a>
    `
  );

  await pressShortcut(page, 'M', 'KeyM');
  await expect
    .poll(async () => (await hudSnapshot(page)).mode, {
      message: 'Alt+Shift+M should switch from browse mode to focus mode'
    })
    .toBe('mode: focus');

  await pressShortcut(page, 'M', 'KeyM');
  await expect
    .poll(async () => (await hudSnapshot(page)).mode, {
      message: 'Alt+Shift+M should switch from focus mode back to browse mode'
    })
    .toBe('mode: browse');
});

test('auto-enters focus mode when quick-nav lands on text input', async ({ page }) => {
  await bootstrap(
    page,
    `
    <h1>Profile</h1>
    <label for="name">Name</label>
    <input id="name" type="text" value="Ada" />
    `
  );

  await pressShortcut(page, 'F', 'KeyF');
  await expect
    .poll(async () => (await hudSnapshot(page)).mode, {
      message: 'Alt+Shift+F should move to field and switch to focus mode'
    })
    .toBe('mode: focus');

  await expect
    .poll(async () =>
      page.evaluate(() => (document.activeElement as HTMLElement | null)?.id ?? '')
    )
    .toBe('name');
});

test('assertive live region updates interrupt current speech', async ({ page }) => {
  await bootstrap(
    page,
    `
    <h1>Status</h1>
    <div id="polite" aria-live="polite"></div>
    <div id="assertive" aria-live="assertive"></div>
    `
  );

  await page.evaluate(() => {
    const polite = document.getElementById('polite');
    const assertive = document.getElementById('assertive');
    if (!polite || !assertive) return;
    polite.textContent = 'Background sync finished';
    assertive.textContent = 'Connection lost';
  });

  await expect
    .poll(async () => (await hudSnapshot(page)).subtitle, {
      message: 'assertive live region should interrupt and become current speech'
    })
    .toContain('Connection lost');
});
