# Canonical Types (Spec)

These types are shared between simulation engine and overlay/HUD.

## CursorTarget
Represents the current navigable unit.

Fields (MVP):
- `domPathShort`: short selector-like string
- `tagName`
- `role`
- `name`
- `states`: array of state tags
- `valueText` (controls)
- `contextText` (landmark/list/table hints)
- `boundingRect` (for overlay reveal/highlight)

## AnnouncementSnapshot
Represents what will be “spoken” and why.

Fields (MVP):
- `spokenText`
- `reason`: browse_move | focus | mode_switch | live_region | state_change | shortcut_nav
- `roleText`, `nameText`, `stateText`, `valueText`, `contextText`
- `debug`:
  - `nameSource` + optional references
  - `roleSource`
  - `descriptionText` + `descriptionSource`

## SpeechItem
- `id`
- `text`
- `priority`: low | normal | high | interrupt
- `createdAt`
- `source`: browse_move | focus | live_region | system

## HudEvent
- `ts`
- `type`: vc_move | focus_move | mode_switch | speech_start | speech_interrupt | live_region | dom_mutation
- `label`: short human readable
