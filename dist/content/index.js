"use strict";
(() => {
  // src/shared/config.ts
  var DEFAULT_SETTINGS = {
    enabled: true,
    visualMode: "highlight",
    hudLevel: "learner",
    wrapNavigation: true,
    holePadding: 8,
    shortcuts: {
      toggleExtension: "Alt+Shift+V",
      toggleVisualMode: "Alt+Shift+O",
      toggleHudMode: "Alt+Shift+U",
      next: "Alt+Shift+ArrowDown",
      previous: "Alt+Shift+ArrowUp",
      activate: "Alt+Shift+Enter",
      toggleMode: "Alt+Shift+M",
      nextHeading: "Alt+Shift+H",
      nextLink: "Alt+Shift+K",
      nextButton: "Alt+Shift+B",
      nextField: "Alt+Shift+F",
      nextLandmark: "Alt+Shift+D"
    }
  };
  var STORAGE_KEY = "virtuallyBlindSettings";

  // src/content/a11y.ts
  var LANDMARK_ROLES = /* @__PURE__ */ new Set(["banner", "main", "navigation", "contentinfo", "complementary", "region", "search", "form"]);
  function isHidden(el) {
    const htmlEl = el;
    if (htmlEl.hidden) return true;
    if (el.getAttribute("aria-hidden") === "true") return true;
    const style = window.getComputedStyle(htmlEl);
    return style.display === "none" || style.visibility === "hidden";
  }
  function shortPath(el) {
    const id = el.id ? `#${el.id}` : "";
    const className = el.classList.length ? `.${el.classList[0]}` : "";
    return `${el.tagName.toLowerCase()}${id}${className}`;
  }
  function textFromIds(ids) {
    if (!ids) return "";
    return ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() || "").filter(Boolean).join(" ");
  }
  function getRole(el) {
    const explicitRole = el.getAttribute("role");
    if (explicitRole) {
      return { role: explicitRole, source: "explicit" };
    }
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return { role: "heading", source: "implicit", headingLevel: Number(tag[1]) };
    if (tag === "a" && el.href) return { role: "link", source: "implicit" };
    if (tag === "button") return { role: "button", source: "implicit" };
    if (tag === "textarea") return { role: "textbox", source: "implicit" };
    if (tag === "select") return { role: "combobox", source: "implicit" };
    if (tag === "img") return { role: "img", source: "implicit" };
    if (tag === "nav") return { role: "navigation", source: "implicit" };
    if (tag === "main") return { role: "main", source: "implicit" };
    if (tag === "header") return { role: "banner", source: "implicit" };
    if (tag === "footer") return { role: "contentinfo", source: "implicit" };
    if (tag === "aside") return { role: "complementary", source: "implicit" };
    if (tag === "input") {
      const input = el;
      const type = input.type || "text";
      if (["checkbox"].includes(type)) return { role: "checkbox", source: "implicit" };
      if (["radio"].includes(type)) return { role: "radio", source: "implicit" };
      if (["button", "submit", "reset"].includes(type)) return { role: "button", source: "implicit" };
      return { role: "textbox", source: "implicit" };
    }
    return { role: "generic", source: "implicit" };
  }
  function getName(el) {
    const ariaLabel = el.getAttribute("aria-label")?.trim();
    if (ariaLabel) return { name: ariaLabel, source: "aria-label" };
    const ariaLabelledBy = textFromIds(el.getAttribute("aria-labelledby"));
    if (ariaLabelledBy) return { name: ariaLabelledBy, source: "aria-labelledby" };
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim();
      if (label) return { name: label, source: "label[for]" };
    }
    if (el.tagName.toLowerCase() === "img") {
      const alt = el.alt?.trim();
      if (alt) return { name: alt, source: "alt" };
    }
    const labelWrap = el.closest("label")?.textContent?.trim();
    if (labelWrap) return { name: labelWrap, source: "label-wrap" };
    const text = el.textContent?.trim();
    if (text) return { name: text.slice(0, 120), source: "text" };
    const title = el.getAttribute("title")?.trim();
    if (title) return { name: title, source: "title" };
    return { name: "", source: "unknown" };
  }
  function getStates(el) {
    const htmlEl = el;
    const states = {};
    states.disabled = htmlEl.matches(":disabled") || el.getAttribute("aria-disabled") === "true";
    states.required = htmlEl.matches(":required") || el.getAttribute("aria-required") === "true";
    states.invalid = htmlEl.matches(":invalid") || el.getAttribute("aria-invalid") === "true";
    states.expanded = el.getAttribute("aria-expanded") === "true" ? true : el.getAttribute("aria-expanded") === "false" ? false : void 0;
    states.pressed = el.getAttribute("aria-pressed") === "true" ? true : el.getAttribute("aria-pressed") === "false" ? false : void 0;
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") states.checked = el.checked;
    }
    if (el instanceof HTMLOptionElement) states.selected = el.selected;
    return states;
  }
  function getValueText(el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value || void 0;
    if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.text || void 0;
    return void 0;
  }
  function getDescription(el) {
    const describedBy = textFromIds(el.getAttribute("aria-describedby"));
    if (describedBy) return { text: describedBy, source: "aria-describedby" };
    const title = el.getAttribute("title");
    if (title) return { text: title, source: "title" };
    return { source: "unknown" };
  }
  function isNavigable(el) {
    if (isHidden(el)) return false;
    const { role } = getRole(el);
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return true;
    if (tag === "a" && el.href) return true;
    if (tag === "button") return true;
    if (tag === "img" && Boolean(el.alt)) return true;
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (["nav", "main", "header", "footer", "aside"].includes(tag)) return true;
    if (LANDMARK_ROLES.has(role)) return true;
    return false;
  }
  function categoryFor(el, role) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag) || role === "heading") return "heading";
    if (role === "link") return "link";
    if (role === "button") return "button";
    if (["input", "textarea", "select"].includes(tag) || ["textbox", "combobox", "checkbox", "radio"].includes(role)) return "field";
    if (LANDMARK_ROLES.has(role)) return "landmark";
    if (role === "img") return "image";
    return "other";
  }
  function getCursorTargets(root = document) {
    const candidates = Array.from(root.querySelectorAll("*"));
    return candidates.filter(isNavigable).map((el, index) => {
      const roleInfo = getRole(el);
      const nameInfo = getName(el);
      const description = getDescription(el);
      const valueText = getValueText(el);
      const rect = el.getBoundingClientRect();
      return {
        id: `target-${index}`,
        element: el,
        domPathShort: shortPath(el),
        tagName: el.tagName.toLowerCase(),
        role: roleInfo.role,
        name: nameInfo.name,
        states: getStates(el),
        valueText,
        contextText: roleInfo.headingLevel ? `Heading level ${roleInfo.headingLevel}` : void 0,
        descriptionText: description.text,
        debug: {
          nameSource: nameInfo.source,
          roleSource: roleInfo.source,
          descriptionSource: description.source
        },
        boundingRect: rect,
        headingLevel: roleInfo.headingLevel,
        category: categoryFor(el, roleInfo.role)
      };
    });
  }
  function computeAnnouncement(target, reason) {
    const states = Object.entries(target.states).filter(([, value]) => value !== void 0).map(([key, value]) => typeof value === "boolean" ? value ? key : `not ${key}` : `${key} ${value}`);
    const parts = [
      target.name,
      target.role,
      target.contextText,
      states.join(", "),
      target.valueText,
      target.descriptionText
    ].filter(Boolean);
    return {
      spokenText: parts.join(". "),
      reason,
      roleText: target.role,
      nameText: target.name,
      stateText: states.join(", "),
      valueText: target.valueText,
      contextText: target.contextText,
      debug: {
        nameSource: target.debug.nameSource,
        roleSource: target.debug.roleSource,
        descriptionText: target.descriptionText,
        descriptionSource: target.debug.descriptionSource
      }
    };
  }
  function shouldAutoFocusMode(target) {
    const el = target.element;
    if (el.isContentEditable) return true;
    return ["textbox", "combobox", "listbox", "spinbutton", "slider"].includes(target.role);
  }

  // src/content/navigation.ts
  function orderedTargets(targets) {
    return [...targets].sort((a, b) => {
      if (a.element === b.element) return 0;
      const pos = a.element.compareDocumentPosition(b.element);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }
  function nextIndex(current, size, delta, wrap) {
    if (size === 0) return -1;
    const candidate = current + delta;
    if (candidate >= 0 && candidate < size) return candidate;
    if (!wrap) return current;
    return candidate < 0 ? size - 1 : 0;
  }
  function findQuickNavIndex(targets, currentIndex, category, direction, wrap) {
    if (!targets.length) return -1;
    let cursor = currentIndex;
    const visited = /* @__PURE__ */ new Set();
    while (true) {
      cursor = nextIndex(cursor, targets.length, direction, wrap);
      if (cursor === currentIndex || visited.has(cursor)) return currentIndex;
      visited.add(cursor);
      if (targets[cursor].category === category) return cursor;
    }
  }

  // src/content/engine.ts
  var SimulationEngine = class {
    listeners = /* @__PURE__ */ new Map();
    settings;
    targets = [];
    state = {
      simMode: "browse",
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
      document.addEventListener("focusin", this.onFocusIn, true);
    }
    on(event, cb) {
      if (!this.listeners.has(event)) this.listeners.set(event, /* @__PURE__ */ new Set());
      this.listeners.get(event)?.add(cb);
      return () => this.listeners.get(event)?.delete(cb);
    }
    getState() {
      return { ...this.state, events: [...this.state.events], speechQueue: [...this.state.speechQueue] };
    }
    setEnabled(enabled) {
      this.settings.enabled = enabled;
      this.emit("settings", this.settings);
    }
    setHudLevel(level) {
      this.settings.hudLevel = level;
      this.emit("settings", this.settings);
    }
    setVisualMode(mode) {
      this.settings.visualMode = mode;
      this.emit("settings", this.settings);
    }
    refreshTargets() {
      this.targets = orderedTargets(getCursorTargets(document));
      if (!this.targets.length) return;
      if (this.state.virtualCursorIndex < 0 || this.state.virtualCursorIndex >= this.targets.length) {
        this.state.virtualCursorIndex = 0;
        this.applyTarget(0, "browse_move");
      }
    }
    moveVirtualCursor(delta, reason = "browse_move") {
      if (!this.settings.enabled || this.state.simMode === "focus") return;
      const idx = nextIndex(this.state.virtualCursorIndex, this.targets.length, delta, this.settings.wrapNavigation);
      this.applyTarget(idx, reason);
    }
    quickNav(category, direction = 1) {
      if (!this.settings.enabled || this.state.simMode === "focus") return;
      const idx = findQuickNavIndex(this.targets, this.state.virtualCursorIndex, category, direction, this.settings.wrapNavigation);
      this.applyTarget(idx, "shortcut_nav");
    }
    activateCurrentTarget() {
      const target = this.state.currentTarget;
      if (!target) return;
      const el = target.element;
      if (target.role === "link" || target.role === "button") {
        el.click();
        this.pushEvent("vc_move", `Activated ${target.role}`);
        return;
      }
      if (target.category === "field") {
        el.focus();
        this.setMode("focus", "Activated form control");
        return;
      }
      el.click();
    }
    setMode(mode, reason = "manual") {
      if (this.state.simMode === mode) return;
      this.state.simMode = mode;
      if (mode === "focus" && this.state.currentTarget) {
        this.state.currentTarget.element.focus();
      }
      this.pushEvent("mode_switch", `Mode ${mode}: ${reason}`);
      this.queueSpeech(`${mode} mode`, "high", "system");
      this.emit("state", this.getState());
    }
    toggleModeManual() {
      this.setMode(this.state.simMode === "browse" ? "focus" : "browse", "Manual toggle");
    }
    queueSpeech(text, priority, source) {
      const item = {
        id: `speech-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
        priority,
        source,
        createdAt: Date.now()
      };
      if (priority === "interrupt") {
        this.state.speechCurrent = item;
        this.state.speechQueue = [];
        this.pushEvent("speech_interrupt", `Interrupted: ${text.slice(0, 50)}`);
        this.emit("state", this.getState());
        return;
      }
      if (!this.state.speechCurrent) {
        this.state.speechCurrent = item;
        this.pushEvent("speech_start", text.slice(0, 50));
        this.emit("state", this.getState());
        return;
      }
      this.state.speechQueue.push(item);
      this.emit("state", this.getState());
    }
    announceLiveRegion(text, assertive) {
      this.pushEvent("live_region", text.slice(0, 60));
      this.queueSpeech(text, assertive ? "interrupt" : "normal", "live_region");
    }
    applyTarget(index, reason) {
      if (index < 0 || index >= this.targets.length) return;
      this.state.virtualCursorIndex = index;
      this.state.currentTarget = this.targets[index];
      this.state.currentAnnouncement = computeAnnouncement(this.targets[index], reason);
      this.pushEvent("vc_move", `${this.targets[index].role}: ${this.targets[index].name || "(unnamed)"}`);
      this.queueSpeech(this.state.currentAnnouncement.spokenText, "normal", reason === "focus" ? "focus" : "browse_move");
      if (shouldAutoFocusMode(this.targets[index])) {
        this.setMode("focus", "Auto-enter editable control");
      }
      this.emit("state", this.getState());
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
      this.pushEvent("focus_move", `Focus moved to ${event.target?.tagName?.toLowerCase() || "unknown"}`);
      if (this.state.simMode === "focus" && this.state.currentTarget) {
        const active = document.activeElement;
        if (!active || active !== this.state.currentTarget.element) {
          this.setMode("browse", "Focus moved away");
        }
      }
      this.emit("state", this.getState());
    };
  };

  // src/content/keymap.ts
  function matchesShortcut(event, shortcut) {
    const parts = shortcut.split("+");
    const key = parts[parts.length - 1].toLowerCase();
    const requireAlt = parts.includes("Alt");
    const requireShift = parts.includes("Shift");
    const requireCtrl = parts.includes("Ctrl");
    const requireMeta = parts.includes("Meta");
    const eventKey = event.key.toLowerCase();
    return eventKey === key && event.altKey === requireAlt && event.shiftKey === requireShift && event.ctrlKey === requireCtrl && event.metaKey === requireMeta;
  }
  function bindKeymap(engine, settings) {
    const onKeyDown = (event) => {
      const action = Object.entries(settings.shortcuts).find(([, shortcut]) => matchesShortcut(event, shortcut))?.[0];
      if (!action) return;
      event.preventDefault();
      switch (action) {
        case "toggleExtension":
          settings.enabled = !settings.enabled;
          engine.setEnabled(settings.enabled);
          break;
        case "toggleVisualMode":
          settings.visualMode = settings.visualMode === "blackout" ? "highlight" : "blackout";
          engine.setVisualMode(settings.visualMode);
          break;
        case "toggleHudMode":
          settings.hudLevel = settings.hudLevel === "learner" ? "debug" : "learner";
          engine.setHudLevel(settings.hudLevel);
          break;
        case "next":
          engine.moveVirtualCursor(1);
          break;
        case "previous":
          engine.moveVirtualCursor(-1);
          break;
        case "activate":
          engine.activateCurrentTarget();
          break;
        case "toggleMode":
          engine.toggleModeManual();
          break;
        case "nextHeading":
          engine.quickNav("heading");
          break;
        case "nextLink":
          engine.quickNav("link");
          break;
        case "nextButton":
          engine.quickNav("button");
          break;
        case "nextField":
          engine.quickNav("field");
          break;
        case "nextLandmark":
          engine.quickNav("landmark");
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }

  // src/content/liveRegions.ts
  function setupLiveRegions(engine) {
    let timer;
    const queue = [];
    const flush = () => {
      const items = queue.splice(0);
      for (const item of items) {
        engine.announceLiveRegion(item.text, item.assertive);
      }
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        if (!target) continue;
        const liveNode = target.closest("[aria-live]");
        if (!liveNode) continue;
        const politeness = liveNode.getAttribute("aria-live") || "polite";
        const text = liveNode.textContent?.trim();
        if (!text) continue;
        queue.push({ text, assertive: politeness === "assertive" });
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 120);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    return observer;
  }

  // src/content/overlay.ts
  var OverlayRenderer = class {
    host;
    shadow;
    maskEl;
    revealEl;
    highlightEl;
    hudEl;
    constructor() {
      this.host = document.createElement("div");
      this.host.id = "virtually-blind-root";
      this.shadow = this.host.attachShadow({ mode: "open" });
      this.maskEl = document.createElement("div");
      this.revealEl = document.createElement("div");
      this.highlightEl = document.createElement("div");
      this.hudEl = document.createElement("div");
      this.renderShell();
      document.documentElement.appendChild(this.host);
    }
    update(state, settings) {
      const rect = state.currentTarget?.boundingRect;
      this.maskEl.style.display = settings.enabled && settings.visualMode === "blackout" && rect ? "block" : "none";
      this.highlightEl.style.display = settings.enabled && settings.visualMode === "highlight" && rect ? "block" : "none";
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
    renderShell() {
      const style = document.createElement("style");
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
      this.maskEl.className = "layer mask";
      this.revealEl.className = "reveal";
      this.highlightEl.className = "highlight";
      this.hudEl.className = "hud";
      this.maskEl.appendChild(this.revealEl);
      this.shadow.append(style, this.maskEl, this.highlightEl, this.hudEl);
    }
    renderHud(state, settings) {
      const target = state.currentTarget;
      const announcement = state.currentAnnouncement;
      const lastEvent = state.events[0];
      const states = Object.entries(target?.states ?? {}).filter(([, v]) => v !== void 0).map(([k, v]) => `${k}:${String(v)}`).join(" | ");
      const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
      const common = `
      <div class="row">
        <span class="badge">mode: ${state.simMode}</span>
        <span class="badge">target: ${esc(announcement?.roleText || "none")} ${esc(announcement?.nameText || "")}</span>
        <span class="badge">vc\u2260focus: ${String(target?.element !== state.keyboardFocus)}</span>
        ${states ? `<span class="badge">${esc(states)}</span>` : ""}
        ${lastEvent ? `<span class="badge">event: ${lastEvent.type}</span>` : ""}
      </div>
      <div class="subtitle">${esc(state.speechCurrent?.text || announcement?.spokenText || "No speech")}</div>
      <div class="help">Shortcuts: ${Object.entries(settings.shortcuts).map(([action, key]) => `${esc(action)}:${esc(key)}`).join(" \xB7 ")}</div>
    `;
      if (settings.hudLevel === "learner") return common;
      const queuePreview = [state.speechCurrent, ...state.speechQueue].filter(Boolean).slice(0, 4).map((item) => item?.text).join(" \u2192 ");
      const events = state.events.slice(0, 5).map((event) => `<div>${esc(new Date(event.ts).toLocaleTimeString())} ${esc(event.type)}: ${esc(event.label)}</div>`).join("");
      return `${common}
      <div class="queue">speech queue: ${esc(queuePreview || "empty")}</div>
      <div class="dim">name source: ${esc(announcement?.debug.nameSource || "-")} \xB7 role source: ${esc(announcement?.debug.roleSource || "-")} \xB7 description source: ${esc(announcement?.debug.descriptionSource || "-")}</div>
      <div class="list">${events}</div>
    `;
    }
  };

  // src/content/index.ts
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] });
      });
    });
  }
  (async () => {
    const settings = await loadSettings();
    const engine = new SimulationEngine(settings);
    const overlay = new OverlayRenderer();
    const unbind = bindKeymap(engine, settings);
    const liveObserver = setupLiveRegions(engine);
    engine.on("state", () => {
      overlay.update(engine.getState(), settings);
    });
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "VB_UPDATE_SETTINGS") {
        Object.assign(settings, message.settings ?? {});
        engine.refreshTargets();
        overlay.update(engine.getState(), settings);
        sendResponse({ ok: true });
      }
      if (message.type === "VB_TOGGLE_ENABLED") {
        settings.enabled = !settings.enabled;
        engine.setEnabled(settings.enabled);
        overlay.update(engine.getState(), settings);
        sendResponse({ ok: true, enabled: settings.enabled });
      }
    });
    window.addEventListener("beforeunload", () => {
      unbind();
      liveObserver.disconnect();
    });
    overlay.update(engine.getState(), settings);
  })();
})();
