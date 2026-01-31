# Database Status

**Date:** January 2026

---

## Current Database Configuration

### Database Type
- **Type:** SQLite
- **Driver:** better-sqlite3
- **Location:** `database/` directory

### Active Database File

Based on environment configuration:

- **Environment:** `development` (default when NODE_ENV not set)
- **Database File:** `database/coi-dev.db`
- **Size:** 7.2 MB
- **Last Modified:** January 21, 2026 16:39

### Database Selection Logic

The system uses `backend/src/config/environment.js` to determine which database file to use:

| Environment | Database File |
|-------------|---------------|
| `production` | `coi.db` |
| `staging` | `coi-staging.db` |
| `development` | `coi-dev.db` (default) |
| `test` | `coi-test.db` |

### Available Database Files

Found in `database/` directory:

1. **coi-dev.db** (7.2 MB) - Development database (currently active)
2. **coi.db** (6.4 MB) - Production database
3. **coi-test.db** (196 KB) - Test database
4. **coi_before_restore_backup.db** (748 KB) - Backup
5. **coi_with_new_tables.db** (772 KB) - Migration backup
6. **coi_prototype.db** (0 B) - Empty file

---

## Database Path

The database path is constructed as:
```
{project_root}/database/{database_name}
```

Example for development:
```
/Users/jestinissac/Documents/Envision PRMS/coi-prototype/database/coi-dev.db
```

---

## How to Check Which Database is Running

1. **Check NODE_ENV:**
   ```bash
   echo $NODE_ENV
   ```

2. **Check database file:**
   ```bash
   ls -lh database/coi-dev.db
   ```

3. **Check if database is locked (in use):**
   ```bash
   lsof database/coi-dev.db
   ```

4. **Query database directly:**
   ```bash
   sqlite3 database/coi-dev.db "SELECT COUNT(*) FROM users;"
   ```

---

## Database Connection

The database is initialized in:
- **File:** `backend/src/database/init.js`
- **Function:** `getDatabase()`
- **Initialization:** `initDatabase()`

Connection is established when backend starts and remains open for the lifetime of the process.

---

## Summary

**Currently Running Database:**
- ✅ **Type:** SQLite
- ✅ **File:** `database/coi-dev.db`
- ✅ **Environment:** development
- ✅ **Status:** Active (7.2 MB, last modified Jan 21)
