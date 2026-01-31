# Service List Fix Summary

## Problem Identified

The `serviceTypeController.js` was using **hardcoded service lists** instead of reading from the `service_catalog_global` database table.

### Issues:
1. ❌ Hardcoded `kuwaitTemplateList` (local/Kuwait services)
2. ❌ Hardcoded `fullServiceTypeList` (global services)
3. ❌ Not reading from `service_catalog_global` table
4. ❌ Changes to database weren't reflected in API responses

---

## Solution Implemented

### ✅ Refactored `serviceTypeController.js`

**New Functions:**
1. `buildKuwaitTemplateList()` - Reads from database and groups Advisory services
2. `buildFullGlobalList()` - Reads from database and keeps all categories separate

**Key Changes:**
- ✅ Reads from `service_catalog_global` table
- ✅ Dynamically builds Kuwait template (groups Advisory sub-categories)
- ✅ Dynamically builds global list (keeps all categories separate)
- ✅ Maintains backward compatibility with existing API structure

---

## Global Service Catalog Location

### Database Table
- **Table**: `service_catalog_global`
- **Location**: SQLite database (`coi-prototype/backend/database/coi.db`)
- **Seeded by**: `seedGlobalServiceCatalog.js`

### Source Files

1. **Excel File** (Original Source):
   - **Location**: `docs/coi-system/Global COI Form.xlsx`
   - **Purpose**: Master source file with all BDO Global services

2. **Extracted Text File**:
   - **Location**: `docs/coi-system/extracted_text/Global COI Form.txt`
   - **Purpose**: Text extraction from Excel for parsing
   - **Used by**: `seedGlobalServiceCatalog.js` parser

3. **Seed Script**:
   - **Location**: `coi-prototype/backend/src/scripts/seedGlobalServiceCatalog.js`
   - **Function**: 
     - Tries to parse `Global COI Form.txt`
     - Falls back to hardcoded list if file not found
     - Populates `service_catalog_global` table

---

## How It Works Now

### 1. Kuwait Template List (Default)
- **When**: `international_operations = false` (default)
- **Source**: `service_catalog_global` table
- **Structure**:
  - Audit & Assurance
  - Advisory (all Advisory sub-categories grouped)
  - Tax Services
  - Accounting Services
  - Other Regulated Services (consolidated)

### 2. Global List (International Operations)
- **When**: `international_operations = true`
- **Source**: `service_catalog_global` table
- **Structure**: All categories kept separate (26+ categories)

---

## Database Schema

```sql
CREATE TABLE service_catalog_global (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    metadata TEXT, -- JSON: {source: 'Global COI Form', version: '1.0'}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Get Service Types
```
GET /api/integration/service-types?entity={entityCode}&international={true|false}
```

**Response:**
```json
{
  "serviceTypes": [
    {
      "category": "Audit & Assurance",
      "services": ["Statutory Audit Services", ...]
    },
    {
      "category": "Advisory",
      "services": [...],
      "hasSubCategories": true
    }
  ],
  "subCategories": {
    "Business Valuation": ["Acquisition", "Capital Increase", "Financial Facilities"]
  },
  "entity": "BDO_AL_NISF",
  "international": false
}
```

---

## Next Steps

### To Update Global Service List:

1. **Update Excel File**:
   - Edit `docs/coi-system/Global COI Form.xlsx`
   - Extract to text: `docs/coi-system/extracted_text/Global COI Form.txt`

2. **Re-seed Database**:
   ```bash
   cd coi-prototype/backend
   node -e "import('./src/scripts/seedGlobalServiceCatalog.js').then(m => m.seedGlobalServiceCatalog())"
   ```

3. **Or Update Directly in Database**:
   ```sql
   INSERT OR REPLACE INTO service_catalog_global 
   (service_code, category, service_name, is_active, display_order)
   VALUES (?, ?, ?, 1, ?);
   ```

---

## Files Modified

1. ✅ `coi-prototype/backend/src/controllers/serviceTypeController.js`
   - Removed hardcoded lists
   - Added `buildKuwaitTemplateList()` function
   - Added `buildFullGlobalList()` function
   - Now reads from `service_catalog_global` table

---

## Testing

### Verify Database Has Services:
```sql
SELECT COUNT(*) FROM service_catalog_global WHERE is_active = 1;
-- Should return 177+ services
```

### Test API:
```bash
# Local list (Kuwait template)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/integration/service-types?entity=BDO_AL_NISF"

# Global list (international operations)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/integration/service-types?entity=BDO_AL_NISF&international=true"
```

---

## Benefits

✅ **Single Source of Truth**: Database is the master
✅ **Dynamic Updates**: Changes to database reflect immediately
✅ **No Code Changes**: Update services via database/Excel
✅ **Backward Compatible**: API structure unchanged
✅ **Maintainable**: Clear separation of concerns
