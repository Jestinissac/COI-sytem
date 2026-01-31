# Testing Quick Start

## Installation Complete ✓

Your COI Prototype now has a complete testing infrastructure:

- ✅ Backend testing (Vitest + Supertest)
- ✅ Frontend testing (Vitest + Vue Test Utils)
- ✅ E2E testing (Playwright)
- ✅ Test fixtures and sample tests
- ✅ Coverage reporting

## Quick Commands

### Run All Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests (from root)
npm run test:e2e

# All unit tests (from root)
npm run test:all
```

### Coverage Reports
```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage

# Both (from root)
npm run test:coverage
```

### Interactive Test UI
```bash
# Backend
cd backend && npm run test:ui

# Frontend
cd frontend && npm run test:ui

# E2E
npm run test:e2e:ui
```

## Directory Structure

```
📦 coi-prototype/
├── 📁 backend/
│   ├── 📁 tests/
│   │   ├── 📁 unit/           # Unit tests
│   │   ├── 📁 integration/    # API tests
│   │   ├── 📁 fixtures/       # Test data
│   │   └── setup.js          # Test config
│   └── vitest.config.js
│
├── 📁 frontend/
│   ├── 📁 tests/
│   │   ├── 📁 unit/           # Component/Store tests
│   │   └── setup.ts          # Test config
│   └── vite.config.ts
│
├── 📁 e2e/
│   └── 📁 tests/              # E2E test files
│
└── playwright.config.ts
```

## Sample Tests Created

### Backend
- ✅ `tests/unit/services/duplicationCheckService.test.js` - Service unit test
- ✅ `tests/integration/api/auth.test.js` - API integration test
- ✅ `tests/fixtures/testData.js` - Test fixtures
- ✅ `tests/setup.js` - Test database setup

### Frontend
- ✅ `tests/unit/components/StatusBadge.test.ts` - Component test
- ✅ `tests/unit/stores/auth.test.ts` - Store test
- ✅ `tests/setup.ts` - Test configuration

### E2E
- ✅ `e2e/tests/auth.spec.ts` - Authentication flow
- ✅ `e2e/tests/coi-workflow.spec.ts` - Complete COI workflow

## What's Next?

1. **Customize sample tests** - The provided tests are templates. Update them to match your actual components and API endpoints.

2. **Add more tests** - Cover critical business logic:
   - COI approval workflows
   - File upload/download
   - Data segregation
   - Duplication detection
   - Engagement code generation

3. **Set up CI/CD** - Integrate tests into your deployment pipeline

4. **Monitor coverage** - Aim for 80%+ coverage on critical paths

## Running Your First Test

### Backend Test
```bash
cd backend
npm test duplicationCheckService.test.js
```

### Frontend Test
```bash
cd frontend
npm test StatusBadge.test.ts
```

### E2E Test
```bash
npm run test:e2e -- e2e/tests/auth.spec.ts
```

## Test Data

Test users are available in `backend/tests/fixtures/testData.js`:
- Requester: `requester@test.com`
- Director: `director@test.com`
- Compliance: `compliance@test.com`
- Partner: `partner@test.com`
- Admin: `admin@test.com`

All test users use the password: `password123`

## Debugging Tests

### View test in browser (E2E)
```bash
npm run test:e2e:ui
```

### See test output (Backend/Frontend)
```bash
npm run test:ui
```

### Run single test file
```bash
# Backend
cd backend && npm test -- path/to/test.js

# Frontend
cd frontend && npm test -- path/to/test.ts
```

## Common Issues

**Problem**: Tests can't find modules
**Solution**: Ensure you're in the correct directory (backend/frontend)

**Problem**: Test database errors
**Solution**: Delete `backend/tests/test-coi.db` and re-run tests

**Problem**: E2E tests timeout
**Solution**: Ensure both backend and frontend servers are running

## Documentation

For detailed information, see `TESTING_GUIDE.md`

---

Happy Testing! 🧪
