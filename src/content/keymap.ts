import { SimulationEngine } from './engine';
import type { ExtensionSettings } from '../shared/types';

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1].toLowerCase();
  const requireAlt = parts.includes('Alt');
  const requireShift = parts.includes('Shift');
  const requireCtrl = parts.includes('Ctrl');
  const requireMeta = parts.includes('Meta');
  const eventKey = event.key.toLowerCase();

  return (
    eventKey === key &&
    event.altKey === requireAlt &&
    event.shiftKey === requireShift &&
    event.ctrlKey === requireCtrl &&
    event.metaKey === requireMeta
  );
}

export function bindKeymap(engine: SimulationEngine, settings: ExtensionSettings): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    const action = Object.entries(settings.shortcuts).find(([, shortcut]) => matchesShortcut(event, shortcut))?.[0];
    if (!action) return;

    event.preventDefault();
    switch (action) {
      case 'toggleExtension':
        settings.enabled = !settings.enabled;
        engine.setEnabled(settings.enabled);
        break;
      case 'toggleVisualMode':
        settings.visualMode = settings.visualMode === 'blackout' ? 'highlight' : 'blackout';
        engine.setVisualMode(settings.visualMode);
        break;
      case 'toggleHudMode':
        settings.hudLevel = settings.hudLevel === 'learner' ? 'debug' : 'learner';
        engine.setHudLevel(settings.hudLevel);
        break;
      case 'next':
        engine.moveVirtualCursor(1);
        break;
      case 'previous':
        engine.moveVirtualCursor(-1);
        break;
      case 'activate':
        engine.activateCurrentTarget();
        break;
      case 'toggleMode':
        engine.toggleModeManual();
        break;
      case 'nextHeading':
        engine.quickNav('heading');
        break;
      case 'nextLink':
        engine.quickNav('link');
        break;
      case 'nextButton':
        engine.quickNav('button');
        break;
      case 'nextField':
        engine.quickNav('field');
        break;
      case 'nextLandmark':
        engine.quickNav('landmark');
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown, true);
  return () => window.removeEventListener('keydown', onKeyDown, true);
}
