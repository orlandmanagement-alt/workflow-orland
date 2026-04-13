## Agency Dashboard Implementation Guide

### Overview

The Agency Dashboard is a complete React + TypeScript application for managing talents, handling client inquiries, tracking analytics, and managing agency settings. This guide covers all components, architecture, and integration points.

---

## Architecture

### Component Structure

```
App.tsx (Router)
├── Login.tsx (Public)
├── Onboarding.tsx (Public)
└── MainLayout.tsx (Protected)
    ├── Dashboard.tsx
    ├── Roster.tsx
    │   └── [TalentDetail.tsx]
    ├── Inbox.tsx
    │   └── [InquiryDetail.tsx]
    ├── Analytics.tsx
    └── Settings.tsx
```

### State Management

**AuthContext (from authMiddlewareExtended.tsx):**
- `user` - Current authenticated user
- `loading` - Auth loading state
- `currentViewAs` - Impersonation state (talentId, talentName)
- `switchToTalent()` - Enable impersonation
- `clearImpersonation()` - Disable impersonation

**Component State:**
- Each page manages its own form/filter state with `useState`
- Data filtering/sorting with `useMemo` for performance

---

## File Descriptions

### Core App Files

#### App.tsx
- **Purpose:** Main application router
- **Routes:**
  - `/login` → Login page
  - `/onboarding` → Onboarding flow
  - `/dashboard` → Main dashboard (protected)
  - `/roster` → Talent roster (protected)
  - `/talent/new` → Create talent (protected)
  - `/talent/:id` → Edit talent (protected)
  - `/inbox` → Inquiry inbox (protected)
  - `/inbox/:id` → Inquiry detail (protected)
  - `/analytics` → Analytics (protected)
  - `/settings` → Settings (protected)
- **Features:**
  - Uses `AuthProviderExtended` for auth state
  - Uses `ProtectedRouteExtended` for role-based routing
  - Redirects to `/login` if not authenticated
  - Redirects to `/onboarding` if first-time user

#### main.tsx
- **Purpose:** React entry point
- **Function:** Mounts React app to DOM root element
- **Error Handling:** Throws if root element not found

#### index.css
- **Purpose:** Global Tailwind CSS imports and custom utilities
- **Includes:**
  - Tailwind base, components, utilities
  - Custom animations (pulse-slow, line-clamp-2/3)
  - Scrollbar styling
  - Focus states
  - Badge and card utilities
  - Loading spinner

#### App.css
- **Purpose:** App-specific component styles
- **Includes:**
  - Navigation styles (nav-link, nav-badge)
  - Status indicators (status-dot with colors)
  - Card styles (stat-card, talent-card)
  - Form styles (form-input, form-label, form-error)
  - Tab styles (tabs, tab-button)
  - Button styles (btn, btn-primary, btn-secondary, etc.)
  - Toast notifications
  - Loading skeleton
  - Empty state styles

### Layout

#### MainLayout.tsx (280 lines)
**Purpose:** Main wrapper for protected pages
**Components:**
- **Sidebar:**
  - Fixed on desktop (lg:), collapsible mobile
  - 5 menu items: Dashboard, Roster, Inbox, Analytics, Settings
  - User profile section (name, email, logout)
  - Gradient background (slate-900 to slate-800)

- **Top Bar:**
  - Hamburger menu on mobile
  - Greeting: "Halo, {firstName}!"
  - Notification bell
  - Help button

- **ImpersonationHeader:**
  - Shows when impersonating talent
  - Display: "Viewing as [Talent Name]"
  - Exit button to clear impersonation

**Props:**
```typescript
children: React.ReactNode
```

**Usage:**
```tsx
<MainLayout>
  <Dashboard />
</MainLayout>
```

### Pages

#### Dashboard.tsx (400 lines)
**Purpose:** Main dashboard overview with KPIs and recent activity
**Components:**
- **Stat Cards (4):**
  - Total Talents: 12 (↑ 25%)
  - Active Talents: 10 (↑ 10%)
  - New Inquiries: 3 (↑ 15%)
  - Commission This Month: Rp 18.75M (↑ 8%)

- **Recent Inquiries:**
  - Lists 3 latest inquiries
  - Status indicators (blue=new, green=replied, yellow=negotiating)
  - Click to go to inquiry detail

