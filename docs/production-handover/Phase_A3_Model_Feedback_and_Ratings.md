# Phase A3: Model Feedback and Ratings

**Purpose:** Capture and compare feedback from multiple models (Qwen 3, Llama 70B, Qwen 2.5) on the Phase A3 plan (fix hardcoded data: Step6 Signatories, Step1 Entity). Use the **Implementation notes** and **Corrected takeaways** when implementing.

**Date:** February 2026

---

## Summary ratings

| Model       | Overall | Step6 Signatories | Step1 Entity | Critical issues |
|------------|---------|-------------------|--------------|------------------|
| **Qwen 3** | Good    | Correct           | Prop mutation bug | Suggested `formData.entity = ...` (mutates prop) |
| **Llama 70B** | Good | Correct           | Same prop mutation | Same; added validation (out of scope for A3) |
| **Qwen 2.5**  | Mixed  | Very good (full example) | **Wrong scope** | Step1 example rewrote entire step; default entity uses emit correctly |

**Best to use:** Qwen 2.5’s **Step6** structure (imports, refs, onMounted, normalization, truthy filter, loading/error). For **Step1**, only replace the Entity dropdown and add fetch + default via **emit**; do not change heading, layout, or other fields.

---

## Qwen 2.5 feedback (added)

### What Qwen 2.5 suggested

- **Step6:** Import `api` and `onMounted`; replace hardcoded `employees` with empty array; add `loadingUsers`, `usersError`; fetch in `onMounted` with `api.get('/auth/users')`; normalize response (bare array or `response.data.data`); filter active with truthy check; show loading/error in template.
- **Step1:** Same pattern for entities; replace hardcoded entity option with dynamic list; set default entity if none selected.

### Qwen 2.5 example code — what to use and what to fix

**Step6 Signatories (use with small fixes):**

- **Use:** Structure is correct. Truthy filter `user.active`, map to `{ id, name }`, loading/error refs, template loading/error messages.
- **Fix 1:** Safe normalization so missing `response.data.data` does not throw:
  - Prefer: `const raw = response?.data; const data = Array.isArray(raw) ? raw : (raw?.data ?? []);`
  - Then: `employees.value = data.filter(user => user.active).map(user => ({ id: user.id, name: user.name }));`
- **Fix 2:** Per workspace rules, avoid `console.log` in production; `console.error` in catch is acceptable for real errors. Optional: use `devLog` for debug-only logs.

**Step1 Entity (do not copy the example template):**

- **Wrong:** Qwen 2.5’s Step1 example replaced the **entire** Step1 view with only “Entity Details” and a single Entity dropdown. The real Step1 is **Requestor Information** with: Requestor Name, Designation, **Entity**, Line of Service. Changing the heading to “Entity Details” and removing the other fields would break the form.
- **Right:** In `Step1Requestor.vue`, only:
  - Replace the single hardcoded `<option>BDO Al Nisf & Partners</option>` with a `v-for` over `entities` (e.g. `entity.entity_display_name || entity.entity_name`, value `entity.entity_name`).
  - Add `entities` ref, `onMounted` fetch of `api.get('/entity-codes')`, loading/error refs and UI if desired.
  - For default: **do not** assign to `formData.entity` (prop). Use:  
    `if (!props.formData.entity && entities.value.length > 0) { const defaultEntity = entities.value.find(e => e.is_default) || entities.value[0]; emit('update', { entity: defaultEntity.entity_name }); }`

---

## Corrected takeaways (all three models)

1. **Active users (Step6):** Filter with a truthy check: `data.filter(user => user.active)`.
2. **Default entity (Step1):** Set via `emit('update', { entity: defaultEntity.entity_name })`, never `formData.entity = ...`.
3. **Step1 scope:** Only change the Entity dropdown and its data source. Keep “Requestor Information” heading, 👤, and all other fields (Requestor Name, Designation, Line of Service) unchanged.
4. **Response normalization:** Use a safe fallback (e.g. `raw?.data ?? []`) when the API might return `{ data: [] }` or a bare array.
5. **Loading/error:** Optional but recommended for both steps; keep messages user-friendly (e.g. “Failed to load signatories. Please try again later.”).

---

## Implementation notes (canonical)

- **Step6:** Fetch `GET /api/auth/users`, normalize response, filter `user => user.active`, map to `{ id, name }`. Keep existing template; add loading/error refs and optional UI.
- **Step1:** Fetch `GET /api/entity-codes`, normalize, set `entities`. Replace only the Entity `<select>` options; keep `handleUpdate('entity', value)`. Set default with `emit('update', { entity: ... })` when `!props.formData.entity` and list length > 0.
- **Reference:** Execution plan `COI_Execution_Plan_Handover_and_Customer_Testing.md` — Phase A3 table; backend `authController.js` (`getAllUsers`), `entityCodesController.js` (`getEntityCodes`); frontend `api` from `@/services/api` (baseURL `/api`).
