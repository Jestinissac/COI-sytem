# E2E Design & Demo UI/UX Build Verification (Per User Level)

**Date:** January 2026  
**Scope:** COI prototype frontend + backend flows per role.  
**References:** [User_Journeys_End_to_End.md](../../docs/coi-system/User_Journeys_End_to_End.md), [FEEDBACK_LOOP_DESIGN.md](FEEDBACK_LOOP_DESIGN.md), [DIETER_RAMS_VIOLATIONS.md](DIETER_RAMS_VIOLATIONS.md), [DIETER_RAMS_FIXES_PLAN.md](DIETER_RAMS_FIXES_PLAN.md), [PROTOTYPE_E2E_ISSUES_LIST.md](../../docs/cursor-skills/PROTOTYPE_E2E_ISSUES_LIST.md).

---

## Summary Table

| Role | User Journey | Business Logic | Notifications | Design | Pitfalls |
|------|--------------|----------------|---------------|--------|----------|
| **Requester** | Pass | Pass | Pass | Fail (P1) | Minor (emojis if present) |
| **Director** | Pass | Pass | Pass | Fail (P1) | None |
| **Compliance** | Pass | Pass | Pass | Fail (P1) | Copy: "Pending Compliance Review" in one heading |
| **Partner** | Pass | Pass | Pass | Fail (P1) | Minor (emojis if present) |
| **Finance** | Pass | Pass | Pass | Pass (dashboard) | None |
| **Admin** | Pass | Pass | Pass | Fail (P1) | None |
| **Super Admin** | Pass | Pass | Pass | Fail (P1) | None |

**Legend:** Pass = aligned with references; Fail = violations or gaps; Minor = small copy/emoji issues.

---

## 1. Requester

### 1.1 User Journey Alignment

- **Login → Landing → My Requests:** Router redirects Requester to `/coi/requester`; RequesterDashboard shows My Requests, tabs (All / Draft / Pending / Approved / Rejected), filters, and empty/error state. **Pass.**
- **Create request (form):** Route `/coi/request/new` with meta `roles: ['Requester', 'Director']`; COIRequestForm has sections (Client, Service, Ownership, Signatory, International). **Pass.**
- **Submit:** Submit flow in coiController; status transitions to Pending Director Approval or Pending Compliance; duplication/conflict flow and justification supported. **Pass.**
- **View status / Respond to need more info / View approved/rejected:** RequesterDashboard and COIRequestDetail show status; need-more-info and resubmit flows exist. **Pass.**

### 1.2 Business Logic

- **Approval order:** Submit sets Pending Director Approval or Pending Compliance; no skip. **Pass.**
- **Department segregation:** getFilteredRequests filters by `requester_id` and `department` for Requester. **Pass.**
- **Duplication/conflict:** Submit path checks duplicates and group conflict; justification required when applicable. **Pass.**

### 1.3 Notifications

- **Submit:** notifyRequestSubmitted, notifyDirectorApprovalRequired, notifyComplianceReviewRequired used in coiController submit flow. **Pass.**
- **Approval/rejection/need more info:** sendApprovalNotification, sendRejectionNotification, sendNeedMoreInfoNotification called from approve/reject/need-more-info endpoints. **Pass.**

### 1.4 Design (Dieter Rams)

- **RequesterDashboard.vue:** DIETER_RAMS_VIOLATIONS lists P1 colored backgrounds (bg-blue-50, hover:border-amber/green-500, bg-amber/green-500), P2 spacing. **Fail (P1).**
- **COIRequestForm.vue:** Colored section background (bg-blue-50), colored notice (bg-blue-50 border-blue-200); PROTOTYPE_E2E lists shadow-xl. **Fail (P1).**
- **COIRequestDetail.vue:** Role-based actions present; modals use shadow-sm/border where checked. **Pass for structure;** colored rejection/approval buttons (amber/red/blue/yellow) are functional status/actions; acceptable per skill (StatusBadge/functional only). Minor: ensure no decorative gradients in detail view.

### 1.5 Other Pitfalls

- **req.user:** Not used; controllers use getUserById(req.userId). **Pass.**
- **Emojis:** PROTOTYPE_E2E lists RequesterDashboard "Awaiting" with emoji; if still present, replace with plain text or icon. **Minor.**

---

## 2. Director

### 2.1 User Journey Alignment

- **Login → Director dashboard; team requests; approve/reject pending:** Router meta `roles: ['Director']` for `/coi/director`; DirectorDashboard shows pending approvals, team requests, approved list; COIRequestDetail shows Approve/Reject only for Director (no Restrictions/Need More Info). **Pass.**

