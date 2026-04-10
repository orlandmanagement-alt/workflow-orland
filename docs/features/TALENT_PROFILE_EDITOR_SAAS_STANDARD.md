# Talent Profile Editor - SaaS Standard Upgrade

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Status**: Design Complete - Ready for Implementation

---

## Executive Summary

Current profile editor implementation is **functional but underpowered** for elite SaaS standards. This document outlines comprehensive upgrade path covering:
- **Auto-save with conflict detection** (not manual only)
- **Real-time validation** with helpful error hints
- **Undo/rollback functionality** for peace of mind
- **Keyboard shortcuts** for power users
- **Accessibility compliance** (WCAG 2.1 AA)
- **Field-level dirty tracking** for precise UX
- **Optimistic updates** for snappy feel
- **Change history/audit trail** for compliance
- **Analytics integration** for user behavior insights

---

## Current State Assessment

### ✅ What's Working
- Tab-based organization (Info, Photos, Assets, Credits)
- Photo upload to R2 with compression
- Local draft auto-save to localStorage
- Progress tracking modal
- Toast notifications
- Responsive grid layouts
- Dark mode support

### ❌ Major Gaps

| Gap | Current | Expected | Impact |
|-----|---------|----------|--------|
| Auto-save | Manual only | Real-time (3s debounce) | **HIGH** - Users lose data |
| Validation | Minimal (required only) | Real-time field validation | **CRITICAL** - Bad data submitted |
| Conflict Detection | None | Server version detection | **HIGH** - Data overwrites |
| Undo/Redo | None | Full history stack (50 states) | **MEDIUM** - User frustration |
| Accessibility | Limited ARIA | WCAG 2.1 AA compliant | **MEDIUM** - Exclusion risk |
| Field Focus | No focus management | Autofocus on errors | **MEDIUM** - UX friction |
| Change Tracking | Dirty boolean only | Field-level dirty flags | **LOW** - Optimization only |
| Keyboard Shortcuts | None | Save (Ctrl+S), Restore (Ctrl+Z) | **LOW** - Power user feature |
| Image Preview | No | WebGL preview + crop tool | **MEDIUM** - Reduces rework |
| Duplicate Prevention | None | Real-time dupe detection | **MEDIUM** - Data quality |
| Analytics | None | Event tracking (save, error, time) | **LOW** - Insights only |
| Batch Operations | None | Multi-edit, bulk delete, copy | **LOW** - Advanced feature |

### Risk Assessment

**Data Loss Risk**: 🔴 **HIGH**
- Manual save-only model = users forget to save before leaving
- No unsaved changes warning

**Data Integrity Risk**: 🔴 **HIGH**
- User A opens profile, User B edits same field via API
- User A saves → overwrites User B's changes (no conflict detection)

**User Frustration**: 🟡 **MEDIUM**
- Accidental edits with no undo
- Lots of required field errors on save instead of inline validation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Profile Editor Container                   │
│  (manages form state, auto-save, undo/redo stacks)           │
└─────────┬───────────────────────────────────────────────────┘
          │
    ┌─────┴──────────────────────────────────────────────┐
    │                                                     │
┌───▼─────────────────┐                   ┌─────────────▼────┐
│ Fragment Editors    │                   │ State Management │
├─────────────────────┤                   ├────────────────── │
│ • Info Editor       │                   │ • formState      │
│ • Photo Editor      │                   │ • changelog      │
│ • Assets Editor     │                   │ • undoStack      │
│ • Credits Editor    │                   │ • redoStack      │
│ • Fields tracked    │                   │ • conflicts      │
└─────────────────────┘                   └──────────────────┘
    ▲    ▲    ▲    ▲                         ▲         ▲
    │    │    │    │                         │         │
  Field Field Field Field                 API    LocalStorage
 Change Validate Save Error          (debounced)  (draft backup)
```

### Key Components

#### 1. Profile State Manager
```typescript
interface ProfileFormState {
  // Original server state
  serverState: TalentProfile;
  
  // Current working state
  values: Partial<TalentProfile>;
  
  // Field-level tracking
  fieldStatus: Record<string, FieldStatus>;
  
  // History for undo/redo
  changelog: ChangeEntry[];
  undoStack: ChangeEntry[];
  redoStack: ChangeEntry[];
  
