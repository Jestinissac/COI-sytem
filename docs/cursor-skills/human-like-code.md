---
name: human-like-code
description: Ensures code reads like it was written by an experienced, thoughtful human developer. Covers naming, structure, comments, and communication clarity. Use when writing new code or refactoring existing code.
---

# Human-Like Code Standards

## When to Use

- Writing any new function, component, or module
- Refactoring existing code for clarity
- Code review (pair with code-review skill)
- When AI-generated code needs to be humanized

## Principles

### 1. Names Tell the Story

- Variable names are complete words: `pendingApprovalRequests` not `pendReqs`
- Function names are verb-first and describe the action: `calculateConflictScore`, `fetchDepartmentRequests`, `validateEngagementCode`
- Boolean variables read as questions: `isApproved`, `hasConflicts`, `canViewFinancials`
- Avoid generic names: `data`, `result`, `temp`, `info`, `item` — add context: `requestData`, `conflictResult`
- Constants use UPPER_SNAKE_CASE with full words: `MAX_MONITORING_DAYS`, `ENGAGEMENT_CODE_PREFIX`

### 2. Structure Reveals Intent

- Guard clauses first, happy path last
- One function does one thing — if you need "and" to describe it, split it
- Group related operations with a blank line, not a comment
- Extract complex conditionals into named booleans:

```javascript
// WRONG — reader must parse the condition mentally
if (req.userRole === 'Compliance' && status !== 'Draft' && !isExpired) { ... }

// RIGHT — the name explains the business rule
const canComplianceReview = req.userRole === 'Compliance' && status !== 'Draft' && !isExpired
if (canComplianceReview) { ... }
```

- Prefer `switch` or lookup objects over long if/else chains for status-based logic
- Keep indentation depth to 3 levels maximum

### 3. Comments Are Conversations

- Explain WHY a decision was made, not what the code does
- Good: `// IESBA requires independence check before any audit engagement approval`
- Bad: `// check if approved`
- Inline TODOs include context: `// TODO(team): Replace mock with PRMS API after integration — Q2 2026`
- Section comments only where logic is non-obvious or business rules are encoded
- Never leave commented-out code — delete it (git has history)

### 4. Error Messages Are Helpful

- Backend: specific, structured, no internals leaked
  - Good: `{ error: 'Client name is required', details: { field: 'client_name' } }`
  - Bad: `{ error: 'Validation failed' }`
- Frontend: user-friendly, actionable
  - Good: "Client name is required"
  - Bad: "Error 422: Unprocessable Entity"
- Logs: enough context to debug without reproducing
  - Good: `console.error('Failed to approve request', { requestId, userId, error: error.message })`
  - Bad: `console.error(error)`

### 5. No Robot Artifacts

- No emojis in any code output (logs, emails, UI text, comments)
- No AI-style explanatory prose in code comments (e.g. "This function is responsible for...")
- No "clever" one-liners that require mental parsing
- No deeply nested callbacks or promise chains — use async/await
- No unnecessary abstractions — three similar lines is better than a premature helper function
- No over-documentation of obvious code

## Anti-Patterns to Flag

- `const d = getRequests()` — single-letter or abbreviated variable
- `// This function gets the data` — comment restates the code
- `x ? (a ? b : c) : (d ? e : f)` — nested ternary
- `data.map(x => x.filter(y => y.status === 'ok').reduce(...))` — chained operations without intermediate naming
- `req.user?.id` — using undocumented request properties (auth.js sets `req.userId`)
- `function doStuff(a, b, true, false, 'x')` — positional parameters without context

## Verification

- Read each function name aloud. Does it make sense without context?
- Can a new team member understand the function without reading the implementation?
- Are all exported functions documented with JSDoc?
- Do error messages tell the user what went wrong AND what to do about it?
- Is there any code that would look "AI-generated" to an experienced developer?
