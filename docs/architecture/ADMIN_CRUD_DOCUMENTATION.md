# Admin CRUD System Documentation

## 📋 Overview

Sistem Admin CRUD Orland Management menyediakan *god-mode* interface untuk administrator mengelola seluruh aspek platform, termasuk:

- **User Management**: Kelola status pengguna, reset password, filter berdasarkan role
- **Talent Verification**: Approve/reject KYC dan verifikasi talent
- **Project Moderation**: Lihat, edit, dan hapus projects lintas klien
- **Analytics & Reporting**: Dashboard stats, audit logs, dan activity tracking

---

## 🏗️ Architecture

### Backend Stack
- **Framework**: Hono.js on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Cookie-based session (DB_SSO.sessions)
- **Security**: Role-based access control (RBAC)
- **Logging**: Audit trail di DB_LOGS.audit_logs

### Frontend Stack
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Client**: Custom AdminApiClient
- **State** Management: React hooks

### File Structure

```
Backend:
apps/appapi/
├── src/
│   ├── functions/admin/
│   │   └── adminCrudHandler.ts        # All admin endpoints
│   ├── middleware/
│   │   └── authMiddleware.ts          # Auth & role checking
│   └── index.ts                       # Route registration

Frontend:
apps/appadmin/
├── src/
│   ├── pages/users/
│   │   └── index.tsx                  # Admin users management UI
│   ├── lib/
│   │   ├── adminApi.ts               # API client class
│   │   └── adminHelpers.ts           # Utility functions
│   └── components/
│       └── admin/                     # Admin components
```

---

## 🔐 Security

### Access Control

**All admin endpoints require:**
- Valid session cookie (`sid`) from DB_SSO
- User role must be `admin` OR `super_admin`
- Middleware check di `apps/appapi/src/functions/admin/adminCrudHandler.ts`

```typescript
// Middleware protection
app.use('*', requireAdminRole);  // Blocks non-admin users with 403
```

### Data Protection

- **Sensitive fields** tidak dikirim ke frontend (e.g., password hashes)
- **Audit logs** mencatat setiap admin action
- **Session validation** di setiap request
- **CORS** restricted ke domain Orland saja

---

## 📡 API Reference

### Base URL
```
/api/v1/admin/
```

### Authentication
All requests require valid session cookie. No Bearer token needed.

---

## User Management

### GET /api/v1/admin/users
List semua users dengan search, filter, dan pagination.

**Query Parameters:**
```typescript
{
  search?: string;      // Search email, name, phone
  status?: 'active' | 'suspended' | 'deleted' | 'pending';
  role?: 'talent' | 'client' | 'admin' | 'agency' | 'super_admin';
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, max: 100
}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "user_123",
      "email": "talent@example.com",
      "phone": "+6281234567890",
      "name": "John Talent",
      "role": "talent",
      "status": "active",
      "created_at": "2026-04-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

**Example:**
```bash
curl "http://localhost:8787/api/v1/admin/users?search=talent&status=active&limit=20" \
  -H "Cookie: sid=session_token"
```

---

### GET /api/v1/admin/users/:id
Get single user details.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "user_123",
    "email": "talent@example.com",
    "name": "John Talent",
    "role": "talent",
    "status": "active",
    "created_at": "2026-04-08T10:00:00Z",
    "updated_at": "2026-04-09T10:00:00Z",
    "last_login": "2026-04-09T15:30:00Z"
  }
}
```

---

### PATCH /api/v1/admin/users/:id/status
Change user status (Activate, Suspend, Delete).

**Request Body:**
```json
{
  "status": "active" | "suspended" | "deleted",
  "reason": "optional reason for audit trail"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User status changed to suspended",
  "data": {
    "userId": "user_123",
    "newStatus": "suspended"
  }
}
```

**Important:** Cannot change own account status (403 error).

---

### PATCH /api/v1/admin/users/:id/password/reset
Send password reset request to user.

**Request Body:** (empty - no body needed)

**Response:**
```json
{
  "status": "success",
  "message": "Password reset initiated",
  "data": {
    "userId": "user_123",
    "resetToken": "abc123def456...",
    "resetUrl": "/auth/reset-password?token=abc123def456..."
  }
}
```

