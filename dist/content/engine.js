import { computeAnnouncement, getCursorTargets, shouldAutoFocusMode } from './a11y';
import { findQuickNavIndex, nextIndex, orderedTargets } from './navigation';
import { DEFAULT_SETTINGS } from '../shared/config';
export class SimulationEngine {
    listeners = new Map();
    settings;
    targets = [];
    state = {
        simMode: 'browse',
        virtualCursorIndex: -1,
        keyboardFocus: document.activeElement,
        currentTarget: null,
        currentAnnouncement: null,
        speechQueue: [],
        speechCurrent: null,
        events: []
    };
    constructor(initialSettings = {}) {
        this.settings = { ...DEFAULT_SETTINGS, ...initialSettings };
        this.refreshTargets();
        document.addEventListener('focusin', this.onFocusIn, true);
    }
    on(event, cb) {
        if (!this.listeners.has(event))
            this.listeners.set(event, new Set());
        this.listeners.get(event)?.add(cb);
        return () => this.listeners.get(event)?.delete(cb);
    }
    getState() {
        return { ...this.state, events: [...this.state.events], speechQueue: [...this.state.speechQueue] };
    }
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        this.emit('settings', this.settings);
    }
    setHudLevel(level) {
        this.settings.hudLevel = level;
        this.emit('settings', this.settings);
    }
    setVisualMode(mode) {
        this.settings.visualMode = mode;
        this.emit('settings', this.settings);
    }
    refreshTargets() {
        this.targets = orderedTargets(getCursorTargets(document));
        if (!this.targets.length)
            return;
        if (this.state.virtualCursorIndex < 0 || this.state.virtualCursorIndex >= this.targets.length) {
            this.state.virtualCursorIndex = 0;
            this.applyTarget(0, 'browse_move');
        }
    }
    moveVirtualCursor(delta, reason = 'browse_move') {
        if (!this.settings.enabled || this.state.simMode === 'focus')
            return;
        const idx = nextIndex(this.state.virtualCursorIndex, this.targets.length, delta, this.settings.wrapNavigation);
        this.applyTarget(idx, reason);
    }
    quickNav(category, direction = 1) {
        if (!this.settings.enabled || this.state.simMode === 'focus')
            return;
        const idx = findQuickNavIndex(this.targets, this.state.virtualCursorIndex, category, direction, this.settings.wrapNavigation);
        this.applyTarget(idx, 'shortcut_nav');
    }
    activateCurrentTarget() {
        const target = this.state.currentTarget;
        if (!target)
            return;
        const el = target.element;
        if (target.role === 'link' || target.role === 'button') {
            el.click();
            this.pushEvent('vc_move', `Activated ${target.role}`);
            return;
        }
        if (target.category === 'field') {
            el.focus();
            this.setMode('focus', 'Activated form control');
            return;
        }
        el.click();
    }
    setMode(mode, reason = 'manual') {
        if (this.state.simMode === mode)
            return;
        this.state.simMode = mode;
        if (mode === 'focus' && this.state.currentTarget) {
            this.state.currentTarget.element.focus();
        }
        this.pushEvent('mode_switch', `Mode ${mode}: ${reason}`);
        this.queueSpeech(`${mode} mode`, 'high', 'system');
        this.emit('state', this.getState());
    }
    toggleModeManual() {
        this.setMode(this.state.simMode === 'browse' ? 'focus' : 'browse', 'Manual toggle');
    }
    queueSpeech(text, priority, source) {
        const item = {
            id: `speech-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            text,
            priority,
            source,
            createdAt: Date.now()
        };
        if (priority === 'interrupt') {
            this.state.speechCurrent = item;
            this.state.speechQueue = [];
            this.pushEvent('speech_interrupt', `Interrupted: ${text.slice(0, 50)}`);
            this.emit('state', this.getState());
            return;
        }
        if (!this.state.speechCurrent) {
            this.state.speechCurrent = item;
            this.pushEvent('speech_start', text.slice(0, 50));
            this.emit('state', this.getState());
            return;
        }
        this.state.speechQueue.push(item);
        this.emit('state', this.getState());
    }
    announceLiveRegion(text, assertive) {
        this.pushEvent('live_region', text.slice(0, 60));
        this.queueSpeech(text, assertive ? 'interrupt' : 'normal', 'live_region');
    }
    applyTarget(index, reason) {
        if (index < 0 || index >= this.targets.length)
            return;
        this.state.virtualCursorIndex = index;
        this.state.currentTarget = this.targets[index];
        this.state.currentAnnouncement = computeAnnouncement(this.targets[index], reason);
        this.pushEvent('vc_move', `${this.targets[index].role}: ${this.targets[index].name || '(unnamed)'}`);
        this.queueSpeech(this.state.currentAnnouncement.spokenText, 'normal', reason === 'focus' ? 'focus' : 'browse_move');
        if (shouldAutoFocusMode(this.targets[index])) {
            this.setMode('focus', 'Auto-enter editable control');
        }
        this.emit('state', this.getState());
    }
    pushEvent(type, label) {
        this.state.events.unshift({ ts: Date.now(), type, label });
        this.state.events = this.state.events.slice(0, 10);
    }
    emit(event, payload) {
        this.listeners.get(event)?.forEach((listener) => listener(payload));
    }
    onFocusIn = (event) => {
        this.state.keyboardFocus = event.target;
        this.pushEvent('focus_move', `Focus moved to ${event.target?.tagName?.toLowerCase() || 'unknown'}`);
        if (this.state.simMode === 'focus' && this.state.currentTarget) {
            const active = document.activeElement;
            if (!active || active !== this.state.currentTarget.element) {
                this.setMode('browse', 'Focus moved away');
            }
        }
        this.emit('state', this.getState());
    };
}