### 2.2 Business Logic

- **Data scope:** getFilteredRequests filters by team (director_id + department) and includes director's own requests. **Pass.**
- **Next status:** approveRequest sets nextStatus to Pending Compliance when role is Director. **Pass.**

### 2.3 Notifications

- **On submit (when Pending Director Approval):** notifyDirectorApprovalRequired called. **Pass.**
- **On approve:** sendApprovalNotification with nextRole Compliance. **Pass.**

### 2.4 Design (Dieter Rams)

- **DirectorDashboard.vue:** P1 colored backgrounds and hovers (bg-blue-50, hover:border-amber/blue/green/purple-500, colored indicators). **Fail (P1).**
- **Shared:** LandingPage, SystemTile (all roles) have P0 gradients/shadows/transforms. **Fail (P0).**

### 2.5 Other Pitfalls

- None identified; req.userId/req.userRole used correctly.

---

## 3. Compliance

### 3.1 User Journey Alignment

- **Login → Compliance dashboard; review queue; open request; four decisions:** ComplianceDashboard shows pending, conflicts, duplications, history; COIRequestDetail shows Approve, Reject, Approve with Restrictions, Need More Info for Compliance when status is Pending Compliance. **Pass.**

### 3.2 Business Logic

- **Commercial data:** getMyRequests and getRequestById use mapResponseForRole(..., user.role); responseMapper strips financial_parameters, total_fees, engagement_code, fee_details for Compliance. **Pass.**
- **Four decision actions:** Approve, Reject, Approve with Restrictions, Need More Info present in COIRequestDetail. **Pass.**
- **Next status:** approveRequest sets nextStatus to Pending Partner for Compliance. **Pass.**

### 3.3 Notifications

- **On approve:** sendApprovalNotification with nextRole Partner. **Pass.**
- **Reject / Need more info:** sendRejectionNotification, sendNeedMoreInfoNotification. **Pass.**

### 3.4 Design (Dieter Rams)

- **ComplianceDashboard.vue:** P1 colored icon containers and hovers (bg-blue/red/yellow/purple-100, hover:border-*-300); P0-level shadow-xl on one modal (line 764). **Fail (P1/P0).**
- **COIRequestDetail.vue:** Action buttons use colored backgrounds for actions (functional); acceptable. **Pass.**

### 3.5 Other Pitfalls

- **Copy inconsistency:** ComplianceDashboard.vue line 158 uses heading "Pending Compliance Review"; system status is "Pending Compliance". **Fix:** Change heading to "Pending Compliance" for consistency with status and User_Journeys.
- **Reports/backend status labels:** reportDataService.js uses 'Pending Partner Approval' in params/SQL (lines 493, 659); DB status is 'Pending Partner'. **Gap:** Can cause wrong counts/filters in reports; align to 'Pending Partner'. Reports.vue uses "Pending Compliance Review" / "Pending Partner Approval" in dropdowns; align to "Pending Compliance" / "Pending Partner" for consistency.

---

## 4. Partner

### 4.1 User Journey Alignment

- **Login → Partner dashboard; pending approvals; four decisions; track engagements/renewals:** PartnerDashboard shows KPIs, pending, active engagements, renewals, red flags; COIRequestDetail shows same four actions for Partner when status is Pending Partner. **Pass.**

### 4.2 Business Logic

- **Next status:** approveRequest sets nextStatus to Pending Finance for Partner. **Pass.**
- **Engagement code:** Visibility in detail after generation; not shown to Compliance (stripped). **Pass.**

### 4.3 Notifications

- **On approve:** sendApprovalNotification with nextRole Finance. **Pass.**

### 4.4 Design (Dieter Rams)

- **PartnerDashboard.vue:** Same pattern as other dashboards (colored backgrounds/hovers per DIETER_RAMS_VIOLATIONS). **Fail (P1).**
- **Emojis:** PROTOTYPE_E2E lists PartnerDashboard "Awaiting", "X days" with emoji; replace with text/icon if present. **Minor.**

### 4.5 Other Pitfalls

- None; req.userId/req.userRole used.

---

## 5. Finance

### 5.1 User Journey Alignment

- **Login → Finance dashboard; finance queue; open request; financial params; generate engagement code; notify Admin:** FinanceDashboard shows pending finance queue and code generation; COIRequestDetail shows engagement code section and generate-code flow for Finance when status is Pending Finance; generateEngagementCode validates Partner approval and status (Pending Finance or Approved). **Pass.**

