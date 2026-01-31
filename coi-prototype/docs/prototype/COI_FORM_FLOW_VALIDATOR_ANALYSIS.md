# COI Request Form – FlowValidator Analysis

**Purpose:** Apply FlowValidator’s 4-Step Integrity Check to the COI Request Form and list all situations that need guards, plus a `useFormLogicGuardian`-style script block.

---

## 1. Mutually Exclusive Enforcement

| Situation | Rule | Current gap | Action |
|-----------|------|-------------|--------|
| **Standalone vs International Operations** | `company_type === 'Standalone'` and `international_operations === true` cannot both hold. | Form allows both; no watcher. | When `company_type` becomes `'Standalone'`, set `international_operations = false`. Optionally: when `international_operations` is set to `true`, if `company_type === 'Standalone'`, force `company_type = ''` or block checking (prefer disabling the checkbox). |

No other mutually exclusive pairs were identified (e.g. Proposal vs Engagement is a single choice, not two booleans).

---

## 2. Parent-Child Dependency (Ghost Data)

| Parent field | Child section / data | When parent makes child irrelevant | Current gap | Action |
|--------------|----------------------|------------------------------------|-------------|--------|
| `company_type` | International operations block | `company_type === 'Standalone'` | Only UI can hide block; state not cleared. | When `company_type === 'Standalone'`: set `international_operations = false`; clear `global_service_category`, `global_service_type`, `global_coi_form_data`, and `globalCOIFormData` (ref). |
| `international_operations` | Global COI block + global service fields | `international_operations === false` | Watcher already clears `global_service_*` and `globalServiceTypes`; **does not** clear `global_coi_form_data` / `globalCOIFormData`. | When turning off international: also set `formData.global_coi_form_data = null` and `globalCOIFormData.value = null`. |
| `international_operations` | Section 5 (Ownership) | When `international_operations === true`, Section 5 is hidden. | Section 5 is `v-if="!international_operations"`; data (`full_ownership_structure`, `related_affiliated_entities`) is **not** cleared when section is hidden. | Optional: when `international_operations` becomes `true`, clear `full_ownership_structure` and `related_affiliated_entities` so reopening (e.g. unchecking international) doesn’t show stale data. Or document that we keep it for “switch back” UX. |

---

## 3. Cross-Section Data Replication

| Master (Section) | Slave (Section / form) | Current state | Action |
|------------------|------------------------|---------------|--------|
| Section 3: `pie_status` | Global form: `clientIsPIE` | Replicated via `populateGlobalCOIForm()` + watcher; InternationalOperationsForm always syncs `clientIsPIE` from `initialData`. | OK. Optional: make “Client is PIE” in Global form read-only if strict “slave” is desired. |
| Section 3: `client_name`, `parent_company`, `client_location`, `relationship_with_client`, etc. | Global form | Same replication + REPLICATED_FROM_MAIN in InternationalOperationsForm. | OK. |
| Section 4: `service_type` / `service_description` | Global form: `servicesDetails` / `natureOfEngagement` | Mapped in `populateGlobalCOIForm()`. | OK. |

---

## 4. UI State Alignment

| Logic | Current | Recommended |
|-------|---------|-------------|
| International operations checkbox allowed? | Always enabled. | **Computed:** `isInternationalOperationsAllowed = company_type !== 'Standalone'`. Disable checkbox when `false`; show helper text when disabled: e.g. “Standalone entities do not have international operations.” |
| Global COI block visible? | `v-if="formData.international_operations"`. | Keep; ensure state is cleared when parent (e.g. `company_type === 'Standalone'`) disables international (see above). |
| Section 5 visible? | `v-if="!formData.international_operations"`. | Keep. |

---

## 5. `useFormLogicGuardian`-style script (for COIRequestForm)

Use this in `COIRequestForm.vue` (or a composable that receives `formData` and `globalCOIFormData`):

```javascript
// ————— Logic Guard: Standalone ⟹ No International Operations (Mutually Exclusive + Ghost Data) —————
watch(() => formData.value.company_type, (newVal) => {
  if (newVal === 'Standalone') {
    formData.value.international_operations = false
    formData.value.global_service_category = ''
    formData.value.global_service_type = ''
    formData.value.global_coi_form_data = null
    globalCOIFormData.value = null
    globalServiceTypes.value = []
  }
})

// ————— Logic Guard: International Operations off ⟹ Clear Global COI Form data (Ghost Data) —————
watch(() => formData.value.international_operations, (newVal) => {
  if (!newVal) {
    formData.value.global_service_category = ''
    formData.value.global_service_type = ''
    formData.value.global_coi_form_data = null
    globalCOIFormData.value = null
    globalServiceTypes.value = []
  }
})
// Note: Already partially present; ensure global_coi_form_data and globalCOIFormData are cleared as above.

// ————— Computed: UI state alignment (International Operations checkbox) —————
const isInternationalOperationsAllowed = computed(() => formData.value.company_type !== 'Standalone')
// In template: disable the "Client has international operations" checkbox when !isInternationalOperationsAllowed
// and show helper text when disabled: "Standalone entities do not have international operations."
```

---

## 6. Summary checklist

- [ ] Add watcher on `company_type`: when `'Standalone'`, set `international_operations = false` and clear all global-related state (including `global_coi_form_data` and `globalCOIFormData`).
- [ ] In `international_operations` watcher: when turning off, also set `global_coi_form_data = null` and `globalCOIFormData.value = null`.
- [ ] Add computed `isInternationalOperationsAllowed` (e.g. `company_type !== 'Standalone'`).
- [ ] In template: bind checkbox `disabled` to `!isInternationalOperationsAllowed` and show helper text when disabled.
- [ ] Optional: when `international_operations` becomes `true`, clear Section 5 fields if you want no ghost data when user toggles back.

After these changes, the form will enforce Standalone ⟹ no international operations, avoid ghost data when switching company type or turning off international, and keep UI state aligned with business rules.
