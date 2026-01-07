# LC/NC Architecture: Where It Fits

## System Architecture with LC/NC Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         COI SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   HRMS System    │────────▶│  Hierarchy Data  │
│  (Employee Data) │         │  (director_id,   │
│                  │         │   department)    │
└──────────────────┘         └──────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LC/NC CONFIGURATION LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Form Builder │  │  Workflow    │  │  Rule Builder│         │
│  │   (Admin UI) │  │  Designer    │  │   (Admin UI) │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         Configuration Database Tables                │     │
│  │  • form_fields_config                                │     │
│  │  • workflow_config                                   │     │
│  │  • business_rules_config                             │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME EXECUTION LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dynamic     │  │  Workflow    │  │  Rule        │         │
│  │  Form        │  │  Engine      │  │  Engine      │         │
│  │  Renderer    │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                            ▼                                    │
│              ┌─────────────────────────┐                        │
│              │   COI Request Form      │                        │
│              │   (Rendered from       │                        │
│              │    Configuration)      │                        │
│              └─────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────┐         ┌──────────────────┐
│   PRMS System    │◀────────│  Client Data     │
│  (Client Master) │         │  (client_name,  │
│                  │         │   client_code)  │
└──────────────────┘         └──────────────────┘
```

---

## Data Flow: HRMS/PRMS → LC/NC → Form

### Example: "Requestor Name" Field

```
1. Admin Configures Field in Form Builder:
   ┌─────────────────────────────────────┐
   │ Field: "Requestor Name"            │
   │ Type: Text                         │
   │ Source: HRMS                       │
   │ Source Field: user.name            │
   │ Readonly: Yes                      │
   └─────────────────────────────────────┘
              │
              ▼
2. Configuration Stored:
   ┌─────────────────────────────────────┐
   │ form_fields_config table            │
   │ field_id: "requestor_name"          │
   │ source_system: "HRMS"               │
   │ source_field: "user.name"           │
   └─────────────────────────────────────┘
              │
              ▼
3. User Opens Form:
   ┌─────────────────────────────────────┐
   │ DynamicForm Component               │
   │ 1. Loads field config               │
   │ 2. Detects HRMS source              │
   │ 3. Calls /integration/hrms/user-data│
   └─────────────────────────────────────┘
              │
              ▼
4. HRMS Data Retrieved:
   ┌─────────────────────────────────────┐
   │ { user: { name: "John Smith" } }   │
   └─────────────────────────────────────┘
              │
              ▼
5. Field Auto-Populated:
   ┌─────────────────────────────────────┐
   │ [Requestor Name: John Smith] (readonly)│
   └─────────────────────────────────────┘
```

---

## LC/NC Component Placement

### Where to Use LC/NC:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐         ┌────────────────┐           │
│  │  Requester     │         │  Admin         │           │
│  │  Dashboard     │         │  Dashboard     │           │
│  │                │         │                │           │
│  │  [Uses]        │         │  [Uses]        │           │
│  │  Dynamic Form  │         │  Form Builder  │           │
│  │  (Read-only)   │         │  (LC/NC Tool)  │           │
│  └────────────────┘         └────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONFIGURATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Form Builder ──▶ form_fields_config                       │
│  Workflow Designer ──▶ workflow_config                     │
│  Rule Builder ──▶ business_rules_config                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HRMS ──▶ Employee Data, Hierarchy                        │
│  PRMS ──▶ Client Data, Engagement Codes                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Prototype Implementation Priority

### Phase 1: Form Builder (Week 1-2)
```
Admin UI (LC/NC) ──▶ Configuration DB ──▶ Dynamic Form Renderer
     │                      │                      │
     │                      │                      ▼
     │                      │              User sees updated form
     │                      │              (No code deployment)
     └──────────────────────┘
```

### Phase 2: HRMS/PRMS Integration (Week 2-3)
```
Form Field Config ──▶ Source: HRMS ──▶ Auto-populate from HRMS
     │                    │
     │                    ▼
     │              user.name, user.director.name
     │
     └──▶ Source: PRMS ──▶ Auto-populate from PRMS
              │
              ▼
         client.client_name, client.status
```

### Phase 3: Workflow Designer (Week 3-4)
```
Admin UI ──▶ workflow_config ──▶ Workflow Engine
     │              │                    │
     │              │                    ▼
     │              │              Dynamic workflow execution
     └──────────────┘
