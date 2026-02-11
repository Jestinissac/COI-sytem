# B7 — Demo Login Role-Switcher — Implementation Plan

**Purpose:** Let customer testers log in by clicking a role card (one click, no separate "Sign In" button). Keep an optional "Advanced Login" for email/password when needed.

**Scope:** Frontend only — [Login.vue](coi-prototype/frontend/src/views/Login.vue). Backend mock auth already accepts any password; no backend change.

---

## 1. Current State

- **Login.vue:** Main content is email + password form and "Sign In" button. Below that, "Demo Users" section with 7 buttons that call `fillDemo(email)` — they only **fill** email and password (`'password'`); user must then click "Sign In".
- **Seed:** [database/seed/seedData.js](coi-prototype/database/seed/seedData.js) uses `@company.com` emails (e.g. `patricia.white@company.com`, `john.smith@company.com`, `admin@company.com`). All users share the same `passwordHash`; backend does not verify password in prototype.
- **Backend:** [authController.js](coi-prototype/backend/src/controllers/authController.js) `login` — "Mock authentication: Accept any password for prototype". No change needed; ensure demo uses a non-empty password (e.g. `'password'`).

---

## 2. Target UX

1. **Primary:** Role card grid (e.g. 7 cards: Requester, Director, Compliance, Partner, Finance, Admin, Super Admin). **Clicking a card** calls the login API with that role’s email and a fixed demo password, then on success navigates to that role’s dashboard. No separate "Sign In" click.
2. **Secondary:** "Advanced Login" collapsible section (toggle or link) that shows the existing email/password form and "Sign In" for testing specific users (e.g. other seed users, or when backend uses real auth later).
3. **Loading:** While login is in progress (after a card click or form submit), show a loading state (e.g. disabled cards/button, or spinner) so the user knows the action is in progress.
4. **Errors:** If login fails (e.g. backend down, user disabled), show an error message in the same way as today (e.g. below the grid or in a toast).

---

## 3. Implementation Steps

### 3.1 Demo user list (align with seed)

Define a single source of demo users used for the cards. Use emails that exist in the seed so login always finds a user.

**Suggested list (matches current Login.vue and seed):**

| Role        | Email                     | Department | Short description (for card)	       |
|------------|---------------------------|------------|--------------------------------------|
| Requester  | patricia.white@company.com   | Audit      | Submit COI requests                   |
| Director   | john.smith@company.com       | Audit      | Approve team requests                 |
| Compliance | emily.davis@company.com      | Audit      | Review regulations                    |
| Partner    | robert.taylor@company.com    | Audit      | Final approval                        |
| Finance    | lisa.thomas@company.com      | Audit      | Generate engagement codes             |
| Admin      | james.jackson@company.com    | Audit      | Execute and manage                    |
| Super Admin| admin@company.com            | Other      | System configuration                  |

- **Password:** Use `'password'` for all demo logins (already used by `fillDemo` and accepted by backend).
- **Optional:** Add a short `description` per role for the card subtitle (as in execution plan). No icons/emojis required; keep copy professional.

### 3.2 Add `loginAs(user)` and reuse routing

- **New function:** `async function loginAs(user: { email: string; role: string })`
  - Set `loading.value = true`, clear `error.value`.
  - Call `await authStore.login(user.email, DEMO_PASSWORD)`.
  - If `!result.success`: set `error.value` (reuse same message logic as `handleLogin`: e.g. result.error === 'Login failed' → "Cannot reach server. Is the backend running on port 3000?" else result.error). Use `finally { loading.value = false }`.
  - If success but `!authStore.user`: set `error.value = 'Login succeeded but user data is missing. Please try again.'` and return.
  - Otherwise: get target route as **`routes[user.role]`** (see routing note below), then `router.push(targetRoute)`.
- **Routing (important):** The existing `handleLogin` uses a `routes` object with **exact role keys**: `'Requester'`, `'Director'`, `'Compliance'`, `'Partner'`, `'Finance'`, `'Admin'`, `'Super Admin'` (including the space in "Super Admin"). Use **`routes[user.role]`** — do **not** use `user.role.toLowerCase()` or other transforms, or "Super Admin" will not match and navigation will fail.

### 3.3 Restructure template

**Option A — Role cards first (recommended)**

1. **Top:** Environment badge (unchanged).
2. **Heading:** e.g. "COI System Demo" and a short line like "Select a role to sign in."
3. **Role grid:** One card per demo user. Each card:
   - Shows role name (and optionally department / short description).
   - `@click="loginAs(demoUser)"` (no form submit).
   - Optionally `:disabled="loading"` and a visual loading state (e.g. opacity or spinner overlay) when `loading` is true.
4. **Error:** Display `error` below the grid (or in a dedicated area) when non-empty.
5. **Advanced Login:** A link or button, e.g. "Advanced Login" or "Sign in with email", that toggles `showAdvancedLogin` (ref). When true, show the existing email/password form and "Sign In" button; form still uses `handleLogin` on submit. When false, hide the form so the default view is the role grid only.