---

## Talent Verification

### GET /api/v1/admin/talents/pending
List talents awaiting KYC verification.

**Query Parameters:**
```typescript
{
  page?: number;     // Default: 1
  limit?: number;    // Default: 20
}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "talent_456",
      "user_id": "user_789",
      "name": "Jane Talent",
      "email": "jane@example.com",
      "category": "modeling",
      "kyc_status": "pending",
      "kyc_submitted_at": "2026-04-08T10:00:00Z",
      "kyc_verified_at": null,
      "profile_picture_url": "r2://media/talent_456_profile.jpg",
      "created_at": "2026-04-08T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/v1/admin/talents/:id/verify
Approve talent KYC and enable public profile.

**Request Body:**
```json
{
  "approvalNotes": "Profile looks good, KYC verified"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Talent verified and profile enabled",
  "data": {
    "talentId": "talent_456",
    "kycStatus": "verified"
  }
}
```

**Side Effects:**
- Updates `talents.kyc_status` to `'verified'`
- Sets `talents.profile_visible` to `true`
- Updates `users.account_tier` to `'premium'`
- Logs action in `audit_logs`

---

### POST /api/v1/admin/talents/:id/reject
Reject talent KYC and disable profile.

**Request Body:**
```json
{
  "rejectionReason": "KTP photo is unclear"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Talent rejected",
  "data": {
    "talentId": "talent_456",
    "kycStatus": "rejected"
  }
}
```

---

## Project Moderation

### GET /api/v1/admin/projects
List all projects across all clients.

**Query Parameters:**
```typescript
{
  status?: 'active' | 'closed' | 'cancelled';
  search?: string;   // Search by title
  page?: number;     // Default: 1
  limit?: number;    // Default: 20
}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "project_123",
      "title": "Fashion Photoshoot Campaign",
      "category": "photography",
      "status": "active",
      "budget": 5000000,
      "start_date": "2026-04-10T00:00:00Z",
      "end_date": "2026-04-30T23:59:59Z",
      "created_at": "2026-04-08T10:00:00Z",
      "updated_at": "2026-04-09T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### DELETE /api/v1/admin/projects/:id
Delete project (hard delete or soft delete based on implementation).

**Request Body:**
```json
{
  "reason": "fraud" | "inappropriate" | "violation" | "other",
  "details": "Project claims to be major brand but is not"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Project deleted",
  "data": {
    "projectId": "project_123",
    "reason": "fraud"
  }
}
```

---

### PATCH /api/v1/admin/projects/:id/status
Close or cancel project.

**Request Body:**
```json
{
  "status": "closed" | "cancelled",
  "reason": "Client requested cancellation"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Project marked as closed",
  "data": {
    "projectId": "project_123",
    "newStatus": "closed"
  }
}
```

---

## Analytics & Reporting

### GET /api/v1/admin/stats/overview
Get high-level admin dashboard statistics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalUsers": 1250,
    "activeUsers": 980,
    "totalTalents": 450,
    "verifiedTalents": 380,
    "totalProjects": 152
  }
}
```

---

### GET /api/v1/admin/audit-logs
Get recent admin action audit trail.

**Query Parameters:**
```typescript
{
  limit?: number;   // Default: 50, max: 500
}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "log_1",
      "admin_id": "admin_123",
      "action": "user_status_change",
      "target_id": "user_456",
      "target_type": "user",
      "details": {
        "oldStatus": "active",
        "newStatus": "suspended",
        "reason": "Suspicious activity"
      },
      "created_at": "2026-04-09T14:30:00Z"
    }
  ],
  "count": 25
}
```

---

## 🎨 Frontend Implementation

### Admin Users Page

Location: `apps/appadmin/src/pages/users/index.tsx`

**Features:**
- ✅ Search by email, name, phone
- ✅ Filter by status dan role
- ✅ Pagination with configurable page size
- ✅ Batch user selection
- ✅ Change user status (Activate, Suspend, Delete)
- ✅ Reset password
- ✅ Loading states + error handling
- ✅ Responsive Tailwind design

**Usage:**
```typescript
import AdminUsersPage from '@/pages/users';