### 5.2 Business Logic

- **Engagement code format:** engagementCodeService generates ENG-YYYY-SVC-##### (e.g. ENG-2026-TAX-00001); validated by pattern. **Pass.**
- **Code only after Partner approval:** generateEngagementCode checks validStatuses ['Pending Finance', 'Approved'] and partner approval. **Pass.**
- **Notifications:** sendEngagementCodeNotification called after code generation. **Pass.**

### 5.3 Notifications

- **After generate code:** sendEngagementCodeNotification. **Pass.**

### 5.4 Design (Dieter Rams)

- **FinanceDashboard.vue:** Error/empty state and Retry added; no P0 gradients in main dashboard layout; DIETER_RAMS_VIOLATIONS does not list FinanceDashboard in top offenders. **Pass (dashboard).**
- **Shared:** Login.vue has shadow-xl (all roles). **Fail (P1) for shared view.**

### 5.5 Other Pitfalls

- None.

---

## 6. Admin

### 6.1 User Journey Alignment

- **Login → Admin dashboard; execution queue; record execution; 30-day monitoring; client approved/rejected/lapse; renewals:** AdminDashboard has execution queue, 30-day monitoring, renewal alerts; COIRequestDetail and execution endpoints support execute and status transitions (Active, Lapsed). **Pass.**

### 6.2 Business Logic

- **Execute only with engagement code:** Execution flow and UI gate on engagement code. **Pass.**
- **Status transitions:** Active, Lapsed, client approved/rejected handled in backend and UI. **Pass.**

### 6.3 Notifications

- **Proposal executed:** sendProposalExecutedNotification. **Pass.**
- **Monitoring:** monitoringService runs scheduled checks; alerts per FEEDBACK_LOOP_DESIGN. **Pass.**

### 6.4 Design (Dieter Rams)

- **AdminDashboard.vue:** PROTOTYPE_E2E and DIETER_RAMS list shadow-xl on modals (e.g. lines 607, 649). **Fail (P1).**

### 6.5 Other Pitfalls

- None.

---

## 7. Super Admin

### 7.1 User Journey Alignment

- **Login → Super Admin dashboard; all requests; field/config management; monitoring; permissions:** SuperAdminDashboard shows system overview; routes for PermissionConfig, FormBuilder, Reports, SLAConfig, etc. are gated by Super Admin / Admin. **Pass.**

### 7.2 Business Logic

- **Cross-role visibility:** getFilteredRequests returns all departments for Super Admin (no role filter). **Pass.**
- **Config access:** FormBuilder, config routes protected by requireRole('Admin', 'Super Admin') or similar. **Pass.**

### 7.3 Notifications

- Not applicable beyond system-wide monitoring. **Pass.**

### 7.4 Design (Dieter Rams)

- **SuperAdminDashboard.vue:** shadow-xl on modals (lines 555, 640). **Fail (P1).**
- **FormBuilder.vue:** shadow-xl, emoji in field type label (e.g. Dropdown icon). **Fail (P1).**
- **Reports.vue:** P0 gradients (page + header), colored buttons; used by Admin/Super Admin. **Fail (P0).**

### 7.5 Other Pitfalls

- None.

---

## Prioritized Improvement List

### Critical (P0)

| # | File / Location | Issue | Fix |
|---|----------------|-------|-----|
| 1 | LandingPage.vue (line 2) | Gradient background | Use `bg-gray-50` |
| 2 | LandingPage.vue (line 6) | Decorative gradient icon container | Remove gradient, shadow, use simple icon |
| 3 | SystemTile.vue (lines 4, 7) | Excessive shadows, transform, gradient icon | Use border, hover:border-gray-400; remove transform and gradient |
| 4 | Reports.vue (lines 2, 53) | Gradient background and header | Use `bg-gray-50` and `bg-white border-b border-gray-200` |
| 5 | reportDataService.js (lines 493, 659) | Status 'Pending Partner Approval' | Use 'Pending Partner' to match DB and coiController |
| 6 | Reports.vue (filters) | Dropdown values "Pending Compliance Review", "Pending Partner Approval" | Use "Pending Compliance", "Pending Partner" |

### High (P1)

