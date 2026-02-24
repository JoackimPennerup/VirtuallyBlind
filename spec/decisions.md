# Decisions & Compromises (living)

Record pragmatic differences vs NVDA/JAWS here.

- [x] Navigation unit: We treat each eligible DOM element as a target (not full accessibility tree nodes).
- [x] Ordering: document order by default (using `compareDocumentPosition`).
- [x] Tabindex handling: VC includes semantically relevant nodes even when not tabbable.
- [x] Word-by-word reveal: MVP currently reveals the full target in blackout mode.
- [x] Live region handling: coalesced with a short debounce to reduce chatty updates.
- [x] Keyboard defaults: all simulator shortcuts use `Alt+Shift+...` to reduce common conflicts.
