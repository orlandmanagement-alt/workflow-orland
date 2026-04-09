# Admin Panel - System Upgrade Checklist

**Version:** 2.0  
**Date:** April 9, 2026  
**Status:** In Progress

---

## Files Status & Upgrade Plan

### Core Files (Sudah Ada)
- ✅ `App.tsx` - Routes setup → **UPGRADE**: Add chat route
- ✅ `AdminLayout.tsx` - Navigation → **UPGRADE**: Add chat menu item, notification bell
- ✅ `Dashboard/index.tsx` - God Mode dashboard → **UPGRADE**: Add live notification stats, chat stats
- ✅ `Users/index.tsx` - User CRM → **VERIFY**: API integration, add chat history filter
- ✅ `Finance/index.tsx` - Treasury → **VERIFY**: Operational, enhance with notification
- ✅ `Projects/index.tsx` - Overwatch → **VERIFY**: API integration
- ✅ `Disputes/index.tsx` - Dispute Center → **VERIFY**: API integration

### New Files to Create
- 🆕 `pages/chat/management.tsx` - **CREATED**: Chat & moderation dashboard
- 🆕 `pages/notifications/index.tsx` - **TODO**: Notification center for admins
- 🆕 `pages/system/health.tsx` - **TODO**: System health & monitoring dashboard
- 🆕 `hooks/useAdminChat.ts` - **TODO**: Chat API hook
- 🆕 `hooks/useAdminNotifications.ts` - **TODO**: Notification API hook
- 🆕 `lib/chatAdminApi.ts` - **TODO**: Chat admin API client
- 🆕 `lib/notificationAdminApi.ts` - **TODO**: Notification admin API client
- 🆕 `components/admin/ChatStats.tsx` - **TODO**: Chat reusable component
- 🆕 `components/admin/NotificationWidget.tsx` - **TODO**: Notification widget

### Enhancement Files
- 📝 `store/useAppStore.ts` - **UPGRADE**: Add notification store, chat store
- 📝 `types/analytics.ts` - **UPGRADE**: Add chat types, notification types
- 📝 `lib/api.ts` - **UPGRADE**: Add admin API endpoints

---

## Upgrade Tasks

### Phase 1: Routes & Navigation
- [ ] Update App.tsx with `/admin/chat` route
- [ ] Update AdminLayout with chat menu item
- [ ] Add notification bell icon to topbar
- [ ] Add quick notification dropdown

### Phase 2: Admin Chat System
- [x] Created chat/management.tsx (already done)
- [ ] Create chat admin API hook
- [ ] Create chat admin API client
- [ ] Create reusable chat stats component

### Phase 3: Notification Center
- [ ] Create notifications/index.tsx page
- [ ] Create notification admin API hook
- [ ] Create reusable notification widget
- [ ] Add notification filtering & search

### Phase 4: System Monitoring
- [ ] Create system/health.tsx page
- [ ] Add real-time health metrics
- [ ] Add system performance charts
- [ ] Add error tracking

### Phase 5: Integration & Stability
- [ ] Update Dashboard with live stats
- [ ] Test all admin APIs
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Test in dark/light mode
- [ ] Verify WebSocket fallback

---

## API Endpoints to Integrate

```
Chat Management:
GET    /api/v1/admin/chats                          ✓
GET    /api/v1/admin/chats/:threadId/messages       ✓
POST   /api/v1/admin/moderate                       ✓
DELETE /api/v1/admin/chats/:threadId                ✓
GET    /api/v1/admin/moderation-logs                ✓
GET    /api/v1/admin/statistics                     ✓

Notifications (to integrate):
GET    /api/v1/admin/notifications                  (new)
GET    /api/v1/admin/notifications/summary          (new)
GET    /api/v1/notifications (for current user)     ✓
PUT    /api/v1/notifications/settings               ✓

System Health (to create):
GET    /api/v1/admin/health/status                  (new)
GET    /api/v1/admin/health/metrics                 (new)
GET    /api/v1/admin/health/logs                    (new)
```

---

## Store Updates Needed

### useAppStore additions:
```typescript
// Notification state
notifications: {
  unreadCount: number
  isLoading: boolean
}

// Chat state
chatStats: {
  activeThreads: number
  totalMessages: number
  averageResponseTime: number
}

// System state
systemHealth: {
  status: 'green' | 'yellow' | 'red'
  uptime: number
  performance: number
}
```

---

## Component Architecture

```
AdminLayout
├── Sidebar (Menu)
│   ├── Dashboard
│   ├── Users
│   ├── Finance
│   ├── Projects
│   ├── Disputes
│   └── Chat ✓ NEW
│       └── Notifications NEW
│       └── System Health NEW
└── Topbar
    ├── Search
    ├── Notification Bell (NEW)
    │   └── Quick Dropdown (NEW)
    └── Settings

Dashboard
├── KPI Cards (current)
├── Activity Chart (current)
├── Incidents Widget (current)
├── Chat Stats Widget (NEW)
├── Live Notifications Widget (NEW)
└── System Health Alert (NEW)

Pages
├── Chat Management ✓ (done)
├── Notification Center (NEW)
├── System Health (NEW)
└── Existing pages remain
```

---

## Current Implementation Summary

### Completed ✅
- Database migrations for chat/notifications
- Message API handler (7 endpoints)
- Notification API handler (7 endpoints)
- Admin chat API handler (6 endpoints)
- Chat UI (appclient messages page)
- Notification settings UI (appclient)
- Admin chat management component ✅

### In Progress 🔄
- Admin panel integration
- Notification admin features
- System health monitoring

### To Do ⏳
- Create remaining admin pages
- API hooks for admin
- Real-time notification polling
- WebSocket fallback
- Error boundaries
- Loading states
- Stability testing

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Chat load time | < 1s | TBD |
| Notification fetch | < 500ms | TBD |
| Dashboard render | < 2s | TBD |
| Real-time update | < 100ms | TBD |
| Error rate | < 0.1% | TBD |

---

## Testing Checklist

- [ ] Admin can load chat management dashboard
- [ ] Admin can filter chats by status
- [ ] Admin can flag messages
- [ ] Admin can delete messages
- [ ] Admin can view moderation logs
- [ ] Admin sees chat statistics
- [ ] Admin can view all system notifications
- [ ] Admin can change notification settings
- [ ] System health page loads
- [ ] All pages work in dark/light mode
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] WebSocket fallback to HTTP works
- [ ] Page navigation is smooth

---

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 2-3 hours for full completion
