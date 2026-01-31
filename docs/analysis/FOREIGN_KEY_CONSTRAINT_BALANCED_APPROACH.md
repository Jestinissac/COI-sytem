# Balanced Approach for Foreign Key Constraints and Deletions

## Understanding Foreign Key Constraints

A **Foreign Key Constraint** is a database rule that maintains referential integrity between tables. It ensures that:
- You cannot delete a parent record if child records still reference it
- You cannot insert a child record with an invalid parent reference

## The Three Approaches

### 1. **ON DELETE CASCADE** (Automatic Deletion)
**What it does:** When parent is deleted, all child records are automatically deleted by the database.

**Pros:**
- ✅ Simple - no manual cleanup needed
- ✅ Fast - database handles it efficiently
- ✅ Atomic - all or nothing (transaction-safe)

**Cons:**
- ❌ No control over deletion logic
- ❌ Cannot delete files from filesystem
- ❌ Cannot enforce business rules (e.g., "only drafts can be deleted")
- ❌ No audit trail of what was deleted
- ❌ Dangerous if misconfigured (could delete more than intended)

**Example:**
```sql
FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE CASCADE
```

### 2. **ON DELETE RESTRICT** (Prevent Deletion)
**What it does:** Prevents deletion of parent if any child records exist.

**Pros:**
- ✅ Safe - prevents accidental data loss
- ✅ Forces explicit cleanup
- ✅ Good for critical relationships

**Cons:**
- ❌ Requires manual cleanup in application code
- ❌ More complex deletion logic
- ❌ Risk of orphaned data if cleanup fails

**Example:**
```sql
FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE RESTRICT
```

### 3. **Manual Deletion** (Current Approach)
**What it does:** Application code explicitly deletes child records before parent.

**Pros:**
- ✅ Full control over deletion logic
- ✅ Can delete files from filesystem
- ✅ Can enforce business rules
- ✅ Can add audit logging
- ✅ Can handle complex relationships

**Cons:**
- ❌ More code to maintain
- ❌ Risk of missing a related table
- ❌ Must ensure deletion order is correct
- ❌ More error-prone

## The Balanced Approach (Recommended)

**Use a hybrid strategy based on the relationship type:**

### Strategy 1: CASCADE for Simple, Safe Relationships
Use `ON DELETE CASCADE` for relationships where:
- Child data has no independent value
- No file cleanup needed
- No business rules to enforce
- Simple one-to-many relationships

**Example:**
```sql
-- Signatories are only meaningful with the request
FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE CASCADE
```

### Strategy 2: RESTRICT for Critical Relationships
Use `ON DELETE RESTRICT` for relationships where:
- Child data should never be deleted with parent
- Data has independent value
- Need to prevent accidental deletion

**Example:**
```sql
-- Engagement codes should not be deleted when request is deleted
FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE RESTRICT
```

### Strategy 3: Manual Deletion for Complex Logic
Use manual deletion for relationships where:
- File cleanup is needed (attachments, uploaded files)
- Business rules must be enforced (only drafts can be deleted)
- Audit logging is required
- Complex cleanup logic exists

**Example:**
```javascript
// Delete attachments and their files
const attachments = db.prepare('SELECT * FROM coi_attachments WHERE coi_request_id = ?').all(id)
attachments.forEach(attachment => {
  if (attachment.file_path && fs.existsSync(attachment.file_path)) {
    fs.unlinkSync(attachment.file_path) // Delete file from filesystem
  }
})
db.prepare('DELETE FROM coi_attachments WHERE coi_request_id = ?').run(id)
```

## Recommended Approach for COI System

### For Draft Deletions (Current Implementation - Good)

**Use Manual Deletion** because:
1. ✅ Need to delete files from filesystem (attachments, uploaded files)
2. ✅ Need to enforce business rule: "Only drafts can be deleted"
3. ✅ Need to handle multiple related tables
4. ✅ Need error handling and user feedback

**Current Implementation:**
```javascript
// 1. Delete attachments and files
// 2. Delete uploaded_files and files
// 3. Delete signatories
// 4. Delete isqm_forms
// 5. Delete global_coi_submissions
// 6. Delete engagement_renewals
// 7. Delete monitoring_alerts
// 8. Delete execution_tracking
// 9. Finally delete coi_requests
```

