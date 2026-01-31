---
name: vue-coi-frontend
description: Vue 3 + TypeScript patterns for the COI frontend: components, state, forms, and dashboards. Use when editing Vue components, views, or frontend logic in the COI prototype.
---

# Vue COI Frontend

## When to Use

- Editing Vue components, views, or composables in `coi-prototype/frontend/`
- Adding or changing COI form sections, dashboards, or modals
- Working with Pinia stores, router, or API services on the frontend

## Project Conventions

- **Stack:** Vue 3 (Composition API), TypeScript, Tailwind CSS, Pinia, Vue Router
- **Rules:** Follow `.cursor/rules/typescript-vue-patterns.mdc` and `.cursor/rules/ui-design-standards.mdc` for applicable files
- **Copy & UI:** No AI-generated emojis, subtext, captions, or filler; use human-like, specific language only (see ui-ux-coi skill)
- **Forms:** COI request form lives in `COIRequestForm.vue`; use existing composables and constants (`coiFormOptions.ts`)

## Patterns

- **State:** Use `ref`/`computed` for local state; Pinia for shared (e.g. `coiRequests`, `auth`)
- **API:** Use `@/services/api`; handle loading/error state and show user feedback
- **Accessibility:** Required fields use `aria-required`; errors use `role="alert"` or `aria-live`; keyboard focus visible (e.g. `focus-within` on radio cards)
- **Validation:** Inline validation messages with `role="alert"`; align with backend rules (e.g. Subsidiary 50–100%, Affiliate 20–49%)

## Verification

- Imports resolve (verify with grep/read); no hallucinated components or stores
- New UI matches existing patterns (sections, buttons, modals) unless explicitly changing design
- No emojis or AI-style copy in UI; human-like design and text only
