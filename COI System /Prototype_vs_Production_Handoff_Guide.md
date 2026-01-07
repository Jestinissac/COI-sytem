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
    EngagementCode, -- Must exist and be Active in COI
    ClientCode,
    ServiceType,
    ServiceYear
) VALUES (...);

-- Database constraint prevents invalid codes
-- FOREIGN KEY (EngagementCode) REFERENCES COI.dbo.coi_engagement_codes(engagement_code)
```

**Integration Method**:
- **Option A**: COI provides validation API endpoint
- **Option B**: PRMS queries COI database directly (if same network)
- **Option C**: Database view/synonym (if allowed)

**Synchronization**:
- **Client Master**: Real-time webhook or 5-minute polling
- **Engagement Codes**: PRMS validates on project creation (real-time)

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

---

## Questions for Technical Team

Before starting production build, confirm:

1. **HRMS Access**: Direct SQL Server connection or API?
2. **PRMS Access**: Direct database or API endpoint?
3. **Authentication**: SSO provider? Active Directory?
4. **Email**: O365 account credentials?
5. **Database**: SQL Server version and connection details?
6. **Cloud**: Deployment platform (Azure, AWS, on-premise)?

---

**This document is the primary reference for production system development.**


