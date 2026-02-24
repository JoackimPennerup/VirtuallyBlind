# Screen Reader Virtual Cursor Simulator — Spec Overview

## Purpose
A Chrome extension that helps sighted developers *experience* how a page is explored with a screen reader by simulating:
- a **virtual cursor** (browse/document navigation)
- a **focus/forms mode** (interactive controls)
- a **speech stream** (as on-screen subtitles)
- a **HUD** that explains role/name/state/context and (in debug mode) why an element is announced as it is.

This is a **pedagogical approximation** of NVDA/JAWS, implemented using DOM/ARIA heuristics available to content scripts.

## Key ideas
- Virtual cursor != keyboard focus
- Navigation is primarily structural/semantic (headings, landmarks, links, form fields)
- Output is a sequence of announcements with interruption rules

## Non-goals
- Full NVDA/JAWS parity
- Full ARIA widget fidelity
- Full table reading/navigation
- Cross-origin iframe coverage
