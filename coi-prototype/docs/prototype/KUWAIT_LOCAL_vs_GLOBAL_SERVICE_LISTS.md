# Kuwait Local vs Global Service Lists

## 📋 Overview

This document defines the **Kuwait Local Service List** (39 services from COI Template) and the **Global Service List** (177+ services from Global COI Form).

---

## 🇰🇼 Kuwait Local Service List (39 Services)

**Source**: COI Template - Service Type Dropdown (Combo Box12)  
**Use Case**: Default list for Kuwait operations (`international_operations = false`)  
**Categories**: 6 main categories

### Category Breakdown:

#### 1. Audit & Assurance (5 services)
1. Statutory Audit Services
2. Reviews Services
3. Agreed Upon Procedures Services
4. Related Services Engagements
5. Other Audit Services

#### 2. Advisory (23 services)
1. Business / Asset Valuation Services
2. Impairment Tests Services
3. Management Consulting Services
4. SOX & Internal Controls Services
5. Internal Audit Services
6. Transaction Services
7. Risk Management Services
8. Forensics Services
9. Other – Post Merger Integrations
10. IT Audit
11. Restructuring Services
12. Due Diligence Services
13. Market and Feasibility Studies Services
14. Policies & Procedures Services
15. Business Planning Services
16. Capital Adequacy Services (Book 7)
17. AML Services (Book 16)
18. Internal Audit Quality Assurance Services
19. Performance and Profitability Improvement Services
20. Capital Adequacy Services (Book 17)
21. Clients' Funds and Clients' Assets Report Services (Book 7)
22. Payroll and HR Services
23. Other Advisory Services

#### 3. Tax Services (6 services)
1. Corporate International Tax Services
2. Tax Compliance & Assurance Engagements Services
3. FATCA Services
4. CRS Services
5. Zakat Services
6. Other Tax Services

#### 4. Accounting Services (2 services)
1. Book Keeping Services
2. Accounting Services

#### 5. IT Services (1 service)
1. IT Services

#### 6. Other Services (2 services)
1. Other Services
2. Not Applicable

**Total**: 39 services across 6 categories

---

## 🌍 Global Service List (177+ Services)

**Source**: Global COI Form.xlsx  
**Use Case**: International operations (`international_operations = true`)  
**Categories**: 26+ categories (all Advisory sub-categories kept separate)

### Category Structure:

#### Main Categories:
1. **Audit & Assurance** (5 services)
2. **Advisory - Analytics & Insights** (3 services)
3. **Advisory - Corporate Finance, Transactions and Restructuring** (14 services)
4. **Advisory - Cyber security** (22 services)
5. **Advisory - Due Diligence** (4 services)
6. **Advisory - Enablement & Adoption** (3 services)
7. **Advisory - ESG Services** (5 services)
8. **Advisory - Forensics Investigations** (15 services)
9. **Advisory - Litigation Support/Dispute Resolution** (12 services)
10. **Advisory - Management Consulting** (9 services)
11. **Advisory - Merger & Acquisitions** (3 services)
12. **Advisory - Operational Excellence** (4 services)
13. **Advisory - Other** (18 services)
14. **Advisory - Outsourcing** (4 services)
15. **Advisory - Recruitment** (2 services)
16. **Advisory - Restructuring** (4 services)
17. **Advisory - Risk Management (RAS)** (10 services)
18. **Business/Asset Valuation** (3 services) - with sub-categories
19. **Tax Services** (10 services)
20. **Accounting Services** (6 services)
21. **Internal Audit Services** (5 services)
22. **IT Services** (3 services)
23. **Transaction Services** (2 services)
24. **Risk Management Services** (1 service)
25. **Forensics Services** (1 service)
26. **Other Services** (12 services)

**Total**: 177+ services across 26+ categories

---

## 🔄 How They Work Together

### Database Storage
- **Single Table**: `service_catalog_global`
- **Metadata Field**: Stores `is_kuwait_local: true` for Kuwait services
- **Category Field**: Stores category name
- **Display Order**: Maintains order within categories