- **Quick Actions:**
  - Pending Profiles notification
  - Support contact card
  - Earnings progress bar
  - Top performer badge

- **Performance Chart:**
  - Shows 3 talents with metrics
  - Bookings, rating, commission per talent

**Sample Data:**
```typescript
const talents = [
  { name: 'Budi Santoso', bookings: 8, rating: 4.8, commission: 45000000 },
  { name: 'Ella Singh', bookings: 12, rating: 4.9, commission: 62000000 },
  { name: 'Citra Dewi', bookings: 6, rating: 4.7, commission: 38000000 },
]
```

#### Roster.tsx (380 lines)
**Purpose:** Manage talent roster with filtering and sorting
**Features:**
- **Filtering:**
  - By status (all, active, pending_review, draft, archived)
  - By search (name or email)

- **Sorting:**
  - By name, earnings (desc), rating (desc), recent

- **Talent Cards:**
  - Status badge (color-coded)
  - Stats: bookings, rating, commission
  - Lock indicators (portfolio, pricing)
  - Independent login status
  - Edit button
  - "Lihat Sebagai" button (impersonate)

- **Grid:**
  - 1 col mobile, 2 col tablet, 3 col desktop
  - Hover effects

**Sample Data:**
```typescript
const talents = [
  {
    id: '1',
    name: 'Budi Santoso',
    status: 'active',
    bookings: 8,
    rating: 4.8,
    commission: 45000000,
    portfolio_locked: false,
    price_locked: false,
    independent_login: false,
  },
  // ...
]
```

#### TalentDetail.tsx (380 lines)
**Purpose:** Create or edit talent profile
**Modes:**
- `mode="create"` - Create new talent
- `mode="edit"` - Edit existing talent (prefilled with data)

**Tabs:**
1. **Basic Tab:**
   - Name (text input)
   - Email (email input)
   - Category (select - 8 options)
   - Location (text input)
   - Bio (textarea)

2. **Settings Tab:**
   - Allow independent login (checkbox)
   - Lock portfolio editing (checkbox)
   - Lock price negotiation (checkbox)

3. **Portfolio Tab:**
   - Media upload placeholder
   - Availability days (checkboxes for each day)

4. **Pricing Tab:**
   - Minimum rate (Rp 10M default)
   - Maximum rate (Rp 50M default)
   - Commission calculation display (15% agency, 85% talent)

**Categories:**
```typescript
const categories = [
  'content_creator',
  'influencer',
  'model',
  'actor',
  'musician',
  'photographer',
  'videographer',
  'other',
]
```

**Form Submission:**
- Create mode: `POST /api/talent` → navigate to `/roster`
- Edit mode: `PUT /api/talent/:id` → navigate to `/roster`

#### Inbox.tsx (350 lines)
**Purpose:** Manage client inquiries
**Features:**
- **Stats Cards (3):**
  - New Inquiries: 3
  - Replied: 2
  - Negotiating: 1

- **Filtering:**
  - By status (all, new, replied, negotiating, declined, accepted)
  - By search (talent, client, project)

- **Sorting:**
  - Recent, oldest, budget_high, budget_low

- **Inquiry Cards:**
  - Status dot (animated if new)
  - Project title, talent name, client name
  - Message preview (line-clamped 2 lines)
  - Budget amount
  - Date and arrow
  - Click to open detail

**Sample Data:**
```typescript
const inquiries = [
  {
    id: 'inq_1',
    talent_name: 'Budi Santoso',
    client_name: 'PT Mitra Digital',
    project_name: 'Premium Content Creator',
    message: 'Kami butuh content creator profesional untuk campaign...',
    budget: 50000000,
    status: 'new',
    created_at: new Date().toISOString(),
  },
  // ...
]
```

#### InquiryDetail.tsx (210 lines)
**Purpose:** View inquiry and reply to client
**Sections:**
- **Header:**
  - Project title
  - From: {client_name}
  - Status badge

- **Info Grid:**
  - Budget Klien
  - Rate Talent
  - Komisi Agency (15% calculated)

- **Client Message:**
  - Display original message
  - Timestamp

- **Reply Section:**
  - Reply textarea
  - "Kirim Balasan" button
  - "Batal" button

