# UX Principle: Don't Expose Regulatory Jargon to End Users

**Date:** January 14, 2026  
**Context:** Parent Company Verification Implementation  
**Issue:** Original plan included "IESBA Required" badges and regulatory code references in user-facing forms

---

## The Problem

### **Original Design (BAD UX):**

```vue
<label class="section-label">
  Corporate Group Structure
  <span class="iesba-badge">IESBA Required</span>
</label>

<p class="help-text">
  Required for auditor independence assessment per IESBA Code Section 290.13
</p>
```

### **Why This is Bad:**

| User Type | Their Knowledge | Their Reaction |
|-----------|----------------|----------------|
| Project Manager | Doesn't know IESBA | "What is IESBA?" 😕 |
| Department Director | Doesn't know IESBA | "Am I supposed to research this?" 😰 |
| Business Development | Doesn't know IESBA | "Is this a legal requirement I need to understand?" 😟 |

**Result:** Cognitive overload, confusion, intimidation, slower form completion

---

## The Solution

### **Corrected Design (GOOD UX):**

```vue
<label class="section-label">
  Corporate Group Structure *
</label>

<p class="help-text">
  Does this client belong to a larger corporate group or holding company?
</p>
```

### **Why This is Better:**

✅ **Standard form pattern** - Asterisk means required (universal understanding)  
✅ **Plain language** - No jargon, no regulatory codes  
✅ **Action-focused** - Tells user WHAT to do, not WHY it's legally required  
✅ **Faster completion** - User knows exactly what information to provide  

---

## The Rule: Separate User-Facing from Compliance-Facing

### **User-Facing UI (NO Regulatory Jargon)**

**Request Form:**
- ❌ "IESBA Required" badges
- ❌ "per IESBA Code Section 290.13"
- ❌ "PIE independence rules"
- ✅ Simple required field indicators (*)
- ✅ Plain language help text
- ✅ "What" not "Why"

**Validation Errors:**
```javascript
// BAD
message: 'Group structure verification required for PIE clients per IESBA 290.13'

// GOOD
message: 'Group structure verification required for Public Interest Entity clients'
// (Regulatory code stored in internal 'code' field for audit trail)
```

---

### **Compliance-Facing UI (SHOW Regulatory Context)**

**Compliance Approval Panel:**
```vue
<div class="verification-panel">
  <h4>Group Structure Verification Required</h4>
  
  <p class="regulatory-note">
    <strong>IESBA Code Section 290.13:</strong> "Audit client" includes parent, 
    subsidiaries, and affiliates. Independence requirements apply to entire group.
  </p>
  
  <p class="warning-text">
    Requester indicated they were unsure of group structure. 
    Please verify parent company relationships before approval.
  </p>
</div>
```

**Why Show It Here:**
- ✅ Compliance officers NEED to know regulatory basis
- ✅ Helps them make informed decisions
- ✅ Provides audit trail justification
- ✅ These users are trained on IESBA standards

---

## Where to Use Regulatory References

| Location | Show IESBA? | Reason |
|----------|-------------|---------|
| Request form labels | ❌ NO | Users don't need to know the law |
| Request form help text | ❌ NO | Should explain what, not why legally |
| Validation error messages | ❌ NO | Keep user-facing, log code internally |
| Compliance approval UI | ✅ YES | Officers need regulatory context |
| Conflict detection results | ✅ YES | Shows which rule triggered flag |
| Backend validation codes | ✅ YES | For audit trail and debugging |
| System documentation | ✅ YES | For training and reference |
| Audit trail logs | ✅ YES | Legal compliance tracking |

---

## Real-World Analogy

### **Bad UX (Exposing Internal Logic):**
```
Car Rental Form:
"Driver's License Number (required per Vehicle Code §12500)"
```
❌ Customer doesn't care about Vehicle Code §12500  
❌ They just need to know: provide license number

### **Good UX (User-Focused):**
```
Car Rental Form:
"Driver's License Number *"
```
✅ Clear requirement  
✅ No legal jargon  
✅ User knows exactly what to provide

---

## Implementation Checklist

### **User-Facing Changes:**
- [x] Remove "IESBA Required" badge from form labels
- [x] Change "Requires Research" to "Not Sure" (friendlier)
- [x] Simplify help text: "Does this client belong to a larger corporate group?"
- [x] Remove regulatory code references from validation messages
- [x] Keep regulatory codes in internal `code` fields only

### **Compliance-Facing Additions:**
- [x] Add regulatory context box to Compliance verification UI
- [x] Show IESBA 290.13 explanation for group structure requirements
- [x] Display regulation reference in conflict detection results
- [x] Include regulatory justification in audit trails

---

## Key Takeaway

> **Users need to know WHAT to provide.**  
> **Compliance officers need to know WHY it's required.**  
> **Don't confuse the two.**

---

## UX Principle Applied Across System

This principle should be applied to ALL regulatory requirements:

| Regulation | User Sees | Compliance Sees |
|------------|-----------|-----------------|
| IESBA 290.13 | "Corporate Group Structure *" | "IESBA 290.13: Audit client includes parent..." |
| PIE Rules | "Public Interest Entity?" | "EU Regulation 537/2014: PIE independence..." |
| Red Lines | "Service Type *" | "Red Lines violation detected per firm policy..." |
| Kuwait CMA | "Local regulatory approval needed?" | "Kuwait CMA Article 42: Prior approval required..." |

---

**Document Status:** APPROVED  
**Applied To:** Parent Company Verification Plan  
**Impact:** Improved UX, faster form completion, reduced user confusion
