# COI Template - Complete Field Extraction

## Form Structure Based on COI Template PDF

### Section 1: Client Data

#### 1. Requestor Information
- **Requestor Name**: Text field (auto-filled from logged-in user)
- **Designation**: Dropdown
  - Director
  - Partner
  - Manager
  - Senior Manager
  - Other (specify)

#### 2. Entity Information
- **Entity**: Dropdown
  - BDO Al Nisf & Partners
  - [Other entities as applicable]

- **Line of Service**: Dropdown
  - Audit & Assurance
  - Advisory
  - Tax
  - Accounting
  - Other Regulated Services

#### 3. Document Information
- **Requested Document**: Dropdown
  - Proposal
  - Engagement Letter
  - Both

- **Language**: Dropdown
  - English
  - Arabic
  - Both

#### 4. Client Information
- **Client Name**: Dropdown (populated from PRMS Client Master)
  - [Dynamic list from PRMS]
  - Option: "Request New Client" (redirects to PRMS admin)

- **Parent Company (if any)**: Text field (conditional - mandatory for International/PIE/Potential)

- **Client Location**: 
  - ☑ Checkbox: "State of Kuwait"
  - ☐ "Other" (text field appears if checked)

#### 5. Relationship & Type
- **Relationship with Client**: Dropdown
  - New Client
  - Existing Client
  - Potential Client

- **Client Type**: Dropdown
  - W.L.L. (With Limited Liability)
  - S.A.K. (Shareholding Company)
  - K.S.C. (Kuwait Shareholding Company)
  - Partnership
  - Sole Proprietorship
  - Other

#### 6. Regulatory Information
- **Regulated Body**: Dropdown
  - MOCI (Ministry of Commerce and Industry)
  - CMA (Capital Markets Authority)
  - CBK (Central Bank of Kuwait)
  - Other
  - N/A

- **Status**: Dropdown
  - Active
  - Inactive
  - Suspended
  - N/A