### API Behavior

#### Default (Kuwait Local):
```
GET /api/integration/service-types?entity=BDO_AL_NISF
```
- Returns: **6 categories** (Advisory grouped)
- Uses: Kuwait Local services (39 services)

#### International Operations:
```
GET /api/integration/service-types?entity=BDO_AL_NISF&international=true
```
- Returns: **26+ categories** (all Advisory sub-categories separate)
- Uses: Global services (177+ services)

---

## 📊 Comparison Table

| Aspect | Kuwait Local | Global |
|--------|--------------|--------|
| **Source** | COI Template | Global COI Form |
| **Total Services** | 39 | 177+ |
| **Categories** | 6 | 26+ |
| **Advisory Grouping** | Single "Advisory" category | Multiple Advisory sub-categories |
| **Use Case** | Kuwait operations | International operations |
| **API Parameter** | `international=false` (default) | `international=true` |

---

## 🗂️ Category Mapping

### Kuwait Local → Global Mapping

| Kuwait Category | Global Categories |
|-----------------|-------------------|
| Audit & Assurance | Audit & Assurance |
| Advisory | All Advisory sub-categories + Business/Asset Valuation |
| Tax Services | Tax Services |
| Accounting Services | Accounting Services |
| IT Services | IT Services |
| Other Services | Other Services + Internal Audit Services + Transaction Services + Risk Management Services + Forensics Services |

---

## 📝 Service Name Variations

Some services have slight name variations between Kuwait and Global:

| Kuwait Local | Global Equivalent |
|--------------|-------------------|
| Reviews Services | Review Services |
| Agreed Upon Procedures Services | Agreed-Upon Procedures |
| Business / Asset Valuation Services | Business Valuation, Asset Valuation |
| Corporate International Tax Services | Corporate Tax Advisory, Individual Tax Advisory |
| Book Keeping Services | Bookkeeping |

**Note**: The system handles these variations through fuzzy matching and category grouping.

---

## 🚀 Seeding Process

### Step 1: Seed Kuwait Local (39 services)
```javascript
import { seedKuwaitServiceCatalog } from './seedKuwaitServiceCatalog.js'
seedKuwaitServiceCatalog()
```

### Step 2: Seed Global (177+ services)
```javascript
import { seedGlobalServiceCatalog } from './seedGlobalServiceCatalog.js'
seedGlobalServiceCatalog()
```

### Combined Seeding:
```javascript
import { seedAllServiceCatalogs } from './seedServiceCatalogs.js'
await seedAllServiceCatalogs()
```

---

## ✅ Verification

### Check Kuwait Local Services:
```sql
SELECT COUNT(*) FROM service_catalog_global 
WHERE JSON_EXTRACT(metadata, '$.is_kuwait_local') = true;
-- Expected: 39
```

### Check Global Services:
```sql
SELECT COUNT(*) FROM service_catalog_global 
WHERE is_active = 1;
-- Expected: 177+
```

### Check Categories:
```sql
SELECT category, COUNT(*) as count 
FROM service_catalog_global 
WHERE is_active = 1 
GROUP BY category 
ORDER BY category;
```

---

## 📁 Files

1. **Kuwait Local Seed**: `coi-prototype/backend/src/scripts/seedKuwaitServiceCatalog.js`
2. **Global Seed**: `coi-prototype/backend/src/scripts/seedGlobalServiceCatalog.js`
3. **Combined Seed**: `coi-prototype/backend/src/scripts/seedServiceCatalogs.js`
4. **Controller**: `coi-prototype/backend/src/controllers/serviceTypeController.js`

---

## 🎯 Summary

- ✅ **Kuwait Local**: 39 services, 6 categories (Advisory grouped)
- ✅ **Global**: 177+ services, 26+ categories (all separate)
- ✅ **Database**: Single table `service_catalog_global` stores both
- ✅ **API**: Returns appropriate list based on `international` parameter
- ✅ **Seeding**: Both lists can be seeded independently or together
