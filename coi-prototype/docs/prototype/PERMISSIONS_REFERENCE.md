# Permissions Reference Guide

## Overview

The COI System uses a dynamic, role-based permission system that allows fine-grained control over user access. Permissions are configurable through the Permission Configuration UI (Super Admin only) and are enforced at both frontend and backend levels.

## Permission System Architecture

### Components

1. **Permissions Table**: Catalog of all available permissions
2. **Role Permissions Table**: Maps permissions to roles
3. **Permission Audit Log**: Tracks all permission changes
4. **Permission Service**: Backend service for permission checks
5. **Permission Composable**: Frontend composable for component-level checks
6. **Permission Middleware**: Backend middleware for route protection

### Permission Key Format

Permissions use a dot-notation format: `category.action.scope`

Examples:
- `email.config.view` - View email configuration
- `requests.approve.director` - Approve requests as Director
- `users.create` - Create users

## Complete Permission List

### Configuration Permissions

| Permission Key | Name | Description | Default Roles |
|---------------|------|-------------|---------------|
| `email.config.view` | View Email Configuration | View email configuration settings | Admin, Super Admin |
| `email.config.edit` | Edit Email Configuration | Edit email configuration settings | Admin, Super Admin |
| `email.config.test` | Test Email Configuration | Test email configuration | Admin, Super Admin |
| `sla.config.view` | View SLA Configuration | View SLA configuration settings | Admin, Compliance, Super Admin |
| `sla.config.edit` | Edit SLA Configuration | Edit SLA configuration settings | Super Admin |
| `priority.config.view` | View Priority Configuration | View priority scoring configuration | Admin, Super Admin |
| `priority.config.edit` | Edit Priority Configuration | Edit priority scoring configuration | Super Admin |

### User Management Permissions

| Permission Key | Name | Description | Default Roles |
|---------------|------|-------------|---------------|
| `users.create` | Create Users | Create new users | Super Admin |
| `users.edit` | Edit Users | Edit existing users | Super Admin |
| `users.disable` | Disable Users | Disable or enable users | Super Admin |
| `users.view` | View Users | View user list | Super Admin |

### System Permissions

| Permission Key | Name | Description | Default Roles |
|---------------|------|-------------|---------------|
| `system.edition.switch` | Switch Edition | Switch between Standard and Pro editions | Super Admin |
| `system.audit.view` | View Audit Logs | View system audit logs | Super Admin |
| `system.config.view` | View System Configuration | View system configuration | Admin, Super Admin |
| `permissions.manage` | Manage Permissions | Manage role-based permissions | Super Admin |

### Request Permissions

| Permission Key | Name | Description | Default Roles |
|---------------|------|-------------|---------------|
| `requests.create` | Create COI Requests | Create new COI requests | Requester, Director |
| `requests.approve.director` | Approve as Director | Approve requests as Director | Director |
| `requests.approve.compliance` | Approve as Compliance | Approve requests as Compliance | Compliance |
| `requests.approve.partner` | Approve as Partner | Approve requests as Partner | Partner |
| `requests.generate.code` | Generate Engagement Codes | Generate engagement codes | Finance |
| `requests.execute` | Execute Proposals | Execute proposals | Admin |
| `requests.view.all` | View All Requests | View requests across all departments | Admin, Compliance, Director, Partner, Finance, Super Admin |

## Default Permission Sets by Role

### Super Admin

**All permissions granted by default**

Super Admin has access to all permissions in the system. This cannot be modified.

### Admin

- **Configuration**: View/edit email config, view SLA/priority config
- **Requests**: Execute proposals, view all requests
- **System**: View system configuration

**Cannot**:
- Manage users
- Switch editions
- Edit SLA/priority config
- Manage permissions

### Compliance

- **Configuration**: View SLA config
- **Requests**: Approve as Compliance, view all requests

**Cannot**:
- View commercial data (financial_parameters, engagement_code, total_fees)
- Edit configurations
- Approve at other levels

### Director

- **Requests**: Create requests, approve as Director, view all requests

**Cannot**:
- Access configuration tools
- Approve at Compliance/Partner level
- Generate engagement codes

### Partner

- **Requests**: Approve as Partner, view all requests

**Cannot**:
- Create requests
- Access configuration tools
- Approve at other levels

### Finance

- **Requests**: Generate engagement codes, view all requests

**Cannot**:
- Create requests
- Approve requests
- Access configuration tools

### Requester

- **Requests**: Create requests

**Cannot**:
- View other users' requests
- Approve requests
- Access any configuration tools