#### 7. Service Information
- **Service Type**: Dropdown (extensive list from Global COI Form)
  
  **Audit & Assurance:**
  - Statutory Audit Services
  - Review Services
  - Agreed-Upon Procedures
  - Compilation Services
  - Other (Audit & Assurance)

  **Advisory Categories** (from Global COI Form):
  - Advisory - Analytics & Insights
    - Data Analytics (Enterprise Data Warehouse, Data Engineering, Reporting & Visualizations)
    - Predictive and/or Data Analytics, AI and Machine Learning
    - Other (Advisory - Analytics & Insights)
  
  - Advisory - Corporate Finance, Transactions and Restructuring
    - Capital Markets & Raising Finance
    - Company Insolvency
    - Corporate Finance
    - Corporate Restructuring
    - Debt Advisory
    - Debt Restructuring
    - Individual Insolvency
    - Post-merger integrations and/or restructuring
    - Private finance initiatives and public private partnerships
    - Raising finance (excluding treasury services)
    - Raising finance (including treasury services)
    - Transactions
    - Working Capital and Operational Advisory
    - Other (Advisory - Corporate Finance, Transactions and Restructuring)
  
  - Advisory - Cyber security
    - CIO/CISO Advisory Services
    - Cloud Migration Services
    - Cybersecurity Audits ISO 27001
    - Cybersecurity education, training and simulations
    - Cybersecurity Policies, Plans, and Procedures development
    - Cybersecurity review and advisory
    - Cybersecurity Risk Management Assessments
    - Cybersecurity Table-top Services
    - Data Privacy services and data mapping
    - EU-GDPR data privacy compliance
    - Incident Response Services
    - Information Governance, Risk and Compliance
    - IT Vendor Risk Management
    - Managed IT/Security Services
    - Managed Security Operations Centre (SOC)
    - Payment Card industry (PCI) Security Readiness Assessments
    - PCI Security Audits
    - Penetration Testing
    - Security Incident Event Manager (SIEM)
    - Virtual Desktop Services
    - Vulnerability assessments
    - Other (Advisory - Cyber security)
  
  - Advisory - Due Diligence
    - Due Diligence
    - Transaction Advisory Services (TAS) (excluding cash management)
    - Transaction Advisory Services (TAS) (including cash management)
    - Other (Advisory - Due Diligence)
  
  - Advisory - Enablement & Adoption
    - Change Management
    - Programme Governance
    - Other (Advisory - Enablement & Adoption)
  
  - Advisory - ESG Services
    - ESG Consulting
    - ESG Due Diligence
    - ESG Reporting
    - ESG Solutions
    - Other (ESG Services)
  
  - Advisory - Forensics Investigations
    - Anti-Money Laundering
    - Asset Tracing
    - Contentious Bankruptcy (fraudulent/preferential conveyances, solvency analysis)
    - Corruption
    - Crimes against the Company
    - Cyber Crimes and Security Breaches
    - Data Privacy Breaches and Assessments
    - Financial Reporting and Public Disclosures
    - Forensic Technology Services (eDiscovery, Data Analytics)
    - Fraud and Corruption Due Diligence
    - Fraud and Corruption Risk Assessments
    - Investigative Due Diligence/Background Checks/Integrity Services
    - Monitorships and Forensic Accounting Support for Monitors
    - Whistleblower Services (Hotlines & Reporting)
    - Other (Advisory - Forensics Investigations)
  
  - Advisory - Litigation Support/Dispute Resolution
    - Accountants' and Auditors' Negligence (Professional Standard of Care Opinions)
    - Arbitrator, government-appointed Umpire or Referee in commercial disputes (*Neutral)
    - Construction Delay Claims
    - Cross Border dispute resolution
    - Economic Loss Quantification and Business Valuations in litigation
    - Insurance Claims (Insured/Business Interruption Loss Analysis)
    - Intellectual Property Disputes
    - Matrimonial disputes (income determination, family asset valuation)
    - Personal Injury/Medical Malpractice/Motor Vehicle Accident Loss Quantification
    - Trustee or Liquidator in Receivership (excluding treasury services)
    - Trustee or Liquidator in Receivership (including treasury services)
    - Other (Advisory - Litigation Support/Dispute Resolution)
  
  - Advisory - Management Consulting
    - Asset Management Consulting
    - Compensation advisory
    - Compliance Management Consulting
    - Corporate Governance
    - Financial Management Advisory
    - Performance advisory
    - Program & Project Management
    - Systems and Procedures Consulting
    - Other (Advisory - Management Consulting)
  
  - Advisory - Merger & Acquisitions
    - M&A services
    - Post Investment Monitoring
    - Other (Advisory - Merger & Acquisitions)
  
  - Advisory - Operational Excellence
    - Capacity Assessment & Optimization
    - Capital Planning & Optimization
    - Cost Reduction / EBITDA Improvement
    - Other (Advisory - Operational Excellence)
  
  - Advisory - Other
    - Accounting Advisory
    - Actuarial Services
    - Audit Advisory
    - Business continuity planning
    - Corporate Social Responsibility
    - Customised Training (Courses, Training needs assessment, planning, budget, Training Projects and management)
    - Employee Stock Option Plan (ESOP) Services
    - Executive/Board Level Professional Services
    - Financial Modelling
    - HR advisory
    - Interim Management Services
    - International Institutions and Donor Assurance (IIDA) - Advisory and/or Delivery
    - IPO Preparedness
    - Real Estate Advisory
    - Solvency services
    - Standardised Training
    - Succession Planning
    - Other (Advisory)
  
  - Advisory - Outsourcing
    - Managed Security
    - Managed Services (Service Desk, Infrastructure-MS, Application-MS, Virtual DBA, onsite support, etc.)
    - Program & Project Management
    - Other (Advisory - Outsourcing)
  
  - Advisory - Recruitment
    - Recruitment services
    - Other (Advisory - Recruitment)
  
  - Advisory - Restructuring
    - Business restructuring
    - Corporate Trustee or Receivership or Solvent liquidation
    - Creditor Representation
    - Other (Advisory - Restructuring)
  
  - Advisory - Risk Management (RAS)
    - Brand Standards compliance
    - Business process enhancement
    - Enterprise risk management
    - Fraud prevention
    - Internal Audit
    - Internal Controls Consulting
    - Other (Advisory - Risk Management)
    - Risk Management Consulting
    - Sarbanes-Oxley (SOX) Compliance
    - Third Party Risk Management
  
  - Tax Services
    - Corporate Tax Advisory
    - Individual Tax Advisory
    - Tax Compliance
    - Tax Planning
    - Transfer Pricing
    - Other (Tax Services)
  
  - Accounting Services
    - Bookkeeping
    - Financial Statement Preparation
    - Other (Accounting Services)

- **Requested service Period**: 
  - ☑ Checkbox: "One Time"
  - ☐ Date Range: "From" (date picker) "To" (date picker)

