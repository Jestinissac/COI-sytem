# Prototype vs Production - Technical Handoff Guide

## Purpose
This document serves as the **primary reference** for the technical team building the production COI system. It clearly distinguishes prototype implementation from production requirements, identifies placeholders, and specifies actual integration points.

---

## Executive Summary

### What is the Prototype?
A **working demonstration** that validates the COI workflow, demonstrates core purpose fulfillment, and provides stakeholder feedback before full production build.

### What is the Goal?
**Primary Objective**: Prove that **no proposal or engagement letter can be issued or signed** without a full, documented, and approved COI review.

### Prototype Success Criteria
- ✅ Core workflow validated
- ✅ Stakeholder approval obtained
- ✅ UI/UX patterns established
- ✅ Integration points identified
- ✅ Technical feasibility confirmed

### Production Goal
Build a **production-ready system** that:
- Enforces governance (core purpose)
- Integrates with real PRMS/HRMS systems
- Handles production-scale data
- Meets compliance requirements
- Provides enterprise-grade reliability

---

## Key Differences: Prototype vs Production

### 1. Database

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Database** | SQLite (local file) | SQL Server Enterprise Edition |
| **Schema** | Simplified, basic constraints | Full schema with all constraints, indexes, triggers |
| **Stored Procedures** | None (application logic) | SQL Server stored procedures for: Engagement Code generation, Validation, Audit logging |
| **Data Volume** | 50 employees, 100 clients, 200 projects | 2,000+ clients, 10,000+ active projects |
| **Performance** | Basic (acceptable for demo) | Optimized with indexes, query optimization |

**Production Requirements**:
- SQL Server Enterprise Edition
- Stored procedures for critical business logic
- Comprehensive indexing strategy
- Query optimization
- Backup and disaster recovery

---

### 2. Integration Points

| Integration | Prototype | Production |
|-------------|-----------|------------|
| **PRMS** | Mock API (simulated responses) | Real REST API or direct database access |
| **HRMS** | Mock API (dummy data) | Real SQL Server Employee Master queries |
| **Email** | Console logging / file output | Microsoft O365 (Exchange/Outlook) SMTP |
| **Client Master** | Local database table | Real-time sync from PRMS Client Master |
| **User Authentication** | Simple JWT/session (mock) | Integrated SSO or Active Directory |

**Prototype Placeholders**:
```typescript
// PROTOTYPE: Mock PRMS API
export const prmsMockApi = {
  async getClients() {
    return mockClients; // Hardcoded array
  },
  async validateEngagementCode(code: string) {
    return { valid: true }; // Always returns true
  }
};

// PRODUCTION: Real PRMS Integration
export const prmsApi = {
  async getClients() {
    const response = await fetch('https://prms-api.company.com/api/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },
  async validateEngagementCode(code: string) {
    // Real validation against PRMS database
    return await prmsDatabase.validateEngagementCode(code);
  }
};
```

---

### 3. Dynamic Field Configuration

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Field Management** | Hardcoded fields (based on COI Template) | **Dynamic configuration** (database-driven) |
| **Field Changes** | Requires code changes | Admin interface (no code changes) |
| **Field Types** | Static (text, dropdown, date) | Configurable (add new types via admin) |
| **Conditional Logic** | Hardcoded if/else | Database-driven rules engine |

**Prototype Implementation**:
```typescript
// PROTOTYPE: Hardcoded fields
const coiFormFields = [
  { name: 'client_name', type: 'dropdown', required: true },
  { name: 'service_description', type: 'textarea', required: true },
  // ... hardcoded based on COI Template
];
```

**Production Implementation**:
```typescript
// PRODUCTION: Dynamic fields from database
async function getFormFields() {
  const fields = await db.query(`
    SELECT * FROM coi_field_config 
    WHERE is_active = 1 
    ORDER BY display_order
  `);
  
  // Fields can be added/modified via admin interface
  // No code changes required
  return fields;
}
```

**Production Database Schema for Dynamic Fields**:
```sql
-- Dynamic field configuration
CREATE TABLE coi_field_config (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_name VARCHAR(100) NOT NULL,
    field_label NVARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'dropdown', 'date', 'textarea', 'checkbox'
    is_required BIT DEFAULT 0,
    display_order INT,
    section VARCHAR(50), -- 'Service Info', 'Client Info', 'Ownership', etc.
    conditional_logic JSON, -- Rules for when field is shown/required
    validation_rules JSON, -- Min length, max length, regex patterns
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Dropdown options for fields
CREATE TABLE coi_field_options (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_config_id INT NOT NULL,
    option_value VARCHAR(100) NOT NULL,
    option_label NVARCHAR(255) NOT NULL,
    display_order INT,
    is_active BIT DEFAULT 1,
    FOREIGN KEY (field_config_id) REFERENCES coi_field_config(id)
);

-- Field conditional logic
CREATE TABLE coi_field_conditions (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_config_id INT NOT NULL,
    condition_type VARCHAR(50), -- 'show_if', 'require_if', 'hide_if'
    condition_field VARCHAR(100), -- Field to check
    condition_operator VARCHAR(50), -- 'equals', 'contains', 'not_empty'
    condition_value VARCHAR(255), -- Value to compare
    FOREIGN KEY (field_config_id) REFERENCES coi_field_config(id)
);

-- Field configuration history (audit trail)
CREATE TABLE coi_field_config_history (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_config_id INT NOT NULL,
    changed_by INT NOT NULL,
    change_type VARCHAR(50), -- 'created', 'updated', 'deleted'
    old_value NVARCHAR(MAX), -- JSON of old configuration
    new_value NVARCHAR(MAX), -- JSON of new configuration
    changed_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (field_config_id) REFERENCES coi_field_config(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

**Production Admin Interface**:
- Super Admin can add/modify/delete fields via UI
- No code deployment required
- Changes take effect immediately
- Full audit trail of changes

---

### 4. Data Sources

| Data Source | Prototype | Production |
|-------------|-----------|------------|
| **Employee Data** | Local database (seeded) | **HRMS SQL Server** (Employee Master) |
| **User Groups** | Local database (seeded) | **HRMS SQL Server** (User Groups) |
| **Client Master** | Local database (seeded) | **PRMS SQL Server** (Client Master) |
| **Email Addresses** | Local database (seeded) | **HRMS SQL Server** (Employee Master) with COI override |
| **Roles & Permissions** | Local database (seeded) | **HRMS SQL Server** (User Groups) |

**Prototype Placeholders**:
```typescript
// PROTOTYPE: Mock HRMS
export const hrmsMock = {
  async getEmployees() {
    return [
      { id: 1, name: "John Smith", email: "john@company.com", role: "Director" },
      // ... 49 more hardcoded
    ];
  },
  async getUserGroups(userId: number) {
    return ['COI_Requester', 'COI_Compliance']; // Hardcoded
  }
};
```

**Production Integration**:
```typescript
// PRODUCTION: Real HRMS Integration
export const hrmsService = {
  async getEmployees() {
    // Direct SQL Server query to HRMS Employee Master
    const connection = await getHRMSConnection();
    const result = await connection.query(`
      SELECT 
        EmployeeID,
        FullName,
        Email,
        Department,
        Position
      FROM HRMS.dbo.EmployeeMaster
      WHERE Status = 'Active'
    `);
    return result.recordset;
  },
  
  async getUserGroups(userId: number) {
    // Query HRMS User Groups
    const connection = await getHRMSConnection();
    const result = await connection.query(`
      SELECT ug.GroupName
      FROM HRMS.dbo.UserGroups ug
      INNER JOIN HRMS.dbo.UserGroupMembers ugm ON ug.GroupID = ugm.GroupID
      WHERE ugm.UserID = @userId
    `, { userId });
    return result.recordset.map(r => r.GroupName);
  },
  
  async getEmailAddress(userId: number) {
    // Primary: HRMS Employee Master
    const hrmsEmail = await this.getEmployeeEmail(userId);
    
    // Override: Check COI user profile
    const coiOverride = await db.query(`
      SELECT email_override 
      FROM coi_users 
      WHERE hrms_user_id = @userId
    `, { userId });
    
    return coiOverride?.email_override || hrmsEmail;
  }
};
```

---

### 5. Authentication & Authorization

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Authentication** | Simple JWT/session (mock) | SSO / Active Directory / OAuth |
| **User Management** | Local database | HRMS (source of truth) |
| **Role Assignment** | Local database | HRMS User Groups |
| **Permissions** | Hardcoded role checks | HRMS User Groups + COI role mapping |
| **Multi-System Access** | Mock permission check | Real HRMS permission system |

**Prototype**:
```typescript
// PROTOTYPE: Simple mock authentication
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Mock: Accept any password
  const user = mockUsers.find(u => u.email === email);
  const token = jwt.sign({ userId: user.id, role: user.role }, 'secret');
  res.json({ token });
});
```

**Production**:
```typescript
// PRODUCTION: SSO / Active Directory
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Authenticate with Active Directory / SSO
  const adUser = await activeDirectory.authenticate(email, password);
  if (!adUser) throw new Error('Invalid credentials');
  
  // Fetch user groups from HRMS
  const userGroups = await hrmsService.getUserGroups(adUser.employeeId);
  
  // Map HRMS groups to COI roles
  const coiRole = mapHRMSGroupsToCOIRole(userGroups);
  
  // Determine system access (HRMS, PRMS, COI)
  const systemAccess = determineSystemAccess(userGroups);
  
  const token = jwt.sign({
    userId: adUser.employeeId,
    role: coiRole,
    systemAccess: systemAccess
  }, process.env.JWT_SECRET);
  
  res.json({ token, systemAccess });
});
```

---

### 6. Email/Notification System

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Email Provider** | Console logging / file | **Microsoft O365** (Exchange/Outlook) |
| **SMTP** | Not configured | O365 SMTP with authentication |
| **Email Source** | Local database | **HRMS Employee Master** (primary) + COI override |
| **Recipients** | Hardcoded or role-based (mock) | **Dynamic role-based** (fetch from HRMS) |
| **Templates** | Hardcoded strings | Database-driven templates (admin configurable) |
| **Delivery Tracking** | Not implemented | Delivery confirmation, retry mechanism |

**Prototype**:
```typescript
// PROTOTYPE: Console logging
async function sendNotification(to: string, subject: string, body: string) {
  console.log(`[EMAIL] To: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${body}`);
  // No actual email sent
}
```

**Production**:
```typescript
// PRODUCTION: O365 SMTP
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.office365.com
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // O365 account
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendNotification(to: string, subject: string, body: string) {
  // Get email from HRMS (with COI override)
  const email = await hrmsService.getEmailAddress(to);
  
  // Get email template from database
  const template = await db.getEmailTemplate('status_change');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: template.subject,
    html: template.body.replace('{{content}}', body)
  };
  
  const info = await transporter.sendMail(mailOptions);
  
  // Log delivery
  await db.logNotification({
    user_id: to,
    email: email,
    sent: true,
    message_id: info.messageId,
    sent_at: new Date()
  });
}
```

---

### 7. Fuzzy Matching & Duplication Checks

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Algorithm** | Basic Levenshtein (application level) | Optimized Levenshtein + SQL Server SOUNDEX |
| **Performance** | Acceptable for 200 projects | Optimized for 10,000+ projects |
| **Filtering** | Fetch all, calculate all | Smart database filtering (prefix, date, status) |
| **Caching** | In-memory (simple) | Redis or distributed cache |
| **Parent/Subsidiary** | Basic relationship check | Full relationship mapping from PRMS |

**Prototype**:
```typescript
// PROTOTYPE: Simple, fetch all
async function checkDuplication(clientName: string) {
  const all = await db.query('SELECT * FROM coi_requests WHERE status = "Active"');
  // Calculate on all 200 records
  return calculateMatches(clientName, all);
}
```

**Production**:
```typescript
// PRODUCTION: Optimized with filtering
async function checkDuplication(clientName: string) {
  // Step 1: Check cache
  const cached = await redis.get(`dup:${clientName}`);
  if (cached) return JSON.parse(cached);
  
  // Step 2: Smart database filtering (reduces 10,000 → 200)
  const candidates = await db.query(`
    EXEC sp_GetPotentialDuplicates @clientName = ?
  `, [clientName]);
  
  // Step 3: Calculate on filtered set
  const matches = calculateMatches(clientName, candidates);
  
  // Step 4: Cache results
  await redis.setex(`dup:${clientName}`, 3600, JSON.stringify(matches));
  
  return matches;
}
```

**Production SQL Server Stored Procedure**:
```sql
CREATE PROCEDURE sp_GetPotentialDuplicates
    @clientName NVARCHAR(255)