- **Action Buttons:**
  - "Arahkan ke Talent" (forward if independent login enabled)
  - "Tolak Inquiry" (decline)

**Navigation:**
- Back button → `/inbox`

#### Analytics.tsx (140 lines)
**Purpose:** View agency performance metrics
**KPI Cards (4):**
- Total Revenue: Rp 225M (↑ 12%)
- Total Booking: 26 (↑ 8%)
- Avg Rating: 4.8⭐ (↑ 0.2)
- Response Rate: 95% (↑ 5%)

**Charts (Placeholders):**
- Revenue Trend (6 months) - h-64
- Talent Performance - h-64
- *Ready for Recharts integration*

**Top Talents Table:**
- Lists 3 top talents
- Shows: Name, bookings, rating, commission
- Hover effects

#### Settings.tsx (380 lines)
**Purpose:** Manage agency settings
**Tabs:**

1. **Account Tab:**
   - Company name
   - Email (read-only disabled)
   - Phone number
   - Address (textarea)

2. **Billing Tab:**
   - Payment methods section
   - Invoice history table (2 samples)
   - Column: invoice#, date, amount, status

3. **KYC Tab:**
   - Warning: KYC required
   - Status: Pending
   - Identity number (KTP/Paspor)
   - NPWP
   - Business registration

4. **Security Tab:**
   - Change Password (old, new, confirm)
   - Active Sessions display
   - Example: Chrome on Windows, Last active: Just now

**Form Handlers:**
- Save buttons per section
- Loading state: "Saving..."
- Success feedback (toast/notification ready)

#### Login.tsx (110 lines)
**Purpose:** Agency user authentication
**Design:**
- Gradient background (slate-900)
- Circular gradient logo "A"

**Form Fields:**
- Email input
- Password input

**Features:**
- Loading state on button
- Demo credentials display
- Sign-up link placeholder
- localStorage integration

**Demo Credentials:**
```
Email: demo@agency.com
Password: demo123
```

**Submission:**
- Sets `cachedUser` in localStorage
- Navigates to `/`

#### Onboarding.tsx (220 lines)
**Purpose:** New agency setup flow
**Steps (4):**
1. Welcome intro
2. Company info (name, website, talent type)
3. Talent management info
4. Completion congratulations

**Features:**
- Progress bar (step 1-4)
- Back/Next navigation
- Disabled back on step 1
- localStorage save on completion
- Redirect to `/` after completion

**Form Fields (Step 2):**
- Company name
- Website (optional)
- Talent type (select)

---

## Utilities & Helpers

### useAuth Hook
**File:** `src/hooks/useAuth.ts`

```typescript
const { user, loading, switchToTalent, clearImpersonation, currentViewAs } = useAuth()
```

**Returns:**
- `user` - Current user object
- `loading` - Auth loading state
- `switchToTalent(talentId)` - Enable impersonation
- `clearImpersonation()` - Disable impersonation
- `currentViewAs` - { talentId, talentName, exitUrl }

### Helper Functions
**File:** `src/lib/helpers.ts`

**formatCurrency(amount: number)**
```typescript
formatCurrency(50000000) // "Rp 50.000.000"
```

**formatDate(date: Date | string)**
```typescript
formatDate(new Date()) // "1 Januari 2024"
```

**formatRelativeTime(date: Date | string)**
```typescript
formatRelativeTime(new Date()) // "Baru saja"
```

**truncateText(text: string, length: number)**
```typescript
truncateText("Hello World", 5) // "Hello..."
```

**getInitials(name: string)**
```typescript
getInitials("Budi Santoso") // "BS"
```

**getStatusColor(status: string)**
```typescript
getStatusColor("active") // "green"
```

**calculateCommission(amount: number, percentage: number)**
```typescript
calculateCommission(50000000, 15) // 7500000
```

### Type Definitions
**File:** `src/lib/types.ts`

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'agency' | 'talent' | 'admin'
  company?: string
  phone?: string
  address?: string
}

interface Talent {
  id: string
  name: string
  email: string
  category: TalentCategory
  bookings: number
  rating: number
  commission: number
  status: 'active' | 'pending_review' | 'draft' | 'archived'
  portfolio_locked: boolean
  price_locked: boolean
  independent_login: boolean
}

