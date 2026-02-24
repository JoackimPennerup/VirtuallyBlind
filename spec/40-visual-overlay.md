# Visual Modes & Overlay Spec

## Blackout explore mode
- Add a full-page fixed overlay mask (dark).
- Cut a “hole” around the active VC target bounding rect (padding configurable).
- The overlay must not block page scroll (unless intentionally configured).
- Use pointer-events carefully:
  - mask should generally be non-interactive; activation is via keyboard.

## Debug highlight mode
- Draw a hotpink outline around the active VC target.
- No mask.

## Subtitles
- Fixed at bottom (integrated into HUD).
- Shows current speech item.
- Interrupt replaces immediately.

## Isolation
- Mount overlay in a shadow root to avoid CSS collisions.
