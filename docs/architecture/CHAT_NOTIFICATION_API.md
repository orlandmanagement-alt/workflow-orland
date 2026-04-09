# Chat & Notification System - Complete API Documentation

**Version:** 1.0  
**Last Updated:** April 9, 2026  
**Status:** Production Ready

---

## Table of Contents
1. [Overview](#overview)
2. [Chat API](#chat-api)
3. [Notification API](#notification-api)
4. [Admin API](#admin-api)
5. [Error Handling](#error-handling)
6. [Response Format](#response-format)

---

## Overview

### Base URL
```
https://api.orlandmanagement.com/api/v1
```

### Authentication
All endpoints require valid session cookie (`sid`) in HTTP-only cookie.

### Notification Types
- `message` - New chat messages
- `project` - Project updates & assignments
- `talent` - Talent requests & approvals
- `booking` - Booking confirmations
- `payment` - Payment & invoice notifications
- `system` - System announcements
- `schedule` - Appointment reminders

---

## Chat API

### GET /messages/threads
Get all message threads for the current user.

**Query Parameters:**
- `limit` (optional): Number of threads (default: 50, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "thread_id": "THREAD-1234567890-abc123",
      "project_id": "PROJ-001",
      "client_id": "CLIENT-001",
      "talent_id": "TALENT-001",
      "subject": "TVC Glow Soap Production",
      "is_archived": 0,
      "created_at": "2026-04-01T10:00:00Z",
      "last_message_at": "2026-04-09T15:30:00Z",
      "message_count": 25,
      "unread_count": 3,
      "last_message": "Kostum sudah siap untuk hari Kamis"
    }
  ]
}
```

---

### POST /messages/threads
Create a new message thread.

**Request Body:**
```json
{
  "project_id": "PROJ-001",
  "client_id": "CLIENT-001",
  "talent_id": "TALENT-001",
  "subject": "Project Discussion"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thread_id": "THREAD-1234567890-abc123"
  }
}
```

**Notes:**
- If thread already exists for this client-talent-project combination, returns existing thread_id
- Subject optional (defaults to "Project Discussion")

---

### GET /messages/:threadId
Get all messages in a thread. Auto-marks messages as read.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 500)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "thread": {
      "thread_id": "THREAD-1234567890-abc123",
      "project_id": "PROJ-001",
      "client_id": "CLIENT-001",
      "talent_id": "TALENT-001",
      "subject": "TVC Glow Soap Production",
      "is_archived": 0,
      "message_count": 25
    },
    "messages": [
      {
        "message_id": "MSG-1234567890-abc123",
        "thread_id": "THREAD-1234567890-abc123",
        "sender_id": "USER-001",
        "sender_role": "client",
        "recipient_id": "USER-002",
        "body": "Halo, apa kabar?",
        "is_read": 1,
        "is_deleted": 0,
        "attachment_url": null,
        "attachment_type": null,
        "created_at": "2026-04-09T10:00:00Z"
      }
    ]
  }
}
```

---

### POST /messages
Send a new message in a thread. Automatically creates notification for recipient.

**Request Body:**
```json
{
  "thread_id": "THREAD-1234567890-abc123",
  "recipient_id": "USER-002",
  "body": "Pesan kami untuk talent ini",
  "attachment_url": "https://r2.url/file.pdf",
  "attachment_type": "pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "MSG-1234567890-abc123",
    "thread_id": "THREAD-1234567890-abc123"
  }
}
```

**Validation:**
- `body`: Required, 1-4000 characters
- `attachment_type`: One of `image|pdf|video|other`
- Notifications auto-created for recipient

---

### PUT /messages/:messageId
Edit a message (only within 5 minutes of sending).

**Request Body:**
```json
{
  "body": "Pesan yang sudah diedit"
}
```

**Response:**
```json
{
  "success": true
}
```

**Constraints:**
- Only sender can edit
- Must be within 5 minutes of creation

---

### DELETE /messages/:messageId
Soft delete a message (preserves audit trail).

**Response:**
```json
{
  "success": true
}
```

**Constraints:**
- Only sender can delete
- Marked as is_deleted=1, not actually removed

---

### POST /messages/threads/:threadId/archive
Archive a thread (hides from main list).

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Archived threads don't appear in GET /messages/threads by default
- Can still be accessed by direct ID

---

## Notification API

### GET /notifications
Get notifications for current user.

**Query Parameters:**
- `limit` (optional): Default 50, max 100
- `offset` (optional): Pagination offset
- `type` (optional): Filter by notif_type (message|project|talent|booking|payment|system|schedule)

**Response:**
```json
{
  "success": true,
  "unread_count": 5,
  "data": [
    {
      "notif_id": "NOTIF-1234567890-abc123",
      "user_id": "USER-001",
      "notif_type": "message",
      "title": "Pesan baru",
      "message": "Sarah: Kostum sudah siap...",
      "related_entity_id": "MSG-001",
      "related_entity_type": "message",
      "is_read": 0,
      "action_url": "/messages/THREAD-001",
      "priority": "normal",
      "created_at": "2026-04-09T15:30:00Z",
      "read_at": null
    }
  ]
}
```

---

### PUT /notifications/:notifId/read
Mark a specific notification as read.

**Response:**
```json
{
  "success": true
}
```

---

### PUT /notifications/read-all
Mark all unread notifications as read.

**Response:**
```json
{
  "success": true
}
```

---

### GET /notifications/settings
Get user's notification preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "setting_id": "NOTIF-SETTINGS-001",
    "user_id": "USER-001",
    "msg_enabled": 1,
    "msg_via_email": 1,
    "msg_via_push": 1,
    "msg_sound": 1,
    "project_enabled": 1,
    "project_updates": 1,
    "project_assignments": 1,
    "project_via_email": 1,
    "project_via_push": 1,
    "talent_request_enabled": 1,
    "talent_approval_enabled": 1,
    "talent_via_email": 1,
    "talent_via_push": 1,
    "payment_enabled": 1,
    "invoice_enabled": 1,
    "payment_via_email": 1,
    "payment_via_push": 1,
    "booking_enabled": 1,
    "booking_via_email": 1,
    "booking_via_push": 1,
    "system_enabled": 1,
    "system_urgent_only": 0,
    "schedule_reminder_24h": 1,
    "schedule_reminder_1h": 1,
    "schedule_via_email": 0,
    "schedule_via_push": 1,
    "schedule_via_sms": 0,
    "quiet_hours_enabled": 1,
    "quiet_hours_start": "21:00",
    "quiet_hours_end": "09:00",
    "updated_at": "2026-04-01T10:00:00Z"
  }
}
```

**Note:** If user has no settings, default settings are created automatically.

---

### PUT /notifications/settings
Update user's notification preferences.

**Request Body:** (send only fields you want to update)
```json
{
  "msg_enabled": 1,
  "msg_via_email": 0,
  "msg_sound": 1,
  "quiet_hours_enabled": 1,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### GET /notifications/summary
Get summary of notifications grouped by type.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "notif_type": "message",
      "total": 25,
      "unread": 3,
      "urgent": 0
    },
    {
      "notif_type": "project",
      "total": 12,
      "unread": 1,
      "urgent": 1
    }
  ]
}
```

---

### DELETE /notifications/:notifId
Delete a notification.

**Response:**
```json
{
  "success": true
}
```

---

## Admin API

**Required:** `userRole` must be `admin`. All endpoints return 403 Forbidden if not admin.

### GET /admin/chats
Get all chats across platform with filtering.

**Query Parameters:**
- `search` (optional): Search in subject or thread_id
- `user_id` (optional): Filter by user participation
- `project_id` (optional): Filter by project
- `flagged_only` (optional): 0|1, show only flagged
- `status` (optional): all|active|archived|flagged
- `start_date` (optional): ISO date for filtering
- `end_date` (optional): ISO date for filtering
- `limit` (optional): Default 50, max 100
- `offset` (optional): Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "thread_id": "THREAD-1234567890-abc123",
      "project_id": "PROJ-001",
      "client_id": "CLIENT-001",
      "talent_id": "TALENT-001",
      "subject": "TVC Production",
      "is_archived": 0,
      "created_at": "2026-04-01T10:00:00Z",
      "last_message_at": "2026-04-09T15:30:00Z",
      "message_count": 25,
      "flagged_count": 2
    }
  ]
}
```

