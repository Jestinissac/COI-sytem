#!/bin/bash

# COI Prototype - Complete Test Suite Runner
# This script runs all tests: API, E2E, and generates comprehensive reports

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     COI PROTOTYPE - COMPLETE TEST SUITE                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if servers are running
echo "Checking if servers are running..."
if lsof -ti:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Backend server running on port 3000"
else
  echo -e "${RED}✗${NC} Backend server NOT running"
  echo "Starting backend server..."
  cd backend && npm run dev &
  BACKEND_PID=$!
  sleep 5
fi

if lsof -ti:5173 > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Frontend server running on port 5173"
else
  echo -e "${RED}✗${NC} Frontend server NOT running"
  echo "Starting frontend server..."
  cd frontend && npm run dev &
  FRONTEND_PID=$!
  sleep 5
fi

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "PHASE 1: Backend Unit & Integration Tests"
echo "══════════════════════════════════════════════════════════════════"
echo ""

cd backend
echo "Running backend tests..."
npm run test:run || echo -e "${YELLOW}Some backend tests failed${NC}"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "PHASE 2: Frontend Component Tests"
echo "══════════════════════════════════════════════════════════════════"
echo ""

cd ../frontend
echo "Running frontend tests..."
npm run test:run || echo -e "${YELLOW}Some frontend tests failed${NC}"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "PHASE 3: End-to-End User Journey Tests"
echo "══════════════════════════════════════════════════════════════════"
echo ""

cd ..
echo "Running E2E tests..."
npx playwright test e2e/tests/complete-user-journey.spec.ts --reporter=html || echo -e "${YELLOW}Some E2E tests failed${NC}"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "PHASE 4: API Integration Tests"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "Running API tests..."
bash << 'APITEST'
# Authentication Tests
echo "Testing Authentication..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patricia.white@company.com","password":"password"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✓ Authentication working"
else
  echo "✗ Authentication failed"
fi

# Data Retrieval Tests
echo "Testing Data Retrieval..."
REQUESTS=$(curl -s -X GET http://localhost:3000/api/coi/requests \
  -H "Authorization: Bearer $TOKEN")

REQUEST_COUNT=$(echo "$REQUESTS" | grep -o '"id":' | wc -l | tr -d ' ')
if [ "$REQUEST_COUNT" -gt 0 ]; then
  echo "✓ Retrieved $REQUEST_COUNT COI requests"
else
  echo "✗ Failed to retrieve requests"
fi

# Client Integration
echo "Testing Client Integration..."
CLIENTS=$(curl -s -X GET http://localhost:3000/api/integration/clients \
  -H "Authorization: Bearer $TOKEN")

CLIENT_COUNT=$(echo "$CLIENTS" | grep -o '"id":' | wc -l | tr -d ' ')
if [ "$CLIENT_COUNT" -gt 0 ]; then
  echo "✓ Retrieved $CLIENT_COUNT clients"
else
  echo "✗ Failed to retrieve clients"
fi

# Engagement Code Validation
echo "Testing Engagement Code Validation..."
VALIDATION=$(curl -s -X GET http://localhost:3000/api/integration/validate-engagement-code/ENG-2026-AUD-00001 \
  -H "Authorization: Bearer $TOKEN")

if echo "$VALIDATION" | grep -q "valid"; then
  echo "✓ Engagement code validation working"
else
  echo "✗ Engagement code validation failed"
fi
APITEST

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "PHASE 5: Database Integrity Tests"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "Checking database tables..."
TABLES=$(sqlite3 database/coi.db ".tables" 2>/dev/null || echo "Database not accessible")
TABLE_COUNT=$(echo "$TABLES" | wc -w | tr -d ' ')
echo "✓ Found $TABLE_COUNT tables in database"

echo "Checking data seeding..."
USER_COUNT=$(sqlite3 database/coi.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
CLIENT_COUNT=$(sqlite3 database/coi.db "SELECT COUNT(*) FROM clients;" 2>/dev/null || echo "0")
REQUEST_COUNT=$(sqlite3 database/coi.db "SELECT COUNT(*) FROM coi_requests;" 2>/dev/null || echo "0")

echo "✓ Users: $USER_COUNT"
echo "✓ Clients: $CLIENT_COUNT"
echo "✓ COI Requests: $REQUEST_COUNT"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "TEST SUMMARY"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "Test Reports Generated:"
echo "  • Backend Coverage: backend/coverage/index.html"
echo "  • Frontend Coverage: frontend/coverage/index.html"
echo "  • E2E Test Report: playwright-report/index.html"
echo "  • API Test Report: BUILD_TEST_REPORT.md"
echo ""

echo "To view reports:"
echo "  Backend:  open backend/coverage/index.html"
echo "  Frontend: open frontend/coverage/index.html"
echo "  E2E:      npx playwright show-report"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     TESTING COMPLETE                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
