# Corporate Group Relationship Types - Framing Guide

## ✅ Correct Terminology (Based on IESBA 290.13 & Corporate Standards)

### Three Relationship Types:

1. **Parent Company**
   - **Definition**: The controlling entity that owns/controls this client
   - **Context**: When this client is a subsidiary of another company
   - **Example**: "Al-Noor Holding Company" is the parent of "Advanced Manufacturing Solutions LLC"
   - **IESBA Impact**: If we audit a subsidiary, we cannot provide certain services to its parent

2. **Subsidiary** (Preferred over "Child Company" in professional context)
   - **Definition**: An entity controlled by this client (this client is the parent)
   - **Context**: When this client has subsidiaries in other countries
   - **Example**: "BDO Kuwait" has subsidiaries "BDO UAE" and "BDO Saudi"
   - **IESBA Impact**: If we audit a parent, we cannot provide certain services to its subsidiaries

3. **Sister Company** (Also called "Sibling Company" - both acceptable)
   - **Definition**: Another entity that shares the same parent as this client
   - **Context**: When this client and another entity are both subsidiaries of the same parent
   - **Example**: "BDO UAE" and "BDO Saudi" are sister companies (both subsidiaries of "BDO Global")
   - **IESBA Impact**: If we audit one sister company, we cannot provide certain services to its sister companies

---

## UI Implementation

### Updated Design Options

All three design options now include:

1. **Relationship Type Dropdown** (Required field)
   - Options: "Parent Company", "Subsidiary", "Sister Company"
   - Smart defaults based on `group_structure`:
     - If `has_parent`: Defaults to "Parent Company"
     - If `standalone`: Defaults to "Subsidiary"
     - If `research_required`: No default (user selects)

2. **Contextual Help Text**
   - Shows explanation based on selected relationship type
   - Updates dynamically when relationship type changes

3. **Dynamic Placeholders**
   - Entity name field placeholder changes based on relationship type:
     - Parent Company → "Parent company name..."
     - Subsidiary → "Subsidiary name..."
     - Sister Company → "Sister company name..."

4. **Updated Labels**
   - Changed from "Parent Companies" / "Subsidiaries" to "Related Entities"
   - More inclusive and accurate

---

## Data Structure

```typescript
interface InternationalCountry {
  country_code: string
  expanded?: boolean
  entities: Array<{
    relationship_type: 'parent' | 'subsidiary' | 'sister'
    name: string
    details: string
  }>
}
```

---

## Why This Framing is Correct

### ✅ Professional Terminology
- Uses standard corporate/accounting terminology
- Aligns with IESBA 290.13 language
- Clear and unambiguous

### ✅ Covers All Scenarios
- **Parent**: Client is controlled by another entity
- **Subsidiary**: Client controls other entities
- **Sister**: Client shares parent with other entities

### ✅ IESBA Compliance
- Matches IESBA 290.13 requirement: "parent company, subsidiaries, affiliates, and related entities under common control"
- Enables proper conflict detection across all relationship types

### ✅ User-Friendly
- Clear labels and help text
- Smart defaults reduce user effort
- Contextual guidance based on group structure

---

## Example Use Cases

### Use Case 1: Client with Parent Company
- **Client**: "Advanced Manufacturing Solutions LLC"
- **Group Structure**: `has_parent`
- **Country**: Kuwait
- **Entity 1**: 
  - Relationship: Parent Company
  - Name: "Al-Noor Holding Company K.S.C.C"
- **Entity 2**:
  - Relationship: Sister Company
  - Name: "Al-Noor Trading Company W.L.L"

### Use Case 2: Client with Subsidiaries
- **Client**: "BDO Kuwait"
- **Group Structure**: `standalone`
- **Country 1**: UAE
  - Entity: Subsidiary → "BDO UAE"
- **Country 2**: Saudi Arabia
  - Entity: Subsidiary → "BDO Saudi"

### Use Case 3: Complex Group Structure
- **Client**: "Regional Operations LLC"
- **Group Structure**: `has_parent`
- **Country**: Kuwait
- **Entity 1**: Parent Company → "Global Holdings Inc"
- **Entity 2**: Sister Company → "Regional Trading LLC"
- **Entity 3**: Sister Company → "Regional Services W.L.L"

---

## Implementation Status

✅ **All 3 design options updated:**
- Option 1: Card-Based Design
- Option 2: Table-Based Design  
- Option 3: Accordion Design (Recommended)

✅ **Features implemented:**
- Relationship type dropdown
- Smart defaults based on group structure
- Contextual help text
- Dynamic placeholders
- Updated labels and messaging

✅ **Ready for review:**
- Demo page: `/coi/international-operations-demo`
- All options functional and interactive
