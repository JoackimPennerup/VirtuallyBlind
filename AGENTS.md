# AGENTS.md — Screen Reader Virtual Cursor Simulator (Chrome Extension)

This repository is intended to be used with an agentic coding workflow (e.g., Codex). The goal is to maintain a clean separation of concerns and keep behavior aligned with the specs in `/spec`.

## Roles & responsibilities

### 1) Simulation Engine Agent
**Owns:**
- `src/content/engine.ts`
- `src/content/navigation.ts`
- `src/shared/types.ts`

**Responsibilities:**
- Maintain simulator state (`simMode`, `virtualCursor`, `keyboardFocus`, `speechQueue`, `events`)
- Implement deterministic navigation order
- Implement quick-navigation (headings/links/buttons/fields/landmarks)
- Expose an event-driven API for the renderer/HUD

**Do not:**
- Manipulate CSS/DOM beyond reading and setting focus/activation

---

### 2) A11y Semantics Agent
**Owns:**
- `src/content/a11y.ts`

**Responsibilities:**
- Compute accessible-ish semantics from DOM/ARIA:
  - role (implicit/explicit)
  - accessible name (label, aria-label, aria-labelledby, alt, text)
  - description (aria-describedby, title)
  - states (disabled, required, invalid, checked, expanded, pressed, selected)
  - value text for controls
- Provide utilities:
  - `getCursorTargets()` — list of navigable targets
  - `computeAnnouncement(target)` — returns `AnnouncementSnapshot`

**Constraints:**
- This is a *pedagogical approximation*, not a full a11y tree implementation.
- Prefer correctness on common patterns over edge-case completeness.

---

### 3) Overlay/HUD Agent
**Owns:**
- `src/content/overlay.ts`

**Responsibilities:**
- Render HUD/subtitles and visual modes:
  - blackout mask with reveal hole
  - hotpink outline debug mode
- Use Shadow DOM to avoid style conflicts
- Update based on engine events

**Do not:**
- Implement navigation logic; treat engine output as authoritative.

---

### 4) Live Regions Agent
**Owns:**
- `src/content/liveRegions.ts`

**Responsibilities:**
- Observe DOM mutations relevant to `aria-live`
- Create announcements with correct priority:
  - `assertive` => interrupt
  - `polite` => enqueue
- Avoid chatty announcements (debounce/coalesce)

---

### 5) Background/Commands Agent
**Owns:**
- `src/background/serviceWorker.ts`, `manifest.json`

**Responsibilities:**
- MV3 wiring, toggles, storage
- Register commands (keyboard shortcuts) when applicable
- Communicate with content scripts via messages

---

## Workflow rules (for agents)

1. **Specs first:** If behavior is unclear, check `/spec`. If still unclear, add a note to `/spec/open-questions.md` and make a reasonable MVP assumption.
2. **Small PRs:** Keep changes focused (engine vs overlay vs semantics).
3. **Deterministic behavior:** Navigation order must be reproducible; document the ordering logic.
4. **Document compromises:** If implementation deviates from NVDA/JAWS, record it in `/spec/decisions.md`.
5. **No over-engineering:** Avoid heavy frameworks. Prefer plain TS + small utilities.

---

## Code structure (high level)

- `src/shared/types.ts`  
  Shared types and event payloads used by engine and HUD.

- `src/content/engine.ts`  
  Core state machine + speech queue + event emitter.

- `src/content/a11y.ts`  
  Compute role/name/state/value and extract navigable targets.

- `src/content/navigation.ts`  
  Ordering rules + quick-navigation filtering.

- `src/content/overlay.ts`  
  Shadow DOM overlay + HUD/subtitles + blackout/highlight renderer.

- `src/content/keymap.ts`  
  Keyboard mapping and dispatch to engine actions.

- `src/content/liveRegions.ts`  
  aria-live observer => announcements.

---

## Definition of Done (MVP)

- Toggle extension on/off
- Browse/focus modes with basic switching rules
- VC next/prev navigation across supported targets
- HUD shows mode, active role+name, and subtitles
- Blackout explore mode and highlight debug mode
- Basic aria-live announcements (polite + assertive)
