# Recent changes – changelog

Short log of notable changes. See linked docs for details.

---

## 2026-02-05

**Country selector (Location + Global Operations)**

- Main form Location dropdown now uses `country_code` as value and syncs to `formData.client_location` (name) for the backend. Loaded drafts correctly resolve "Kuwait" / "State of Kuwait" / "KWT" to the same option.
- Global Operations country selector already had normalized options, fallback list, and sorted options; no further code change.

Details: [Country-Selector-Fix-Summary.md](Country-Selector-Fix-Summary.md)

**Files touched**

- `coi-prototype/frontend/src/views/COIRequestForm.vue` (Location ref, options, resolve on load)
- `coi-prototype/frontend/src/components/coi/InternationalOperationsForm.vue` (earlier fix only)

---

*Add new entries above with date and a one-line summary; link to a full note if needed.*
