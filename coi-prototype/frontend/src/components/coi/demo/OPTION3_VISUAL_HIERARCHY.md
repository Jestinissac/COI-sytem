# Option 3: Accordion with Nested Cards - Visual Hierarchy

## 🎯 Visual Hierarchy Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: INTERNATIONAL OPERATIONS TOGGLE                                 │
│ ☑ Client has international operations          [Load Sample Data]        │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: COUNTRIES ACCORDION (Collapsible Headers)                      │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ [1] Kuwait (KWT)                    ▼  2 entities • Parent • Sister│  │
│ │     └─ 🟣 Parent  🟢 Sister                                        │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ [2] Saudi Arabia (SAU)              ▼  2 entities • Subsidiary     │  │
│ │     └─ 🔵 Subsidiary                                              │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ [3] United Arab Emirates (ARE)     ▶  3 entities • Mix            │  │
│ │     └─ 🔵 Subsidiary  🟢 Sister                                   │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ [4] United States (USA)            ▶  1 entity • Subsidiary       │  │
│ │     └─ 🔵 Subsidiary                                             │  │
│ └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (When Expanded)
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: COUNTRY DETAILS (Accordion Content)                              │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ Country: [Kuwait ▼]                                              │  │
│ │                                                                   │  │
│ │ ┌───────────────────────────────────────────────────────────┐ │  │
│ │ │ ℹ️ Corporate Group Relationships                            │ │  │
│ │ │ This client has a parent company. You can add the parent    │ │  │
│ │ │ company or sister companies (entities sharing the same       │ │  │
│ │ │ parent).                                                     │ │  │
│ │ └───────────────────────────────────────────────────────────┘ │  │
│ │                                                                   │  │
│ │ Related Entities                          [+ Add Entity]         │  │
│ └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 4: ENTITY CARDS (Nested Cards with Color Coding)                  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ 🟣 PARENT COMPANY (Purple Left Border)                           │  │
│ │ ┌────────────────────────────────────────────────────────────┐ │  │
│ │ │ Relationship Type: [Parent Company ▼]  🏢 Parent           │ │  │
│ │ │ Parent Company: The controlling entity that owns this client│ │  │
│ │ │                                                              │ │  │
│ │ │ Entity Name: Al-Noor Holding Company K.S.C.C               │ │  │
│ │ │                                                              │ │  │
│ │ │ Additional Details:                                         │ │  │
│ │ │ Parent company registered in Kuwait. Main holding entity     │ │  │
│ │ │ controlling multiple subsidiaries across GCC region.         │ │  │
│ │ │                                                              │ │  │
│ │ │                                    [Remove Entity]           │ │  │
│ │ └────────────────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ 🟢 SISTER COMPANY (Green Left Border)                            │  │
│ │ ┌────────────────────────────────────────────────────────────┐ │  │
│ │ │ Relationship Type: [Sister Company ▼]  🔗 Sister           │ │  │
│ │ │ Sister Company: Another entity sharing the same parent...   │ │  │
│ │ │                                                              │ │  │
│ │ │ Entity Name: Al-Noor Trading Company W.L.L                 │ │  │
│ │ │                                                              │ │  │
│ │ │ Additional Details:                                         │ │  │
│ │ │ Sister company operating in trading and distribution...     │ │  │
│ │ │                                                              │ │  │
│ │ │                                    [Remove Entity]           │ │  │
│ │ └────────────────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ 🔵 SUBSIDIARY (Blue Left Border)                                  │  │
│ │ ┌────────────────────────────────────────────────────────────┐ │  │
│ │ │ Relationship Type: [Subsidiary ▼]  📦 Subsidiary          │ │  │
│ │ │ Subsidiary: An entity controlled by this client            │ │  │
│ │ │                                                              │ │  │
│ │ │ Entity Name: Al-Noor Manufacturing Saudi Arabia Ltd.        │ │  │
│ │ │                                                              │ │  │
│ │ │ Additional Details:                                         │ │  │
│ │ │ Subsidiary established in 2020. Manufacturing operations... │ │  │
│ │ │                                                              │ │  │
│ │ │                                    [Remove Entity]           │ │  │
│ │ └────────────────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding System

### Relationship Type Colors

