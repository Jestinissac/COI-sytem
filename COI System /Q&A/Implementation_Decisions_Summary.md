# Implementation Decisions Summary

## Date: [Current Session]

This document summarizes all critical decisions made based on Q&A answers, to be used for prototype development.

---

## 1. Client Request Workflow

### Decision
**System creates "Client Request" for PRMS Admin, Requester can save draft**

### Implementation Requirements
- Create `client_requests` table with fields:
  - `id`, `client_name`, `commercial_registration`, `requested_by`, `requested_date`, `status`, `prms_admin_notes`, `created_date`, `updated_date`
- Notification system: Send notification to PRMS Admin when new client requested
- Draft capability: Allow Requester to save COI request as draft while client is being added
- Status tracking: Track client request status (Pending, In Progress, Completed, Rejected)
- Notification to Requester: When PRMS Admin adds client, notify Requester
- UI: "Request New Client" button in client dropdown

### Database Schema Addition
```sql
CREATE TABLE client_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(255) NOT NULL,
    commercial_registration VARCHAR(100),
    requested_by INT NOT NULL,
    requested_date DATETIME NOT NULL,
    status ENUM('Pending', 'In Progress', 'Completed', 'Rejected') DEFAULT 'Pending',
    prms_admin_notes TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id)
);
```

---

## 2. Director Approval Mechanism

### Decision
**In-system approval: Director clicks "Approve" button**

### Implementation Requirements
- Notification system: Send notification to Director when team member submits request
- Director dashboard: Show "Pending Approval" section
- Approval button: One-click approve in system
- Audit trail: Record approval with timestamp, user ID, IP address (optional)
- Optional document upload: Director can attach approval document as backup
- Approval delegation: Future enhancement (not in prototype)

### Database Schema Addition
```sql
ALTER TABLE coi_requests ADD COLUMN director_approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending';
ALTER TABLE coi_requests ADD COLUMN director_approval_date DATETIME;
ALTER TABLE coi_requests ADD COLUMN director_approval_by INT;
ALTER TABLE coi_requests ADD COLUMN director_approval_notes TEXT;
ALTER TABLE coi_requests ADD COLUMN director_approval_document_id INT;

CREATE TABLE director_approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coi_request_id INT NOT NULL,
    director_id INT NOT NULL,
    approval_status ENUM('Approved', 'Rejected') NOT NULL,
    approval_date DATETIME NOT NULL,
    approval_notes TEXT,
    document_id INT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (director_id) REFERENCES users(id),
    FOREIGN KEY (document_id) REFERENCES coi_attachments(id)
);
```

### Workflow Logic
- If Requester role = "Director": Skip director approval step
- If Requester role = "Team Member": Require director approval before submission
- System blocks submission until director approval received

---

## 3. Global COI Integration

### Decision
**Manual Excel upload, status updates to stakeholders (external process)**

### Implementation Requirements
- Excel upload functionality: Compliance Officer can upload Excel sheet
- Status tracking: Track Global clearance status (Pending, Approved, Rejected)
- Status field: Add `global_clearance_status` to `coi_requests` table
- Configuration: Make Global clearance requirement configurable
- Notification: Send status updates to stakeholders when Global clearance changes

### Database Schema Addition
```sql
ALTER TABLE coi_requests ADD COLUMN global_clearance_status ENUM('Not Required', 'Pending', 'Approved', 'Rejected') DEFAULT 'Not Required';
ALTER TABLE coi_requests ADD COLUMN global_clearance_date DATETIME;
ALTER TABLE coi_requests ADD COLUMN global_clearance_verified_by INT;
ALTER TABLE coi_requests ADD COLUMN global_clearance_excel_id INT;

CREATE TABLE global_clearance_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_type_id INT,
    client_type VARCHAR(50),
    require_global_clearance_before_approval BOOLEAN DEFAULT FALSE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id)
);
```

### Configuration Logic
- If `require_global_clearance_before_approval = TRUE`: Block Partner approval until Global clearance = Approved
- If `require_global_clearance_before_approval = FALSE`: Allow request to proceed, track Global clearance separately
- Compliance Officer can override configuration if needed
- Default: `require_global_clearance_before_approval = FALSE` (can proceed)

### Verification
- Compliance Officer verifies Global clearance
- Compliance Officer updates status in system
- System sends notification when status changes

---

## 4. Document Management

### Decision
**COI system database storage, both digital forms and PDF uploads, all roles with data segregation**

### Implementation Requirements

