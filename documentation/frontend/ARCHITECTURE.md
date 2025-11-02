# Frontend Architecture - Consensus.io

Comprehensive guide to the React TypeScript frontend application.

## 🏗️ Architecture Overview

The frontend is a Single Page Application (SPA) built with React and TypeScript, using a component-based architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────┐
│              React App (App.tsx)            │
│         React Router for Navigation         │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐    ┌───▼────┐
│ Routes │    │ Service │    │ Store  │
│ Pages  │    │  Layer  │    │Zustand │
└───┬───┘    └────┬────┘    └───┬────┘
    │              │              │
    └──────┬───────┴──────┬───────┘
           │              │
    ┌──────▼──────┐  ┌───▼─────┐
    │ Components  │  │   Lib   │
    │  Reusable   │  │ Utilities│
    └─────────────┘  └─────────┘
```

## 📁 Directory Structure Explained

### `src/components/` - Reusable UI Components

**Purpose**: Shared UI components used across multiple pages.

**Components:**
- **`CloudMap.tsx`**: Interactive cluster visualization using d3-force and RoughJS
  - Displays clusters as hand-drawn bubbles
  - Physics simulation for positioning
  - Click/hover interactions
  - Sentiment-based coloring

- **`ChatBox.tsx`**: Chat interface for discussions
  - Real-time message display
  - Message input
  - Sentiment-colored message bubbles
  - Timestamp display

- **`OpinionForm.tsx`**: Form for submitting opinions
  - Text area for opinion input
  - Rating slider (1-10)
  - Form validation
  - Submit handler

- **`QRBlock.tsx`**: QR code display component
  - Hand-drawn border aesthetic
  - Hover animations
  - Click to navigate

- **`Layout.tsx`**: Page layout wrapper
  - Header with navigation
  - Sentiment legend
  - Consistent styling

- **`Toast.tsx`**: Notification toast component
- **`ConsensusCard.tsx`**: Cluster detail card
- **`SentimentLegend.tsx`**: Legend for sentiment colors

### `src/routes/` - Page Components

**Purpose**: Page-level components representing different views/routes.

**Pages:**
- **`admin/Admin.tsx`**: Admin panel
  - Create topics
  - View all topics and opinions
  - Generate QR codes
  - Trigger clustering
  - Delete topics
  - Add manual opinions
  - Advanced features toggle

- **`poll/Poll.tsx`**: Opinion submission page
  - Display topic
  - Opinion form
  - Submit and redirect to live view

- **`live/Live.tsx`**: Live results visualization
  - Cluster map
  - Chat interface
  - Real-time updates via WebSocket/polling

- **`invite/Invite.tsx`**: QR code invitation page
  - Display QR code for joining
  - Topic information

- **`join/Join.tsx`**: Join flow handler
  - Auto-redirects to poll page

- **`login/Login.tsx`**: Login page (optional)
- **`error/Error.tsx`**: Error page
- **`dev/Showcase.tsx`**: Development showcase with mock data

### `src/service/` - API Integration Layer

**Purpose**: All backend communication and type definitions.

**Files:**
- **`fetchService.ts`**: HTTP client functions
  - Wraps `fetch` API
  - Handles credentials and cookies
  - Error handling
  - All API calls: `loginUser()`, `createTopic()`, `createOpinion()`, etc.

- **`Endpoints.ts`**: API endpoint enum
  - Centralized endpoint definitions
  - Easy to update if API changes

- **`model/`**: TypeScript type definitions
  - `Opinion.ts` - Opinion data structure
  - `Message.ts` - Chat message structure
  - `LiveViewResponse.ts` - Live view API response
  - `TopicResponse.ts` - Topic creation response
  - etc.

### `src/store/` - State Management

**Purpose**: Global application state using Zustand.

**Files:**
- **`clusterStore.ts`**: Cluster data store
  - Stores clusters by topic UUID
  - Functions: `setClusters()`, `getClusters()`
  - Type definitions: `Cluster`, `Opinion`

### `src/lib/` - Utility Functions

**Purpose**: Reusable utility functions and configurations.

**Files:**
- **`ws.ts`**: WebSocket client service
  - Connection management
  - Event handling
  - Fallback to polling if WebSocket unavailable

- **`sentiment.ts`**: Sentiment color calculations
  - Maps sentiment scores to colors
  - Cluster sentiment averaging

- **`motion.ts`**: Framer Motion animation variants
  - Reusable animation configurations

- **`colors.ts`**: Color palette definitions
- **`mockData.ts`**: Mock data for development
- **`paper-texture.ts`**: Paper texture styling

### `src/types/` - TypeScript Declarations

Type declarations for third-party libraries:
- `d3-force.d.ts` - d3-force types
- `roughjs.d.ts` - RoughJS types

## 🔄 Data Flow

### Creating a Topic

```
User types topic → Admin.tsx
    ↓