AS
BEGIN
    DECLARE @prefix NVARCHAR(3) = LEFT(LOWER(LTRIM(RTRIM(@clientName))), 3);
    DECLARE @soundexCode CHAR(4) = SOUNDEX(@clientName);
    
    SELECT 
        r.id,
        r.request_id,
        c.client_name,
        DIFFERENCE(@soundexCode, SOUNDEX(c.client_name)) AS soundex_score
    FROM coi_requests r WITH (NOLOCK)
    INNER JOIN clients c WITH (NOLOCK) ON r.client_id = c.id
    WHERE r.status IN ('Approved', 'Active')
    AND r.created_at >= DATEADD(year, -3, GETDATE())
    AND (
        LEFT(LOWER(LTRIM(RTRIM(c.client_name))), 3) = @prefix
        OR DIFFERENCE(@soundexCode, SOUNDEX(c.client_name)) >= 2
    )
    ORDER BY soundex_score DESC, r.created_at DESC;
END
```

---

### 8. Engagement Code Generation

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Generation Logic** | Application code | **SQL Server stored procedure** |
| **Sequence Management** | Application-level counter | Database-level sequence (thread-safe) |
| **Uniqueness** | Application check | Database constraint + stored procedure |
| **Format** | `ENG-{YEAR}-{SERVICE_TYPE}-{SEQUENTIAL}` | Same format, but generated in DB |

**Prototype**:
```typescript
// PROTOTYPE: Application-level generation
async function generateEngagementCode(serviceType: string, year: number) {
  const lastCode = await db.query(`
    SELECT engagement_code 
    FROM coi_engagement_codes 
    WHERE service_type = ? AND year = ?
    ORDER BY sequential_number DESC LIMIT 1
  `, [serviceType, year]);
  
  const nextSeq = lastCode ? lastCode.sequential_number + 1 : 1;
  return `ENG-${year}-${serviceType}-${String(nextSeq).padStart(5, '0')}`;
}
```

**Production**:
```sql
-- PRODUCTION: SQL Server stored procedure
CREATE PROCEDURE sp_GenerateEngagementCode
    @serviceType VARCHAR(10),
    @year INT,
    @coiRequestId INT,
    @generatedBy INT,
    @engagementCode VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    -- Get next sequence number (thread-safe)
    DECLARE @nextSeq INT;
    SELECT @nextSeq = ISNULL(MAX(sequential_number), 0) + 1
    FROM coi_engagement_codes WITH (UPDLOCK, ROWLOCK)
    WHERE service_type = @serviceType AND year = @year;
    
    -- Generate code
    SET @engagementCode = 'ENG-' + 
        CAST(@year AS VARCHAR(4)) + '-' + 
        @serviceType + '-' + 
        RIGHT('00000' + CAST(@nextSeq AS VARCHAR(5)), 5);
    
    -- Insert with unique constraint
    INSERT INTO coi_engagement_codes (
        engagement_code,
        coi_request_id,
        service_type,
        year,
        sequential_number,
        status,
        generated_date,
        generated_by
    ) VALUES (
        @engagementCode,
        @coiRequestId,
        @serviceType,
        @year,
        @nextSeq,
        'Active',
        GETDATE(),
        @generatedBy
    );
    
    COMMIT TRANSACTION;
END
```

---

### 9. Client Master Synchronization

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Source** | Local database table | **PRMS Client Master** (source of truth) |
| **Sync Method** | On-demand fetch (mock) | Real-time webhook or scheduled sync |
| **Cache** | 5-minute in-memory cache | Redis cache with invalidation |
| **Conflict Resolution** | Not applicable | Handle PRMS updates, deletions, status changes |

**Prototype**:
```typescript
// PROTOTYPE: Mock fetch
async function getClients() {
  return await db.query('SELECT * FROM clients');
  // Local database, no sync needed
}
```

**Production**:
```typescript
// PRODUCTION: Real PRMS sync
async function getClients() {
  // Check cache first
  const cached = await redis.get('clients:all');
  if (cached) return JSON.parse(cached);
  
  // Fetch from PRMS
  const clients = await prmsApi.getClientMaster();
  
  // Sync to COI database (for offline access)
  await syncClientsToCOI(clients);
  
  // Cache for 5 minutes
  await redis.setex('clients:all', 300, JSON.stringify(clients));
  
  return clients;
}

// Real-time sync (if PRMS supports webhooks)
app.post('/webhooks/prms/client-updated', async (req, res) => {
  const { client_code, client_name, status } = req.body;
  
  // Update COI cache immediately
  await updateClientInCache(client_code, { client_name, status });
  
  // Invalidate cache
  await redis.del('clients:all');
  
  res.json({ success: true });
});
```

---

### 10. Document Management

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Storage** | Database BLOB or local files | **Cloud storage** (AWS S3, Azure Blob) or database |
| **Access Control** | Basic role checks | Row-level security, detailed audit logs |
| **ISQM Forms** | PDF upload only | **Both**: Digital forms + PDF upload |
| **Version Control** | Not implemented | Document versioning, change history |

**Prototype**:
```typescript
// PROTOTYPE: Simple file storage
async function uploadDocument(file: File, requestId: number) {
  const filePath = `./uploads/${requestId}/${file.name}`;
  await fs.writeFile(filePath, file.buffer);
  
  await db.insert('coi_attachments', {
    coi_request_id: requestId,
    file_name: file.name,
    file_path: filePath
  });
}
```

**Production**:
```typescript
// PRODUCTION: Cloud storage with access control
import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

async function uploadDocument(file: File, requestId: number, userId: number) {
  // Check access permissions
  await checkDocumentAccess(userId, requestId, 'upload');
  
  // Upload to S3
  const key = `coi/${requestId}/${Date.now()}-${file.name}`;
  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      uploaded_by: userId.toString(),
      request_id: requestId.toString()
    }
  }).promise();
  
  // Store metadata in database
  await db.insert('coi_attachments', {
    coi_request_id: requestId,
    file_name: file.name,
    file_path: key, // S3 key
    file_size: file.size,
    file_type: file.mimetype,
    uploaded_by: userId,
    access_control: generateAccessControl(requestId) // Row-level security
  });
  
  // Audit log
  await db.insert('audit_logs', {
    action: 'document_uploaded',
    user_id: userId,
    request_id: requestId,
    details: { file_name: file.name }
  });
}
```

---

## Complete Data Flow: Prototype vs Production

### Prototype Data Flow

```
┌─────────────┐
│   Frontend  │
│  (Vue.js)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Node.js)  │
└──────┬──────┘
       │
       ├─► Mock HRMS API
       │   └─► Returns hardcoded employees
       │
       ├─► Mock PRMS API
       │   └─► Returns hardcoded clients
       │
       └─► SQLite Database
           └─► Local data storage
