---
name: code-review
description: Systematic code review for COI prototype. Checks security, data segregation, auth patterns, human-readable code, and business logic. Use after writing or modifying any COI code.
---

# Code Review (COI)

## When to Use

- After writing or modifying backend controllers, services, or routes
- After changing Vue components, views, or stores
- Before any commit
- When reviewing PRs or changes from other contributors

## Review Steps (in order)

### 1. Auth & Security

- [ ] All routes have `authenticateToken` middleware
- [ ] Role-restricted routes have `requireRole()` or `requirePermission()`
- [ ] Uses `req.userId` / `req.userRole` (NOT `req.user.id` / `req.user.role`)
- [ ] Response mapper applied for data-returning endpoints
- [ ] No JWT_SECRET fallback to default in production code
- [ ] SQL queries use parameterized statements (`.prepare()`)
- [ ] No sensitive data in logs, responses, or URLs

### 2. Data Segregation

- [ ] Compliance role CANNOT see: `financial_parameters`, `engagement_code`, `total_fees`
- [ ] Requester/Director scoped to own department
- [ ] Response mapper function used (not ad-hoc deletes)
- [ ] Frontend does not rely on hiding alone — backend enforces

### 3. Code Readability (Human-Like)

- [ ] Function/variable names reveal intent (no abbreviations)
- [ ] Functions under 40 lines, single responsibility
- [ ] No nested ternaries or deep if/else — use guard clauses
- [ ] Named constants for magic values
- [ ] JSDoc on exported functions
- [ ] Comments explain WHY not WHAT
- [ ] Complex conditionals extracted into named booleans

### 4. Error Handling

- [ ] Every async function has try/catch
- [ ] Consistent error response format: `{ success, error, details? }`
- [ ] Frontend shows user-friendly messages (toast), not raw errors
- [ ] Empty/null/missing data handled (no crashes on undefined)

### 5. Business Logic

- [ ] Workflow order preserved (Director -> Compliance -> Partner -> Finance -> Admin)
- [ ] CMA/IESBA rules evaluated where required
- [ ] Duplication check on submission
- [ ] Financial data visible only to Finance/Admin/Super Admin

### 6. Frontend Specific

- [ ] TypeScript types for props, emits, API responses
- [ ] Loading, error, and empty states handled
- [ ] No emojis or AI-style copy in UI
- [ ] Keyboard accessible (focus states, tab order)
- [ ] Tailwind only (no inline styles)
- [ ] Semantic HTML (button not div with click handler)

### 7. Cleanup

- [ ] No `console.log` (use devLog or remove)
- [ ] No dead code, unused imports, commented-out blocks
- [ ] No TODO/FIXME without tracking reference
- [ ] No emojis in email subjects or notification text

## Output Format

Organize findings as:

- **P0 - Must fix before merge:** Security, data leaks, broken auth, wrong req.user pattern
- **P1 - Fix in this PR:** Logic bugs, missing validation, console.log in production path
- **P2 - Fix soon:** Readability, naming, missing types, minor UX issues
- **P3 - Consider:** Refactoring opportunities, performance, documentation

## Verification

- Run through each step above in order
- For each violation, state: file path, line number, what is wrong, how to fix
- Reference the relevant `.cursor/rules/*.mdc` file for each category
