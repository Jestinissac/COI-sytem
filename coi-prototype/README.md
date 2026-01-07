# COI System Prototype

## Setup Instructions

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:3000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Database Setup

The database is automatically initialized when the backend starts. To seed data:

```bash
cd database/seed
node seedData.js
```

### Default Login

For prototype, use any email/password combination that exists in the seeded data:
- Email: `john.smith@company.com` (or any user email from seed data)
- Password: `password` (all users use this password in prototype)

### User Roles

- **Requester**: Can create and view own requests (department-segregated)
- **Director**: Can approve team member requests, view department requests
- **Compliance**: Reviews all requests (cross-department), no commercial data
- **Partner**: Approves requests, sees all departments
- **Finance**: Generates engagement codes
- **Admin**: Executes proposals, manages 30-day monitoring
- **Super Admin**: Full system access

### Departments

- Audit (15 employees, 8 requests)
- Tax (12 employees, 6 requests)
- Advisory (10 employees, 4 requests)
- Accounting (8 employees, 2 requests)
- Other (5 employees)