## Permission Inheritance Rules

1. **Super Admin**: Always has all permissions (cannot be revoked)
2. **Explicit Grants**: Permissions explicitly granted to a role take precedence
3. **Explicit Denials**: Permissions explicitly denied override defaults
4. **Default Deny**: If no permission is found, access is denied (fail-closed)

## Using Permissions in Code

### Backend

#### Route Protection

```javascript
import { requirePermission } from '../middleware/auth.js'

// Protect route with permission
router.get('/config', authenticateToken, requirePermission('email.config.view'), getConfig)
```

#### Service-Level Checks

```javascript
import { checkPermission } from '../services/permissionService.js'

if (!checkPermission(userRole, 'email.config.edit')) {
  throw new Error('Insufficient permissions')
}
```

### Frontend

#### Component-Level Checks

```vue
<script setup>
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, hasAnyPermission } = usePermissions()
</script>

<template>
  <button v-if="hasPermission('email.config.edit')">Edit Config</button>
  
  <div v-if="hasAnyPermission(['requests.approve.director', 'requests.approve.compliance'])">
    Approval Section
  </div>
</template>
```

#### Route Guards

```typescript
import { usePermissions } from '@/composables/usePermissions'

const { canAccess } = usePermissions()

// In router guard
if (!canAccess(route)) {
  // Redirect or show error
}
```

## Permission Management

### Adding New Permissions

1. **Add to Database**: Insert into `permissions` table
2. **Grant to Roles**: Add entries to `role_permissions` table
3. **Update Documentation**: Add to this reference guide
4. **Update Seed Function**: Add to `seedDefaultPermissions()` in `init.js`

### Granting/Revoking Permissions

**Via UI** (Super Admin only):
1. Navigate to Permission Configuration (`/coi/admin/permission-config`)
2. Use the permission matrix to toggle permissions
3. Changes are logged in audit trail

**Via API**:
```javascript
// Grant permission
POST /api/permissions/grant
{
  "role": "Admin",
  "permission_key": "email.config.edit"
}

// Revoke permission
POST /api/permissions/revoke
{
  "role": "Admin",
  "permission_key": "email.config.edit",
  "reason": "Temporary restriction"
}
```

## Permission Audit Trail

All permission changes are logged in `permission_audit_log` table with:
- Role affected
- Permission changed
- Action (granted/revoked)
- Changed by (user ID)
- Timestamp
- Optional reason

View audit log via:
- UI: Permission Configuration page
- API: `GET /api/permissions/audit-log`

## Migration from Hardcoded Permissions

The system maintains backward compatibility during migration:

1. **Phase 1**: Permissions seeded, old role checks still work
2. **Phase 2**: New routes use `requirePermission()`
3. **Phase 3**: Components migrate to `usePermissions()` composable
4. **Phase 4**: All hardcoded checks replaced

## Best Practices

1. **Fail Closed**: Default to denying access if permission not found
2. **Explicit Checks**: Always check permissions explicitly, don't assume
3. **Audit Everything**: All permission changes are logged
4. **Document Changes**: Update this reference when adding permissions
5. **Test Permissions**: Verify permissions work for all roles
6. **Super Admin Protection**: Never allow revoking Super Admin permissions

## Troubleshooting

### Permission Not Working

1. Check if permission exists in database: `SELECT * FROM permissions WHERE permission_key = ?`
2. Check if role has permission: `SELECT * FROM role_permissions WHERE role = ? AND permission_key = ?`
3. Verify Super Admin status (has all permissions)
4. Check frontend cache (permissions cached for 5 minutes)
5. Review audit log for recent changes

### Permission Check Returns False

- Verify permission key spelling (case-sensitive)
- Check role name matches exactly
- Ensure permission is granted (not just exists)
- Clear frontend cache if needed

### Super Admin Cannot Access

- Super Admin should have all permissions automatically
- Check if user role is exactly "Super Admin" (case-sensitive)
- Verify authentication token includes correct role

## Related Files

- `backend/src/services/permissionService.js` - Permission service
- `backend/src/middleware/auth.js` - Auth middleware with `requirePermission()`
- `frontend/src/composables/usePermissions.ts` - Permission composable
- `frontend/src/views/PermissionConfig.vue` - Permission configuration UI
- `database/migrations/20260126_permissions.sql` - Permission tables migration
- `.cursor/agents/permission-auditor.md` - Permission audit subagent

## Support

For permission-related issues:
1. Check this reference guide
2. Review audit log for changes
3. Use permission-auditor subagent for automated checks
4. Contact Super Admin for permission grants