```

---

## Key Benefits for Prototype

1. **Demonstrates Flexibility**: Shows system can adapt without code changes
2. **HRMS/PRMS Integration**: Shows real data flow from external systems
3. **Business User Empowerment**: Stakeholders can modify forms themselves
4. **Faster Iteration**: Test changes in minutes, not hours/days
5. **Production-Ready Approach**: Same architecture can scale to production

---

## Summary

**LC/NC Components**:
- Form Builder (Admin UI)
- Dynamic Form Renderer (User-facing)
- Workflow Designer (Admin UI)
- Rule Builder (Admin UI)

**Integration Points**:
- HRMS → Hierarchy data → Form fields
- PRMS → Client data → Form fields
- Configuration → Runtime → User experience

**Prototype Value**: Shows flexibility and integration capability even at early stage.


## System Architecture with LC/NC Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         COI SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   HRMS System    │────────▶│  Hierarchy Data  │
│  (Employee Data) │         │  (director_id,   │
│                  │         │   department)    │
└──────────────────┘         └──────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LC/NC CONFIGURATION LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Form Builder │  │  Workflow    │  │  Rule Builder│         │
│  │   (Admin UI) │  │  Designer    │  │   (Admin UI) │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         Configuration Database Tables                │     │
│  │  • form_fields_config                                │     │
│  │  • workflow_config                                   │     │
│  │  • business_rules_config                             │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME EXECUTION LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dynamic     │  │  Workflow    │  │  Rule        │         │
│  │  Form        │  │  Engine      │  │  Engine      │         │
│  │  Renderer    │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                            ▼                                    │
│              ┌─────────────────────────┐                        │
│              │   COI Request Form      │                        │
│              │   (Rendered from       │                        │
│              │    Configuration)      │                        │
│              └─────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────┐         ┌──────────────────┐
│   PRMS System    │◀────────│  Client Data     │
│  (Client Master) │         │  (client_name,  │
│                  │         │   client_code)  │
└──────────────────┘         └──────────────────┘
```

---

## Data Flow: HRMS/PRMS → LC/NC → Form

### Example: "Requestor Name" Field

```
1. Admin Configures Field in Form Builder:
   ┌─────────────────────────────────────┐
   │ Field: "Requestor Name"            │
   │ Type: Text                         │
   │ Source: HRMS                       │
   │ Source Field: user.name            │
   │ Readonly: Yes                      │
   └─────────────────────────────────────┘
              │
              ▼
2. Configuration Stored:
   ┌─────────────────────────────────────┐
   │ form_fields_config table            │
   │ field_id: "requestor_name"          │
   │ source_system: "HRMS"               │
   │ source_field: "user.name"           │
   └─────────────────────────────────────┘
              │
              ▼
3. User Opens Form:
   ┌─────────────────────────────────────┐
   │ DynamicForm Component               │
   │ 1. Loads field config               │
   │ 2. Detects HRMS source              │
   │ 3. Calls /integration/hrms/user-data│
   └─────────────────────────────────────┘
              │
              ▼
4. HRMS Data Retrieved:
   ┌─────────────────────────────────────┐
   │ { user: { name: "John Smith" } }   │
   └─────────────────────────────────────┘
              │
              ▼
5. Field Auto-Populated:
   ┌─────────────────────────────────────┐
   │ [Requestor Name: John Smith] (readonly)│
   └─────────────────────────────────────┘
```

---

## LC/NC Component Placement

### Where to Use LC/NC:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐         ┌────────────────┐           │
│  │  Requester     │         │  Admin         │           │
│  │  Dashboard     │         │  Dashboard     │           │
│  │                │         │                │           │
│  │  [Uses]        │         │  [Uses]        │           │
│  │  Dynamic Form  │         │  Form Builder  │           │
│  │  (Read-only)   │         │  (LC/NC Tool)  │           │
│  └────────────────┘         └────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONFIGURATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Form Builder ──▶ form_fields_config                       │
│  Workflow Designer ──▶ workflow_config                     │
│  Rule Builder ──▶ business_rules_config                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HRMS ──▶ Employee Data, Hierarchy                        │
│  PRMS ──▶ Client Data, Engagement Codes                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Prototype Implementation Priority

### Phase 1: Form Builder (Week 1-2)
```
Admin UI (LC/NC) ──▶ Configuration DB ──▶ Dynamic Form Renderer
     │                      │                      │
     │                      │                      ▼
     │                      │              User sees updated form
     │                      │              (No code deployment)
     └──────────────────────┘
```

### Phase 2: HRMS/PRMS Integration (Week 2-3)
```
Form Field Config ──▶ Source: HRMS ──▶ Auto-populate from HRMS
     │                    │
     │                    ▼
     │              user.name, user.director.name
     │
     └──▶ Source: PRMS ──▶ Auto-populate from PRMS
              │
              ▼
         client.client_name, client.status
```

### Phase 3: Workflow Designer (Week 3-4)
```
Admin UI ──▶ workflow_config ──▶ Workflow Engine
     │              │                    │
     │              │                    ▼
     │              │              Dynamic workflow execution
     └──────────────┘
```

---

## Key Benefits for Prototype

1. **Demonstrates Flexibility**: Shows system can adapt without code changes
2. **HRMS/PRMS Integration**: Shows real data flow from external systems
3. **Business User Empowerment**: Stakeholders can modify forms themselves
4. **Faster Iteration**: Test changes in minutes, not hours/days
5. **Production-Ready Approach**: Same architecture can scale to production

---

## Summary

**LC/NC Components**:
- Form Builder (Admin UI)
- Dynamic Form Renderer (User-facing)
- Workflow Designer (Admin UI)
- Rule Builder (Admin UI)

**Integration Points**:
- HRMS → Hierarchy data → Form fields
- PRMS → Client data → Form fields
- Configuration → Runtime → User experience

**Prototype Value**: Shows flexibility and integration capability even at early stage.