### For Submitted Requests (Should Use RESTRICT)

**Use ON DELETE RESTRICT** because:
- Submitted requests should never be deleted
- Engagement codes, renewals, and monitoring data have independent value
- Need to prevent accidental data loss

**Recommended Schema Update:**
```sql
-- For critical relationships, use RESTRICT
FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE RESTRICT

-- For simple relationships, use CASCADE
FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE CASCADE
```

## Best Practices

### 1. **Categorize Relationships**

**CASCADE (Safe to auto-delete):**
- `coi_signatories` - Only meaningful with request
- `monitoring_alerts` - Only meaningful with request
- `execution_tracking` - Only meaningful with request

**RESTRICT (Prevent deletion):**
- `coi_engagement_codes` - Has independent value, should not be deleted
- `engagement_renewals` - Historical data, should be preserved

**MANUAL (Complex logic needed):**
- `coi_attachments` - Need file cleanup
- `uploaded_files` - Need file cleanup
- `isqm_forms` - May need special handling
- `global_coi_submissions` - May need special handling

### 2. **Order of Deletion Matters**

Always delete in this order:
1. Files from filesystem (attachments, uploaded files)
2. Child records with CASCADE relationships
3. Child records with RESTRICT relationships (if allowed)
4. Parent record

### 3. **Transaction Safety**

Wrap deletions in a transaction:
```javascript
const transaction = db.transaction(() => {
  // Delete all related records
  // Delete parent record
})
transaction()
```

### 4. **Error Handling**

Handle errors gracefully:
```javascript
try {
  // Delete operations
} catch (error) {
  if (error.message.includes('FOREIGN KEY constraint')) {
    // Identify which table is blocking deletion
    // Provide helpful error message
  }
}
```

## Recommended Schema Updates

### Option A: Hybrid Approach (Recommended)

```sql
-- Simple relationships: CASCADE
ALTER TABLE coi_signatories 
  DROP CONSTRAINT IF EXISTS fk_coi_signatories_request;
ALTER TABLE coi_signatories 
  ADD CONSTRAINT fk_coi_signatories_request 
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE CASCADE;

-- Critical relationships: RESTRICT
ALTER TABLE coi_engagement_codes 
  DROP CONSTRAINT IF EXISTS fk_engagement_code_request;
ALTER TABLE coi_engagement_codes 
  ADD CONSTRAINT fk_engagement_code_request 
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id) ON DELETE RESTRICT;

-- Complex relationships: Manual (no CASCADE)
-- Keep current manual deletion for:
-- - coi_attachments (file cleanup needed)
-- - uploaded_files (file cleanup needed)
-- - isqm_forms (may need special handling)
```

### Option B: Keep Current Manual Approach (Current - Also Good)

**Pros:**
- ✅ Full control
- ✅ Can handle file cleanup
- ✅ Can enforce business rules
- ✅ Works well for drafts

**Cons:**
- ❌ More code to maintain
- ❌ Must remember to update when new tables are added

## Recommendation for COI System

**Keep the current manual deletion approach** for draft deletions because:

1. ✅ **File Cleanup Required**: Attachments and uploaded files need filesystem cleanup
2. ✅ **Business Rules**: Only drafts can be deleted - this logic belongs in application code
3. ✅ **Error Handling**: Can provide specific error messages
4. ✅ **Audit Trail**: Can log what was deleted
5. ✅ **Flexibility**: Can add/remove deletion logic as needed

**However, consider adding CASCADE for simple relationships:**
- `coi_signatories` - Safe to cascade
- `monitoring_alerts` - Safe to cascade

**And RESTRICT for critical relationships:**
- `coi_engagement_codes` - Should never be deleted with request
- `engagement_renewals` - Historical data, should be preserved

## Summary

**Balanced Approach = Right Tool for Right Job**

- **CASCADE**: Simple, safe relationships (signatories, alerts)
- **RESTRICT**: Critical data that should never be deleted (engagement codes)
- **MANUAL**: Complex logic needed (file cleanup, business rules, audit trails)

Your current implementation is actually following the balanced approach correctly for draft deletions! The foreign key error was simply because we missed the `uploaded_files` table, which is now fixed.