createTopic() → fetchService.ts
    ↓
POST /api/admin → Backend
    ↓
Response with UUID
    ↓
Refresh topic list
    ↓
Display in Admin panel
```

### Submitting an Opinion

```
User fills form → Poll.tsx
    ↓
createOpinion() → fetchService.ts
    ↓
POST /api/poll/:uuid (with cookie)
    ↓
Backend saves to database
    ↓
Redirect to Live view
```

### Clustering Flow

```
Admin clicks "Cluster" → Admin.tsx
    ↓
triggerCluster() → fetchService.ts
    ↓
POST /api/trigger_clustering/:uuid
    ↓
Backend worker process:
  - Loads opinions
  - Runs clustering algorithm
  - Saves clusters
    ↓
getClusters() → fetchService.ts
    ↓
GET /api/clusters/:uuid
    ↓
Update clusterStore
    ↓
Display in Admin panel
```

## 🎨 Styling Approach

### TailwindCSS

Utility-first CSS framework:
- Classes in JSX: `className="bg-white p-4 rounded-lg"`
- Custom theme in `tailwind.config.js`
- Responsive design with breakpoints

### Custom Theme

Defined in `tailwind.config.js`:
- Color palette (ink, paper, accent)
- Font families (display, scribble)
- Custom utilities

### Hand-Drawn Aesthetic

- **RoughJS**: Adds hand-drawn borders and lines
- **Paper texture**: Background texture effect
- **Organic animations**: Framer Motion for natural movement

## 🗺️ Routing

React Router configuration in `App.tsx`:

```typescript
Routes:
  /           → Redirects to /admin
  /admin      → Admin panel
  /invite/:uuid → QR code page
  /join/:uuid   → Join handler (redirects)
  /poll/:uuid   → Opinion submission
  /live/:uuid   → Live results
  /dev          → Dev showcase
  /login        → Login page
  /*            → Error page
```

## 🔌 API Integration

### Fetch Service Pattern

All API calls follow this pattern:

```typescript
export function createTopic(topic: string): Promise<TopicResponse> {
    return fetch(`${API_ENDPOINT}/${Endpoints.ADMIN}`, {
        method: 'POST',
        headers: JSON_HEADER,
        credentials: 'include',  // Include cookies
        body: JSON.stringify({topic})
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText)
    })
}
```

### Error Handling

- Network errors caught in components
- User-friendly error messages via Toast
- Fallback to demo mode if backend unavailable

### Credentials

All authenticated requests use:
```typescript
credentials: 'include'  // Sends cookies with request
```

## 🎭 State Management

### Zustand Store

Simple, lightweight state management:

```typescript
interface ClusterStore {
  clusters: Record<string, Cluster[]>
  setClusters: (uuid: string, clusters: Cluster[]) => void
}

// Usage in components
const { clusters, setClusters } = useClusterStore()
```

### Local State

Components use `useState` for:
- Form inputs
- UI state (modals, toggles)
- Loading states

### No Global State Needed For

- User session (handled via cookies)
- Current route (React Router)
- API responses (fetched as needed)

## 🎨 Component Patterns

### Function Components with Hooks

```typescript
function MyComponent() {
  const [state, setState] = useState()
  const { data } = useCustomHook()
  
  useEffect(() => {
    // Side effects
  }, [dependencies])
  
  return <div>...</div>
}
```

### Props Pattern

```typescript
interface ComponentProps {
  required: string
  optional?: number
  callback: (value: string) => void
}

function Component({ required, optional = 0, callback }: ComponentProps) {
  // Component logic
}
```

## 🚀 Build Process

### Development

```bash
npm start
```
- Starts dev server on port 3000
- Hot reload on file changes
- Source maps for debugging

### Production Build

```bash
npm run build
```
- Creates optimized bundle in `build/`
- Minifies code
- Tree-shaking removes unused code
- Static files ready for deployment

### Build Output

```
build/
├── index.html        # Entry point
├── static/
│   ├── css/         # CSS bundle
│   └── js/          # JavaScript bundle
└── manifest.json    # Asset manifest
```

Backend serves this directory as static files.

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```bash
REACT_APP_API_URL=http://localhost:4200/api
REACT_APP_WS_URL=ws://localhost:4200
```

Access in code:
```typescript
const API_URL = process.env.REACT_APP_API_URL
```

### Package Configuration

`package.json`:
- Dependencies: React, TypeScript, Tailwind, etc.
- Scripts: `start`, `build`, `test`
- Proxy: `"proxy": "http://localhost:4200"` (dev only)

## 🎯 Key Features Implementation

### Real-time Updates

**WebSocket** (`lib/ws.ts`):
- Connects to backend WebSocket server
- Listens for cluster updates
- Falls back to polling if WebSocket unavailable

**Usage:**
```typescript
const ws = getWebSocketService()
ws.connect(uuid).then(() => {
  ws.on('cluster_update', (data) => {
    // Handle update
  })
})
```

### Cluster Visualization

**CloudMap Component**:
- Uses d3-force for physics simulation
- RoughJS for hand-drawn styling
- Framer Motion for animations
- Sentiment-based coloring

**Data Flow:**
1. Fetch clusters from API
2. Store in Zustand store
3. Pass to CloudMap component
4. Render with d3-force simulation

### QR Code Generation

- Uses `react-qr-code` library
- Generates QR code for join/live URLs
- Displayed in modal for easy sharing

## 🧪 Development Tools

### Dev Showcase (`/dev`)

Test all components with mock data:
- No backend required
- All pages available
- Interactive components
- Perfect for demos

### TypeScript

Benefits:
- Type safety
- Autocomplete
- Refactoring support
- Self-documenting code

## 📱 Responsive Design

- Mobile-first approach
- Tailwind breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
- Flexible layouts
- Touch-friendly interactions

## ♿ Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Screen reader support
- Color contrast (WCAG AA)
- Reduced motion support

## 🐛 Debugging

### React DevTools

Install browser extension for component inspection.

### Console Logging

```typescript
console.log('Debug info:', data)
```

### Network Tab

Check API requests/responses in browser DevTools.

### Source Maps

Production build includes source maps for debugging.

## 🚀 Performance Optimization

- Code splitting: React lazy loading (if needed)
- Memoization: `React.memo()` for expensive components
- Bundle size: Tree-shaking removes unused code
- Images: Optimized and lazy-loaded
- Fonts: Self-hosted, subsetted

## 📝 Best Practices

1. **Type Safety**: Always define TypeScript types
2. **Component Size**: Keep components focused and small
3. **Separation of Concerns**: UI, logic, and data separate
4. **Error Handling**: Always handle API errors gracefully
5. **Loading States**: Show loading indicators
6. **User Feedback**: Toast notifications for actions
7. **Code Reusability**: Extract common patterns to components/hooks

## 🔄 State Updates

### When to Use Zustand vs Local State

**Zustand (Global):**
- Cluster data (shared across pages)
- Settings that persist
- Data fetched from API

**Local State:**
- Form inputs
- UI toggles (modals, dropdowns)
- Component-specific state

## 📚 Further Reading

- See [README.md](README.md) for setup instructions
- See [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) for API details
- See [USER_FLOW.md](USER_FLOW.md) for user journey