#### Storage
- Database storage: Store documents in `coi_attachments` table
- File storage: Store files in database (BLOB) or file system with database references
- Maximum file size: 10MB (configurable)
- Supported formats: PDF, DOCX, XLSX, images (JPG, PNG)

#### ISQM Forms
- **Method 1 - Digital Forms**: Fillable directly in COI system
  - Client Screening Questionnaire (digital form builder)
  - New Client Acceptance checklist (digital form builder)
- **Method 2 - PDF Upload**: Upload completed PDF forms
  - For existing/active projects with completed forms
  - User uploads PDF files

#### Access Control
- **Admin**: Full access (upload, edit, view, delete)
- **Compliance**: View only (verification)
- **Partner**: View only (oversight)
- **Requester**: View own request forms only
- **Finance**: View only (if needed for financial assessment)

### Database Schema
```sql
CREATE TABLE coi_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coi_request_id INT NOT NULL,
    attachment_type ENUM('Proposal', 'Engagement Letter', 'ISQM Form', 'Director Approval', 'Global Clearance Excel', 'Other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    file_type VARCHAR(50),
    file_content LONGBLOB,
    uploaded_by INT NOT NULL,
    uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_digital_form BOOLEAN DEFAULT FALSE,
    form_data JSON,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE isqm_forms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coi_request_id INT NOT NULL,
    form_type ENUM('Client Screening Questionnaire', 'New Client Acceptance Checklist') NOT NULL,
    form_data JSON,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by INT,
    completed_date DATETIME,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);
```

---

## 5. Email/Notification System

### Decision
**Microsoft O365 (Exchange/Outlook), role-based emails, HRMS source with COI override**

### Implementation Requirements

#### Email System
- **Provider**: Microsoft O365 (Exchange/Outlook)
- **SMTP Configuration**: O365 SMTP settings
- **Email Templates**: HTML email templates for different notification types
- **Attachments**: Support email attachments (reports, documents)

#### Email Source
- **Primary**: HRMS Employee Master (SQL Server)
- **Override**: COI system user profile (user can update)
- **Fallback**: COI profile if HRMS not available
- **User Management**: User can update email in profile

#### Notification Recipients
- **Role-based**: Fetch all users with relevant roles (e.g., all Admin role users)
- **No hardcoded emails**: System dynamically fetches recipients based on roles
- **Auto-updates**: If Admin team changes, system automatically updates recipients
- **Configuration**: Admin can configure notification preferences per role

### Database Schema
```sql
CREATE TABLE notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_notification (user_id, notification_type)
);

CREATE TABLE email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) NOT NULL,
    template_subject VARCHAR(255) NOT NULL,
    template_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_date DATETIME,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_date DATETIME,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Notification Types
- Status change notifications
- Approval requests
- Rejection notifications
- 30-day monitoring alerts (every 10 days)
- Renewal alerts (90/60/30 days before expiry)
- Client request notifications
- Director approval requests
- Global clearance status updates

### Configuration
```javascript
// Email Configuration (prototype - use environment variables)
const emailConfig = {
  provider: 'O365',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  },
  from: process.env.EMAIL_FROM,
  replyTo: process.env.EMAIL_REPLY_TO
};
```

---

## Summary of Database Changes

### New Tables
1. `client_requests` - Track new client requests
2. `director_approvals` - Track director approvals
3. `global_clearance_config` - Configuration for Global clearance requirements
4. `coi_attachments` - Document storage
5. `isqm_forms` - ISQM form data
6. `notification_preferences` - User notification preferences
7. `email_templates` - Email template management
8. `notifications` - In-app notifications

### Modified Tables
1. `coi_requests` - Add director approval fields, Global clearance fields
2. `users` - Add email override field (if not exists)

---

## Implementation Priority

### Phase 1 (Core Functionality)
1. Client request workflow
2. Director approval mechanism
3. Document storage (basic)
4. Email notifications (basic)

### Phase 2 (Enhanced Features)
1. Global COI integration
2. ISQM digital forms
3. Advanced notification preferences
4. Email templates

### Phase 3 (Advanced Features)
1. Document access control refinement
2. Approval delegation
3. Advanced reporting

---

## Next Steps

1. ✅ Answers recorded
2. ✅ User journeys updated
3. ⏳ Implementation plan update (if plan file exists)
4. ⏳ Database schema design
5. ⏳ Prototype development

---

## Related Documents

- Q&A Answers: `COI System /Q&A/Answers_Record.md`
- Critical Questions: `COI System /Q&A/Critical_Questions_For_Immediate_Answer.md`
- User Journeys: `COI System /User_Journeys_End_to_End.md`
- All Questions: `COI System /Q&A/User_Journey_Questions.md`