**Option B — Keep form visible by default**

- Keep current layout but change each "Demo Users" button from `@click="fillDemo(...)"` to `@click="loginAs(demoUser)"` so that clicking a demo user logs in immediately. Optionally add a collapsible "Advanced Login" for the form so the form can be hidden when not needed.

Recommendation: **Option A** so the main experience is "click role → you’re in", which matches the execution plan and is clearer for customer testing.

### 3.4 Demo user data structure

In `<script setup>`, define an array of demo users, e.g.:

```ts
const DEMO_PASSWORD = 'password'

const demoUsers = [
  { role: 'Requester', email: 'patricia.white@company.com', department: 'Audit', description: 'Submit COI requests' },
  { role: 'Director', email: 'john.smith@company.com', department: 'Audit', description: 'Approve team requests' },
  // ... one per role, same emails as seed
]
```

Use `demoUsers` for both the grid and for `loginAs(demoUser)` (pass the object; `loginAs` only needs `email` and optionally `role` for any future use).

### 3.5 Loading and error behaviour

- **Visual indicators:** While `loading` is true, either disable all role cards (e.g. `:class="{ 'loading': loading }"` with CSS that reduces opacity and sets `pointer-events: none`) or show a single loading message (e.g. "Signing in..."). Use consistent messaging (e.g. "Signing in...") for both card login and form submit.
- **Card click:** Call `loginAs(demoUser)`. Ensure cards cannot be clicked again until `loading` is false.
- **Form submit:** Keep current `handleLogin`; it already sets `loading` and `error`. No change required except that the form is inside "Advanced Login" when Option A is used.
- **Error handling:** Set `error.value` in `loginAs` on failure with clear, user-friendly messages (e.g. server unreachable vs invalid credentials). Display `error` below the grid or in a dedicated area. Clear `error` when starting a new login attempt (card or form).

### 3.6 Backend verification (no code change)

- Confirm [authController.js](coi-prototype/backend/src/controllers/authController.js) login still accepts any non-empty password for a valid email. Seed users are looked up by email only; no password check in prototype. Use `'password'` for all demo logins so it’s consistent and matches the current "Demo Users (password: password)" hint if you keep it in Advanced Login.

---

## 4. File Checklist

| Step | Action |
|------|--------|
| 1 | Define `demoUsers` array (and `DEMO_PASSWORD = 'password'`) in Login.vue. |
| 2 | Add `loginAs(user)` that calls `authStore.login(user.email, 'password')` and navigates on success using existing role→route map. |
| 3 | Add `showAdvancedLogin` ref; default `false` if using Option A so role grid is the default view. |
| 4 | Restructure template: heading, role card grid (click → `loginAs`), error display, then "Advanced Login" toggle and form. |
| 5 | Ensure loading state disables or visually indicates progress during login (card or form). |
| 6 | Remove or repurpose `fillDemo` if no longer needed (e.g. only used in Advanced Login to pre-fill form). |
| 7 | (Optional) In Advanced Login section, add a short note like "Demo users: password is **password**" for testers. |

---

## 5. Verification

- Click each role card → login succeeds and user is taken to the correct dashboard (Requester, Director, Compliance, Partner, Finance, Admin, Super Admin).
- Toggle "Advanced Login" → form appears; submit with a seed email and `password` → same behaviour as card login.
- Submit with invalid email or with backend stopped → error message shown, no navigation.
- While login is in progress, UI shows loading (no double submissions).

---

## 6. Out of Scope

- **Backend:** No changes. Mock auth remains as-is.
- **Real SSO/OAuth:** Not in scope for B7; production will use Azure AD etc. per execution plan.
- **Icons/emojis on cards:** Optional; plan does not require them. Prefer professional text-only or simple icons if the design system already provides them.

---

## 7. Suggested Amendments (Qwen) — Implementation Notes

### 7.1 Route lookup correction

Use the same `routes` object as in `handleLogin`. Keys are **exact** role strings (e.g. `'Super Admin'` with a space). In `loginAs`, use:

```ts
const targetRoute = routes[user.role]  // NOT routes[user.role.toLowerCase()]
if (targetRoute) {
  router.push(targetRoute)
} else {
  error.value = 'Role not found.'
}
```

### 7.2 loginAs — full example

