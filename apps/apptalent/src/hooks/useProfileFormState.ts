import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Field-level status tracking
 */
export interface FieldStatus {
  isDirty: boolean;
  isValidating: boolean;
  isSaving: boolean;
  hasError: boolean;
  lastChangedAt: Date | null;
  changeCount: number;
}

/**
 * Change entry for undo/redo
 */
export interface ChangeEntry {
  fieldName: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  source: 'user' | 'server' | 'merge';
}

/**
 * Server conflict detection
 */
export interface ServerConflict {
  field: string;
  clientValue: any;
  serverValue: any;
  lastEditedBy: string;
  lastEditedAt: Date;
}

/**
 * Form state manager hook - Orchestrates auto-save, undo/redo, conflict detection
 * 
 * Features:
 * - Real-time field tracking (dirty, validating, saving)
 * - Undo/redo stack (up to 50 states)
 * - Server conflict detection
 * - Change history for audit trail
 * - Validation error tracking
 */
export const useProfileFormState = <T extends Record<string, any>>(initialData: T) => {
  // Original server state
  const [serverState] = useState<T>(initialData);
  
  // Current working values
  const [values, setValues] = useState<T>(initialData);
  
  // Field-level status tracking
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>(() => {
    const status: Record<string, FieldStatus> = {};
    for (const key in initialData) {
      status[key] = {
        isDirty: false,
        isValidating: false,
        isSaving: false,
        hasError: false,
        lastChangedAt: null,
        changeCount: 0
      };
    }
    return status;
  });
  
  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<ChangeEntry[]>([]);
  const [redoStack, setRedoStack] = useState<ChangeEntry[]>([]);
  const [changelog, setChangelog] = useState<ChangeEntry[]>([]);
  
  // Validation errors (field → array of error messages)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  // Server conflicts
  const [serverConflict, setServerConflict] = useState<ServerConflict | null>(null);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update field value with change tracking
  const updateField = useCallback((fieldName: string, newValue: any) => {
    const oldValue = values[fieldName];
    
    // 1. Update value
    setValues((prev: T) => ({ ...prev, [fieldName]: newValue }));
    
    // 2. Track change in changelog
    const change: ChangeEntry = {
      fieldName,
      oldValue,
      newValue,
      timestamp: new Date(),
      source: 'user'
    };
    
    setChangelog(prev => [...prev, change]);
    
    // 3. Add to undo stack (limit to 50)
    setUndoStack(prev => [...prev.slice(-49), change]);
    
    // 4. Clear redo stack (new change made)
    setRedoStack([]);
    
    // 5. Update field status
    setFieldStatus(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isDirty: newValue !== oldValue,
        lastChangedAt: new Date(),
        changeCount: (prev[fieldName]?.changeCount || 0) + 1,
        isValidating: true, // Start validation
        isSaving: false
      }
    }));
    
    // 6. Auto-save will be triggered by useAutoSave
  }, [values]);
  
  // Mark field as saving
  const markFieldAsSaving = useCallback((fieldName: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isSaving: true
      }
    }));
  }, []);
  
  // Mark field as saved
  const markFieldAsSaved = useCallback((fieldName: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isDirty: false,
        isSaving: false,
        hasError: false
      }
    }));
    setLastSavedAt(new Date());
  }, []);
  
  // Mark field as error
  const markFieldAsError = useCallback((fieldName: string, errors: string[]) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isSaving: false,
        hasError: errors.length > 0
      }
    }));
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: errors
    }));
  }, []);
  
  // Mark field validation done
  const markFieldAsValidated = useCallback((fieldName: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValidating: false
      }
    }));
  }, []);
  
  // Undo function
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastChange = undoStack[undoStack.length - 1];
    
    // Restore old value (without triggering change tracking)
    setValues((prev: T) => ({ ...prev, [lastChange.fieldName]: lastChange.oldValue }));
	
    // Move to redo stack
    setRedoStack(prev => [...prev, lastChange]);
    setUndoStack(prev => prev.slice(0, -1));
    
    // Mark as dirty
    setFieldStatus(prev => ({
      ...prev,
      [lastChange.fieldName]: {
        ...prev[lastChange.fieldName],
        isDirty: true
      }
    }));
  }, [undoStack]);
  
  // Redo function
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const lastUndone = redoStack[redoStack.length - 1];
    
    // Restore new value
    setValues((prev: T) => ({ ...prev, [lastUndone.fieldName]: lastUndone.newValue }));
	
    // Move back to undo stack
    setUndoStack(prev => [...prev, lastUndone]);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack]);
  
  // Get all dirty fields
  const getDirtyFields = useCallback(() => {
    return Object.entries(fieldStatus)
      .filter(([_, status]) => status.isDirty)
      .map(([field]) => field);
  }, [fieldStatus]);
  
  // Get overall form dirty state
  const isFormDirty = getDirtyFields().length > 0;
  
  // Can undo?
  const canUndo = undoStack.length > 0;
  
  // Can redo?
  const canRedo = redoStack.length > 0;
  
  // Reset form to server state
  const resetForm = useCallback(() => {
    setValues(serverState);
    setUndoStack([]);
    setRedoStack([]);
    setChangelog([]);
    setValidationErrors({});
    setServerConflict(null);
    
    // Clear field status
    const newStatus: Record<string, FieldStatus> = {};
    for (const key in serverState) {
      newStatus[key] = {
        isDirty: false,
        isValidating: false,
        isSaving: false,
        hasError: false,
        lastChangedAt: null,
        changeCount: 0
      };
    }
    setFieldStatus(newStatus);
  }, [serverState]);
  
  return {
    // State
    values,
    fieldStatus,
    undoStack,
    redoStack,
    changelog,
    validationErrors,
    serverConflict,
    isSaving,
    lastSavedAt,
    isFormDirty,
    canUndo,
    canRedo,
    
    // Actions
    updateField,
    markFieldAsSaving,
    markFieldAsSaved,
    markFieldAsError,
    markFieldAsValidated,
    undo,
    redo,
    getDirtyFields,
    resetForm,
    setServerConflict,
    setAutoSaveTimer: (timer: NodeJS.Timeout | null) => {
      autoSaveTimerRef.current = timer;
    },
    getAutoSaveTimer: () => autoSaveTimerRef.current,
  };
};

export type ProfileFormState = ReturnType<typeof useProfileFormState>;

