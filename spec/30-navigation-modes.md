# Navigation & Modes Spec (MVP)

## Modes
### Browse mode
- Virtual cursor moves among navigable targets without changing DOM focus.
- Arrow-like commands should move VC next/previous in deterministic order.
- Activation command may click/activate current target (and may move focus).

### Focus mode
- Intended for interacting with form fields/controls.
- When entering focus mode, DOM focus should be set to the active control.
- Navigation keys in focus mode should respect native interaction (e.g., typing).
- Provide an explicit command to exit focus mode back to browse.

## Mode switching rules (MVP)
- Enter focus mode when VC lands on:
  - input/textarea/select
  - contenteditable
  - elements with role textbox/combobox/listbox/spinbutton/slider (basic)
- Exit focus mode:
  - explicit user command
  - or when focus moves away due to Escape/blur (documented behavior)

## Deterministic ordering (MVP)
The VC traversal list is built by scanning DOM and filtering navigable targets:
- headings (h1-h6)
- landmarks/regions (nav/main/header/footer/aside + ARIA landmarks)
- links
- buttons
- form controls (input, textarea, select, checkbox, radio)
- images with alt text

Ordering approach:
- default: document order of eligible targets
- skip hidden/inert/aria-hidden elements
- respect `tabindex="-1"` for focusability, but VC may still include semantically relevant nodes; document decision in decisions.md

## Quick navigation
Provide “next/prev” per category:
- headings, links, buttons, fields, landmarks
If no next item exists, optionally wrap (configurable).

## Activation behavior (MVP)
- If target is link/button: click()
- If target is form control: focus() and switch to focus mode