```

### Production Data Flow

```
┌─────────────┐
│   Frontend  │
│  (Vue.js)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Backend   │
│  (API)      │
└──────┬──────┘
       │
       ├─► HRMS SQL Server
       │   ├─► Employee Master (read)
       │   ├─► User Groups (read)
       │   └─► Email addresses (read)
       │
       ├─► PRMS SQL Server
       │   ├─► Client Master (read)
       │   ├─► Engagement Code validation (read)
       │   └─► Project creation (write)
       │
       ├─► COI SQL Server
       │   ├─► COI requests (read/write)
       │   ├─► Engagement codes (read/write)
       │   ├─► Dynamic field config (read/write)
       │   └─► Audit logs (write)
       │
       ├─► O365 SMTP
       │   └─► Email notifications (write)
       │
       └─► Cloud Storage (S3/Azure)
           └─► Documents (read/write)
```

---

## Detailed Integration Points

### 1. HRMS Integration (Production)

**Data Sources**:
- **Employee Master**: `HRMS.dbo.EmployeeMaster`
- **User Groups**: `HRMS.dbo.UserGroups`, `HRMS.dbo.UserGroupMembers`
- **Departments**: `HRMS.dbo.Departments`

**Read Operations**:
```sql
-- Get employee data
SELECT 
    EmployeeID,
    FullName,
    Email,
    Department,
    Position,
    ManagerID
FROM HRMS.dbo.EmployeeMaster
WHERE Status = 'Active';

-- Get user groups for permission mapping
SELECT ug.GroupName
FROM HRMS.dbo.UserGroups ug
INNER JOIN HRMS.dbo.UserGroupMembers ugm ON ug.GroupID = ugm.GroupID
WHERE ugm.UserID = @userId;

-- Map HRMS groups to COI roles
-- HRMS Group: 'COI_Directors' → COI Role: 'Director'
-- HRMS Group: 'COI_Compliance' → COI Role: 'Compliance'
-- HRMS Group: 'COI_Partners' → COI Role: 'Partner'
```

**Integration Method**:
- **Option A**: Direct SQL Server connection (same network)
- **Option B**: REST API (if HRMS exposes API)
- **Option C**: Database replication/view (if allowed)

**Caching Strategy**:
- Cache employee data (5-10 minutes)
- Cache user groups (15-30 minutes)
- Invalidate on HRMS updates (if webhook available)

---

### 2. PRMS Integration (Production)

**Data Sources**:
- **Client Master**: `PRMS.dbo.ClientMaster`
- **Projects**: `PRMS.dbo.Projects`
- **Engagement Codes**: Validated against COI system

**Read Operations**:
```sql
-- Get clients from PRMS Client Master
SELECT 
    ClientCode,
    ClientName,
    CommercialRegistration,
    Status,
    Industry,
    ParentCompanyCode
FROM PRMS.dbo.ClientMaster
WHERE Status = 'Active';

-- Validate Engagement Code before project creation
-- (This happens in PRMS, but COI must provide validation endpoint)
```

**Write Operations**:
```sql
-- PRMS creates project (validates Engagement Code)
INSERT INTO PRMS.dbo.Projects (
    ProjectID,
    EngagementCode, -- **MANDATORY** - Must exist and be Active in COI
    ClientCode,
    ServiceType,
    ServiceYear,
    BillingCurrency, -- From COI financial_parameters.currency
    Risks, -- From COI financial_parameters.risk_assessment (converted to text)
    ProjectValue -- Optional: From COI financial_parameters.pending_amount
) VALUES (...);

-- Database constraint prevents invalid codes
-- FOREIGN KEY (EngagementCode) REFERENCES COI.dbo.coi_engagement_codes(engagement_code)
```

**⚠️ CRITICAL PRMS REQUIREMENT: Engagement Code Field**

**Status**: Engagement Code field is **NOT currently present** in PRMS project creation form.

**Production Requirement**: 
- **PRMS MUST add `EngagementCode` as a MANDATORY field** in the Project Creation form
- This field must be:
  - Required (cannot be null)
  - Validated against COI system before project creation
  - Linked via foreign key constraint to `COI.dbo.coi_engagement_codes(engagement_code)`
  - Only accepts codes with status = 'Active'

**PRMS Schema Update Required**:
```sql
-- PRMS.dbo.Projects table MUST include:
ALTER TABLE PRMS.dbo.Projects
ADD COLUMN EngagementCode VARCHAR(50) NOT NULL;

-- Foreign key constraint (enforces validation)
ALTER TABLE PRMS.dbo.Projects
ADD CONSTRAINT FK_Projects_EngagementCode
FOREIGN KEY (EngagementCode)
REFERENCES COI.dbo.coi_engagement_codes(engagement_code);

-- Check constraint (only Active codes)
ALTER TABLE PRMS.dbo.Projects
ADD CONSTRAINT CHK_EngagementCode_Active
CHECK (
    EXISTS (
        SELECT 1 FROM COI.dbo.coi_engagement_codes
        WHERE engagement_code = PRMS.dbo.Projects.EngagementCode
        AND status = 'Active'
    )
);
```

**Financial Parameters Integration**:

Based on PRMS field analysis (`http://prms.envisionsystem.com/project/add`), the following financial parameters should be pushed from COI to PRMS:

1. **Billing Currency** (HIGH Priority)
   - **COI Source**: `financial_parameters.currency`
   - **PRMS Target**: `Billing Currency` dropdown (already exists)
   - **Action**: Push during project creation

2. **Risk Assessment** (MEDIUM Priority)
   - **COI Source**: `financial_parameters.risk_assessment` (Low, Medium, High, Very High)
   - **PRMS Target**: `Risks` textbox (already exists, free text)
   - **Action**: Convert structured value to descriptive text
   - **Mapping**: "Low" → "Risk Assessment: Low", etc.

3. **Project Value** (OPTIONAL, LOW Priority)
   - **COI Source**: `financial_parameters.pending_amount`
   - **PRMS Target**: `Project Value` text input (already exists)
   - **Action**: Push if `pending_amount` is provided

**Fields NOT to Push**:
- **Credit Terms**: PRMS doesn't have this field - keep in COI only
- **Financial Notes**: Optional - can be included in PRMS Description field if needed

**Integration Method**:
- **Option A**: COI provides validation API endpoint + financial data push
- **Option B**: PRMS queries COI database directly (if same network)
- **Option C**: Database view/synonym (if allowed)

**Synchronization**:
- **Client Master**: Real-time webhook or 5-minute polling
- **Engagement Codes**: PRMS validates on project creation (real-time)
- **Financial Parameters**: Pushed during project creation (real-time)

---

### 3. Email Integration (Production)

**Provider**: Microsoft O365 (Exchange/Outlook)

**Configuration**:
```typescript
const emailConfig = {
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.O365_EMAIL,
    pass: process.env.O365_PASSWORD
  },
  from: 'coi-system@company.com',
  replyTo: 'coi-support@company.com'
};
```

**Email Sources**:
1. **Primary**: HRMS Employee Master
2. **Override**: COI user profile (if user updates email)
3. **Fallback**: COI profile if HRMS unavailable

**Recipients**:
- **Role-based**: Fetch all users with role from HRMS
- **Dynamic**: No hardcoded emails
- **Auto-updates**: If Admin team changes, system automatically updates

**Templates** (Database-driven):
```sql
CREATE TABLE email_templates (
    id INT PRIMARY KEY IDENTITY(1,1),
    template_name VARCHAR(100) NOT NULL,
    template_subject NVARCHAR(255) NOT NULL,
    template_body NVARCHAR(MAX) NOT NULL, -- HTML template
    variables JSON, -- {{request_id}}, {{client_name}}, etc.
    is_active BIT DEFAULT 1
);
```

---

## Dynamic Field Configuration (Production)

### Purpose
Allow COI Template fields to be modified without code changes. If template adds 2-3 new fields, admin can add them via UI.

### Database Schema

```sql
-- Field definitions
CREATE TABLE coi_field_config (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_name VARCHAR(100) NOT NULL UNIQUE, -- 'client_name', 'service_description'
    field_label NVARCHAR(255) NOT NULL, -- Display label
    field_type VARCHAR(50) NOT NULL, -- 'text', 'dropdown', 'date', 'textarea', 'checkbox'
    section VARCHAR(50) NOT NULL, -- 'Service Info', 'Client Info', 'Ownership', 'Signatory'
    is_required BIT DEFAULT 0,
    display_order INT,
    placeholder_text NVARCHAR(255),
    help_text NVARCHAR(500),
    validation_rules NVARCHAR(MAX), -- JSON: { minLength: 5, maxLength: 255, pattern: 'regex' }
    default_value NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Dropdown options
CREATE TABLE coi_field_options (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_config_id INT NOT NULL,
    option_value VARCHAR(100) NOT NULL,
    option_label NVARCHAR(255) NOT NULL,
    display_order INT,
    is_active BIT DEFAULT 1,
    FOREIGN KEY (field_config_id) REFERENCES coi_field_config(id)
);

-- Conditional logic (show/hide/require based on other fields)
CREATE TABLE coi_field_conditions (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_config_id INT NOT NULL,
    condition_type VARCHAR(50), -- 'show_if', 'require_if', 'hide_if'
    condition_field VARCHAR(100), -- Field to check
    condition_operator VARCHAR(50), -- 'equals', 'contains', 'not_empty', 'in'
    condition_value NVARCHAR(255), -- Value to compare (JSON array for 'in')
    FOREIGN KEY (field_config_id) REFERENCES coi_field_config(id)
);

-- Field configuration history (audit)
CREATE TABLE coi_field_config_history (
    id INT PRIMARY KEY IDENTITY(1,1),
    field_config_id INT NOT NULL,
    changed_by INT NOT NULL,
    change_type VARCHAR(50), -- 'created', 'updated', 'deleted', 'activated', 'deactivated'
    old_configuration NVARCHAR(MAX), -- JSON snapshot
    new_configuration NVARCHAR(MAX), -- JSON snapshot
    changed_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (field_config_id) REFERENCES coi_field_config(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

### Example: Adding New Field (No Code Changes)

**Scenario**: COI Template adds new field "Valuation Purpose"

**Admin Action** (via UI):
1. Go to "Field Configuration" page
2. Click "Add New Field"
3. Fill form:
   - Field Name: `valuation_purpose`
   - Field Label: "Valuation Purpose"
   - Field Type: `textarea`
   - Section: "Service Info"
   - Required: Yes
   - Display Order: 5
4. Click "Save"

**Result**:
- Field appears in COI request form immediately
- No code deployment needed
- Full audit trail recorded

**Code** (Dynamic):
```typescript
// PRODUCTION: Dynamic form rendering
async function getCOIRequestForm() {
  // Fetch all active fields from database
  const fields = await db.query(`
    SELECT 
      fc.*,
      (SELECT * FROM coi_field_options 
       WHERE field_config_id = fc.id AND is_active = 1 
       ORDER BY display_order FOR JSON PATH) AS options,
      (SELECT * FROM coi_field_conditions 
       WHERE field_config_id = fc.id FOR JSON PATH) AS conditions
    FROM coi_field_config fc
    WHERE fc.is_active = 1
    ORDER BY fc.section, fc.display_order
  `);
  
  // Group by section
  const formSections = groupBySection(fields);
  
  return formSections;
}