---

### GET /admin/chats/:threadId/messages
Get detailed view of a specific thread (including deleted messages).

**Query Parameters:**
- `limit` (optional): Default 100
- `offset` (optional): Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "thread": {
      "thread_id": "THREAD-001",
      "subject": "TVC Production"
    },
    "messages": [
      {
        "message_id": "MSG-001",
        "sender_id": "USER-001",
        "body": "Message content",
        "is_deleted": 0,
        "created_at": "2026-04-09T10:00:00Z",
        "moderation_count": 0
      }
    ],
    "moderation": [
      {
        "moderation_id": "MOD-001",
        "message_id": "MSG-001",
        "action_taken": "flagged",
        "reason": "Inappropriate content",
        "created_at": "2026-04-09T15:00:00Z"
      }
    ]
  }
}
```

---

### POST /admin/moderate
Apply moderation action to a message.

**Request Body:**
```json
{
  "message_id": "MSG-001",
  "action": "delete",
  "reason": "Spam or inappropriate content",
  "admin_notes": "Optional admin-only notes about this action"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moderation_id": "MOD-1234567890-abc123"
  }
}
```

**Actions:**
- `flag` - Mark for review (visible to admins)
- `delete` - Soft delete message
- `suspend` - Flag for user suspension (future feature)

---

### DELETE /admin/chats/:threadId
Delete entire chat thread (soft delete all messages + archive).

**Response:**
```json
{
  "success": true
}
```

**Note:** Creates moderation log entry for audit trail.

---

### GET /admin/moderation-logs
Get all moderation actions taken.

**Query Parameters:**
- `action` (optional): Filter by action_taken (flag|delete|suspend)
- `limit` (optional): Default 50, max 100
- `offset` (optional): Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "moderation_id": "MOD-001",
      "message_id": "MSG-001",
      "thread_id": "THREAD-001",
      "flagged_by": "ADMIN-001",
      "reason": "Spam",
      "action_taken": "deleted",
      "admin_notes": "User warned before",
      "created_at": "2026-04-09T15:00:00Z"
    }
  ]
}
```

