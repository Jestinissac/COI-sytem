# Ad-Hoc Code Review Prompt

**Copy the prompt below and paste it into Cursor after writing or modifying code. It will review your changes against all critical quality checks for the COI prototype.**

---

## Prompt (copy everything below this line)

```
Review the code I just wrote or modified. Check every item below. For each violation, state the file, line, what is wrong, and exactly how to fix it.

## Auth Pattern
- Uses req.userId and req.userRole (NOT req.user.id or req.user.role — req.user is never set by auth.js)
- Every route has authenticateToken middleware
- Role-restricted routes have requireRole() or requirePermission()
- If full user object needed, uses getUserById(req.userId) explicitly

## Data Segregation
- Response mapper applied (mapResponseForRole, not ad-hoc delete)
- Compliance cannot see financial_parameters, engagement_code, total_fees
- Backend enforces — frontend hiding alone is insufficient
- All callers of getFilteredRequests apply the mapper before responding

## Human-Readable Code
- Function and variable names are descriptive, complete words (no abbreviations)
- Functions are under 40 lines, single responsibility
- No nested ternaries, no deep if/else — use guard clauses
- Named constants for magic numbers and strings
- Comments explain WHY, not WHAT
- JSDoc on all exported functions
- Complex conditionals extracted into named booleans
- Boolean variables read as questions (isApproved, hasConflicts)

## Security
- SQL uses parameterized queries (.prepare()) — no string interpolation
- No JWT_SECRET fallback to 'prototype-secret' in production
- No sensitive data in logs, responses, or URLs
- Input validated on backend (type, length, format)
- File uploads validated (MIME type, extension, size)

## Error Handling
- Every async function has try/catch
- Consistent response format: { success, data?, error? }
- Frontend shows user-friendly messages, not raw errors
- Loading, error, and empty states in data-fetching components
- Error messages are specific and actionable ("Client name is required" not "Validation failed")

## Business Logic
- Approval workflow order: Director -> Compliance -> Partner -> Finance -> Admin
- CMA/IESBA rules evaluated before approval
- Duplication check on submission (fuzzy match)
- Financial data visible only to Finance/Admin/Super Admin
- 30-day monitoring period enforced

## UI/UX
- No emojis in UI, emails, notifications, or system-generated text
- No AI-generated subtext, captions, or filler copy
- Tailwind only (no inline styles, no custom CSS unless necessary)
- Semantic HTML (button not div with click handler)
- Keyboard accessible (focus states, tab order)
- 8px grid spacing (gap-1, gap-2, gap-4, gap-6, gap-8)
- shadow-sm only (no shadow-lg/xl/2xl), no gradients

## Cleanup
- No console.log (use devLog pattern or remove)
- No dead code, unused imports, commented-out blocks
- No TODO/FIXME without a tracking reference
- No emojis in email subjects or notification text

Classify findings as:
- P0 (block merge): Security, data leaks, broken auth, wrong req.user pattern
- P1 (fix in this PR): Logic bugs, missing validation, console.log in production path
- P2 (fix soon): Readability, naming, missing types, minor UX issues
- P3 (consider): Refactoring opportunities, performance, documentation
```
