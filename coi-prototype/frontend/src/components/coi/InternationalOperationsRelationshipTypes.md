# International Operations - Relationship Types

## Corporate Group Relationship Types

Based on IESBA 290.13 and corporate structure standards, entities in a corporate group can have three types of relationships:

### 1. **Parent Company**
- **Definition**: The controlling entity that owns/controls this client
- **Context**: When this client is a subsidiary of another company
- **Example**: "Al-Noor Holding Company" is the parent of "Advanced Manufacturing Solutions LLC"
- **IESBA Impact**: If we audit a subsidiary, we cannot provide certain services to its parent

### 2. **Subsidiary** (Child Company)
- **Definition**: An entity controlled by this client (this client is the parent)
- **Context**: When this client has subsidiaries in other countries
- **Example**: "BDO Kuwait" has subsidiaries "BDO UAE" and "BDO Saudi"
- **IESBA Impact**: If we audit a parent, we cannot provide certain services to its subsidiaries

### 3. **Sister Company** (Sibling Company)
- **Definition**: Another entity that shares the same parent as this client
- **Context**: When this client and another entity are both subsidiaries of the same parent
- **Example**: "BDO UAE" and "BDO Saudi" are sister companies (both subsidiaries of "BDO Global")
- **IESBA Impact**: If we audit one sister company, we cannot provide certain services to its sister companies

---

## UI Framing Options

### Option A: Relationship Type Dropdown (Recommended)
**Best for:** Clear, explicit selection

```
┌─────────────────────────────────────────┐
│ Country: [Kuwait ▼]                    │
│                                         │
│ Relationship Type: [▼]                 │
│   • Parent Company                      │
│   • Subsidiary                          │
│   • Sister Company                      │
│                                         │
│ Entity Name: [________________]        │
│ Details: [________________]            │
└─────────────────────────────────────────┘
```

### Option B: Radio Buttons with Icons
**Best for:** Visual clarity

```
┌─────────────────────────────────────────┐
│ Country: [Kuwait ▼]                    │
│                                         │
│ Relationship Type:                      │
│  (○) Parent Company    (○) Subsidiary  │
│  (○) Sister Company                     │
│                                         │
│ Entity Name: [________________]        │
└─────────────────────────────────────────┘
```

### Option C: Contextual Based on Group Structure
**Best for:** Simplified when group structure is known

```
If group_structure === 'has_parent':
  Show: "Parent Company" (only option)
  
If group_structure === 'standalone':
  Show: "Subsidiary" or "Sister Company" options
  
If group_structure === 'research_required':
  Show: All three options
```

---

## Recommended Approach: Option A with Smart Defaults

**Implementation:**
1. Always show relationship type dropdown
2. Pre-select based on `group_structure`:
   - If `has_parent`: Default to "Parent Company"
   - If `standalone`: Default to "Subsidiary"
   - If `research_required`: No default (user selects)
3. Allow user to change if needed
4. Store `relationship_type` in database

---

## Database Schema Update

```sql
-- Update international_countries structure
-- Each entity should have:
{
  country_code: 'KWT',
  entities: [
    {
      name: 'Al-Noor Holding Company',
      relationship_type: 'parent',  -- 'parent' | 'subsidiary' | 'sister'
      details: 'Additional information...'
    }
  ]
}
```

---

## Labeling Recommendations

**Professional Terminology:**
- ✅ **Parent Company** (not "Parent")
- ✅ **Subsidiary** (preferred over "Child Company" in professional context)
- ✅ **Sister Company** (or "Sibling Company" - both acceptable)

**Help Text:**
- **Parent Company**: "The controlling entity that owns this client"
- **Subsidiary**: "An entity controlled by this client"
- **Sister Company**: "Another entity sharing the same parent as this client"
