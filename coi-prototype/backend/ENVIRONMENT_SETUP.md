# Environment Setup Guide

## Overview

The COI System backend supports multiple environments with separate databases for data isolation. This ensures that load testing and development work don't pollute production data.

## Environments

| Environment | Database File | Load Testing | Use Case |
|------------|---------------|--------------|----------|
| **production** | `database/coi.db` | ❌ Disabled | Production deployment |
| **staging** | `database/coi-staging.db` | ✅ Enabled | Pre-production testing |
| **development** | `database/coi-dev.db` | ✅ Enabled | Local development |
| **test** | `database/coi-test.db` | ✅ Enabled | Automated testing |

## Setting Environment

### Using Environment Variable

```bash
# Production
NODE_ENV=production npm run dev

# Staging
NODE_ENV=staging npm run dev

# Development (default)
NODE_ENV=development npm run dev

# Test
NODE_ENV=test npm run dev
```

### Using .env File

Create a `.env` file in `coi-prototype/backend/`:

```bash
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:5173
```

## Load Testing

Load testing is **automatically disabled in production** for safety. It's only available in:
- Staging
- Development  
- Test

### Endpoints

- `POST /api/admin/load-test` - Run load simulation (staging/dev/test only)
  - Body: `{ requestCount: 100, userCount: 10 }`
  - Returns: Performance metrics and noise reduction stats

- `DELETE /api/admin/load-test/cleanup` - Clean up test data (staging/dev/test only)
  - Removes all `LOAD-TEST-*` entries from the database

- `GET /api/admin/noise-stats` - Get notification noise reduction statistics
  - Query: `?days=7` (optional, default 7)

### Example: Running Load Test

```bash
# In staging/development environment
curl -X POST http://localhost:3000/api/admin/load-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"requestCount": 1000, "userCount": 50}'
```

### Example: Cleanup

```bash
curl -X DELETE http://localhost:3000/api/admin/load-test/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Analytics Endpoints

Separate analytics endpoints provide clean business intelligence:

### Business Analytics (Production Data Only)

`GET /api/admin/analytics/business`

Returns business metrics excluding all test data:
- Total requests (production only)
- Active clients
- Recent activity (last 30 days)
- Breakdown by status
- Breakdown by service type

### Performance Analytics (All Data)

`GET /api/admin/analytics/performance`

Returns system performance metrics including test data:
- Total requests (all)
- Production vs test request counts
- Database statistics
- Useful for capacity planning

## Database Separation

Each environment uses a separate database file:

```
database/
  ├── coi.db              # Production
  ├── coi-staging.db      # Staging
  ├── coi-dev.db          # Development
  └── coi-test.db         # Test
```

### Benefits

1. **Production Safety**: Load testing cannot affect production data
2. **Clean Analytics**: Business reports exclude all test data automatically
3. **Flexible Testing**: Can test system capacity without risk
4. **BI-Ready**: Analytics data is clean and accurate

## Automatic Test Data Filtering

In production, all report queries automatically exclude test data:

- Reports: `WHERE request_id NOT LIKE 'LOAD-TEST-%'`
- Analytics: Business metrics exclude test data by default
- Performance metrics: Can include test data for capacity planning

## Migration Path

1. **Development**: Use `NODE_ENV=development` (default)
   - Database: `coi-dev.db`
   - Load testing: Enabled

2. **Staging**: Use `NODE_ENV=staging`
   - Database: `coi-staging.db`
   - Load testing: Enabled
   - Test production-like scenarios

3. **Production**: Use `NODE_ENV=production`
   - Database: `coi.db`
   - Load testing: Disabled (automatic)
   - Clean analytics by default

## Troubleshooting

### Load Testing Returns 403 in Production

This is expected behavior. Load testing is disabled in production for safety. Use staging or development environment.

### Reports Include Test Data

Check your environment:
- Production: Test data is automatically excluded
- Staging/Dev: Test data may appear (expected for testing)

### Database Not Found

The database file is created automatically on first run. Ensure the `database/` directory exists and is writable.

## Best Practices

1. **Always use staging for load testing** before production deployment
2. **Clean up test data regularly** in staging/dev environments
3. **Use production environment** only for real business data
4. **Monitor analytics endpoints** to ensure clean data separation
5. **Backup production database** before any major changes