// Frontend renders dynamically
<template>
  <div v-for="section in formSections" :key="section.name">
    <h3>{{ section.label }}</h3>
    <component 
      v-for="field in section.fields" 
      :key="field.field_name"
      :is="getFieldComponent(field.field_type)"
      :field="field"
      :value="formData[field.field_name]"
      @input="updateField(field.field_name, $event)"
    />
  </div>
</template>
```

---

## Complete Data Flow Diagrams

### Prototype Data Flow

```
User Login
    ↓
[Frontend] Check mock permissions
    ↓
[Backend] Return mock user data
    ↓
[Frontend] Show system tiles (HRMS, PRMS, COI)
    ↓
User clicks "COI System"
    ↓
[Frontend] COI Dashboard
    ↓
User creates COI request
    ↓
[Frontend] Form with hardcoded fields
    ↓
[Backend] Validate (basic)
    ↓
[Backend] Check duplication (mock - all 200 projects)
    ↓
[Backend] Save to SQLite
    ↓
[Backend] Mock notification (console log)
    ↓
[Backend] Approval workflow (all in SQLite)
    ↓
[Backend] Generate Engagement Code (application logic)
    ↓
[Backend] Save to SQLite
    ↓
[Frontend] Show Engagement Code
    ↓
User tests PRMS validation (mock)
    ↓
[Backend] Mock PRMS API validates code
    ↓
[Backend] Create mock project (SQLite)
```

### Production Data Flow

```
User Login
    ↓
[Frontend] SSO / Active Directory authentication
    ↓
[Backend] Authenticate with AD
    ↓
[Backend] Query HRMS for user groups
    ↓
[Backend] Map HRMS groups to COI roles
    ↓
[Backend] Determine system access (HRMS, PRMS, COI)
    ↓
[Frontend] Show system tiles based on permissions
    ↓
User clicks "COI System"
    ↓
[Frontend] COI Dashboard
    ↓
User creates COI request
    ↓
[Frontend] Fetch dynamic fields from database
    ↓
[Frontend] Render form dynamically
    ↓
User selects client
    ↓
[Backend] Fetch clients from PRMS Client Master (with cache)
    ↓
[Backend] Return clients to frontend
    ↓
User submits request
    ↓
[Backend] Validate (server-side)
    ↓
[Backend] Check duplication:
    │   ├─► Query PRMS for active engagements (filtered)
    │   ├─► Calculate fuzzy matching (application)
    │   └─► Return matches
    ↓
[Backend] Save to COI SQL Server
    ↓
[Backend] Send notification:
    │   ├─► Get email from HRMS (with COI override)
    │   ├─► Get template from database
    │   ├─► Send via O365 SMTP
    │   └─► Log delivery status
    ↓
[Backend] Approval workflow:
    │   ├─► Director approval (if needed)
    │   ├─► Compliance review (with duplication alerts)
    │   ├─► Partner approval
    │   ├─► Finance coding (stored procedure generates code)
    │   └─► Admin execution
    ↓
[Backend] Generate Engagement Code:
    │   ├─► Call SQL Server stored procedure
    │   ├─► Thread-safe sequence generation
    │   └─► Save to database
    ↓
[Frontend] Show Engagement Code
    ↓
User creates project in PRMS
    ↓
[PRMS] Validates Engagement Code:
    │   ├─► Query COI database (or API)
    │   ├─► Check code exists and is Active
    │   └─► Database constraint prevents invalid codes
    ↓
[PRMS] Creates project (if valid)
    ↓
[COI] Updates request status to "Active"
```

---

## Placeholder Identification

### Prototype Placeholders (To Replace in Production)

#### 1. Authentication
```typescript
// PROTOTYPE PLACEHOLDER
app.post('/api/login', (req, res) => {
  // Mock: Accept any password
  const user = mockUsers.find(u => u.email === req.body.email);
  const token = jwt.sign({ userId: user.id }, 'secret');
  res.json({ token });
});

// PRODUCTION: Replace with SSO/AD
```

#### 2. Employee Data
```typescript
// PROTOTYPE PLACEHOLDER
const mockEmployees = [
  { id: 1, name: "John Smith", role: "Director" },
  // ... hardcoded
];

// PRODUCTION: Replace with HRMS query
const employees = await hrmsService.getEmployees();
```

#### 3. Client Data
```typescript
// PROTOTYPE PLACEHOLDER
const mockClients = [
  { client_code: "CLI-001", client_name: "ABC Corp" },
  // ... hardcoded
];

// PRODUCTION: Replace with PRMS Client Master
const clients = await prmsService.getClients();
```

#### 4. Email Notifications
```typescript
// PROTOTYPE PLACEHOLDER
console.log(`[EMAIL] To: ${email}, Subject: ${subject}`);

// PRODUCTION: Replace with O365 SMTP
await transporter.sendMail({ to: email, subject, html: body });
```

#### 5. User Groups/Permissions
```typescript
// PROTOTYPE PLACEHOLDER
const userGroups = ['COI_Requester']; // Hardcoded

// PRODUCTION: Replace with HRMS query
const userGroups = await hrmsService.getUserGroups(userId);
```

#### 6. Field Configuration
```typescript
// PROTOTYPE PLACEHOLDER
const fields = [
  { name: 'client_name', type: 'dropdown', required: true },
  // ... hardcoded based on COI Template
];

// PRODUCTION: Replace with database query
const fields = await db.query('SELECT * FROM coi_field_config WHERE is_active = 1');
```

---

## Production Build Checklist

### Database (SQL Server Enterprise Edition)

- [ ] Create full database schema
- [ ] Create stored procedures:
  - [ ] `sp_GenerateEngagementCode`
  - [ ] `sp_GetPotentialDuplicates`
  - [ ] `sp_ValidateEngagementCode`
  - [ ] `sp_GetDynamicFields`
- [ ] Create indexes for performance
- [ ] Create foreign key constraints (critical)
- [ ] Create check constraints (Active status)
- [ ] Setup backup and recovery

### Integration Points

- [ ] **HRMS Integration**:
  - [ ] Establish SQL Server connection
  - [ ] Query Employee Master
  - [ ] Query User Groups
  - [ ] Map groups to COI roles
  - [ ] Handle email override logic

- [ ] **PRMS Integration**:
  - [ ] Establish connection/API access
  - [ ] Fetch Client Master (sync strategy)
  - [ ] Provide Engagement Code validation endpoint
  - [ ] Handle project creation triggers
  - [ ] **⚠️ CRITICAL: Add Engagement Code field to PRMS project form (MANDATORY)**
  - [ ] Push financial parameters (currency, risk assessment) to PRMS
  - [ ] Map COI risk assessment to PRMS Risks field (structured → text conversion)
  - [ ] Update PRMS Projects table schema with Engagement Code foreign key constraint

- [ ] **Email Integration**:
  - [ ] Configure O365 SMTP
  - [ ] Implement email templates (database)
  - [ ] Role-based recipient logic
  - [ ] Delivery tracking

### Dynamic Configuration

- [ ] **Field Management**:
  - [ ] Create `coi_field_config` table
  - [ ] Create `coi_field_options` table
  - [ ] Create `coi_field_conditions` table
  - [ ] Create admin UI for field management
  - [ ] Dynamic form rendering (frontend)

- [ ] **Admin Interface**:
  - [ ] Field configuration page
  - [ ] Add/edit/delete fields
  - [ ] Configure dropdown options
  - [ ] Set conditional logic
  - [ ] Audit trail

### Performance Optimization

- [ ] **Database**:
  - [ ] Create indexes for fuzzy matching
  - [ ] Optimize queries
  - [ ] Implement caching strategy

- [ ] **Application**:
  - [ ] Redis cache for duplication checks
  - [ ] Client data caching
  - [ ] Query optimization

### Latest Features (Production Requirements)

- [ ] **Finance Module**:
  - [ ] Financial parameters modal/form
  - [ ] Code preview functionality
  - [ ] Backend validation (Partner approval, status checks)
  - [ ] Financial parameters display in UI
  - [ ] Integration with PRMS (currency, risk assessment push)

- [ ] **Resubmission Workflow**:
  - [ ] Rejection type distinction (fixable/permanent)
  - [ ] Resubmission logic and UI
  - [ ] Email notification differentiation
  - [ ] Database columns: `rejection_reason`, `rejection_type`

- [ ] **Feedback Loops**:
  - [ ] All notification types implemented
  - [ ] Role-based recipient logic
  - [ ] Template-based emails
  - [ ] Client response notifications
  - [ ] Monitoring alerts (30-day, renewal, expiry)

- [ ] **Foreign Key Handling**:
  - [ ] Cascade deletion logic
  - [ ] Soft delete option (consider)
  - [ ] Audit trail for deletions

- [ ] **Rule Management**:
  - [ ] Deduplication logic
  - [ ] Unique constraints
  - [ ] Cleanup endpoints

- [ ] **Conflict Detection**:
  - [ ] Expandable conflict sections
  - [ ] Clickable conflict items (new tab)
  - [ ] Visual feedback improvements

### Security & Compliance

- [ ] **Authentication**:
  - [ ] SSO/Active Directory integration
  - [ ] Role-based access control
  - [ ] Multi-system permission mapping

- [ ] **Audit Logging**:
  - [ ] Enhanced audit logs
  - [ ] Immutable audit trail
  - [ ] Compliance reporting

---

## Migration Path: Prototype → Production

### Step 1: Database Migration
1. Convert SQLite schema to SQL Server
2. Add production-specific tables (dynamic fields, audit logs)
3. Create stored procedures
4. Add indexes and constraints

### Step 2: Replace Placeholders
1. Replace mock HRMS with real integration
2. Replace mock PRMS with real integration
3. Replace mock email with O365
4. Replace hardcoded fields with dynamic configuration

### Step 3: Add Production Features
1. Dynamic field configuration
2. Enhanced audit logging
3. Performance optimizations
4. Security hardening

### Step 4: Testing
1. Integration testing with real systems
2. Performance testing (10,000+ projects)
3. Security testing
4. User acceptance testing

---

## Technical Specifications for Production

### API Endpoints (Production)

```typescript
// Authentication
POST /api/auth/login          // SSO/AD authentication
GET  /api/auth/user           // Get current user with permissions

