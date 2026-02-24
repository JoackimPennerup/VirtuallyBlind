# HUD Specification

The HUD is a fixed overlay (bottom of viewport) that helps users understand:
- current simulator mode (browse/focus)
- active virtual cursor target (role + accessible name)
- relevant states (required/invalid/disabled/expanded/checked/etc.)
- what the simulator is “speaking” (subtitles)
- in debug mode: *why* (name source, role source, description source) + a short event list + speech queue preview.

## Design principles
- Pedagogical clarity > completeness
- Minimal intrusion (no layout shifts)
- Shadow DOM isolation
- Progressive disclosure: learner vs debug

## HUD levels
### Learner
- Mode
- Role + Name
- States (chips)
- Short context (landmark, heading level, position-in-set if available)
- Subtitles
- Badge for last event (mode switch / focus moved / live region)

### Debug
Everything in Learner plus:
- name source: label / aria-label / aria-labelledby / alt / text / title / unknown
- role source: implicit vs explicit
- description source: aria-describedby / title / unknown
- virtual cursor target vs keyboard focus identifiers
- recent events buffer (max 10)
- speech queue preview (current + next few)

## Update triggers
Update HUD on:
- vc_move
- focus_move
- mode_switch
- speech_start / speech_interrupt
- live_region
- state_change (on active target)
- dom_mutation that affects active target

## Animation guidance
Use short, diagnostic animations:
- mode switch pulse (100–200ms)
- speech interrupt flash (immediate replacement; optional 150ms highlight)
- live region badge blink (150–300ms)
Avoid long fades that hide interrupts.

## Data model
See `/spec/types.md` for canonical types: `CursorTarget`, `AnnouncementSnapshot`, `SpeechItem`, `HudEvent`.
