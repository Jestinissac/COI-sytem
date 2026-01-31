---
name: ui-ux-coi
description: UI/UX standards for the COI frontend: forms, dashboards, accessibility, and enterprise UX. Use when designing or changing COI screens, components, or user flows.
---

# UI/UX COI

## When to Use

- Designing or changing COI form sections, dashboards, or modals
- Improving accessibility (focus, labels, alerts, live regions)
- Applying enterprise UX: less but better, no filler copy, clear hierarchy
- Aligning with Dieter Rams–style principles (build-verification skill)
- Ensuring **human-like design and copy**: no AI-generated emojis, subtext, or captions

## Project Rules

- **Rule:** Follow `.cursor/rules/ui-design-standards.mdc` for Vue/frontend files
- **Build verification:** Use build-verification skill for user journeys and business goals vs implementation

## Patterns

- **Forms:** Required fields have visible label and `aria-required`; errors use `role="alert"` or `aria-live`; keyboard focus visible (e.g. `focus-within` on cards)
- **Copy:** Human-like, specific language only. No AI-generated emojis anywhere in UI. No generic AI subtext, captions, taglines, or filler (e.g. "Welcome to our amazing app", "Click here to get started"). Avoid long explanatory paragraphs; keep helper text short; no redundant "Click to…" when the control is obvious
- **Loading/error:** Show loading state and error message with retry where appropriate; use `aria-live` for dynamic status
- **Consistency:** Reuse existing patterns (sections, cards, buttons, modals) from COIRequestForm and dashboards

## Verification

- New UI is keyboard-navigable and has sensible focus order
- Error and status messages are announced (role="alert" or aria-live where appropriate)
- **No AI-generated content in UI:** no emojis; no generic subtext, captions, or taglines; no filler copy. All visible text is human-like, specific, and purposeful.