// COI Requests
GET  /api/coi/requests        // List requests (role-filtered)
POST /api/coi/requests        // Create request
GET  /api/coi/requests/:id    // Get request details
PUT  /api/coi/requests/:id   // Update request
POST /api/coi/requests/:id/approve  // Approve (role-based)

// Dynamic Fields
GET  /api/coi/fields          // Get dynamic field configuration
POST /api/coi/fields          // Add field (Super Admin only)
PUT  /api/coi/fields/:id     // Update field (Super Admin only)

// Duplication Check
POST /api/coi/check-duplication  // Check for duplicates

// Engagement Codes
POST /api/coi/generate-code      // Generate Engagement Code (Finance only)
GET  /api/coi/validate-code/:code // Validate code (PRMS calls this)

// Integration
GET  /api/integration/clients     // Get clients from PRMS
GET  /api/integration/employees  // Get employees from HRMS
```

### Database Stored Procedures (Production)

```sql
-- Engagement Code Generation
CREATE PROCEDURE sp_GenerateEngagementCode
    @serviceType VARCHAR(10),
    @year INT,
    @coiRequestId INT,
    @generatedBy INT,
    @engagementCode VARCHAR(50) OUTPUT

-- Duplication Check (Pre-filtering)
CREATE PROCEDURE sp_GetPotentialDuplicates
    @clientName NVARCHAR(255)

-- Validation
CREATE PROCEDURE sp_ValidateEngagementCode
    @engagementCode VARCHAR(50),
    @isValid BIT OUTPUT

-- Dynamic Fields
CREATE PROCEDURE sp_GetDynamicFields
    @section VARCHAR(50) = NULL
```

---

## Summary: Key Differences

| Component | Prototype | Production |
|-----------|-----------|------------|
| **Database** | SQLite | SQL Server Enterprise |
| **HRMS** | Mock API | Real SQL Server queries |
| **PRMS** | Mock API | Real API/database access |
| **Email** | Console log | O365 SMTP |
| **Fields** | Hardcoded | Dynamic (database-driven) |
| **Auth** | Mock JWT | SSO/Active Directory |
| **Stored Procedures** | None | SQL Server procedures |
| **Caching** | In-memory | Redis/distributed |
| **Performance** | Basic | Optimized (indexes, filtering) |
| **Scale** | 200 projects | 10,000+ projects |

---

## Handoff Deliverables

### For Technical Team

1. **This Document**: Primary reference
2. **Prototype Code**: Working reference implementation
3. **Database Schema**: SQL Server conversion guide
4. **API Documentation**: Endpoint specifications
5. **Integration Specifications**: HRMS/PRMS connection details
6. **Dynamic Field Guide**: How to implement dynamic configuration

### For Frontend Team

1. **UI/UX Patterns**: Component structure and design
2. **User Journeys**: Complete workflow documentation
3. **Dynamic Form Rendering**: How to render fields from database
4. **Integration Points**: API endpoints and data structures

---

## Related Documents

- Prototype Plan: `COI System /Prototype_Plan.md`
- Risk Analysis: `COI System /Risk_Analysis_and_Failure_Points.md`
- User Journeys: `COI System /User_Journeys_End_to_End.md`
- Dynamic Fields: `COI System /COI_Template_Fields_Extraction.md`
- Fuzzy Matching: `COI System /Fuzzy_Matching_Implementation_Location.md`
- PRMS Integration Analysis: `PRMS_INTEGRATION_ANALYSIS.md` (Financial parameters mapping)
- Finance Module Gap Analysis: `FINANCE_MODULE_GAP_ANALYSIS.md`

---

## Latest Prototype Updates (January 2026)

### Finance Module Enhancements ✅

**Status**: Fully implemented in prototype

**Features Added**:
1. **Financial Parameters Modal** (`CodeGenerationModal.vue`)
   - Credit Terms dropdown (Net 15, 30, 60, 90, Due on Receipt, Custom)
   - Currency dropdown (KWD, USD, EUR, GBP, SAR, AED)
   - Risk Assessment dropdown (Low, Medium, High, Very High)
   - Pending Amount (optional number field)
   - Notes (optional textarea)
   - Code preview before generation (`ENG-{YEAR}-{SERVICE_TYPE}-#####`)

2. **Backend Validation** (`coiController.js` - `generateEngagementCode`)
   - Partner approval required before code generation
   - Request status validation (Pending Finance, Approved, Pending Partner)
   - Duplicate code prevention
   - Service type validation
   - Financial parameters validation (credit_terms, currency, risk_assessment required)

3. **Financial Parameters Display**
   - Request detail page shows financial parameters section
   - Engagement Codes tab shows currency and risk assessment
   - Color-coded risk assessment display

**Production Notes**:
- Financial parameters stored in `coi_requests.financial_parameters` (JSON TEXT)
- These parameters should be pushed to PRMS during project creation (see PRMS Integration section)
- Currency and Risk Assessment are HIGH/MEDIUM priority for PRMS integration

---

### Resubmission Workflow ✅

**Status**: Fully implemented in prototype

**Features Added**:
1. **Rejection Type Distinction**
   - `rejection_type` field: 'fixable' or 'permanent'
   - Fixable rejections: Requester can modify and resubmit
   - Permanent rejections: Cannot be resubmitted (e.g., client rejections, hard prohibitions)

2. **Database Schema**:
   ```sql
   ALTER TABLE coi_requests ADD COLUMN rejection_reason TEXT;
   ALTER TABLE coi_requests ADD COLUMN rejection_type VARCHAR(20) DEFAULT 'fixable';
   ```

3. **Resubmission Logic** (`coiController.js` - `resubmitRejectedRequest`):
   - Only fixable rejections can be resubmitted
   - Resubmission converts request back to 'Draft' status
   - Resets approval fields (director, compliance, partner statuses, dates, notes)
   - Preserves rejection reason for reference

4. **UI Features**:
   - Rejection type selector in reject modal (radio buttons)
   - Conditional "Modify and Resubmit" button (fixable only)
   - "Create New Request" link for permanent rejections
   - Rejected requests tab in Requester Dashboard

**Production Notes**:
- Client rejections are automatically marked as 'permanent'
- Approver rejections default to 'fixable' but can be set to 'permanent'
- Email notifications differentiate between fixable and permanent rejections
- Resubmission is a **common feature** (Standard + Pro editions)

---

### Feedback Loops & Notifications ✅

**Status**: Fully implemented in prototype

**Features Added**:
1. **Comprehensive Notification Coverage**:
   - Director approval/rejection notifications
   - Compliance review notifications (stale requests, duplication alerts)
   - Partner approval/rejection notifications
   - Finance engagement code generation notifications (requester, admin, partner)
   - Client response notifications (acceptance/rejection)
   - Resubmission notifications
   - "Need More Info" notifications

2. **Email Service** (`emailService.js`):
   - Role-based recipient logic
   - Template-based emails
   - Notification differentiation by type
   - Client acceptance/rejection notifications

3. **Monitoring Alerts**:
   - 30-day proposal monitoring (every 10 days)
   - Renewal alerts
   - Expiry tracking
   - Interval alerts

**Production Notes**:
- All notifications currently use console logging (prototype)
- Production must use O365 SMTP (see Email Integration section)
- Email addresses should be fetched from HRMS Employee Master
- Templates should be database-driven (see Email Templates section)

---

### Foreign Key Constraint Handling ✅

**Status**: Implemented with balanced approach

**Issue**: Foreign key constraints prevent deletion of draft requests with related records.

