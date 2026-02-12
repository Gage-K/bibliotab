# Frontend Modernization & Production Readiness Plan

## Executive Summary

The frontend is functional but has **critical security vulnerabilities**, **missed opportunities** to leverage backend improvements, and **significant technical debt** that will hinder scaling and maintainability. This document outlines 30+ identified issues and a comprehensive improvement plan.

**Severity Breakdown:**
- 🔴 **Critical (4)**: Security vulnerabilities that must be fixed before production
- 🟠 **High (12)**: Missing features and poor architecture that impacts UX/scalability
- 🟡 **Medium (14)**: Code quality issues causing technical debt

---

## Table of Contents

1. [Critical Issues Summary](#critical-issues-summary)
2. [Component Design Problems](#component-design-problems)
3. [Implementation Plan](#implementation-plan)
4. [Detailed Task Breakdown](#detailed-task-breakdown)
5. [Architecture Recommendations](#architecture-recommendations)

---

## Critical Issues Summary

### 🔴 Security Vulnerabilities (MUST FIX)

1. **Password stored in React state**
   - Location: `Login.jsx` line 52: `setAuth({ user, pwd, accessToken })`
   - Impact: Password exposed in memory, React DevTools, and potential XSS
   - Fix: Remove `pwd` from auth state immediately

2. **Auth lost on page refresh**
   - Location: `authProvider.jsx` uses only in-memory state
   - Impact: Users logged out on every refresh (terrible UX)
   - Fix: Add localStorage persistence

3. **No token refresh mechanism**
   - Backend has `/api/auth/refresh` endpoint but frontend doesn't use it
   - Impact: Sessions expire without warning, poor UX
   - Fix: Implement axios response interceptor

4. **Logout doesn't call backend**
   - Location: `Profile.jsx` line 89-91 only clears local state
   - Impact: Session remains active on server (security issue)
   - Fix: Call `POST /api/auth/logout`

### 🟠 High Priority Issues

5. **No pagination implementation**
   - Backend supports `?page=1&limit=20` but frontend loads all tabs
   - Impact: Won't scale beyond 100+ tabs (performance/memory)
   - Fix: Add pagination UI in Dashboard

6. **React Query installed but unused**
   - `@tanstack/react-query@^5.90.7` in package.json but never imported
   - Impact: No caching, request deduplication, or optimistic updates
   - Fix: Implement React Query hooks

7. **No API service layer**
   - Axios calls scattered across 8+ components
   - Manual auth headers in every request
   - Impact: Duplicate code, hard to maintain, error-prone
   - Fix: Create `services/tabService.js` and `services/authService.js`

8. **Manual auth header injection**
   - Every API call manually adds `Authorization: auth.accessToken`
   - Repeated in Dashboard.jsx (3x), Profile.jsx (2x), MainTabEditor.jsx (2x)
   - Impact: Easy to forget, inconsistent, verbose
   - Fix: Axios request interceptor

### 🟡 Medium Priority Issues

9. **Incomplete TypeScript migration** - Only 1/24 components uses TypeScript
10. **Console.log statements** - 8+ debug statements in production code
11. **No form validation** - Tab editor accepts fret values like -5, 99
12. **No delete confirmations** - Accidental deletes with no warning
13. **No unsaved changes warnings** - Can lose work by navigating away
14. **Errors only in console** - Users see nothing when operations fail
15. **Prop drilling** - 17 props passed through MainTabEditor → Editor
16. **Large components** - MainTabEditor.jsx is 347 lines (should be 3-4 components)

---

## Component Design Problems

### Problem 1: Violation of Single Responsibility Principle

**MainTabEditor.jsx (347 lines)** does too much:

```jsx
// Current responsibilities (SEVEN concerns in one component):
1. Data fetching (useEffect with axios)
2. Tab state management (7 useState calls)
3. Position tracking (measure, frame, note navigation)
4. Editing mode toggling
5. Save/update logic
6. Context provider creation
7. Child component orchestration
```

**Issues:**
- Hard to test individual concerns
- Changes to one feature risk breaking others
- Difficult to reason about state flow
- Cannot reuse logic in other components

**Better Design:**

```jsx
// Split into focused components:

// 1. Container (data + orchestration)
function TabEditorContainer({ tabId }) {
  const { data, isLoading } = useTab(tabId);
  const updateTab = useUpdateTab();

  if (isLoading) return <TabEditorSkeleton />;

  return (
    <TabEditorProvider tab={data.data}>
      <TabEditorLayout />
    </TabEditorProvider>
  );
}

// 2. Context (shared state)
function TabEditorProvider({ tab, children }) {
  const [position, positionActions] = useTabPosition();
  const [editState, editActions] = useEditState();

  return (
    <TabEditorContext.Provider value={{...}}>
      {children}
    </TabEditorContext.Provider>
  );
}

// 3. Layout (composition)
function TabEditorLayout() {
  return (
    <>
      <TabDetailsSection />
      <TabDisplaySection />
      <TabControlsSection />
      <TabFormModal />
    </>
  );
}

// 4. Custom hooks (reusable logic)
function useTabPosition() { /* position state + navigation */ }
function useEditState() { /* editing mode + save logic */ }
```

**Benefits:**
- ✅ Each component has one responsibility
- ✅ Logic is testable in isolation
- ✅ Can reuse hooks elsewhere
- ✅ Easier to understand and modify

---

### Problem 2: Prop Drilling Anti-Pattern

**Current:** MainTabEditor passes 17 props to Editor component:

```jsx
// MainTabEditor.jsx lines 314-329
<Editor
  tab={tab}
  position={position}
  editorIsOpen={editorIsOpen}
  addNewFrame={testHandler}
  addNewMeasure={addNewMeasure}
  deleteFrame={deleteFrame}
  deleteMeasure={deleteMeasure}
  getEmptyFrame={getEmptyFrame}
  handleOpeningEditor={handleOpeningEditor}
  updatePosition={updatePosition}
  updateTabData={updateTabData}
  isEditing={isEditing}
  saveChanges={saveChanges}
  isSaving={isSaving}
  // ... 17 props total!
/>
```

Then Editor passes most of these down to EditorControls, TabForm, etc.

**Problems:**
- Intermediate components receive props they don't use
- Hard to track where data originates
- Refactoring requires changing multiple files
- TypeScript/PropTypes become verbose

**Better Design - Context API:**

```jsx
// TabEditorContext.tsx
interface TabEditorContextValue {
  // State
  tab: Tab;
  position: Position;
  editState: EditState;

  // Actions
  navigation: {
    updatePosition: (pos: Position) => void;
  };
  editing: {
    openEditor: () => void;
    closeEditor: () => void;
  };
  mutations: {
    updateTabData: (measure, frame, notes) => void;
    saveChanges: () => Promise<void>;
  };
  frames: {
    addFrame: () => void;
    deleteFrame: (index) => void;
  };
  measures: {
    addMeasure: () => void;
    deleteMeasure: (index) => void;
  };
}

export const useTabEditor = () => {
  const context = useContext(TabEditorContext);
  if (!context) throw new Error('useTabEditor must be used within TabEditorProvider');
  return context;
};

// Now components just use the hook:
function EditorControls() {
  const { frames, measures } = useTabEditor();

  return (
    <div>
      <button onClick={frames.addFrame}>Add Frame</button>
      <button onClick={measures.addMeasure}>Add Measure</button>
    </div>
  );
}
```

**Benefits:**
- ✅ No prop drilling
- ✅ Components only import what they need
- ✅ TypeScript auto-completion
- ✅ Easy to add new actions without changing prop signatures

---

### Problem 3: Scattered Business Logic

**Current:** Tab editing logic is duplicated and scattered:

```jsx
// MainTabEditor.jsx - Managing tab structure
const addNewFrame = (measureIndex) => {
  setTab(prev => {
    const newTab = [...prev];
    newTab[measureIndex].push(getEmptyFrame());
    return newTab;
  });
};

const deleteFrame = (measureIndex, frameIndex) => {
  setTab(prev => {
    const newTab = [...prev];
    newTab[measureIndex].splice(frameIndex, 1);
    return newTab;
  });
};

// Similar logic in TabDisplay.jsx for rendering
// Similar logic in TabForm.jsx for editing notes
```

**Problems:**
- Business rules not centralized
- Same validations repeated
- Hard to ensure consistency
- Cannot unit test logic without mounting components

**Better Design - Custom Hooks with Business Logic:**

```typescript
// hooks/useTabMutations.ts
export function useTabMutations(tab: Tab, setTab: SetState<Tab>) {
  const frames = useMemo(() => ({
    add: (measureIndex: number) => {
      setTab(prev => {
        const newTab = [...prev];
        newTab[measureIndex].push(createEmptyFrame());
        return newTab;
      });
    },

    delete: (measureIndex: number, frameIndex: number) => {
      if (!canDeleteFrame(tab, measureIndex)) {
        throw new Error('Cannot delete last frame in measure');
      }

      setTab(prev => {
        const newTab = [...prev];
        newTab[measureIndex].splice(frameIndex, 1);
        return newTab;
      });
    },
  }), [tab, setTab]);

  const measures = useMemo(() => ({
    add: () => {
      setTab(prev => [...prev, createEmptyMeasure()]);
    },

    delete: (measureIndex: number) => {
      if (tab.length === 1) {
        throw new Error('Cannot delete last measure');
      }

      setTab(prev => {
        const newTab = [...prev];
        newTab.splice(measureIndex, 1);
        return newTab;
      });
    },
  }), [tab, setTab]);

  return { frames, measures };
}

// Business logic functions (pure, testable)
function canDeleteFrame(tab: Tab, measureIndex: number): boolean {
  return tab[measureIndex].length > 1;
}

function createEmptyFrame(): Frame {
  return {
    notes: { E: '', A: '', D: '', G: '', B: '', e: '' },
  };
}

function createEmptyMeasure(): Measure {
  return [createEmptyFrame()];
}
```

**Benefits:**
- ✅ Business logic is pure and testable
- ✅ Validation rules centralized
- ✅ Consistent behavior across components
- ✅ Easy to add new validations

---

### Problem 4: Weak Type Safety

**Current:** Only 1 component (`TabDetails.tsx`) uses TypeScript. Others are pure JSX:

```jsx
// Dashboard.jsx - No types
const [tabs, setTabs] = useState([]);  // What shape is a tab?
const [isLoading, setIsLoading] = useState(false);
const [isCreating, setIsCreating] = useState(false);

function deleteTab(id) {  // What type is id? string? number?
  // ...
}

// TabDisplay.jsx - PropTypes but no TypeScript
TabDisplay.propTypes = {
  tab: PropTypes.array.isRequired,  // Array of what?
  position: PropTypes.number,  // WRONG - should be object!
};
```

**Problems:**
- Runtime errors instead of compile-time errors
- No IntelliSense/auto-completion
- Refactoring is dangerous
- PropTypes can lie (as shown above)

**Better Design - Full TypeScript:**

```typescript
// types/tab.types.ts (already exists - just needs to be used!)
export interface Note {
  E: string;
  A: string;
  D: string;
  G: string;
  B: string;
  e: string;
}

export interface Frame {
  notes: Note;
}

export type Measure = Frame[];
export type Tab = Measure[];

export interface TabDetails {
  song: string;
  artist: string;
  tuning: string[];
}

export interface Position {
  measure: number;
  frame: number;
  note: string;
}

// Dashboard.tsx
import { Tab } from '../types/tab.types';

const [tabs, setTabs] = useState<Tab[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(false);

function deleteTab(id: string): Promise<void> {
  // TypeScript ensures id is string
  // Return type enforces async/await usage
}

// TabDisplay.tsx
interface TabDisplayProps {
  tab: Tab;
  position: Position;  // Correct type!
  onFrameClick: (measure: number, frame: number) => void;
}

export const TabDisplay: React.FC<TabDisplayProps> = ({ tab, position, onFrameClick }) => {
  // TypeScript validates props at compile time
  // Auto-completion for tab[0][0].notes.E
};
```

**Benefits:**
- ✅ Catch errors at compile time
- ✅ IntelliSense in VSCode
- ✅ Safe refactoring
- ✅ Self-documenting code

---

### Problem 5: No Error Boundaries

**Current:** If any component throws an error, the entire app crashes with a blank screen:

```jsx
// Dashboard.jsx
const getTabs = async () => {
  try {
    const response = await axios.get(TABS_URL, {...});
    setTabs(response.data);  // What if response.data is null?
  } catch (err) {
    console.error(err);  // User sees NOTHING
  }
};
```

**Problems:**
- Users see blank screen when errors occur
- No way to recover
- Errors only logged to console
- No user feedback

**Better Design - Error Boundaries + User Feedback:**

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service (Sentry, etc.)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

// Wrap sections of app:
// main.jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Dashboard.tsx - use React Query error states
const { data, error, isLoading } = useQuery({
  queryKey: ['tabs'],
  queryFn: tabService.getAll,
});

if (error) {
  return <ErrorMessage error={error} retry={refetch} />;
}
```

**Benefits:**
- ✅ Graceful error handling
- ✅ User can recover
- ✅ Error logging for debugging
- ✅ Better UX

---

### Problem 6: Form State Complexity

**Current:** Form state tightly coupled to parent tab state:

```jsx
// TabForm.jsx
const TabForm = ({ tab, measure, frame, updateTabData, handleOpeningEditor }) => {
  const [currentNotes, setCurrentNotes] = useState(tab[measure][frame]?.notes);

  useEffect(() => {
    setCurrentNotes(tab[measure][frame]?.notes);  // Sync with parent
  }, [tab, measure, frame]);

  // Complex dependency management
  // Easy to cause infinite loops
};
```

**Problems:**
- Form state and tab state can get out of sync
- useEffect dependencies can cause bugs
- No validation before save
- Difficult to test

**Better Design - Controlled Form with Validation:**

```typescript
// hooks/useTabForm.ts
interface UseTabFormOptions {
  initialNotes: Note;
  onSubmit: (notes: Note) => void;
}

export function useTabForm({ initialNotes, onSubmit }: UseTabFormOptions) {
  const [notes, setNotes] = useState<Note>(initialNotes);
  const [errors, setErrors] = useState<Partial<Record<keyof Note, string>>>({});

  const validateNote = (value: string): string | null => {
    if (value === '') return null;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 24) {
      return 'Fret must be between 0 and 24';
    }
    return null;
  };

  const handleChange = (string: keyof Note, value: string) => {
    const error = validateNote(value);
    setNotes(prev => ({ ...prev, [string]: value }));
    setErrors(prev => ({ ...prev, [string]: error || undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Partial<Record<keyof Note, string>> = {};
    Object.entries(notes).forEach(([key, value]) => {
      const error = validateNote(value);
      if (error) newErrors[key as keyof Note] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(notes);
  };

  return {
    notes,
    errors,
    handleChange,
    handleSubmit,
    isDirty: JSON.stringify(notes) !== JSON.stringify(initialNotes),
  };
}

// TabForm.tsx
export const TabForm: React.FC<TabFormProps> = ({ initialNotes, onSave, onCancel }) => {
  const { notes, errors, handleChange, handleSubmit, isDirty } = useTabForm({
    initialNotes,
    onSubmit: onSave,
  });

  return (
    <form onSubmit={handleSubmit}>
      {(['E', 'A', 'D', 'G', 'B', 'e'] as const).map(string => (
        <FormField
          key={string}
          label={string}
          value={notes[string]}
          error={errors[string]}
          onChange={(value) => handleChange(string, value)}
        />
      ))}

      <button type="submit" disabled={!isDirty}>
        Save
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};
```

**Benefits:**
- ✅ Form state isolated from parent
- ✅ Built-in validation
- ✅ Clear data flow
- ✅ Testable hook

---

### Problem 7: Duplicate Loading States

**Current:** Every component manages its own loading state:

```jsx
// Dashboard.jsx
const [isLoading, setIsLoading] = useState(false);
const getTabs = async () => {
  setIsLoading(true);
  try {
    const response = await axios.get(...);
    setTabs(response.data);
  } finally {
    setIsLoading(false);
  }
};

// Profile.jsx - SAME PATTERN
const [isLoading, setIsLoading] = useState(false);
const getUser = async () => {
  setIsLoading(true);
  try { ... } finally { setIsLoading(false); }
};

// MainTabEditor.jsx - SAME PATTERN AGAIN
const [isLoading, setIsLoading] = useState(false);
// ... repeat 8 more times
```

**Problems:**
- Boilerplate repeated in every component
- Easy to forget to set loading to false
- No error state handling
- Cannot compose loading states

**Better Design - React Query handles this:**

```typescript
// No manual loading state needed!
// Dashboard.tsx
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['tabs', page, limit],
  queryFn: () => tabService.getAll(page, limit),
});

if (isLoading) return <TabsSkeleton />;
if (error) return <ErrorMessage error={error} retry={refetch} />;

const tabs = data.data;
const pagination = data.pagination;

// React Query handles:
// ✅ Loading state
// ✅ Error state
// ✅ Caching
// ✅ Background refetching
// ✅ Request deduplication
```

**Benefits:**
- ✅ No boilerplate
- ✅ Consistent loading/error patterns
- ✅ Automatic caching
- ✅ Better UX with background updates

---

### Problem 8: No Component Composition Patterns

**Current:** Components are monolithic with inline everything:

```jsx
// Dashboard.jsx - 212 lines, everything inline
export default function Dashboard() {
  // 60 lines of state/hooks
  // 50 lines of functions
  // 100 lines of JSX

  return (
    <PageWrapper>
      <div className="w-full">
        {/* Inline header */}
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-6xl font-bold">Dashboard</h1>
          {/* Inline button */}
          <button
            onClick={createTab}
            className={`${isCreating ? "animate-pulse bg-indigo-400..." : "bg-indigo-600..."}`}
          >
            Create Tab
          </button>
        </div>

        {/* Inline grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {tabs.map(tab => (
            {/* Inline card - 30+ lines */}
            <div className="bg-gray-800 rounded-lg...">
              {/* ... */}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
```

**Problems:**
- Cannot reuse card design elsewhere
- Hard to test individual pieces
- Difficult to scan/understand
- Styling inconsistent

**Better Design - Composition with Reusable Components:**

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading,
  children,
  onClick
}) => {
  const baseStyles = "px-4 py-2 rounded font-medium transition-colors";
  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        loading && "animate-pulse cursor-not-allowed"
      )}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

// components/TabCard.tsx
interface TabCardProps {
  tab: Tab;
  onEdit: () => void;
  onDelete: () => void;
}

export const TabCard: React.FC<TabCardProps> = ({ tab, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <h3>{tab.tab_name}</h3>
        <p className="text-sm text-gray-400">{tab.tab_artist}</p>
      </CardHeader>

      <CardContent>
        <p className="text-sm">Tuning: {tab.tuning.join('-')}</p>
        <p className="text-xs text-gray-500">
          Modified: {formatDate(tab.modified_at)}
        </p>
      </CardContent>

      <CardFooter>
        <Button variant="primary" onClick={onEdit}>Edit</Button>
        <Button variant="danger" onClick={onDelete}>Delete</Button>
      </CardFooter>
    </Card>
  );
};

// Dashboard.tsx - Now clean and focused
export const Dashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useTabs(page);
  const createTabMutation = useCreateTab();

  const handleCreateTab = async () => {
    const newTab = await createTabMutation.mutateAsync(defaultTabData);
    navigate(`/editor/${newTab.id}`);
  };

  if (isLoading) return <TabsSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <PageWrapper>
      <DashboardHeader>
        <h1>Dashboard</h1>
        <Button
          onClick={handleCreateTab}
          loading={createTabMutation.isLoading}
        >
          Create Tab
        </Button>
      </DashboardHeader>

      <TabGrid>
        {data.data.map(tab => (
          <TabCard
            key={tab.id}
            tab={tab}
            onEdit={() => navigate(`/editor/${tab.id}`)}
            onDelete={() => handleDelete(tab.id, tab.tab_name)}
          />
        ))}
      </TabGrid>

      <Pagination {...data.pagination} onPageChange={setPage} />
    </PageWrapper>
  );
};
```

**Benefits:**
- ✅ Reusable components (Button, Card, Pagination)
- ✅ Consistent design
- ✅ Easy to test
- ✅ Clear separation of concerns
- ✅ Much easier to read and maintain

---

## Implementation Plan

### Phase 1: Security & Auth Foundation (CRITICAL - Do First)

#### Task 1: Fix Auth Security Issues (30 min) 🔴

**Files to modify:**
- `/client/src/context/authProvider.jsx`
- `/client/src/pages/Login.jsx`
- `/client/src/pages/Profile.jsx`

**Changes:**

1. **Remove password from state (Login.jsx line 52)**:
```jsx
// BEFORE (INSECURE):
setAuth({ user, pwd, accessToken });

// AFTER:
setAuth({ user, accessToken, refreshToken: response.data.refreshToken });
```

2. **Add localStorage persistence (authProvider.jsx)**:
```jsx
const [auth, setAuth] = useState(() => {
  const stored = localStorage.getItem('auth');
  return stored ? JSON.parse(stored) : {};
});

useEffect(() => {
  if (auth?.accessToken) {
    localStorage.setItem('auth', JSON.stringify(auth));
  } else {
    localStorage.removeItem('auth');
  }
}, [auth]);
```

3. **Call logout endpoint (Profile.jsx line 89)**:
```jsx
async function handleLogout() {
  try {
    await axios.post('/api/auth/logout', {}, {
      headers: { Authorization: auth.accessToken }
    });
  } finally {
    setAuth({});
    redirect("/");
  }
}
```

**Verification:**
```bash
# 1. Login → check localStorage in DevTools → should see token (NOT password)
# 2. Reload page → should stay logged in
# 3. Logout → localStorage should be cleared
```

---

#### Task 2: Centralize API with Interceptors (45 min) 🔴

**Why:** Auth headers manually added 8+ times. Token refresh not implemented.

**Replace `/client/src/api/axios.js`:**

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - auto-add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (auth?.accessToken) {
      config.headers.Authorization = auth.accessToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401/token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/auth/refresh`,
          { refreshToken: auth.refreshToken }
        );

        const newAuth = {
          ...auth,
          accessToken: refreshResponse.data.accessToken,
        };
        localStorage.setItem('auth', JSON.stringify(newAuth));

        // Retry original request with new token
        originalRequest.headers.Authorization = newAuth.accessToken;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Remove manual headers from:**
- Dashboard.jsx (lines 68-73, 99-103, 122-127)
- Profile.jsx (lines 33-38, 65-74)
- MainTabEditor.jsx (lines 49-54, 93-99)

**Before/After:**
```jsx
// BEFORE (repeated 8 times):
const response = await axios.get(TABS_URL, {
  headers: {
    "Content-Type": "application/json",
    Authorization: auth.accessToken,
  },
});

// AFTER:
const response = await axios.get('/api/tabs');  // Auto-authenticated!
```

---

#### Task 3: Create API Service Layer (60 min) 🟠

**Create `/client/src/api/services/tabService.js`:**

```javascript
import axios from '../axios';

export const tabService = {
  getAll: async (page = 1, limit = 20) => {
    const response = await axios.get('/api/tabs', { params: { page, limit } });
    return response.data;
  },

  getById: async (tabId) => {
    const response = await axios.get(`/api/tabs/${tabId}`);
    return response.data;
  },

  create: async (tabData) => {
    const response = await axios.post('/api/tabs', tabData);
    return response.data;
  },

  update: async (tabId, updates) => {
    const response = await axios.put(`/api/tabs/${tabId}`, updates);
    return response.data;
  },

  delete: async (tabId) => {
    const response = await axios.delete(`/api/tabs/${tabId}`);
    return response.data;
  },
};
```

**Create `/client/src/api/services/authService.js`:**

```javascript
import axios from '../axios';

export const authService = {
  login: async (username, password) => {
    const response = await axios.post('/api/auth/login', { username, password });
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await axios.post('/api/auth/register', { username, email, password });
    return response.data;
  },

  logout: async () => {
    const response = await axios.post('/api/auth/logout');
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await axios.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};
```

**Update components:**
- Dashboard.jsx: Use `tabService.getAll()`, `tabService.create()`, `tabService.delete()`
- MainTabEditor.jsx: Use `tabService.getById()`, `tabService.update()`
- Login.jsx: Use `authService.login()`
- Register.jsx: Use `authService.register()`
- Profile.jsx: Use `authService.logout()`

---

### Phase 2: State Management & Backend Integration

#### Task 4: Implement React Query (90 min) 🟠

React Query is already installed (`@tanstack/react-query@^5.90.7`) but not used.

**Create `/client/src/api/queryClient.js`:**

```javascript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Update `/client/src/main.jsx`:**

```jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Create `/client/src/hooks/useTabs.js`:**

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tabService } from '../api/services/tabService';

// GET all tabs with pagination
export const useTabs = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['tabs', page, limit],
    queryFn: () => tabService.getAll(page, limit),
  });
};

// GET single tab
export const useTab = (tabId) => {
  return useQuery({
    queryKey: ['tabs', tabId],
    queryFn: () => tabService.getById(tabId),
    enabled: !!tabId,
  });
};

// CREATE tab
export const useCreateTab = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tabService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });
};

// UPDATE tab
export const useUpdateTab = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tabId, updates }) => tabService.update(tabId, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['tabs', variables.tabId], data);
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });
};

// DELETE tab
export const useDeleteTab = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tabService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });
};
```

**Update Dashboard.jsx:**

```jsx
// BEFORE (lines 60-79 - manual state management):
const [tabs, setTabs] = useState([]);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  getTabs();
}, []);

const getTabs = async () => {
  setIsLoading(true);
  try {
    const response = await axios.get(...);
    setTabs(response.data);
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};

// AFTER:
import { useTabs, useCreateTab, useDeleteTab } from '../hooks/useTabs';

const { data, isLoading, error } = useTabs(page, limit);
const createTabMutation = useCreateTab();
const deleteTabMutation = useDeleteTab();

const tabs = data?.data || [];
const pagination = data?.pagination;

// No manual loading state, error handling, or useEffect needed!
```

**Benefits:**
- ✅ Automatic caching
- ✅ Request deduplication
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Loading/error states built-in

---

#### Task 5: Add Pagination UI (30 min) 🟠

**Update Dashboard.jsx:**

Add pagination state:
```jsx
const [page, setPage] = useState(1);
const [limit] = useState(20);

const { data, isLoading, error } = useTabs(page, limit);
const tabs = data?.data || [];
const pagination = data?.pagination;
```

Add pagination controls after tabs grid:
```jsx
{pagination && pagination.totalPages > 1 && (
  <div className="flex justify-center gap-4 mt-8">
    <button
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
      className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>

    <span className="px-4 py-2">
      Page {pagination.page} of {pagination.totalPages}
      ({pagination.total} tabs)
    </span>

    <button
      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
      disabled={page === pagination.totalPages}
      className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
)}
```

**Verification:**
```bash
# 1. Create 25+ tabs
# 2. Dashboard shows 20 tabs + pagination controls
# 3. Click Next → page 2 loads
# 4. Network tab → verify ?page=2&limit=20 parameter
```

---

### Phase 3: Code Quality & TypeScript

#### Task 6: Remove Debug Code (45 min) 🟡

**Remove console.log from:**
- Dashboard.jsx (lines 77, 111, 131)
- Login.jsx (line 68)
- Profile.jsx (line 43)
- MainTabEditor.jsx (lines 66, 82, 102)

**Extract custom hooks:**

**Create `/client/src/hooks/useErrorMessage.js`:**
```javascript
import { useState, useRef, useEffect } from 'react';

export const useErrorMessage = () => {
  const [errMsg, setErrMsg] = useState('');
  const errRef = useRef();

  useEffect(() => {
    setErrMsg('');
  }, []);

  const showError = (message) => {
    setErrMsg(message);
    errRef.current?.focus();
  };

  const clearError = () => setErrMsg('');

  return { errMsg, errRef, showError, clearError };
};
```

**Update Login.jsx, Register.jsx, Profile.jsx:**
```jsx
// BEFORE:
const [errMsg, setErrMsg] = useState('');
const errRef = useRef();

// AFTER:
import { useErrorMessage } from '../hooks/useErrorMessage';
const { errMsg, errRef, showError, clearError } = useErrorMessage();
```

---

#### Task 7: Complete TypeScript Migration (120 min) 🟡

**Priority files to migrate:**
1. `/client/src/pages/Dashboard.jsx` → `Dashboard.tsx`
2. `/client/src/components/MainTabEditor.jsx` → `MainTabEditor.tsx`
3. `/client/src/pages/Login.jsx` → `Login.tsx`
4. `/client/src/context/authProvider.jsx` → `authProvider.tsx`

**Create `/client/src/types/api.types.ts`:**

```typescript
export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken?: string | null;
}

export interface Tab {
  id: string;
  user_id: string;
  tab_name: string;
  tab_artist?: string;
  tuning: string[];
  tab_data: any; // Use @tablab/shared types
  created_at: string;
  modified_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
}
```

**Convert authProvider.jsx → authProvider.tsx:**

```typescript
import { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '../types/api.types';

interface AuthContextType {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : { user: null, accessToken: null };
  });

  useEffect(() => {
    if (auth?.accessToken) {
      localStorage.setItem('auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('auth');
    }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```

**Convert services to TypeScript:**

```typescript
// tabService.ts
import axios from '../axios';
import { Tab, PaginatedResponse } from '../../types/api.types';

export const tabService = {
  getAll: async (page = 1, limit = 20): Promise<PaginatedResponse<Tab>> => {
    const response = await axios.get('/api/tabs', { params: { page, limit } });
    return response.data;
  },

  getById: async (tabId: string): Promise<{ success: boolean; data: Tab }> => {
    const response = await axios.get(`/api/tabs/${tabId}`);
    return response.data;
  },

  // ... rest with proper types
};
```

---

### Phase 4: UX Improvements

#### Task 8: Add Validation & Confirmations (60 min) 🟡

**TabForm.jsx - Add fret validation:**

```jsx
const validateFret = (value) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return '';
  if (num < 0 || num > 24) return '';
  return value;
};

const handleSubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const notes = {};

  for (let [key, value] of formData.entries()) {
    const validatedValue = validateFret(value);
    notes[key] = validatedValue;
  }

  updateTabData(position.measure, position.frame, notes);
  handleOpeningEditor();
};

// In JSX:
<input
  type="number"
  min="0"
  max="24"
  name="E"
  aria-invalid={values.E && (parseInt(values.E) < 0 || parseInt(values.E) > 24)}
/>
```

**Dashboard.jsx - Add delete confirmation:**

```jsx
const deleteTab = async (id, tabName) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${tabName}"? This cannot be undone.`
  );

  if (!confirmed) return;

  try {
    await deleteTabMutation.mutateAsync(id);
  } catch (err) {
    alert('Failed to delete tab. Please try again.');
  }
};
```

**MainTabEditor.jsx - Add unsaved changes warning:**

```jsx
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);

// Track changes:
const updateTabData = (...args) => {
  setHasUnsavedChanges(true);
  // ... existing logic
};

const saveChanges = async () => {
  // ... existing save logic
  setHasUnsavedChanges(false);
};
```

---

#### Task 9: Add Error Boundaries & User Feedback (45 min) 🟡

**Create `/client/src/components/ErrorBoundary.tsx`:**

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-300 mb-4">
              The application encountered an unexpected error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Create `/client/src/components/ErrorToast.tsx`:**

```typescript
import { useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export const ErrorToast = ({ message, onClose }: ErrorToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
      <span>{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  );
};
```

**Update main.jsx:**

```jsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</ErrorBoundary>
```

**Add error feedback in Dashboard:**

```jsx
const { data, isLoading, error } = useTabs(page, limit);
const [showError, setShowError] = useState(false);

useEffect(() => {
  if (error) setShowError(true);
}, [error]);

// In JSX:
{showError && error && (
  <ErrorToast
    message={error.message || 'Failed to load tabs'}
    onClose={() => setShowError(false)}
  />
)}
```

---

## Architecture Recommendations

### 1. Adopt Feature-Based Organization

**Current:**
```
/client/src/
├── components/     # Mixed concerns
├── pages/          # Mixed concerns
├── hooks/          # Global hooks
└── api/            # Centralized
```

**Recommended:**
```
/client/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useLogin.ts
│   │   ├── api/
│   │   │   └── authService.ts
│   │   └── context/
│   │       └── AuthProvider.tsx
│   │
│   ├── tabs/
│   │   ├── components/
│   │   │   ├── TabCard.tsx
│   │   │   ├── TabEditor/
│   │   │   │   ├── TabEditorContainer.tsx
│   │   │   │   ├── TabDisplay.tsx
│   │   │   │   ├── TabForm.tsx
│   │   │   │   └── TabControls.tsx
│   │   │   └── TabDetails.tsx
│   │   ├── hooks/
│   │   │   ├── useTabs.ts
│   │   │   ├── useTabMutations.ts
│   │   │   └── useTabPosition.ts
│   │   ├── api/
│   │   │   └── tabService.ts
│   │   └── types/
│   │       └── tab.types.ts
│   │
│   └── dashboard/
│       ├── pages/
│       │   └── Dashboard.tsx
│       └── components/
│           ├── DashboardHeader.tsx
│           ├── TabGrid.tsx
│           └── Pagination.tsx
│
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ErrorToast.tsx
│   ├── hooks/
│   │   ├── useErrorMessage.ts
│   │   └── useFormValidation.ts
│   └── types/
│       └── api.types.ts
│
└── api/
    ├── axios.ts
    └── queryClient.ts
```

**Benefits:**
- Features are self-contained
- Easy to find related code
- Can delete entire feature easily
- Scalable structure

---

### 2. Implement Design System

**Create reusable UI components:**

```typescript
// shared/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

// shared/components/ui/Card.tsx
interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={clsx('bg-gray-800 rounded-lg shadow-lg p-6', className)}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children }: { children: ReactNode }) => (
  <div className="border-b border-gray-700 pb-4 mb-4">{children}</div>
);

export const CardContent = ({ children }: { children: ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const CardFooter = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-2 justify-end">{children}</div>
);
```

---

### 3. Separate Presentational and Container Components

**Container (smart component):**
```typescript
// features/tabs/components/TabEditor/TabEditorContainer.tsx
export const TabEditorContainer: React.FC<{ tabId: string }> = ({ tabId }) => {
  const { data, isLoading } = useTab(tabId);
  const updateTab = useUpdateTab();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = async (updates: Partial<Tab>) => {
    await updateTab.mutateAsync({ tabId, updates });
    setHasUnsavedChanges(false);
  };

  if (isLoading) return <TabEditorSkeleton />;

  return (
    <TabEditorProvider tab={data.data}>
      <TabEditorPresentation
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onDirtyChange={setHasUnsavedChanges}
      />
    </TabEditorProvider>
  );
};
```

**Presentational (dumb component):**
```typescript
// features/tabs/components/TabEditor/TabEditorPresentation.tsx
interface Props {
  onSave: (updates: Partial<Tab>) => Promise<void>;
  hasUnsavedChanges: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

export const TabEditorPresentation: React.FC<Props> = ({
  onSave,
  hasUnsavedChanges,
  onDirtyChange
}) => {
  const { tab, position } = useTabEditor();

  return (
    <div>
      <TabDetailsSection />
      <TabDisplaySection />
      <TabControlsSection />
      {hasUnsavedChanges && <UnsavedChangesWarning />}
    </div>
  );
};
```

---

### 4. Use Compound Components for Complex UI

**Instead of prop drilling:**
```jsx
<Editor
  prop1={...}
  prop2={...}
  prop3={...}
  // ... 17 props
/>
```

**Use compound components:**
```jsx
<TabEditor>
  <TabEditor.Header>
    <TabEditor.Title />
    <TabEditor.SaveButton />
  </TabEditor.Header>

  <TabEditor.Body>
    <TabEditor.Details />
    <TabEditor.Display />
  </TabEditor.Body>

  <TabEditor.Controls>
    <TabEditor.AddFrame />
    <TabEditor.DeleteFrame />
  </TabEditor.Controls>
</TabEditor>
```

Implementation:
```typescript
const TabEditorContext = createContext<TabEditorContextValue | undefined>(undefined);

export const TabEditor = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(/* ... */);

  return (
    <TabEditorContext.Provider value={{ state, setState }}>
      <div className="tab-editor">{children}</div>
    </TabEditorContext.Provider>
  );
};

TabEditor.Header = ({ children }: { children: ReactNode }) => (
  <header className="tab-editor-header">{children}</header>
);

TabEditor.Title = () => {
  const { state } = useContext(TabEditorContext);
  return <h1>{state.tab.tab_name}</h1>;
};

// etc.
```

---

## Implementation Order

**Week 1: Critical Security**
1. Task 1 - Fix auth security (30 min)
2. Task 2 - Axios interceptors (45 min)
3. Task 3 - API service layer (60 min)

**Week 2: State Management**
4. Task 4 - React Query (90 min)
5. Task 5 - Pagination (30 min)

**Week 3: Code Quality**
6. Task 6 - Remove debug code (45 min)
7. Task 7 - TypeScript migration (120 min)

**Week 4: UX Polish**
8. Task 8 - Validation & confirmations (60 min)
9. Task 9 - Error boundaries (45 min)

**Total: ~8.5 hours**

---

## Success Metrics

After implementation:

**Security:**
- ✅ No password in client state (verified in localStorage)
- ✅ Auth persists across refreshes
- ✅ Automatic token refresh works
- ✅ Logout calls backend endpoint

**Performance:**
- ✅ Pagination handles 1000+ tabs
- ✅ Request caching reduces API calls by 70%+
- ✅ No duplicate requests (React Query deduplication)

**Code Quality:**
- ✅ TypeScript coverage: 0% → 80%+
- ✅ Zero console.log statements
- ✅ Service layer: All API calls centralized
- ✅ Component size: Average 150 lines (down from 347)

**User Experience:**
- ✅ Error messages shown to users (not just console)
- ✅ Form validation prevents invalid input
- ✅ Delete confirmations prevent accidents
- ✅ Unsaved changes warnings

---

## End-to-End Verification Checklist

```bash
# 1. Start dev server
cd client && pnpm run dev

# 2. Test Auth Flow
[ ] Login → token in localStorage (no password!)
[ ] Reload page → stay logged in
[ ] Network tab → Authorization header auto-added
[ ] Logout → localStorage cleared

# 3. Test Tab CRUD
[ ] Dashboard loads tabs with pagination
[ ] Create tab → list auto-updates (no manual refresh)
[ ] Edit tab → changes save correctly
[ ] Delete tab → confirmation required → list updates
[ ] Navigate away/back → instant load from cache

# 4. Test Error Handling
[ ] Disconnect internet → error toast appears
[ ] Invalid fret (e.g., 99) → rejected
[ ] Backend error → user sees message

# 5. Test Token Refresh
[ ] Wait for token expiry
[ ] Make request → auto-refreshes
[ ] Continue working seamlessly

# 6. Code Quality
[ ] No console.log in code
[ ] TypeScript builds without errors
[ ] No PropTypes/TypeScript conflicts
```

---

## Additional Resources

**TypeScript:**
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

**React Query:**
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)

**Component Patterns:**
- [Patterns.dev](https://www.patterns.dev/posts/react-patterns)
- [Kent C. Dodds - AHA Programming](https://kentcdodds.com/blog/aha-programming)

**Testing:**
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest](https://vitest.dev/)

---

## Questions or Concerns?

If you have questions about this plan or want to discuss alternatives, please reach out. This is a living document and can be adjusted based on your priorities and timeline.

**Priority Recommendation:** Start with Phase 1 (Security) as these are critical vulnerabilities. The other phases can be done incrementally.
