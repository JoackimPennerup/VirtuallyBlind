import type { EngineState, ExtensionSettings } from '../shared/types';

export class OverlayRenderer {
  private host: HTMLDivElement;
  private shadow: ShadowRoot;
  private maskEl: HTMLDivElement;
  private revealEl: HTMLDivElement;
  private highlightEl: HTMLDivElement;
  private hudEl: HTMLDivElement;

  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'virtually-blind-root';
    this.shadow = this.host.attachShadow({ mode: 'open' });
    this.maskEl = document.createElement('div');
    this.revealEl = document.createElement('div');
    this.highlightEl = document.createElement('div');
    this.hudEl = document.createElement('div');
    this.renderShell();
    document.documentElement.appendChild(this.host);
  }

  update(state: EngineState, settings: ExtensionSettings): void {
    const rect = state.currentTarget?.boundingRect;
    this.maskEl.style.display = settings.enabled && settings.visualMode === 'blackout' && rect ? 'block' : 'none';
    this.highlightEl.style.display = settings.enabled && settings.visualMode === 'highlight' && rect ? 'block' : 'none';

    if (rect) {
      const left = Math.max(0, rect.left - settings.holePadding);
      const top = Math.max(0, rect.top - settings.holePadding);
      const width = rect.width + settings.holePadding * 2;
      const height = rect.height + settings.holePadding * 2;
      Object.assign(this.revealEl.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      });
      Object.assign(this.highlightEl.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      });
    }

    this.hudEl.innerHTML = this.renderHud(state, settings);
  }

  private renderShell(): void {
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; }
      .mask { background: rgba(0,0,0,.85); }
      .reveal { position: fixed; box-shadow: 0 0 0 9999px rgba(0,0,0,.85); border-radius: 6px; background: transparent; }
      .highlight { position: fixed; border: 3px solid hotpink; border-radius: 6px; }
      .hud { position: fixed; left: 0; right: 0; bottom: 0; color: #fff; background: rgba(16,16,16,.92); font: 12px/1.4 system-ui, sans-serif; padding: 8px 12px; border-top: 1px solid #444; }
      .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .badge { border: 1px solid #666; border-radius: 999px; padding: 2px 8px; }
      .subtitle { font-size: 14px; margin-top: 4px; color: #9de6ff; }
      .dim { opacity: .8; }
      .help { margin-top: 6px; font-size: 11px; opacity: .9; }
      .queue { font-size: 11px; margin-top: 4px; color: #ffcf87; }
      .list { margin-top: 4px; font-size: 11px; max-height: 60px; overflow: hidden; }
    `;

    this.maskEl.className = 'layer mask';
    this.revealEl.className = 'reveal';
    this.highlightEl.className = 'highlight';
    this.hudEl.className = 'hud';

    this.maskEl.appendChild(this.revealEl);
    this.shadow.append(style, this.maskEl, this.highlightEl, this.hudEl);
  }

  private renderHud(state: EngineState, settings: ExtensionSettings): string {
    const target = state.currentTarget;
    const announcement = state.currentAnnouncement;
    const lastEvent = state.events[0];
    const states = Object.entries(target?.states ?? {})
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}:${String(v)}`)
      .join(' | ');

    const esc = (value: string): string =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const common = `
      <div class="row">
        <span class="badge">mode: ${state.simMode}</span>
        <span class="badge">target: ${esc(announcement?.roleText || 'none')} ${esc(announcement?.nameText || '')}</span>
        <span class="badge">vc≠focus: ${String(target?.element !== state.keyboardFocus)}</span>
        ${states ? `<span class="badge">${esc(states)}</span>` : ''}
        ${lastEvent ? `<span class="badge">event: ${lastEvent.type}</span>` : ''}
      </div>
      <div class="subtitle">${esc(state.speechCurrent?.text || announcement?.spokenText || 'No speech')}</div>
      <div class="help">Shortcuts: ${Object.entries(settings.shortcuts)
        .map(([action, key]) => `${esc(action)}:${esc(key)}`)
        .join(' · ')}</div>
    `;

    if (settings.hudLevel === 'learner') return common;

    const queuePreview = [state.speechCurrent, ...state.speechQueue]
      .filter(Boolean)
      .slice(0, 4)
      .map((item) => item?.text)
      .join(' → ');
    const events = state.events
      .slice(0, 5)
      .map((event) => `<div>${esc(new Date(event.ts).toLocaleTimeString())} ${esc(event.type)}: ${esc(event.label)}</div>`)
      .join('');
    return `${common}
      <div class="queue">speech queue: ${esc(queuePreview || 'empty')}</div>
      <div class="dim">name source: ${esc(announcement?.debug.nameSource || '-')} · role source: ${esc(announcement?.debug.roleSource || '-')} · description source: ${esc(announcement?.debug.descriptionSource || '-')}</div>
      <div class="list">${events}</div>
    `;
  }
}