**Solution**: Cascade deletion implemented in `deleteRequest` function:
- Deletes related records from: `coi_attachments`, `uploaded_files`, `coi_signatories`, `isqm_forms`, `global_coi_submissions`, `engagement_renewals`, `monitoring_alerts`, `execution_tracking`
- Deletes associated files from filesystem
- Finally deletes `coi_requests` record

**Production Notes**:
- SQL Server foreign key constraints should use `ON DELETE CASCADE` where appropriate
- Audit trail should log all deletions
- Soft delete option should be considered for production
- Consider retention policies for deleted drafts

---

### Rule Deduplication ✅

**Status**: Implemented in prototype

**Issue**: Duplicate rules appearing in Rule Builder (240+ rules with many duplicates).

**Solution**:
1. **Backend Deduplication** (`configController.js` - `identifyDuplicates` function):
   - Groups rules by signature (name, condition, action)
   - Keeps "best" version (Approved > Pending > Rejected, then Active > Inactive, then most recent)
   - Applied in `getBusinessRules()` before returning to frontend
   - Normalization handles null/undefined/empty string values correctly

2. **Cleanup Endpoint**:
   - Super Admin endpoint: `POST /api/config/business-rules/cleanup-duplicates`
   - Permanently deletes duplicate rules from database
   - Keeps only the "best" version

**Production Notes**:
- Consider adding unique constraint to `business_rules_config` table
- Normalization logic handles null/undefined/empty string values correctly
- Deduplication runs on every `getBusinessRules()` call (performance consideration)

---

### Request Deletion (Draft Only) ✅

**Status**: Implemented in prototype

**Features Added**:
1. **Delete Draft Functionality** (`coiController.js` - `deleteRequest`):
   - Only draft requests can be deleted
   - Requires requester ownership or admin role
   - Cascade deletion of all related records
   - File system cleanup

2. **UI Features**:
   - "Delete Draft" button in request detail page
   - "Delete" button in Requester Dashboard drafts tab
   - Confirmation dialog before deletion

**Production Notes**:
- Soft delete option should be considered
- Audit trail must log all deletions
- Consider retention policies for deleted drafts

---

### Conflict Detection Enhancements ✅

**Status**: Implemented in prototype

**Features Added**:
1. **Expandable Conflict Sections** (`COIRequestDetail.vue`):
   - "Previous COI" section (expandable)
   - "Service Conflict" section (expandable)
   - Clickable items open in new tab for comparison

2. **Visual Feedback**:
   - Hover effects on clickable items
   - Focus rings for accessibility
   - Clear indication of clickable elements

**Production Notes**:
- Conflict detection uses fuzzy matching algorithm
- Service conflict detection based on service type rules
- Parent/subsidiary relationships considered

---

### Print Functionality ✅

**Status**: Implemented in prototype

**Features Added**:
1. **COI Tracking Report Print**:
   - Print-friendly HTML generation
   - Includes all request details
   - Formatted for standard paper sizes

**Production Notes**:
- Consider PDF generation for production
- Include company letterhead/branding
- Support multiple report formats

---

## CRM Features (January 2026)

### Prospect Management System

**Status**: Fully implemented in prototype

The prototype now includes a complete prospect management system that operates separately from the client master, enabling COI requests for prospects before they become full PRMS clients.

**New Database Tables**:

| Table | Purpose | Production SQL Server |
|-------|---------|----------------------|
| `prospects` | Prospect records separate from clients | See schema below |
| `lead_sources` | Lead attribution reference data | See schema below |
| `prospect_funnel_events` | Conversion funnel tracking | See schema below |
| `prospect_client_creation_requests` | PRMS client creation workflow | See schema below |
| `proposal_engagement_conversions` | Proposal to engagement tracking | See schema below |

**Prospect Table Schema (Production SQL Server)**:
```sql
CREATE TABLE prospects (
    id INT PRIMARY KEY IDENTITY(1,1),
    prospect_code VARCHAR(50) UNIQUE,
    prospect_name NVARCHAR(255) NOT NULL,
    commercial_registration VARCHAR(100),
    industry VARCHAR(100),
    nature_of_business NVARCHAR(MAX),
    client_id INT REFERENCES clients(id),
    group_level_services NVARCHAR(MAX), -- JSON array
    prms_client_code VARCHAR(50),
    prms_synced BIT DEFAULT 0,
    prms_sync_date DATETIME,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Converted', 'Inactive')),
    converted_to_client_id INT REFERENCES clients(id),
    converted_date DATETIME,
    -- Lead Attribution
    lead_source_id INT REFERENCES lead_sources(id),
    referred_by_user_id INT REFERENCES users(id),
    referred_by_client_id INT REFERENCES clients(id),
    source_opportunity_id INT,
    source_notes NVARCHAR(MAX),
    -- Lost Tracking
    lost_reason NVARCHAR(MAX),
    lost_at_stage VARCHAR(50),
    lost_date DATETIME,
    stale_detected_at DATETIME,
    stale_notification_sent_at DATETIME,
    last_activity_at DATETIME DEFAULT GETDATE(),
    -- Timestamps
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_lead_source ON prospects(lead_source_id);
CREATE INDEX idx_prospects_last_activity ON prospects(last_activity_at);
CREATE INDEX idx_prospects_code ON prospects(prospect_code);
```

**Lead Sources Reference Table**:
```sql
CREATE TABLE lead_sources (
    id INT PRIMARY KEY IDENTITY(1,1),
    source_code VARCHAR(50) UNIQUE NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_category VARCHAR(50), -- 'referral', 'system', 'outbound', 'other'
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);

-- Seed data
INSERT INTO lead_sources (source_code, source_name, source_category) VALUES
    ('unknown', 'Unknown / Legacy', 'other'),
    ('internal_referral', 'Internal Referral (Partner/Director)', 'referral'),
    ('client_referral', 'Client Referral', 'referral'),
    ('insights_module', 'Client Intelligence Module', 'system'),
    ('cold_outreach', 'Cold Outreach', 'outbound'),
    ('direct_creation', 'Direct Client Creation', 'other'),
    ('marketing', 'Marketing Campaign', 'outbound'),
    ('event', 'Event / Conference', 'outbound');
```

**COI Requests Extended Columns (CRM)**:
```sql
-- Add to coi_requests table
ALTER TABLE coi_requests ADD is_prospect BIT DEFAULT 0;
ALTER TABLE coi_requests ADD prospect_id INT REFERENCES prospects(id);
ALTER TABLE coi_requests ADD prms_client_id VARCHAR(50);
ALTER TABLE coi_requests ADD prospect_converted_at DATETIME;
ALTER TABLE coi_requests ADD lead_source_id INT REFERENCES lead_sources(id);
ALTER TABLE coi_requests ADD lost_reason NVARCHAR(MAX);
ALTER TABLE coi_requests ADD lost_at_stage VARCHAR(50);
ALTER TABLE coi_requests ADD lost_date DATETIME;
ALTER TABLE coi_requests ADD stale_detected_at DATETIME;
ALTER TABLE coi_requests ADD last_activity_at DATETIME DEFAULT GETDATE();
```

**Production Notes**:
- Prospect code format: `PROS-{YEAR}-{SEQUENTIAL}` (e.g., PROS-2026-0001)
- Prospects can be linked to existing clients (`client_id`) or standalone
- `prms_client_code` populated when prospect is converted to PRMS client
- Lead source tracking enables ROI analysis by acquisition channel

---

### Funnel Tracking & Analytics

**Status**: Fully implemented in prototype

The system tracks prospect journey through the conversion funnel, logging events at each stage transition for attribution analytics.

**Funnel Stages**:
```
lead_created        → Prospect record created
proposal_submitted  → COI request submitted with is_prospect=1
pending_director    → Awaiting director approval
pending_compliance  → Awaiting compliance review
pending_partner     → Awaiting partner approval
pending_finance     → Awaiting finance coding
approved            → Proposal approved
engagement_started  → Converted to engagement
client_created      → PRMS client created
lost / rejected     → Rejected or abandoned
```

**Funnel Events Table (Production SQL Server)**:
```sql
CREATE TABLE prospect_funnel_events (
    id INT PRIMARY KEY IDENTITY(1,1),
    prospect_id INT REFERENCES prospects(id),
    coi_request_id INT REFERENCES coi_requests(id),
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    performed_by_user_id INT REFERENCES users(id),
    performed_by_role VARCHAR(50),
    event_timestamp DATETIME DEFAULT GETDATE(),
    days_in_previous_stage INT,
    notes NVARCHAR(MAX),
    metadata NVARCHAR(MAX), -- JSON
    created_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_funnel_prospect ON prospect_funnel_events(prospect_id);
CREATE INDEX idx_funnel_coi_request ON prospect_funnel_events(coi_request_id);
CREATE INDEX idx_funnel_stage ON prospect_funnel_events(to_stage);
CREATE INDEX idx_funnel_timestamp ON prospect_funnel_events(event_timestamp);
```

**Service Layer** (`funnelTrackingService.js`):
```javascript
// Log funnel event on status change
logStatusChange({
  coiRequestId,
  oldStatus: 'Pending Director',
  newStatus: 'Pending Compliance',
  userId,
  userRole: 'Director'
});

// Get conversion metrics
const metrics = getConversionFunnelMetrics(dateFrom, dateTo);
// Returns: { stage, count, conversionRate, dropOff } for each stage
```

**Production Notes**:
- Funnel events are logged automatically on COI request status changes
- Only prospect requests (`is_prospect = 1`) generate funnel events
- `days_in_previous_stage` calculated automatically
- Metadata stores JSON context (old/new status, etc.)

---

### Stale Prospect Detection

**Status**: Fully implemented in prototype