  // Save state
  isSaving: boolean;
  lastSavedAt: Date | null;
  autoSaveTimer: NodeJS.Timeout | null;
  
  // Validation
  validationErrors: Record<string, string[]>;
  
  // Conflicts
  serverConflict: ServerConflict | null;
}

interface FieldStatus {
  isDirty: boolean;
  isValidating: boolean;
  isSaving: boolean;
  lastChangedAt: Date;
  changeCount: number;
}

interface ChangeEntry {
  fieldName: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  source: 'user' | 'server' | 'merge';
}

interface ServerConflict {
  field: string;
  clientValue: any;
  serverValue: any;
  lastEditedBy: string;
  lastEditedAt: Date;
  resolution: 'client' | 'server' | 'merge';
}
```

#### 2. Auto-Save Engine
- **Debounce Strategy**: 3000ms (configurable)
- **Conflict Detection**: Compare `lastModified_client` vs `lastModified_server`
- **Optimistic Updates**: Show success immediately, rollback on error
- **Retry Logic**: Exponential backoff (500ms → 1s → 2s → 4s) max 3 retries
- **Offline Support**: Queue saves when offline, sync when online

#### 3. Validation Framework

```typescript
interface FieldValidator {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  asyncValidate?: (value: any) => Promise<string | null>;
  debounceMs?: number; // Default 800ms
}

// Validation Rules: Field-Level
const FIELD_VALIDATORS = {
  full_name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    custom: (val) => val.trim().length < 3 ? "Name too short" : null
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    asyncValidate: checkEmailUniqueness
  },
  bio: {
    maxLength: 500,
    custom: (val) => val.includes('http') ? "URLs not allowed in bio" : null
  },
  portfolio_links: {
    custom: (links) => {
      const dupes = links.filter((x, i) => links.indexOf(x) !== i);
      return dupes.length ? `Duplicate links: ${dupes.join(', ')}` : null;
    }
  }
};
```

#### 4. Real-Time Validation

Validation triggers:
- **On Change**: Debounce 800ms (text fields)
- **On Blur**: Immediate (important fields)
- **On Submit**: All fields, with error summary
- **Async Validation**: Email uniqueness (server side)

Error Display Strategy:
```
SEVERITY LEVELS:
├─ 🔴 Error (blocking - field red, save disabled)
├─ 🟡 Warning (non-blocking - field yellow, save possible)
└─ 🔵 Info (hint only - field blue, no impact)

HINT MESSAGES:
"Character limit: 150 / 500" ← Real-time counter
"This email is already in use" ← Async error
"Profile not searchable until 'Gender' is set" ← Requirement hint
```

---

## Specification

### Phase 1: Real-Time Auto-Save

**Feature**: Save changes 3 seconds after last keystroke (no manual save button)

```typescript
// Implementation Pattern
const autoSaveState = useCallback((field: string, value: any) => {
  // 1. Update local state immediately (optimistic)
  setFieldState({ ...state, [field]: value });
  
  // 2. Mark field as dirty + validating
  setFieldStatus(field, { isDirty: true, isValidating: true });
  
  // 3. Validate field in real-time
  const error = await validateField(field, value);
  setFieldError(field, error);
  
  // 4. Debounce API call (clear if new change comes in)
  debounce(() => {
    if (error) return; // Don't save invalid data
    
    // 5. Send to API
    apiRequest('/talents/me', {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value })
    })
    .then(() => {
      // 6. Mark saved
      setFieldStatus(field, { isDirty: false, isSaving: false });
      setLastSavedAt(new Date());
      showToast('Saved', 2000);
    })
    .catch((err) => {
      // 7. On error: rollback + show error + enable retry
      setFieldError(field, err.message);
      setFieldStatus(field, { isDirty: true, hasError: true });
    });
  }, 3000);
}, []);
```

### Phase 2: Conflict Detection & Resolution

**Feature**: Detect when server state differs from client, offer resolution

```typescript
// Before save: Check version conflict
const checkForConflicts = async (field: string, clientValue: any) => {
  const response = await api.get(`/talents/me?fields=${field}&meta=true`);
  const { value: serverValue, lastEditedAt, lastEditedBy } = response.data;
  
  // If field hasn't changed server-side: OK to save
  if (serverValue === clientValue) {
    return null; // No conflict
  }
  
  // Conflict detected
  return {
    field,
    clientValue,
    serverValue,
    lastEditedBy,
    lastEditedAt,
    options: ['useClient', 'useServer', 'merge'] as const
  };
};