#### 8. Other Companies or Data
- **Other Companies or Data**: Text area
  - (If the provided service is intended for a company other than the client, its parent company or additional data)

---

### Section 2: Review Results

#### 1. Client Status
- **Client Status**: Dropdown
  - New Client
  - Existing Client
  - Potential Client
  - Active
  - Inactive

#### 2. Previous Services
- **Previous Services**: Dropdown
  - Statutory Audit Services
  - Review Services
  - Advisory Services
  - Tax Services
  - Accounting Services
  - [All service types from Service Type dropdown]
  - ☐ N/A (checkbox - if checked, Service Date field is hidden)

- **Service Date**: Date picker (shown if Previous Services is selected and N/A is not checked)

#### 3. Notes
- **Notes (if any)**: Text area

#### 4. Checked By
- **Name**: Text field (auto-filled from logged-in user if Compliance role)
- **Designation**: Dropdown (same as Requestor Designation)
- **Date**: Date picker (auto-filled with current date)

#### 5. Decision
- **Decision**: Radio buttons (single selection)
  - ☐ Proceed
  - ☐ Reject
  - ☐ Escalate

#### 6. Decision Notes
- **Notes (if any)**: Text area

#### 7. Approved By
- **Name**: Text field (auto-filled from logged-in user if Partner role)
- **Designation**: Dropdown (same as Requestor Designation)
- **Date**: Date picker (auto-filled with current date)

---

## Additional Fields from COI Workflow (Not in Template but Required)

### Section A: Service Information (Detailed)
- **Exact description and scope**: Text area (mandatory)
- **Service type**: Recurring / New / Linked to existing engagement (radio buttons)
- **Service category**: Assurance / Advisory / Tax / Accounting / Other regulated services (dropdown)
- **Valuation purposes**: Text field (if applicable)

### Section B: Client Information (Detailed)
- **Full legal name**: Auto-filled from Client Name selection
- **Commercial registration details**: Auto-filled from PRMS
- **Nature of business**: Text area
- **Operating sectors**: Multi-select dropdown
- **Client status**: New / Existing / Potential (already in template)
- **If existing**: 
  - Engagement code: Text field
  - Service history: Text area
  - Partner in charge: Dropdown (from Employee Master)
- **If new**: 
  - Introduction source: Text field
  - Due diligence notes: Text area

### Section C: Ownership & Structure
- **Parent company name**: Text field (conditional - mandatory for International/PIE/Potential)
- **Full ownership structure**: Text area
- **PIE status**: Yes / No (radio buttons)
- **Related/affiliated entities**: Multi-select or text area

### Section D: Signatory Details
- **Names and positions of authorized signatories**: 
  - Dynamic list (add/remove)
  - Name: Text field
  - Position: Dropdown (from Employee Master)

### Section E: International Operations & Global Checks
- **International operations**: Yes / No (checkbox - activates additional tab)
- **Foreign subsidiaries, branches, affiliates**: Text area
- **Global independence clearance**: 
  - Status: Pending / Approved / Rejected (dropdown)
  - Upload Excel sheet for Global COI portal

---

## Form Validation Rules

1. **Mandatory Fields**:
   - Requestor Name, Designation
   - Entity, Line of Service
   - Requested Document, Language
   - Client Name (from dropdown)
   - Client Location
   - Relationship with Client, Client Type
   - Service Type
   - Requested service Period
   - Decision (in Review Results)

2. **Conditional Mandatory**:
   - Parent Company: Required if International/PIE/Potential client
   - Global independence clearance: Required if International Operations = Yes

3. **Auto-filled Fields**:
   - Requestor Name (from logged-in user)
   - Checked By Name (if Compliance role)
   - Approved By Name (if Partner role)
   - Dates (current date)

4. **Dropdown Population**:
   - Client Name: From PRMS Client Master API
   - Service Type: From Global COI Form Services List
   - Employee names/positions: From HRMS Employee Master API

---

## Form States & Workflow

1. **Draft**: Initial state when form is being filled
2. **Submitted**: After requester submits (moves to Compliance)
3. **Under Review**: Compliance is reviewing
4. **Compliance Decision**: Proceed/Reject/Escalate
5. **Partner Review**: If Proceed from Compliance
6. **Partner Decision**: Proceed/Reject/Escalate
7. **Finance Coding**: If Proceed from Partner
8. **Admin Execution**: After Finance coding
9. **Active**: After client approval
10. **Closed**: After rejection or completion


