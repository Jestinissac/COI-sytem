# COI Prototype - Testing Guide

## Overview

This document provides a comprehensive guide to the testing infrastructure for the COI (Conflict of Interest) Prototype application.

## Testing Stack

### Backend Testing
- **Framework**: Vitest (Fast Vite-native test runner)
- **HTTP Testing**: Supertest (API endpoint testing)
- **Coverage**: @vitest/coverage-v8
- **Database**: SQLite in-memory/test database

### Frontend Testing
- **Framework**: Vitest
- **Component Testing**: @vue/test-utils (Official Vue testing library)
- **DOM Environment**: happy-dom (Fast DOM implementation)
- **UI**: @vitest/ui (Visual test interface)

### E2E Testing
- **Framework**: Playwright (Cross-browser testing)
- **Browsers**: Chromium, Firefox, WebKit
- **Features**: Screenshots, video recording, trace viewer

## Project Structure

```
coi-prototype/
├── backend/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── controllers/         # Controller unit tests
│   │   │   ├── services/            # Service unit tests
│   │   │   └── middleware/          # Middleware unit tests
│   │   ├── integration/
│   │   │   └── api/                 # API integration tests
│   │   ├── fixtures/
│   │   │   └── testData.js          # Test data fixtures
│   │   ├── setup.js                 # Test setup and DB initialization
│   │   └── test-coi.db              # Test database (auto-created)
│   └── vitest.config.js             # Vitest configuration
│
├── frontend/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── components/          # Component tests
│   │   │   ├── stores/              # Pinia store tests
│   │   │   └── views/               # View tests
│   │   └── setup.ts                 # Test setup (mocks, global config)
│   └── vite.config.ts               # Vite + Vitest configuration
│
└── e2e/
    ├── tests/
    │   ├── auth.spec.ts             # Authentication E2E tests
    │   └── coi-workflow.spec.ts     # COI workflow E2E tests
    └── playwright.config.ts         # Playwright configuration

```

## Running Tests

### Backend Tests

```bash
# Navigate to backend directory
cd backend

# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# From project root

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/tests/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run All Tests

```bash
# From project root

# Run backend + frontend tests
npm run test:all

# Run all tests with coverage
npm run test:coverage
```

## Writing Tests

### Backend Unit Test Example

```javascript
// backend/tests/unit/services/example.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { seedTestData, getTestDb } from '../../setup.js';
import { testUsers } from '../../fixtures/testData.js';

describe('Service Name', () => {
  beforeEach(() => {
    seedTestData({ users: testUsers });
  });

  it('should do something', () => {
    const db = getTestDb();
    // Your test logic
    expect(true).toBe(true);
  });
});
```

### Backend API Integration Test Example

```javascript
// backend/tests/integration/api/example.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/index.js'; // Your Express app

describe('GET /api/endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Frontend Component Test Example

```typescript
// frontend/tests/unit/components/MyComponent.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from '@/components/MyComponent.vue';

describe('MyComponent.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    });

    expect(wrapper.text()).toContain('Test');
  });
});
```

### Frontend Store Test Example

```typescript
// frontend/tests/unit/stores/myStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMyStore } from '@/stores/myStore';

describe('My Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default state', () => {
    const store = useMyStore();
    expect(store.data).toBeNull();
  });
});
```

### E2E Test Example

```typescript
// e2e/tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate to page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/COI Prototype/);
});
```

## Test Database

### Backend Test Database

The backend uses a separate SQLite test database (`backend/tests/test-coi.db`) that:
- Is automatically created from `database/schema.sql`
- Is cleared before each test (clean slate)
- Uses the same schema as production
- Is deleted after all tests complete

### Seeding Test Data

```javascript
import { seedTestData } from '../setup.js';
import { testUsers, testClients } from '../fixtures/testData.js';

beforeEach(() => {
  seedTestData({
    users: testUsers,
    clients: testClients
  });
});
```

## Coverage Reports

After running tests with coverage, reports are generated in:

- **Backend**: `backend/coverage/`
- **Frontend**: `frontend/coverage/`

Open `coverage/index.html` in a browser to view detailed coverage reports.

## Continuous Integration (CI)

To integrate with CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm run install:all

- name: Run backend tests
  run: cd backend && npm run test:run

- name: Run frontend tests
  run: cd frontend && npm run test:run

- name: Run E2E tests
  run: npm run test:e2e
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 2. Descriptive Test Names
```javascript
// Good
it('should return 401 when user is not authenticated')

// Bad
it('test auth')
```

### 3. Arrange-Act-Assert Pattern
```javascript
it('should add item to cart', () => {
  // Arrange
  const cart = new ShoppingCart();
  const item = { id: 1, name: 'Product' };

  // Act
  cart.addItem(item);

  // Assert
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0]).toBe(item);
});
```

### 4. Mock External Dependencies
```javascript
import { vi } from 'vitest';

// Mock axios
vi.mock('axios');
```

### 5. Test Edge Cases
- Empty inputs
- Null/undefined values
- Maximum/minimum values
- Error conditions

## Debugging Tests

### Backend/Frontend (Vitest)

```javascript
// Add debugger statement
it('should do something', () => {
  debugger; // Pause execution
  expect(value).toBe(expected);
});
```

Run with Node inspector:
```bash
node --inspect-brk node_modules/vitest/vitest.mjs run
```

### E2E (Playwright)

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# View test trace
npx playwright show-trace trace.zip
```

## Common Issues & Solutions

### Issue: Test database not found
**Solution**: Ensure you're running tests from the correct directory, or the schema file path in `setup.js` is correct.

### Issue: Tests fail in CI but pass locally
**Solution**:
- Check for timezone differences
- Ensure test database is properly cleaned
- Check for race conditions in async tests

### Issue: E2E tests timeout
**Solution**:
- Increase timeout in playwright.config.ts
- Ensure dev server starts properly
- Check for slow network requests

### Issue: Module import errors
**Solution**: Ensure `type: "module"` is in package.json for ESM imports

## Test Coverage Goals

### Recommended Coverage Targets
- **Backend Controllers**: 80%+
- **Backend Services**: 90%+
- **Backend Middleware**: 90%+
- **Frontend Components**: 70%+
- **Frontend Stores**: 85%+
- **E2E Critical Paths**: 100%

### What to Test
✅ Business logic
✅ API endpoints
✅ User workflows
✅ Edge cases
✅ Error handling

### What NOT to Test
❌ Third-party libraries
❌ Framework internals
❌ Simple getters/setters
❌ Configuration files

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)

## Getting Help

If you encounter issues:
1. Check the test output for error messages
2. Review the setup files (backend/tests/setup.js, frontend/tests/setup.ts)
3. Check test fixtures and ensure data is properly seeded
4. Refer to the framework documentation
5. Run tests with `--reporter=verbose` for detailed output

---

**Last Updated**: 2026-01-07