// Resolution UI
if (conflict) {
  return (
    <ConflictDialog
      field={conflict.field}
      clientValue={conflict.clientValue}
      serverValue={conflict.serverValue}
      editedBy={conflict.lastEditedBy}
      editedAt={conflict.lastEditedAt}
      onResolve={(resolution) => {
        if (resolution === 'useClient') {
          // Keep our value, force save
          forceSave(conflict.field, conflict.clientValue);
        } else if (resolution === 'useServer') {
          // Take their value, update local state
          setFieldState(conflict.field, conflict.serverValue);
        } else if (resolution === 'merge') {
          // For arrays: combine; for objects: deep merge
          const merged = smartMerge(conflict.clientValue, conflict.serverValue);
          setFieldState(conflict.field, merged);
        }
      }}
    />
  );
}
```

### Phase 3: Undo/Redo Stack

**Feature**: Full undo/redo for all changes (up to 50 states)

```typescript
// Track every change
const handleFieldChange = (field: string, newValue: any, oldValue?: any) => {
  // 1. Add to changelog
  const change: ChangeEntry = {
    fieldName: field,
    oldValue: oldValue ?? getFieldValue(field),
    newValue,
    timestamp: new Date(),
    source: 'user'
  };
  
  // 2. Add to undo stack (limit to 50)
  setUndoStack(prev => [...prev.slice(-49), change]);
  
  // 3. Clear redo stack (new change made)
  setRedoStack([]);
  
  // 4. Update state
  setFieldValue(field, newValue);
};

// Undo: Pop from undo stack, push to redo stack
const handleUndo = () => {
  if (undoStack.length === 0) return;
  
  const lastChange = undoStack[undoStack.length - 1];
  
  // Restore old value
  setFieldValue(lastChange.fieldName, lastChange.oldValue);
  
  // Move to redo stack
  setRedoStack(prev => [...prev, lastChange]);
  setUndoStack(prev => prev.slice(0, -1));
  
  // Mark as dirty (changed from saved state)
  setFieldDirty(lastChange.fieldName, true);
};

// Redo: Pop from redo stack, push to undo stack
const handleRedo = () => {
  if (redoStack.length === 0) return;
  
  const lastUndone = redoStack[redoStack.length - 1];
  
  // Restore new value
  setFieldValue(lastUndone.fieldName, lastUndone.newValue);
  
  // Move back to undo stack
  setUndoStack(prev => [...prev, lastUndone]);
  setRedoStack(prev => prev.slice(0, -1));
};