| # | File / Location | Issue | Fix |
|---|----------------|-------|-----|
| 7 | RequesterDashboard.vue | Colored backgrounds/hovers (bg-blue-50, hover:border-amber/green-500) | Use bg-gray-50, hover:border-gray-400 |
| 8 | DirectorDashboard.vue | Colored backgrounds/hovers | Same as above |
| 9 | ComplianceDashboard.vue | Colored icon containers, shadow-xl modal (line 764) | Neutral icon containers; shadow-sm or border for modal |
| 10 | ComplianceDashboard.vue (line 158) | Heading "Pending Compliance Review" | Change to "Pending Compliance" |
| 11 | PartnerDashboard.vue | Colored backgrounds/hovers | Neutralize per design system |
| 12 | COIRequestForm.vue | shadow-xl, bg-blue-50 sections | Use shadow-sm/border; bg-gray-50 for sections |
| 13 | Login.vue (line 21) | shadow-xl | Use shadow-sm or border |
| 14 | AdminDashboard.vue (modals) | shadow-xl | Use shadow-sm or border |
| 15 | SuperAdminDashboard.vue (modals) | shadow-xl | Use shadow-sm or border |
| 16 | FormBuilder.vue | shadow-xl, emoji in field type | shadow-sm; replace emoji with SVG/icon |
| 17 | PRMSDemo.vue | Multiple gradients, shadow-lg | Use flat backgrounds, shadow-sm/border |
| 18 | Emojis (RequesterDashboard, PartnerDashboard, DirectorDashboard, LandingPage, etc.) | Emojis in UI | Replace with plain text or standard icon component |
| 19 | emailService.js / monitoringService.js | Emoji in subject/body | Remove for professional tone |

### Medium (P2)

| # | File / Location | Issue | Fix |
|---|----------------|-------|-----|
| 20 | coi.routes.js | applyDataSegregation not used on list route | Optional: add middleware for consistency; list already stripped via mapResponseForRole in controller |
| 21 | reportDataService.js getComplianceSummaryReport | Verify no commercial fields in payload for Compliance | If any, strip same as getRequestById |
| 22 | Frontend console.log (auth, api, useKeyboardShortcuts) | Unguarded console | Remove or wrap in import.meta.env.DEV |

### Low (P3)

| # | File / Location | Issue | Fix |
|---|----------------|-------|-----|
| 23 | coi-wizard steps | Step backgrounds bg-gradient-to-b from-*-50 to-white | Consider bg-gray-50 or bg-white |
| 24 | StatusBadge / dashboard copy | Ensure human-like, specific text | Spot-check; no generic taglines |

---

## Reference to Existing Lists

- **DIETER_RAMS_VIOLATIONS.md:** 169 violations; P0 (12), P1 (45), P2 (78), P3 (34). Most violations: Reports.vue, LandingPage.vue, SystemTile.vue, RequesterDashboard, DirectorDashboard, ComplianceDashboard, COIRequestForm. Summary by file in that doc.
- **PROTOTYPE_E2E_ISSUES_LIST.md:** P0 (commercial data in list — fixed via mapResponseForRole; status name in reports — fix 'Pending Compliance Review' / 'Pending Partner Approval'). P1 (emojis, gradients/shadows, debug console, email emoji). P2 (applyDataSegregation, report payload audit, frontend console). P3 (wizard backgrounds, status copy).
- **User_Journeys_End_to_End.md:** All seven role journeys (Requester, Compliance, Partner, Finance, Admin, Super Admin, PRMS integration). Verification above confirms required steps and status labels (Pending Compliance, Pending Partner, etc.) are implemented; remaining gaps are copy/label consistency and design violations, not missing workflow steps.

---

## Success Criteria (Build-Verification Skill)

| Criterion | Status |
|-----------|--------|
| All user journeys complete and functional | Pass |
| All business rules enforced | Pass |
| Business goals supported | Pass |
| Zero critical design violations | Fail — P0 gradients/shadows in LandingPage, SystemTile, Reports |
| Spacing follows 8px grid | Fail — P2 spacing inconsistencies across files |
| Colors match approved palette | Fail — P1 colored backgrounds/hovers in dashboards |
| No decorative elements | Fail — P0/P1 decorative gradients and icon containers |
| Typography consistent | Fail — P2 typography mix in places |
| Borders/shadows minimal | Fail — shadow-xl in multiple views |

**Conclusion:** E2E behaviour and business logic are aligned with User_Journeys and FEEDBACK_LOOP_DESIGN. Auth uses req.userId/req.userRole; Compliance list and detail strip commercial data via mapResponseForRole. Remaining work is design (Dieter Rams) and label/copy consistency (Pending Compliance vs Pending Compliance Review, Pending Partner vs Pending Partner Approval) plus cleanup of emojis and console logging as in PROTOTYPE_E2E_ISSUES_LIST.