// In your router/main layout
<Route path="/admin/users" element={<AdminUsersPage />} />
```

---

### API Client Usage

The `AdminApiClient` (in `lib/adminApi.ts`) simplifies API calls:

```typescript
import { adminApi } from '@/lib/adminApi';

// Get users
const result = await adminApi.getUsers({
  search: 'john',
  status: 'active',
  page: 1,
  limit: 20
});

if (result.success) {
  console.log(result.data); // users array
}

// Update user status
const result = await adminApi.updateUserStatus(
  'user_123',
  'suspended',
  'Suspicious activity'
);

// Verify talent
await adminApi.verifyTalent('talent_456', 'Profile approved');

// Get projects
const projects = await adminApi.getProjects({
  status: 'active',
  search: 'campaign'
});

// Get dashboard stats
const stats = await adminApi.getAdminStats();
```

---

### Helper Functions

Utility functions provided in `lib/adminHelpers.ts`:

```typescript
import {
  STATUS_CONFIG,
  ROLE_CONFIG,
  getStatusBadgeClass,
  getRoleBadgeClass,
  canUserPerform,
  formatDate,
  formatDateTime,
  getTimeAgo,
  maskEmail,
  maskPhone,
  exportToCSV
} from '@/lib/adminHelpers';

// Get status color configuration
const config = STATUS_CONFIG['active']; // { label, color, bgColor, ... }

// Check permissions
if (canUserPerform(user.role, 'manage_users')) {
  // Allow action
}

// Format dates
formatDate('2026-04-09T10:00:00Z'); // "9 April 2026"
getTimeAgo('2026-04-09T10:00:00Z'); // "15 minutes ago"

// Mask sensitive data
maskEmail('user@example.com');    // "use***@example.com"
maskPhone('+6281234567890');      // "6281****7890"

// Export data
exportToCSV(usersArray, 'users.csv');
```

---

## 🧪 Testing

### Unit Test Example

```typescript
import { adminApi } from '@/lib/adminApi';

describe('AdminApiClient', () => {
  it('should fetch users with filters', async () => {
    const result = await adminApi.getUsers({
      search: 'john',
      status: 'active'
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should update user status', async () => {
    const result = await adminApi.updateUserStatus(
      'user_123',
      'suspended',
      'Test reason'
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('changed to suspended');
  });

  it('should handle errors gracefully', async () => {
    const result = await adminApi.updateUserStatus(
      'nonexistent',
      'deleted'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] All admin endpoints tested locally
- [ ] Role-based access control verified
- [ ] Audit logs enabled in production
- [ ] Error handling configured
- [ ] Rate limiting applied (if needed)
- [ ] Admin credentials secured

### Environment Variables

Untuk admin, tidak perlu variables tambahan. Semua config sudah ada di:
- `DB_SSO` - Session & user data
- `DB_CORE` - Projects & talents
- `DB_LOGS` - Audit trail

---

## 🔧 Troubleshooting

### Admin Access Denied (403)

**Cause:** User role bukan 'admin' atau  'super_admin'

**Solution:**
1. Verify user role di DB_SSO.users
2. Check session is valid
3. Ensure user_role middleware set correctly

```sql
-- Check user role
SELECT id, email, role FROM users WHERE email = 'admin@example.com';

-- Update role if needed
UPDATE users SET role = 'admin' WHERE id = 'user_123';
```

### Audit Logs Not Recording

**Cause:** DB_LOGS table doesn't exist atau insert fails

**Solution:**
1. Verify audit_logs table exists
2. Check insert privileges
3. Logs are optional (graceful degradation in code)

---

## 📚 Related Documentation

- [Mission Implementation](./MISSION_IMPLEMENTATION.md)
- [API Reference](./MISSION_README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

## 📝 Changelog

### v1.0 (Initial Release)
- ✅ User management (list, update status, reset password)
- ✅ Talent verification (approve/reject KYC)
- ✅ Project moderation (list, delete, update status)
- ✅ Admin dashboard + audit logs
- ✅ Role-based access control
- ✅ Advanced search & filtering
- ✅ Pagination support

---

**Last Updated:** April 9, 2026
**Status:** Production Ready ✅
