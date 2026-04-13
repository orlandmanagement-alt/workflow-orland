## Build & Run Guide for appagency

### Quick Start

```bash
# Install dependencies (from root of monorepo)
npm install

# Run agency dashboard in development
npm run dev --filter=appagency

# Build for production
npm run build --filter=appagency

# Preview production build
npm run preview --filter=appagency
```

---

## Project Structure

```
apps/appagency/
├── src/
│   ├── App.tsx              # Main app router (9 routes)
│   ├── App.css              # App-specific styling
│   ├── main.tsx             # React entry point
│   ├── index.css            # Global Tailwind styles
│   ├── hooks/
│   │   └── useAuth.ts       # useAuth hook
│   ├── lib/
│   │   ├── helpers.ts       # Utility functions
│   │   └── types.ts         # TypeScript interfaces
│   ├── layouts/
│   │   └── MainLayout.tsx   # Sidebar + top bar
│   ├── pages/
│   │   ├── Dashboard.tsx    # Dashboard overview
│   │   ├── Roster.tsx       # Talent roster
│   │   ├── TalentDetail.tsx # Create/edit talent
│   │   ├── Inbox.tsx        # Inquiry inbox
│   │   ├── InquiryDetail.tsx # Inquiry detail + reply
│   │   ├── Analytics.tsx    # Analytics overview
│   │   ├── Settings.tsx     # Agency settings
│   │   ├── Login.tsx        # Login form
│   │   └── Onboarding.tsx   # Onboarding flow
│   ├── middleware/
│   │   └── authMiddlewareExtended.tsx # Auth context
│   ├── assets/              # Images, icons
│   └── store/               # Redux (if used)
├── public/                  # Static assets
├── index.html               # HTML entry point
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── wrangler.toml           # Cloudflare deployment config
```

---

## Scripts

### Development

```bash
# Start development server (default: localhost:5173)
npm run dev

# With specific port
npm run dev -- --port 3000

# Build and preview
npm run build && npm run preview
```

### Production

```bash
# Production build
npm run build

# Generate source maps for debugging
npm run build -- --sourcemap

# Preview build locally
npm run preview
```

### Testing

```bash
# Run unit tests (if configured)
npm run test

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint --fix

# Check TypeScript
npm run type-check
```

---

## Environment Configuration

### Development (.env.development.local)

```env
VITE_API_URL=http://localhost:8787
VITE_AUTH_URL=http://localhost:8788
VITE_AGENCY_DOMAIN=http://agency.localhost:5173
VITE_DEBUG=true
```

### Production (.env.production)

```env
VITE_API_URL=https://api.orlandmanagement.com
VITE_AUTH_URL=https://auth.orlandmanagement.com
VITE_AGENCY_DOMAIN=https://agency.orlandmanagement.com
VITE_DEBUG=false
```

### Using Environment Variables

In components:
```typescript
const API_URL = import.meta.env.VITE_API_URL
const AGENCY_DOMAIN = import.meta.env.VITE_AGENCY_DOMAIN
```

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS 14+, Android 9+)

---

## Development Tools

### Required

- Node.js 18+ (check with `node --version`)
- npm 8+ (check with `npm --version`)

### Recommended

- VS Code with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin
  - ESLint
  - Prettier

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5173
lsof -i :5173
# Kill process
kill -9 <PID>
```

### Dependencies Cache Issues
```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Build Errors
```bash
# Clear build cache
rm -rf dist .turbo

# Rebuild
npm run build
```

### TypeScript Errors
```bash
# Check TypeScript version
npm list typescript

# Update TypeScript
npm install -D typescript@latest
```

---

## Performance Tips

1. **Use React DevTools Profiler**
   - Chrome DevTools → React DevTools → Profiler
   - Identify slow components

2. **Monitor Bundle Size**
   ```bash
   npm run build -- --analyze
   ```

3. **Check Network Tab**
   - Monitor API calls
   - Check response times

4. **Enable Source Maps in Dev**
   ```bash
   npm run dev # Already enabled
   ```

---