```ts
const DEMO_PASSWORD = 'password'

const routes: Record<string, string> = {
  'Requester': '/coi/requester',
  'Director': '/coi/director',
  'Compliance': '/coi/compliance',
  'Partner': '/coi/partner',
  'Finance': '/coi/finance',
  'Admin': '/coi/admin',
  'Super Admin': '/coi/super-admin'
}

async function loginAs(user: { email: string; role: string }) {
  loading.value = true
  error.value = ''
  try {
    const result = await authStore.login(user.email, DEMO_PASSWORD)
    if (!result.success) {
      error.value = result.error === 'Login failed'
        ? 'Cannot reach server. Is the backend running on port 3000?'
        : (result.error || 'Invalid credentials')
      return
    }
    if (!authStore.user) {
      error.value = 'Login succeeded but user data is missing. Please try again.'
      return
    }
    const targetRoute = routes[user.role]
    if (targetRoute) {
      router.push(targetRoute)
    } else {
      error.value = 'Role not found.'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
```

### 7.3 Template structure (Option A)

- **Environment badge** — keep existing.
- **Heading:** "COI System Demo"; **Subheading:** "Select a role to sign in."
- **Role grid:** `v-if="!showAdvancedLogin"`. Each card: role name, department, description; `@click="loginAs(demoUser)"`; `:class="{ 'loading': loading }"` for disabled state.
- **Error:** `v-if="error"` block below grid.
- **Advanced Login toggle:** Button or link that sets `showAdvancedLogin = !showAdvancedLogin`; label "Advanced Login" / "Hide Advanced Login".
- **Advanced Login form:** `v-if="showAdvancedLogin"`; existing email/password form and "Sign In" button; optional note "Demo users: password is **password**".

### 7.4 Optional enhancements

- **Animations:** Smooth transition when toggling the Advanced Login section (e.g. Vue transition or CSS).
- **Accessibility:** Use semantic buttons for role cards; add `aria-label` or visible text so purpose is clear (e.g. "Sign in as Requester"). Ensure focus order and keyboard use work.
- **Responsive design:** Use a responsive grid (e.g. `grid-cols-2 md:grid-cols-4` or similar) so the role grid works on small and large screens.

---

## 8. Step-by-step implementation reference (Qwen)

Use this section when implementing in [Login.vue](coi-prototype/frontend/src/views/Login.vue). **Preserve the existing layout** (background image, logo, outer card wrapper, environment badge from `/health`) and integrate the role grid and Advanced Login inside the current card. Use **`useAuthStore`** (not default import): `import { useAuthStore } from '@/stores/auth'` and `const authStore = useAuthStore()`.

### Step 1: Script — `demoUsers`, `DEMO_PASSWORD`, `routes`, `loginAs`, `handleLogin`

- Add `DEMO_PASSWORD = 'password'` and the full `demoUsers` array (all 7 roles with email, department, description).
- Add `routes` object with exact keys: `'Requester'`, `'Director'`, … `'Super Admin'`.
- Add `showAdvancedLogin = ref(false)`.
- Add `loginAs(user)` as in section 7.2 (set loading/error, call `authStore.login(user.email, DEMO_PASSWORD)`, then `routes[user.role]` and `router.push`).
- Update `handleLogin` to use the same `routes` and error messaging: after successful login, `const targetRoute = routes[authStore.user.role]` then `router.push(targetRoute)`.
- Keep `onMounted` for environment from `/health`; keep `fillDemo` only if you still need it for Advanced Login pre-fill (optional).

### Step 2: Template — role grid first, then Advanced Login

- **Inside the existing login card:** Replace or reorganise so the default view is:
  - Environment badge (existing).
  - Heading "COI System Demo" and subheading "Select a role to sign in."
  - Role grid: `v-if="!showAdvancedLogin"`, `v-for="(user, index) in demoUsers"`, each card `@click="loginAs(user)"`, `:class="{ 'loading': loading }"`, show `user.role`, `user.department`, `user.description`.
  - Error: `v-if="error"` with `{{ error }}`.
  - Toggle: button or link "Advanced Login" / "Hide Advanced Login" that flips `showAdvancedLogin`.
  - Advanced Login form: `v-if="showAdvancedLogin"`, existing email/password inputs and "Sign In" button (`@submit.prevent="handleLogin"`), optional note "Demo users: password is **password**".

### Step 3: Styles

- **Role grid:** `display: grid`, `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`, `gap: 15px`. Use responsive columns (e.g. 2 on small, 4 on large) if desired.
- **Role card:** Border, padding, cursor pointer; hover state; `.role-card.loading`: `opacity: 0.6`, `pointer-events: none`.
- **Error:** Red text, margin as needed.
- **Advanced form:** Reuse or adapt existing input/button styles so the form matches the rest of the app.

### Step 4: Verification

- **Role cards:** Click each role card → login succeeds and user is taken to the correct dashboard.
- **Advanced Login:** Toggle to show form; submit with a seed email and `password` → same behaviour as card login.
- **Loading:** While login is in progress, cards/button show loading state (no double submissions).
- **Errors:** Invalid email or backend stopped → clear error message, no navigation.

### Final notes (Qwen)

- **Optional:** Tooltips, animations, or more detailed error messages as needed.
- **Testing:** Test all roles and the Advanced Login path; cover backend-down and invalid-credentials cases.
