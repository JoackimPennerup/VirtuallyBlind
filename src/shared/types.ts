export type SimMode = 'browse' | 'focus';
export type HudLevel = 'learner' | 'debug';
export type VisualMode = 'blackout' | 'highlight';

export type AnnouncementReason =
  | 'browse_move'
  | 'focus'
  | 'mode_switch'
  | 'live_region'
  | 'state_change'
  | 'shortcut_nav';

export type SpeechPriority = 'low' | 'normal' | 'high' | 'interrupt';

export type SpeechSource = 'browse_move' | 'focus' | 'live_region' | 'system';

export type HudEventType =
  | 'vc_move'
  | 'focus_move'
  | 'mode_switch'
  | 'speech_start'
  | 'speech_interrupt'
  | 'live_region'
  | 'dom_mutation';

export interface CursorStates {
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  checked?: boolean;
  selected?: boolean;
  expanded?: boolean;
  pressed?: boolean;
}

export interface SemanticsDebug {
  nameSource: string;
  roleSource: 'implicit' | 'explicit';
  descriptionSource: string;
}

export interface CursorTarget {
  id: string;
  element: Element;
  domPathShort: string;
  tagName: string;
  role: string;
  name: string;
  states: CursorStates;
  valueText?: string;
  contextText?: string;
  descriptionText?: string;
  debug: SemanticsDebug;
  boundingRect: DOMRect;
  headingLevel?: number;
  category: 'heading' | 'link' | 'button' | 'field' | 'landmark' | 'image' | 'other';
}

export interface AnnouncementSnapshot {
  spokenText: string;
  reason: AnnouncementReason;
  roleText: string;
  nameText: string;
  stateText?: string;
  valueText?: string;
  contextText?: string;
  debug: {
    nameSource: string;
    roleSource: string;
    descriptionText?: string;
    descriptionSource: string;
  };
}

export interface SpeechItem {
  id: string;
  text: string;
  priority: SpeechPriority;
  createdAt: number;
  source: SpeechSource;
}

export interface HudEvent {
  ts: number;
  type: HudEventType;
  label: string;
}

export interface ExtensionSettings {
  enabled: boolean;
  visualMode: VisualMode;
  hudLevel: HudLevel;
  wrapNavigation: boolean;
  holePadding: number;
  shortcuts: Record<string, string>;
}

export interface EngineState {
  simMode: SimMode;
  virtualCursorIndex: number;
  keyboardFocus: Element | null;
  currentTarget: CursorTarget | null;
  currentAnnouncement: AnnouncementSnapshot | null;
  speechQueue: SpeechItem[];
  speechCurrent: SpeechItem | null;
  events: HudEvent[];
}

export interface EngineApi {
  refreshTargets(): void;
  moveVirtualCursor(delta: 1 | -1, reason?: AnnouncementReason): void;
  quickNav(category: 'heading' | 'link' | 'button' | 'field' | 'landmark', direction?: 1 | -1): void;
  activateCurrentTarget(): void;
  setMode(mode: SimMode, reason?: string): void;
  toggleModeManual(): void;
  queueSpeech(text: string, priority: SpeechPriority, source: SpeechSource): void;
  setEnabled(enabled: boolean): void;
  setHudLevel(level: HudLevel): void;
  setVisualMode(mode: VisualMode): void;
  getState(): EngineState;
  on(event: string, cb: (payload?: unknown) => void): () => void;
}
