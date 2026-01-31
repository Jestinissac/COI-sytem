---
name: build-verification
description: Verifies user journeys, business logic, and business goals against builds. Ensures UI/UX design follows Dieter Rams principles. Use when reviewing code changes, testing features, or validating implementations against requirements.
---

# Build Verification & Design Compliance

## Core Responsibilities

When reviewing builds or code changes, verify:

1. **User Journey Alignment** - Implementation matches documented user journeys
2. **Business Logic Compliance** - Features implement correct business rules
3. **Business Goals Achievement** - Changes support stated business objectives
4. **Dieter Rams Design Principles** - UI/UX follows minimal, functional design standards

---

## User Journey Verification

### Verification Checklist

For each feature or change, verify:

- [ ] **User flow matches documented journey** (see `COI System /User_Journeys_End_to_End.md`)
- [ ] **All required steps are present** (no missing workflow stages)
- [ ] **Status transitions are correct** (matches state machine)
- [ ] **Role-based access is enforced** (users see only their permitted actions)
- [ ] **Notifications trigger at correct points** (see `FEEDBACK_LOOP_DESIGN.md`)
- [ ] **Integration points work** (PRMS, HRMS mock integrations)
- [ ] **Error handling guides users** (clear messages, recovery paths)

### Key User Journeys to Verify

1. **Requester Journey**: Login -> Create Request -> Submit -> Track Status -> Receive Notifications
2. **Director Journey**: Review Requests -> Approve/Reject -> Delegate if needed
3. **Compliance Journey**: Review -> Check Conflicts -> Approve/Request Info
4. **Partner Journey**: Final Review -> Approve -> Generate Engagement Code
5. **Finance Journey**: Validate Financial Data -> Approve -> Activate Engagement

### Common Issues to Flag

- Missing status transitions
- Incorrect role permissions
- Broken notification triggers
- Missing validation steps
- Incomplete error handling
- Uses `req.user.id` instead of `req.userId` (auth.js sets `req.userId`/`req.userRole`, NOT `req.user`)
- Emojis in email subjects or notification text (violates human-like copy standard)
- `console.log` without dev-only gating (should use devLog pattern)
- Missing response mapper on data-returning endpoints (Compliance data leak risk)

---

## Business Logic Verification

### Core Business Rules

Verify these critical rules are enforced:

1. **No Engagement Without COI Approval**
   - Engagement codes only generated after full approval chain
   - Database constraints prevent bypass
   - PRMS integration validates engagement code

2. **Duplication Detection**
   - Fuzzy matching triggers on submission
   - 90%+ match requires justification
   - Service conflicts are detected (IESBA rules)

3. **Approval Workflow**
   - Sequential: Director -> Compliance -> Partner -> Finance -> Admin
   - Cannot skip stages
   - Rejection stops workflow immediately

4. **Department Segregation**
   - Users only see their department's data
   - Cross-department access requires explicit permissions
   - Audit trail tracks all access

5. **Engagement Code Format**
   - Format: `ENG-YYYY-SVC-#####`
   - Unique per engagement
   - Validated before PRMS project creation

---

## Dieter Rams Design Principles

Apply these principles when reviewing UI/UX. **Also verify human-like design and copy:** no AI-generated emojis anywhere in UI; no AI-style subtext, captions, or taglines; no filler or generic marketing copy; all visible text is specific, contextual, and human-like.

### Design Standards

- **Spacing:** 8px grid system (gap-1, gap-2, gap-4, gap-6, gap-8)
- **Colors:** bg-white/bg-gray-50/bg-gray-100 backgrounds; text-blue-600 single accent; status colors functional only
- **Typography:** text-xs labels, text-3xl/2xl/xl headings, text-base/sm body
- **Borders:** border-gray-200 default, shadow-sm only
- **No:** gradients, shadow-lg/xl/2xl, decorative elements, colored backgrounds, emojis

---

## Success Criteria

A build passes verification when:

- All user journeys are complete and functional
- All business rules are enforced
- Business goals are supported
- Zero critical design violations
- Spacing follows 8px grid
- Colors match approved palette
- No decorative elements
- Typography is consistent
- Borders/shadows are minimal