Automated detection of stale prospects and proposals for follow-up.

**Thresholds** (Configurable):
- **14 days**: Flag as "needs follow-up"
- **30 days**: Mark as "stale"
- **30 days**: Stale proposal (no status change)

**Lost Reasons**:
```javascript
const LOST_REASONS = {
  STALE: 'stale_no_activity',
  REJECTED: 'rejected_by_compliance',
  REJECTED_DIRECTOR: 'rejected_by_director',
  REJECTED_PARTNER: 'rejected_by_partner',
  CLIENT_DECLINED: 'client_declined',
  COMPETITOR_WON: 'competitor_won',
  BUDGET_CONSTRAINTS: 'budget_constraints',
  TIMING_NOT_RIGHT: 'timing_not_right',
  NO_RESPONSE: 'no_response',
  OTHER: 'other'
};
```

**Service Layer** (`staleProspectService.js`):
```javascript
// Run detection job (call via scheduler)
const results = runStaleDetectionJob();
// Returns: { staleProspects, needsFollowup, staleProposals }

// Mark prospect as lost
markProspectAsLost(prospectId, 'client_declined', 'pending_partner', userId);

// Update activity timestamp (resets stale timer)
updateProspectActivity(prospectId);
```

**Production Notes**:
- Requires scheduled job (cron) to run `runStaleDetectionJob()` daily
- Stale detection logs funnel events automatically
- Lost analysis available: by reason, by stage, by lead source

---

### My Day/Week/Month Views

**Status**: Fully implemented in prototype

Personalized task management views showing actionable items based on user role.

**New Frontend Components**:
- `MyDay.vue` - Today's actionable items
- `MyWeek.vue` - This week's upcoming items
- `MyMonth.vue` - This month's calendar view

**Service Layer** (`myDayWeekService.js`):
```javascript
// Get My Day view
const myDay = getMyDay(user);
// Returns: {
//   today: { actionRequired, expiring, overdue },
//   summary: { totalActions, urgentCount, expiringCount }
// }

// Get My Week view
const myWeek = getMyWeek(user);
// Returns: {
//   thisWeek: { dueThisWeek, expiringThisWeek, groupedByDay },
//   summary: { weekTotal }
// }
```

**Role-Based Action Types**:
| Role | Action Required When |
|------|---------------------|
| Requester | Draft, Rejected, More Info Requested (own requests) |
| Director | Pending Director Approval + own requests |
| Compliance | Pending Compliance |
| Partner | Pending Partner |
| Finance | Pending Finance |
| Admin/Super Admin | Requires re-evaluation (escalated) |

**Production Notes**:
- Uses existing data segregation middleware
- Overdue threshold: 14 days
- Expiry tracking for proposals (30 days from execution) and engagements
- Works with real data, no changes needed for production

---

## Notification Batching System

**Status**: Fully implemented in prototype

The notification system includes intelligent batching to reduce email noise.

**New Database Tables**:
```sql
CREATE TABLE notification_queue (
    id INT PRIMARY KEY IDENTITY(1,1),
    recipient_id INT NOT NULL REFERENCES users(id),
    notification_type VARCHAR(100) NOT NULL,
    is_urgent BIT DEFAULT 0,
    payload NVARCHAR(MAX) NOT NULL, -- JSON
    batch_id VARCHAR(50),
    sent BIT DEFAULT 0,
    sent_at DATETIME,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE notification_stats (
    id INT PRIMARY KEY IDENTITY(1,1),
    stat_date DATE NOT NULL,
    total_generated INT DEFAULT 0,
    total_sent INT DEFAULT 0,
    urgent_sent INT DEFAULT 0,
    batched_count INT DEFAULT 0,
    digest_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    UNIQUE(stat_date)
);
```

**Batching Configuration**:
```javascript
const BATCH_CONFIG = {
  windowMinutes: 5,           // Batch window
  urgentTypes: [              // Bypass batching
    'REJECTION',
    'EXPIRING_TODAY',
    'MORE_INFO_REQUESTED'
  ]
};
```

**Service Layer** (`notificationService.js`):
```javascript
// Queue notification (batched or urgent)
queueNotification(recipientId, 'STATUS_CHANGE', payload, isUrgent);

// Flush batch (call via scheduler every 5 minutes)
const result = flushNotificationBatch();
// Returns: { digestsSent, notificationsSent, noiseReduction }

// Get noise reduction stats
const stats = getNoiseReductionStats(days);
// Returns: { totalGenerated, totalSent, noiseReduction: '85%' }
```

**Production Notes**:
- Urgent notifications sent immediately (rejection, expiring today, more info)
- Non-urgent notifications batched into digests
- Requires scheduled job to call `flushNotificationBatch()` every 5 minutes
- Noise reduction can reach 70-90% in active systems

---

## Environment Configuration

**Status**: Fully implemented in prototype

Multi-environment support with separate databases.

**Environment Configuration** (`config/environment.js`):
```javascript
// Environment detection
getEnvironment()       // 'production', 'staging', 'development', 'test'
isProduction()         // boolean
isLoadTestingAllowed() // Only staging, development, test

// Database per environment
getDatabaseName()
// production  → 'coi.db'
// staging     → 'coi-staging.db'
// development → 'coi-dev.db'
// test        → 'coi-test.db'
```

**Production Notes**:
- Set `NODE_ENV` environment variable
- Load testing blocked in production
- Each environment uses separate database file (SQLite) or connection string (SQL Server)

---

## Service Catalog System

**Status**: Fully implemented in prototype

Multi-entity service catalog management with Kuwait Local and Global catalogs.

**New Database Tables**:
```sql
CREATE TABLE entity_codes (
    id INT PRIMARY KEY IDENTITY(1,1),
    entity_code VARCHAR(10) UNIQUE NOT NULL,
    entity_name NVARCHAR(255) NOT NULL,
    country_code VARCHAR(3),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE service_catalog_global (
    id INT PRIMARY KEY IDENTITY(1,1),
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name NVARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description NVARCHAR(MAX),
    is_pie_relevant BIT DEFAULT 0,
    typical_timing VARCHAR(50),  -- 'year_end', 'quarter_end', 'on_demand'
    deadline_days INT,
    seasonal_pattern NVARCHAR(MAX), -- JSON
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE service_catalog_entities (
    id INT PRIMARY KEY IDENTITY(1,1),
    entity_id INT NOT NULL REFERENCES entity_codes(id),
    global_service_id INT NOT NULL REFERENCES service_catalog_global(id),
    local_service_code VARCHAR(50),
    local_service_name NVARCHAR(255),
    local_restrictions NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    UNIQUE(entity_id, global_service_id)
);
```

**Production Notes**:
- Kuwait Local catalog: 39 services (from COI Template)
- Global catalog: 177+ services (from Global COI Form)
- Entity-specific overrides for local naming/restrictions

---

## Company Relationships (IESBA 290.13)

**Status**: Fully implemented in prototype

Industry-standard company relationship tracking for group structure conflicts.

**New Columns on coi_requests**:
```sql
ALTER TABLE coi_requests ADD company_type VARCHAR(50) 
    CHECK(company_type IN ('Standalone', 'Subsidiary', 'Parent', 'Sister', 'Affiliate'));
ALTER TABLE coi_requests ADD parent_company_id INT REFERENCES clients(id);
ALTER TABLE coi_requests ADD ownership_percentage DECIMAL(5,2) 
    CHECK(ownership_percentage >= 0 AND ownership_percentage <= 100);
ALTER TABLE coi_requests ADD control_type VARCHAR(50) 
    CHECK(control_type IN ('Majority', 'Minority', 'Joint', 'Significant Influence', 'None'));
ALTER TABLE coi_requests ADD group_structure VARCHAR(50) 
    CHECK(group_structure IN ('standalone', 'has_parent', 'research_required'));
ALTER TABLE coi_requests ADD parent_company_verified_by INT REFERENCES users(id);
ALTER TABLE coi_requests ADD parent_company_verified_at DATETIME;
ALTER TABLE coi_requests ADD group_conflicts_detected NVARCHAR(MAX); -- JSON array
ALTER TABLE coi_requests ADD requires_compliance_verification BIT DEFAULT 0;
```

**Production Notes**:
- Enables automatic conflict detection across group structures
- Compliance verification flag for uncertain parent relationships
- Backfill `group_structure` from existing `parent_company` values

---

## Updated Database Schema Summary

### New Tables (7 Migrations)

| Migration Date | Tables Added |
|----------------|--------------|
| 2026-01-12 | `prospects`, `service_type_categories`, `proposal_engagement_conversions` |
| 2026-01-13 | `entity_codes`, `service_catalog_global`, `service_catalog_entities` |
| 2026-01-15 | `countries` |
| 2026-01-16 | `client_intelligence_*` (5 tables) |
| 2026-01-19 | `notification_queue`, `notification_stats` |
| 2026-01-20 | `lead_sources`, `prospect_funnel_events` |

### Extended Columns on coi_requests

| Category | Columns |
|----------|---------|
| CRM/Prospect | `is_prospect`, `prospect_id`, `prms_client_id`, `prospect_converted_at`, `lead_source_id` |
| Lost Tracking | `lost_reason`, `lost_at_stage`, `lost_date`, `stale_detected_at`, `last_activity_at` |
| Company Relationships | `company_type`, `parent_company_id`, `ownership_percentage`, `control_type` |
| Group Structure | `group_structure`, `parent_company_verified_by`, `parent_company_verified_at`, `group_conflicts_detected`, `requires_compliance_verification` |
| Monitoring | `monitoring_days_elapsed`, `interval_alerts_sent`, `renewal_notification_sent`, `expiry_notification_sent` |
| Service | `service_sub_category` |

---

