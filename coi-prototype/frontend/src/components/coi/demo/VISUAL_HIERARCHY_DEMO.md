# Option 3: Accordion with Nested Cards - Visual Hierarchy Demo

## Visual Hierarchy Structure

### Level 1: Countries (Accordion Headers)
- **Visual Indicator**: Numbered badges (1, 2, 3...)
- **Information Display**: Country name, country code, entity count, relationship type badges
- **Interaction**: Click to expand/collapse
- **Styling**: Gradient background, hover effects

### Level 2: Country Details (Accordion Content)
- **Country Selection**: Dropdown with country list
- **Context Banner**: Blue info box explaining corporate group relationships
- **Entity Section**: Header with "Add Entity" button

### Level 3: Entity Cards (Nested Cards)
- **Color-Coded Borders**: 
  - 🟣 **Purple** (left border) = Parent Company
  - 🔵 **Blue** (left border) = Subsidiary
  - 🟢 **Green** (left border) = Sister Company
  - ⚪ **Gray** (left border) = No relationship selected

- **Visual Elements**:
  - Relationship type badge with emoji icons
  - Entity name field (bold, prominent)
  - Details textarea
  - Remove button

---

## Sample Data Structure

### Country 1: Kuwait (KWT)
**Status**: Expanded
**Entities**: 2
- **Parent Company**: Al-Noor Holding Company K.S.C.C
- **Sister Company**: Al-Noor Trading Company W.L.L

### Country 2: Saudi Arabia (SAU)
**Status**: Expanded
**Entities**: 2
- **Subsidiary**: Al-Noor Manufacturing Saudi Arabia Ltd.
- **Subsidiary**: Al-Noor Services KSA

### Country 3: United Arab Emirates (ARE)
**Status**: Collapsed
**Entities**: 3
- **Subsidiary**: Al-Noor UAE Free Zone Company
- **Sister Company**: Al-Noor Real Estate Development LLC
- **Sister Company**: Al-Noor Investment Holdings LLC

### Country 4: United States (USA)
**Status**: Collapsed
**Entities**: 1
- **Subsidiary**: Al-Noor Americas Inc.

---

## Visual Hierarchy Benefits

### ✅ Clear Organization
- Countries grouped in accordion (collapsible)
- Entities nested within countries
- Easy to scan and navigate

### ✅ Color Coding
- Instant recognition of relationship types
- Consistent color scheme throughout
- Visual distinction between entity types

### ✅ Information Density
- Compact when collapsed
- Detailed when expanded
- Progressive disclosure

### ✅ User Experience
- Numbered badges for easy reference
- Relationship type badges in accordion header
- Hover effects for interactivity
- Clear visual feedback

---

## Mock Data Preview

```
┌─────────────────────────────────────────────────────────┐
│ ☑ Client has international operations  [Load Sample Data]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [1] Kuwait (KWT)                    ▼ 2 entities • Parent│
│     └─ Parent • Sister                                  │
├─────────────────────────────────────────────────────────┤
│ Country: [Kuwait ▼]                                    │
│                                                          │
│ ℹ️ Corporate Group Relationships                        │
│    This client has a parent company...                  │
│                                                          │
│ Related Entities                          [+ Add Entity]│
│                                                          │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🟣 Parent Company                                  │ │
│ │ Al-Noor Holding Company K.S.C.C                   │ │
│ │ Parent company registered in Kuwait...             │ │
│ └───────────────────────────────────────────────────┘ │
│                                                          │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🟢 Sister Company                                   │ │
│ │ Al-Noor Trading Company W.L.L                      │ │
│ │ Sister company operating in trading...              │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [2] Saudi Arabia (SAU)              ▼ 2 entities • Subs │
│     └─ Subsidiary                                     │
├─────────────────────────────────────────────────────────┤
│ ... (expanded content similar to above)                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [3] United Arab Emirates (ARE)     ▶ 3 entities • Mix │
│     └─ Subsidiary • Sister                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [4] United States (USA)            ▶ 1 entity • Subs   │
│     └─ Subsidiary                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Color Scheme

| Relationship Type | Border Color | Background | Badge Color | Icon |
|-------------------|--------------|------------|-------------|------|
| Parent Company    | Purple (#9333EA) | Purple-50 | Purple-100 | 🏢 |
| Subsidiary        | Blue (#3B82F6)   | Blue-50   | Blue-100   | 📦 |
| Sister Company    | Green (#10B981)   | Green-50  | Green-100  | 🔗 |
| Not Selected      | Gray (#D1D5DB)    | Gray-50   | -          | -   |

---

## Interactive Features

1. **Accordion Expand/Collapse**
   - Click country header to toggle
   - Smooth animation
   - Visual indicator (chevron rotates)

2. **Add Country**
   - Dashed border button
   - Adds new country accordion item
   - Auto-expands on creation

3. **Add Entity**
   - Blue button within country section
   - Adds entity card with smart defaults
   - Color-coded based on relationship type

4. **Remove Actions**
   - Remove country (X button in header)
   - Remove entity (button in card footer)

5. **Load Sample Data**
   - One-click population
   - Demonstrates all relationship types
   - Shows visual hierarchy clearly

---

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ Clear labels and placeholders
- ✅ Color + text indicators (not color alone)
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