// Keyboard Shortcuts
useEffect(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); }
      if (e.key === 's') { e.preventDefault(); handleSaveNow(); } // Force save
    }
  };
  
  window.addEventListener('keydown', handleKeydown);
  return () => window.removeEventListener('keydown', handleKeydown);
}, []);
```

### Phase 4: Seamless Photo Editing

**Feature**: Preview, crop, optimize, then upload

```typescript
// Photo Upload Flow: Preview → Crop → Optimize → Upload
const handlePhotoSelect = async (file: File, photoType: string) => {
  // 1. Create preview
  const preview = URL.createObjectURL(file);
  
  // 2. Open crop modal
  setShowCropModal(true);
  setCropPreview(preview);
  
  // 3. User crops (WebGL canvas)
  const croppedBlob = await cropImage(preview);
  
  // 4. Optimize: Compress + resize
  const optimized = await optimizeImage(croppedBlob, {
    maxWidth: 2000,
    maxHeight: 2500,
    quality: 0.85
  });
  
  // 5. Show file size before upload
  showToast(`Ready to upload: ${(optimized.size / 1024).toFixed(1)}KB`, 3000);
  
  // 6. Upload with progress
  const progressHandler = (event: ProgressEvent) => {
    const percent = (event.loaded / event.total) * 100;
    setUploadProgress(photoType, percent);
  };
  
  const result = await uploadPhoto(optimized, photoType, {
    onProgress: progressHandler
  });
  
  // 7. Update field
  setFieldValue(photoType, result.publicUrl);
};
```

### Phase 5: Accessibility (WCAG 2.1 AA)

```typescript
// Form Field Component with Accessibility
const AccessibleFormField = ({
  label,
  name,
  value,
  error,
  hint,
  required,
  onChange,
  onBlur
}: AccessibleFieldProps) => {
  const fieldId = `field-${name}`;
  const errorId = `error-${name}`;
  const hintId = `hint-${name}`;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-bold text-slate-900 dark:text-white mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-label={label}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        aria-live="polite" // Announce validation errors
        className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors
          ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'}
          focus:ring-2 focus:ring-brand-500`}
      />
      
      {hint && (
        <p id={hintId} className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          💡 {hint}
        </p>
      )}
      
      {error && (
        <p 
          id={errorId} 
          className="text-xs text-red-600 mt-1 flex items-center gap-1"
          role="alert"
        >
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};
```

### Phase 6: Analytics & Monitoring

```typescript
// Track user behavior: save flow, errors, time spent
const analyticsEvents = {
  // Save attempt
  'profile_save_attempt': {
    field: string;
    oldValue: any;
    newValue: any;
    validationPassed: boolean;
    isAutoSave: boolean;
  },
  
  // Save success
  'profile_save_success': {
    field: string;
    duration_ms: number;
    fileSize_kb?: number; // For photos
  },
  
  // Save error
  'profile_save_error': {
    field: string;
    error: string;
    statusCode?: number;
  },
  
  // Undo/Redo
  'profile_undo': { changeCount: number; };
  'profile_redo': { changeCount: number; };
  
  // Conflict resolution
  'profile_conflict_resolved': {
    field: string;
    resolution: 'client' | 'server' | 'merge';
  },
  
  // Session
  'profile_session_start': { totalChanges: number; };
  'profile_session_end': {
    duration_seconds: number;
    fieldsEdited: string[];
    autoSaveCount: number;
    errorCount: number;
  }
};

// Implementation
const trackEvent = (event: keyof typeof analyticsEvents, data: any) => {
  analytics.track(event, {
    ...data,
    timestamp: new Date(),
    userId: user.id,
    version: 'profile-editor-v2'
  });
};
```

---

## Implementation Roadmap

### Week 1: Core Infrastructure
- [ ] Setup form state manager (Zustand)
- [ ] Implement debounced auto-save
- [ ] Add field-level dirty tracking
- [ ] Setup validation framework (before → real-time)

### Week 2: Advanced Features
- [ ] Conflict detection algorithm
- [ ] Undo/redo stack management
- [ ] Keyboard shortcuts
- [ ] Async validation (email uniqueness)

### Week 3: UX Enhancement
- [ ] Photo preview + crop tool
- [ ] Accessibility audit (WCAG)
- [ ] Error recovery flows
- [ ] Unsaved changes warning modal

### Week 4: Polish & Testing
- [ ] Analytics integration
- [ ] Performance optimization
- [ ] End-to-end testing
- [ ] Production deployment

---

## Key Metrics

### Success Criteria

| Metric | Target | Achievement |
|--------|--------|-------------|
| Data Loss Incidents | < 0.1% | Prevent with auto-save |
| Validation Errors on Submit | < 2% | Catch inline instead |
| Avg Save Time | < 200ms | Optimistic updates |
| Undo Usage Rate | > 10% | Power user feature |
| User Satisfaction | > 4.5/5 | Before vs after survey |

### Performance Targets

- **Save Latency**: p95 < 500ms (API + UI update)
- **Validation Speed**: Instant (< 100ms per field)
- **Auto-save Debounce**: 3000ms (not too aggressive)
- **Bundle Size Impact**: < 50KB (new code)
- **Accessibility Score**: WCAG 2.1 AA 100%

---

## Risk Mitigation

### Risk: Data Conflicts During Offline
**Mitigation**: Queue saves locally, sync on reconnect with conflict resolution

### Risk: Accidental Overwrites
**Mitigation**: Server version check before save, prompt if mismatch

### Risk: Performance Degradation with Large Forms
**Mitigation**: Virtual scrolling, field-level code splitting

### Risk: Accessibility Regression
**Mitigation**: WCAG audit on each deploy, automated tests

---

## References & Standards

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Hook Form Best Practices](https://react-hook-form.com/)
- [Figma Design System - Forms](https://www.figma.com)
- [Auto-save UX Patterns](https://www.nngroup.com/articles/auto-save/)