## Database Mocking (Development Only)

Sample data is hardcoded in components for development:

### Dashboard Sample Data
```typescript
const talents = [
  { name: 'Budi Santoso', bookings: 8, rating: 4.8, commission: 45000000 },
  { name: 'Ella Singh', bookings: 12, rating: 4.9, commission: 62000000 },
  { name: 'Citra Dewi', bookings: 6, rating: 4.7, commission: 38000000 },
]
```

### Login Credentials (Demo)
```
Email: demo@agency.com
Password: demo123
Company: Demo Agency
```

**Note:** Replace with real API calls in Phase 4

---

## Integration with Hono Backend

### Backend API Base URL
```typescript
const API_BASE = import.meta.env.VITE_API_URL
// Example: http://localhost:8787 (development)
//          https://api.orlandmanagement.com (production)
```

### API Call Example
```typescript
// In a component
import { useEffect, useState } from 'react'

export const Dashboard = () => {
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const response = await fetch('/api/agency/roster', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        })
        const data = await response.json()
        setTalents(data.talents)
      } catch (error) {
        console.error('Failed to fetch talents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTalents()
  }, [])

  // ... rest of component
}
```

---

## Deployment

### To Cloudflare Pages

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Push to Git**
   ```bash
   git push origin main
   ```

3. **Cloudflare Pages Setup**
   - Connect Git repository
   - Build command: `npm run build`
   - Build output directory: `dist`

4. **Environment Variables**
   - Set in Cloudflare Pages dashboard
   - Required: VITE_API_URL, VITE_AUTH_URL

### To Vercel

1. **Connect Vercel to Git**
2. **Build Settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Environment Variables:**
   - Add VITE_* variables

---

## Monitoring & Analytics

### Enable Error Tracking (Recommended)

```typescript
// src/main.tsx - Add Sentry
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})
```

### Log User Actions

```typescript
// src/lib/analytics.ts
export const trackEvent = (eventName: string, properties?: any) => {
  console.log(`[Analytics] ${eventName}`, properties)
  // Send to analytics service
}
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes following TypeScript strict mode
3. Format with Prettier: `npm run format`
4. Lint: `npm run lint`
5. Type check: `npm run type-check`
6. Commit: `git commit -m "feat: add feature name"`
7. Push: `git push origin feature/name`
8. Create Pull Request

---

## Common Tasks

### Add New Page

1. Create `src/pages/NewPage.tsx`
2. Add route in `App.tsx`
3. Add menu item in `MainLayout.tsx`
4. Implement page component

### Add New API Call

1. Create function in `src/lib/api.ts`
2. Use in component with try/catch
3. Handle loading and error states
4. Update TypeScript types

### Update Styling

1. Modify `src/App.css` for component-specific
2. Modify `src/index.css` for global
3. Or use Tailwind classes directly
4. Check responsive breakpoints

### Add API Integration

Replace sample data in each page:
```typescript
// Before (sample data)
const talents = [{ name: 'Budi', ... }]

// After (API call)
const [talents, setTalents] = useState([])
useEffect(() => {
  fetch('/api/agency/roster')
    .then(r => r.json())
    .then(data => setTalents(data.talents))
}, [])
```

---

## Security Best Practices

1. **Never hardcode secrets**
   - Use environment variables
   - Keep .env.local in .gitignore

2. **Always validate user input**
   - Check email format
   - Sanitize text inputs
   - Validate file uploads

3. **Use HTTPS in production**
   - Cloudflare auto-enables
   - Set Secure flag on cookies

4. **Protect sensitive operations**
   - Require password confirmation
   - Log all sensitive actions
   - Implement CSRF tokens

5. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

---

## Resources

- [React Documentation](https://react.dev)
- [React Router v6](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Cloudflare Pages](https://pages.cloudflare.com)

---

## Support & Feedback

For issues or questions:
1. Check existing documentation
2. Review sample data in components
3. Check browser DevTools console
4. Review IMPLEMENTATION_GUIDE.md
5. Check COMPONENT_CHECKLIST.md

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