---

### GET /admin/statistics
Get chat platform statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "active_threads": 150,
    "total_threads": 480,
    "total_messages": 12450,
    "total_moderation_actions": 45,
    "deleted_messages": 30,
    "flagged_messages": 15
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Description of what went wrong",
  "status": 400
}
```

### Common Error Codes
| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body and parameters |
| 401 | Unauthorized | Ensure valid session cookie exists |
| 403 | Forbidden | Admin endpoints require admin role |
| 404 | Not Found | Resource doesn't exist or access denied |
| 500 | Server Error | Contact support |

### Specific Errors
- `"Thread not found or access denied"` - User doesn't have access to this thread
- `"Message not found or too old to edit"` - Edit window (5 min) expired
- `"Cannot delete other users messages"` - Only sender can delete
- `"Unauthorized: Sesi tidak ditemukan"` - Missing or invalid session cookie

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Pagination
All list endpoints support:
```json
{
  "success": true,
  "data": [...]
}
```

Use `limit` and `offset` query parameters for pagination.

### Timestamps
All timestamps are ISO 8601 format with UTC timezone:
```
2026-04-09T15:30:00Z
```

---

## Rate Limiting
- Recommended: Fetch threads every 5 seconds
- Recommended: Fetch messages every 3 seconds
- No strict rate limit, but use reasonable intervals

---

## Integration Examples

### Send a Message with React/Axios
```typescript
const sendMessage = async (threadId: string, body: string) => {
  const response = await axios.post(
    'https://api.orlandmanagement.com/api/v1/messages',
    {
      thread_id: threadId,
      recipient_id: 'USER-002',
      body: body,
    },
    { withCredentials: true } // Important for cookies
  );
  return response.data;
};
```

### Get User Notification Settings
```typescript
const getSettings = async () => {
  const response = await axios.get(
    'https://api.orlandmanagement.com/api/v1/notifications/settings',
    { withCredentials: true }
  );
  return response.data.data;
};
```

### Admin: Moderate a Message
```typescript
const moderateMessage = async (messageId: string) => {
  const response = await axios.post(
    'https://api.orlandmanagement.com/api/v1/admin/moderate',
    {
      message_id: messageId,
      action: 'delete',
      reason: 'Spam detected',
    },
    { withCredentials: true }
  );
  return response.data;
};
```

---

## Changelog

### v1.0 (2026-04-09) - Initial Release
- Chat messaging API (7 endpoints)
- Notification API (7 endpoints)
- Admin moderation API (6 endpoints)
- User notification preferences
- Moderation audit logging
- Full test coverage

---

**For support or questions, contact:** dev@orlandmanagement.com