interface Inquiry {
  id: string
  talent_id: string
  talent_name: string
  client_name: string
  project_name: string
  budget: number
  status: 'new' | 'replied' | 'negotiating' | 'declined' | 'accepted'
}
```

---

## Integration Points

### Authentication API Calls

**Login Endpoint:**
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: { user: User, token: string }
```

**Logout Endpoint:**
```typescript
POST /api/auth/logout
```

### Talent Management API

**Get Roster:**
```typescript
GET /api/agency/roster
Query: { status?, search?, sort? }
Response: { talents: Talent[] }
```

**Create Talent:**
```typescript
POST /api/agency/talent
Body: { name, email, category, ... }
Response: { talent: Talent }
```

**Update Talent:**
```typescript
PUT /api/agency/talent/:id
Body: { name?, email?, category?, ... }
Response: { talent: Talent }
```

**Impersonate Talent:**
```typescript
POST /api/agency/impersonate-talent/:id
Response: { token: string, impersonation_token: string }
```

### Inquiry Management API

**Get Inbox:**
```typescript
GET /api/agency/inbox
Query: { status?, search?, sort? }
Response: { inquiries: Inquiry[] }
```

**Get Inquiry Detail:**
```typescript
GET /api/agency/inbox/:id
Response: { inquiry: InquiryDetail }
```

**Reply to Inquiry:**
```typescript
POST /api/agency/inbox/:id/reply
Body: { message: string }
Response: { success: boolean }
```

### Dashboard API

**Get Dashboard Stats:**
```typescript
GET /api/agency/dashboard
Response: { stats: DashboardStats }
```

---

## Styling & Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Color Scheme
- **Primary:** Indigo-600 to Purple-600 (gradients)
- **Success:** Green
- **Warning:** Yellow
- **Danger:** Red
- **Neutral:** Slate (50-900)

### Typography
- **Headings:** Semi-bold (font-semibold)
- **Body:** Regular (400)
- **Small:** 12px (text-sm)

### Spacing
- **Gap between sections:** 6rem (mb-6)
- **Gap between items:** 4rem (gap-4)
- **Padding in cards:** 6 (p-6)

---

## Form Validation

### Email Validation
```typescript
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
```

### Phone Validation
```typescript
const isValidPhone = (phone: string) =>
  /^\+62\d{9,12}$/.test(phone) || /^08\d{9,12}$/.test(phone)
```

### Required Fields
- All fields in talent form: name, email, category, location, bio
- All fields in reply form: message

---

## Local Storage Schema

### cachedUser
```typescript
{
  id: string
  email: string
  name: string
  role: 'agency'
}
```

### impersonation
```typescript
{
  talentId: string
  talentName: string
  exitUrl: string
}
```

---

## Testing Checklist

- [ ] All 9 routes load without errors
- [ ] Sidebar navigation works on mobile
- [ ] Form submissions handled correctly
- [ ] Filtering and sorting work as expected
- [ ] Impersonation flow works end-to-end
- [ ] localStorage persists auth state
- [ ] Logout clears auth state
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Loading states visible during async operations
- [ ] Error messages displayed for failed requests
- [ ] Talent cards render with correct data
- [ ] Inquiry cards show correct status indicators
- [ ] Settings form enables/disables fields correctly
- [ ] Analytics cards display trend indicators
- [ ] Onboarding flow completes successfully

---

## Next Steps

1. **Backend Integration:** Connect all fetch() calls to Hono backend
2. **Error Handling:** Add error boundaries and retry logic
3. **Real-time Updates:** Implement WebSocket for notifications
4. **Chart Integration:** Add Recharts to Analytics page
5. **File Uploads:** Implement portfolio and KYC document uploads
6. **Mobile Optimization:** Fine-tune responsive design
7. **Performance:** Add React.memo for expensive components
8. **Testing:** Write unit and e2e tests

---

## Deployment

### Environment Variables
```
VITE_API_URL=https://api.orlandmanagement.com
VITE_AUTH_URL=https://auth.orlandmanagement.com
VITE_AGENCY_DOMAIN=https://agency.orlandmanagement.com
```

### Build
```bash
npm run build
```

### Deploy to Cloudflare Pages
```bash
npm run deploy
```

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready (UI Layer)
