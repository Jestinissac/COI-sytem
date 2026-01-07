# COI Prototype Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install separately:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed Database

```bash
# Run seed script to populate database with mock data
npm run seed

# Or manually:
cd database/seed
node runSeed.js
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on http://localhost:3000

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

### 5. Login

Navigate to http://localhost:5173

**Prototype Login Credentials:**
- Email: `john.smith@company.com` (or any user email from seed data)
- Password: `password` (all users use this in prototype)

## Test Users by Role

### Requester (Audit Department)
- Email: `patricia.white@company.com`
- Password: `password`
- Sees: Only own requests (strict segregation)

### Director (Audit Department)
- Email: `john.smith@company.com`
- Password: `password`
- Sees: Own requests + team member requests (department only)

### Compliance Officer
- Email: `emily.davis@company.com`
- Password: `password`
- Sees: All departments, no commercial data

### Partner
- Email: `robert.taylor@company.com`
- Password: `password`
- Sees: All departments, full visibility

### Finance
- Email: `lisa.thomas@company.com`
- Password: `password`
- Sees: All departments, can generate engagement codes

### Admin
- Email: `james.jackson@company.com`
- Password: `password`
- Sees: All departments, execution queue

### Super Admin
- Email: `admin@company.com`
- Password: `password`
- Sees: Everything, no restrictions

## Features Implemented

### ✅ Authentication & Routing
- Login page with mock authentication
- Multi-system landing page
- Role-based routing
- JWT token management

### ✅ Database & Data Seeding
- SQLite database with full schema
- 50 employees (all departments)
- 100 clients (with fuzzy matching test cases)
- 200 active projects
- 20 COI requests (distributed by department)

### ✅ COI Template Form
- All form sections (A-G)
- All dropdowns with options
- Conditional field logic
- Form validation
- Save as draft
- Submit functionality

### ✅ Role-Specific Dashboards
- Requester dashboard (strict segregation)
- Director dashboard (department + team)
- Compliance dashboard (all departments, no commercial)
- Partner dashboard (all departments)
- Finance dashboard (all departments)
- Admin dashboard (all departments)
- Super Admin dashboard (no restrictions)

### ✅ Data Segregation
- Department-based filtering middleware
- Role-based data access rules
- Commercial data exclusion (Compliance)
- Team member inclusion (Directors)

### ✅ Workflow Actions
- Director approval workflow
- Compliance review workflow (with duplication alerts)
- Partner approval workflow
- Finance code generation
- Admin execution workflow

### ✅ Duplication Detection
- Fuzzy matching algorithm (Levenshtein Distance)
- Abbreviation normalization
- Match scoring (75-89% flag, 90%+ block)
- Display in Compliance dashboard

## Edition Management

### Checking Current Edition

The system supports two editions:
- **Standard Edition**: Basic features, fixed form structure, action-based rules
- **Pro Edition**: Advanced features, dynamic form builder, recommendation-based rules, change management

**To check current edition:**
1. Login as Super Admin (`admin@company.com`)
2. Navigate to Super Admin Dashboard
3. View the "System Edition" card at the top

### Switching Editions

**To switch from Standard to Pro (or vice versa):**
1. Login as Super Admin
2. Go to Super Admin Dashboard
3. Find the "System Edition" section
4. Toggle the switch to desired edition
5. Confirm the change in the modal
6. Features will update immediately

**Note:** 
- Only Super Admin can switch editions
- Existing requests are not affected by edition changes
- Pro features become hidden/disabled when switching to Standard
- Standard features remain available in Pro edition

### Edition-Specific Features

**Standard Edition Features:**
- Basic rules engine (block/flag actions)
- Fixed form structure
- Basic duplication detection
- Engagement code generation
- Role-based dashboards

**Pro Edition Additional Features:**
- Advanced rules engine (recommendations with confidence)
- Dynamic form builder
- Change management system
- Impact analysis
- Field dependency tracking
- Rules engine health monitoring

For detailed comparison, see [EDITION_COMPARISON.md](EDITION_COMPARISON.md)

## Next Steps

1. Test all user journeys
2. Verify data segregation works correctly
3. Test duplication detection with seeded data
4. Test approval workflows end-to-end
5. Verify engagement code generation
6. Test edition switching functionality

## Troubleshooting

### Database not initialized
- Delete `database/coi.db` and restart backend
- Or run seed script manually

### Port already in use
- Change port in `vite.config.ts` (frontend) or `backend/src/index.js` (backend)

### CORS errors
- Ensure backend is running on port 3000
- Check proxy configuration in `vite.config.ts`