| Type | Border | Background | Badge | Icon | Usage |
|------|--------|------------|-------|------|-------|
| **Parent Company** | 🟣 Purple (#9333EA) | Purple-50 | Purple-100 | 🏢 | Controlling entity |
| **Subsidiary** | 🔵 Blue (#3B82F6) | Blue-50 | Blue-100 | 📦 | Controlled entity |
| **Sister Company** | 🟢 Green (#10B981) | Green-50 | Green-100 | 🔗 | Shared parent |

---

## 📊 Sample Data Structure

### Country 1: Kuwait (KWT) - Expanded
```
Entities: 2
├─ 🟣 Parent Company
│  └─ Al-Noor Holding Company K.S.C.C
│     └─ "Parent company registered in Kuwait. Main holding entity..."
│
└─ 🟢 Sister Company
   └─ Al-Noor Trading Company W.L.L
      └─ "Sister company operating in trading and distribution..."
```

### Country 2: Saudi Arabia (SAU) - Expanded
```
Entities: 2
├─ 🔵 Subsidiary
│  └─ Al-Noor Manufacturing Saudi Arabia Ltd.
│     └─ "Subsidiary established in 2020. Manufacturing operations..."
│
└─ 🔵 Subsidiary
   └─ Al-Noor Services KSA
      └─ "Service subsidiary providing technical support..."
```

### Country 3: United Arab Emirates (ARE) - Collapsed
```
Entities: 3
├─ 🔵 Subsidiary: Al-Noor UAE Free Zone Company
├─ 🟢 Sister Company: Al-Noor Real Estate Development LLC
└─ 🟢 Sister Company: Al-Noor Investment Holdings LLC
```

### Country 4: United States (USA) - Collapsed
```
Entities: 1
└─ 🔵 Subsidiary: Al-Noor Americas Inc.
```

---

## ✨ Visual Hierarchy Benefits

### 1. **Clear Information Architecture**
- **Level 1**: Toggle + Action Button
- **Level 2**: Country Accordion (Collapsible)
- **Level 3**: Country Details (Expanded Content)
- **Level 4**: Entity Cards (Nested, Color-Coded)

### 2. **Progressive Disclosure**
- Countries collapsed by default (except first)
- Expand to see details
- Reduces cognitive load

### 3. **Visual Distinction**
- Color-coded borders for quick scanning
- Relationship badges in accordion header
- Numbered country badges
- Emoji icons for relationship types

### 4. **User Experience**
- Smooth expand/collapse animations
- Hover effects for interactivity
- Clear visual feedback
- Easy navigation

### 5. **Information Density**
- Compact when collapsed
- Detailed when expanded
- Efficient use of space

---

## 🎯 Key Visual Elements

### Accordion Header
- **Number Badge**: Circular, blue background
- **Country Name**: Bold, prominent
- **Country Code**: Gray, smaller text
- **Entity Count**: Shows total entities
- **Relationship Badges**: Color-coded pills
- **Chevron Icon**: Rotates on expand/collapse
- **Remove Button**: Red X icon

### Entity Card
- **Left Border**: 4px, color-coded
- **Background**: Light tint matching border color
- **Relationship Badge**: Colored pill with emoji
- **Entity Name Field**: Bold, prominent
- **Details Textarea**: Multi-line, expandable
- **Remove Button**: Bottom-right, red

---

## 📱 Responsive Behavior

- **Desktop**: Full accordion with all details visible
- **Tablet**: Same structure, optimized spacing
- **Mobile**: Stacked layout, full-width cards

---

## 🚀 Interactive Features

1. **Toggle International Operations**
   - Shows/hides entire section
   - Load Sample Data button appears

2. **Expand/Collapse Countries**
   - Click header to toggle
   - Smooth animation
   - Chevron rotates

3. **Add Country**
   - Creates new accordion item
   - Auto-expands on creation
   - Focuses country dropdown

4. **Add Entity**
   - Adds entity card to selected country
   - Smart defaults based on group structure
   - Color-coded on relationship selection

5. **Remove Actions**
   - Remove country (header X button)
   - Remove entity (card footer button)
   - Confirmation for country removal (optional)

6. **Load Sample Data**
   - One-click population
   - Demonstrates all relationship types
   - Shows visual hierarchy clearly

---

## ✅ Accessibility

- Semantic HTML structure
- ARIA labels for accordion states
- Keyboard navigation support
- Screen reader friendly
- Color + text indicators (not color alone)
- Clear focus states
