import { DEFAULT_SETTINGS, STORAGE_KEY } from '../shared/config';
import type { ExtensionSettings } from '../shared/types';
import { SimulationEngine } from './engine';
import { bindKeymap } from './keymap';
import { setupLiveRegions } from './liveRegions';
import { OverlayRenderer } from './overlay';

interface RuntimeMessage {
  type?: 'VB_UPDATE_SETTINGS' | 'VB_TOGGLE_ENABLED';
  settings?: Partial<ExtensionSettings>;
}

async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result: Record<string, unknown>) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined) });
    });
  });
}

(async () => {
  const settings = await loadSettings();
  const engine = new SimulationEngine(settings);
  const overlay = new OverlayRenderer();
  const unbind = bindKeymap(engine, settings);
  const liveObserver = setupLiveRegions(engine);

  engine.on('state', () => {
    overlay.update(engine.getState(), settings);
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type === 'VB_UPDATE_SETTINGS') {
      Object.assign(settings, message.settings ?? {});
      engine.refreshTargets();
      overlay.update(engine.getState(), settings);
      sendResponse({ ok: true });
    }
    if (message.type === 'VB_TOGGLE_ENABLED') {
      settings.enabled = !settings.enabled;
      engine.setEnabled(settings.enabled);
      overlay.update(engine.getState(), settings);
      sendResponse({ ok: true, enabled: settings.enabled });
    }
  });

  window.addEventListener('beforeunload', () => {
    unbind();
    liveObserver.disconnect();
  });

  overlay.update(engine.getState(), settings);
})();