## Scheduled Jobs (Production)

The following scheduled jobs are required for production:

| Job | Frequency | Function |
|-----|-----------|----------|
| Stale Detection | Daily (midnight) | `runStaleDetectionJob()` |
| Notification Batch Flush | Every 5 minutes | `flushNotificationBatch()` |
| Proposal Monitoring | Daily | `checkProposalExpiry()` |
| Engagement Renewal Alerts | Weekly | `checkEngagementRenewals()` |

**Example Cron Configuration**:
```bash
# Stale detection - daily at midnight
0 0 * * * node /app/jobs/staleDetection.js

# Notification batch flush - every 5 minutes
*/5 * * * * node /app/jobs/flushNotifications.js

# Proposal monitoring - daily at 8am
0 8 * * * node /app/jobs/proposalMonitoring.js

# Engagement renewal alerts - weekly on Monday
0 9 * * 1 node /app/jobs/renewalAlerts.js
```

**Production Notes**:
- Use process manager (PM2, systemd) for job reliability
- Jobs should be idempotent (safe to run multiple times)
- Log job execution to audit trail

---

## Service Abstraction Layers (Production)

### HRMS Service Abstraction

Create `hrmsService.js` with this interface:
```typescript
interface HRMSService {
  // Employee data
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee>;
  getEmployeeByEmail(email: string): Promise<Employee>;
  
  // User groups/permissions
  getUserGroups(userId: number): Promise<string[]>;
  mapGroupsToCOIRole(groups: string[]): string;
  
  // Email
  getEmailAddress(userId: number): Promise<string>;
}

// Production implementation queries HRMS SQL Server
// Prototype implementation returns mock data
```

### PRMS Service Abstraction

Create `prmsService.js` with this interface:
```typescript
interface PRMSService {
  // Client master
  getClients(): Promise<Client[]>;
  getClientByCode(code: string): Promise<Client>;
  syncClients(): Promise<void>;
  
  // Engagement code validation
  validateEngagementCode(code: string): Promise<{ valid: boolean; reason?: string }>;
  
  // Project creation
  createProject(data: ProjectData): Promise<{ projectId: string }>;
}

// Production implementation queries PRMS SQL Server or API
// Prototype implementation returns mock data
```

### Email Service Abstraction

The `notificationService.js` already abstracts email:
```typescript
// Prototype: console.log
// Production: Replace sendEmail() implementation with:

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  auth: {
    user: process.env.O365_EMAIL,
    pass: process.env.O365_PASSWORD
  }
});

export function sendEmail(to, subject, body, metadata = {}) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: body
  });
}
```

---

## Dynamic Fields (Practical Approach)

### Current Implementation

The prototype already supports dynamic fields via:
1. `form_fields_config` table - Field definitions
2. `form_templates` / `form_template_fields` tables - Template management
3. `custom_fields` JSON column on `coi_requests` - Storage for dynamic values

### Recommended Production Approach

**Phase 1: JSON Storage (Immediate)**
- Keep hardcoded core fields working
- Store additional fields in `custom_fields` JSON column
- No complex schema changes required

**Phase 2: Admin UI (Later)**
- Build field configuration interface
- Allow adding/editing fields without deployment
- Full audit trail

**Example Usage**:
```javascript
// Store custom fields as JSON
const request = {
  // Core fields (hardcoded)
  client_id: 123,
  service_type: 'Audit',
  
  // Dynamic fields (JSON)
  custom_fields: JSON.stringify({
    valuation_purpose: 'Acquisition',
    special_requirements: 'Urgent review needed',
    additional_contacts: ['john@client.com']
  })
};

// Retrieve and parse
const customFields = JSON.parse(request.custom_fields || '{}');
```

**Production Notes**:
- JSON storage in SQL Server uses `NVARCHAR(MAX)`
- Index on frequently queried JSON paths using computed columns
- No complex rules engine needed initially

---

## Production Build Checklist (Updated)

### New Items

- [ ] **CRM/Prospect System**:
  - [ ] Create `prospects` table with all columns
  - [ ] Create `lead_sources` table and seed data
  - [ ] Create `prospect_funnel_events` table
  - [ ] Create `prospect_client_creation_requests` table
  - [ ] Add CRM columns to `coi_requests`

- [ ] **Notification Batching**:
  - [ ] Create `notification_queue` table
  - [ ] Create `notification_stats` table
  - [ ] Set up 5-minute batch flush job
  - [ ] Configure urgent notification bypass

- [ ] **Scheduled Jobs**:
  - [ ] Stale detection job (daily)
  - [ ] Notification batch flush (every 5 minutes)
  - [ ] Proposal monitoring (daily)
  - [ ] Engagement renewal alerts (weekly)

- [ ] **Service Catalog**:
  - [ ] Create `entity_codes` table
  - [ ] Create `service_catalog_global` table
  - [ ] Create `service_catalog_entities` table
  - [ ] Seed Kuwait Local (39 services)
  - [ ] Seed Global catalog (177+ services)

- [ ] **Company Relationships**:
  - [ ] Add company relationship columns to `coi_requests`
  - [ ] Implement group conflict detection
  - [ ] Add compliance verification workflow

- [ ] **Service Abstraction Layers**:
  - [ ] Create `hrmsService.js` production implementation
  - [ ] Create `prmsService.js` production implementation
  - [ ] Replace mock email with O365 SMTP

- [ ] **Master Search** (Optional Enhancements):
  - [ ] Backend search API for performance at scale
  - [ ] Search history database table (cross-device sync)
  - [ ] Recent items database table (cross-device sync)
  - [ ] Search analytics tracking
  - [ ] ARIA labels for accessibility
  - [ ] Backend fuzzy matching API (leverages existing `calculateSimilarity`)

---

## New API Endpoints (CRM Features)

```typescript
// Prospects
GET    /api/prospects              // List prospects (filtered)
POST   /api/prospects              // Create prospect
GET    /api/prospects/:id          // Get prospect details
PUT    /api/prospects/:id          // Update prospect
POST   /api/prospects/:id/convert  // Convert to client

// Lead Sources
GET    /api/lead-sources           // Get all lead sources

// Funnel Analytics
GET    /api/analytics/funnel       // Get funnel metrics
GET    /api/analytics/funnel/:prospectId  // Get funnel events for prospect

// Stale Detection
GET    /api/analytics/stale        // Get stale detection summary
POST   /api/analytics/stale/run    // Run stale detection (admin)

// My Day/Week
GET    /api/my-day                 // Get My Day view
GET    /api/my-week                // Get My Week view
GET    /api/my-month               // Get My Month view

// Notifications
GET    /api/notifications/stats    // Get noise reduction stats
POST   /api/notifications/flush    // Flush notification batch (admin)

// Master Search (Optional - for enhanced features)
GET    /api/search/history          // Get user's search history
POST   /api/search/history          // Save search to history
DELETE /api/search/history          // Clear search history
GET    /api/search/recent-items     // Get user's recent items
POST   /api/search/recent-items     // Track item access
POST   /api/search                  // Backend search with pagination (for performance at scale)
```

---

## Master Search Feature (January 2026)

**Status**: Fully implemented in prototype

**Features Added**:
1. **Global Search Component** (`GlobalSearch.vue`)
   - Accessible via `⌘/Ctrl + K` keyboard shortcut on all dashboards
   - Role-based result filtering
   - Empty state with recent items, search history, and quick actions
   - Search history persistence (localStorage)
   - Recent items tracking (localStorage)

2. **Search Enhancements**:
   - **Relevance Ranking**: Results sorted by relevance score (exact matches, starts with, contains, recent items, status priority)
   - **Autocomplete Suggestions**: Shows top 5 suggestions for 1-character queries
   - **Fuzzy Matching**: Levenshtein distance algorithm handles typos and name variations (70% similarity threshold)
   - **Result Highlighting**: Safe highlighting using computed segments (no v-html, regex escaped)

3. **Role-Based Access**:
   - Requester: Only own requests
   - Director: Department requests + team members
   - Compliance/Partner/Finance: All requests (backend filtered)
   - Admin/Super Admin: All requests + users

**Production Notes**:
- **Prototype**: Uses browser localStorage for search history and recent items
- **Production**: Consider server-side storage for cross-device sync (optional)
- **Performance**: For 10,000+ requests, consider backend search API with database indexing
- **Fuzzy Matching**: Backend `calculateSimilarity` function exists in `duplicationCheckService.js` - can be used for API endpoint
- **Accessibility**: Add ARIA labels for screen reader support (recommended)

**Database Schema** (Optional for enhanced features):
- `user_search_history` table (for cross-device sync)
- `user_recent_items` table (for cross-device sync)

**See**: `coi-prototype/MASTER_SEARCH_HANDOFF_UPDATE.md` for detailed implementation notes

---

## Questions for Technical Team

Before starting production build, confirm:

1. **HRMS Access**: Direct SQL Server connection or API?
2. **PRMS Access**: Direct database or API endpoint?
3. **⚠️ PRMS Engagement Code Field**: Has PRMS added the mandatory Engagement Code field to project creation form?
4. **PRMS Financial Fields**: Confirm PRMS can accept Billing Currency and Risks fields during project creation
5. **Authentication**: SSO provider? Active Directory?
6. **Email**: O365 account credentials?
7. **Database**: SQL Server version and connection details?
8. **Cloud**: Deployment platform (Azure, AWS, on-premise)?
9. **Job Scheduler**: What tool for scheduled jobs? (Windows Task Scheduler, Azure Functions, cron)
10. **CRM Integration**: Any existing CRM to integrate with prospect management?

---

**This document is the primary reference for production system development.**

**Last Updated**: January 2026 (CRM Features, Notification Batching, My Day/Week Views, Master Search)


