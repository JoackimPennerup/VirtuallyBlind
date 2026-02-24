# VirtuallyBlind — Screen Reader Virtual Cursor Simulator

A Chrome MV3 extension scaffold that simulates a screen reader-style virtual cursor for sighted developers.

## Implemented MVP pieces

- Virtual cursor engine (`browse` / `focus`) with deterministic traversal.
- A11y approximation for role/name/states/value extraction.
- Quick navigation (headings, links, buttons, fields, landmarks).
- Speech queue with interrupt semantics.
- Live region observer for `aria-live` polite/assertive updates.
- Overlay in shadow DOM:
  - blackout explore mode with reveal hole,
  - hotpink debug highlight mode,
  - always-on HUD + subtitles with learner/debug detail levels.
- Background service worker and command wiring.

## Project layout

- `src/content/engine.ts`
- `src/content/a11y.ts`
- `src/content/navigation.ts`
- `src/content/overlay.ts`
- `src/content/liveRegions.ts`
- `src/content/keymap.ts`
- `src/content/index.ts`
- `src/background/serviceWorker.ts`
- `src/shared/types.ts`
- `src/shared/config.ts`

## Build

```bash
npm install
npm run build
```

Load the extension in Chrome via **chrome://extensions** → **Load unpacked** and select this repository folder.

The manifest points to transpiled files in `dist/`.
