# consensus.io - Demo Walkthrough

## Quick Start Demo (No Backend Required)

### Option 1: Dev Showcase (Recommended for Demo)

1. **Start the development server**:
   ```bash
   cd code/frontend
   npm start
   ```

2. **Navigate to `/dev`**:
   - URL: `http://localhost:3000/dev`
   - This shows all pages with mock data

3. **Explore each tab**:
   - **Admin**: Create topics, view opinions
   - **Invite (QR)**: See QR code display
   - **Poll/Submit**: Fill out opinion form
   - **Live/Results**: See cluster visualization with mock data
   - **Components**: Browse individual UI components

### Option 2: Simulated User Flow

1. **Start the dev server** (as above)

2. **Admin Flow**:
   - Visit `http://localhost:3000/admin`
   - Create a topic (if backend connected)
   - Or see existing topics

3. **Participant Flow**:
   - Visit `http://localhost:3000/invite/00000000-0000-0000-0000-000000000000`
   - See QR code for the demo UUID
   - Click or scan to join

4. **Submit Opinion**:
   - Auto-redirected to poll page
   - Enter opinion and rating
   - Click Submit

5. **View Results**:
   - Auto-redirected to live view
   - See cluster visualization
   - Interact with clusters (hover/click)
   - Send chat messages

## Full Demo with Backend

### Prerequisites
- Backend API running on `http://localhost:4200`
- All endpoints implemented (see `BACKEND_INTEGRATION.md`)
- Database with some sample topics

### Step-by-Step Demo

#### 1. Admin Creates Topic
```
URL: http://localhost:3000/admin
Action: Type "How can we improve our product?" and click "Create Topic"
Result: Gets UUID, redirected to invite page
```

#### 2. Share QR Code
```
URL: http://localhost:3000/invite/:uuid
Action: Show QR code to participants
Result: Participants can scan or click to join
```

#### 3. Participants Join
```
URL: http://localhost:3000/join/:uuid
Action: Automatically redirects
Result: Goes to poll page
```

#### 4. Submit Opinions
```
URL: http://localhost:3000/poll/:uuid
Action: 
  - Enter opinion: "Add dark mode"
  - Set rating: 8
  - Click Submit
Result: Opinion saved, redirected to live view
```

#### 5. View Clustering
```
URL: http://localhost:3000/live/:uuid
Features:
  - Cluster bubbles (size = engagement, color = sentiment)
  - Hover over cluster → see ConsensusCard
  - Click cluster → detailed view
  - Chat with other participants
  - Real-time updates as new opinions arrive
```

#### 6. Admin Triggers Clustering
```
URL: http://localhost:3000/admin
Action: 
  - Expand topic
  - Click "Cluster" button
Result: AI processes opinions, creates clusters
```

#### 7. View Updated Results
```
URL: http://localhost:3000/live/:uuid (refresh)
Result: See newly formed clusters with headings
```

## Demo Features to Highlight

### ✨ Visual Design
- Hand-drawn aesthetic (ScribbleMind style)
- Paper texture background
- Animated transitions
- Sentiment-based coloring

### 🎯 CloudMap Visualization
- Clusters as hand-drawn bubbles
- Size based on engagement
- Color gradient: red (negative) → yellow (neutral) → green (positive)
- Hover effects and animations
- Physics-based positioning (d3-force)

### 💬 Interactive Elements
- Click clusters to see details
- Chat interface for discussion
- Real-time sentiment visualization
- Badge system for participation

### 🔄 Real-Time Updates
- WebSocket connection for live updates
- Polling fallback if WebSocket unavailable
- Automatic cluster refresh
- Live message updates

## Troubleshooting Demo

### No Backend Running?
→ Use `/dev` showcase with mock data

### Backend Not Connected?
→ Check `API_ENDPOINT` in `src/service/fetchService.ts`
→ Verify CORS settings on backend

### No Clusters Showing?
→ Click "Cluster" button in Admin page
→ Wait for AI processing
→ Refresh Live page

### WebSocket Not Working?
→ Frontend falls back to polling automatically
→ Check console for connection errors

## Presentation Tips

1. **Start with `/dev`** - Show all components at once
2. **Walk through user flow** - Admin → Invite → Join → Poll → Live
3. **Highlight CloudMap** - Show cluster interactions, sentiment coloring
4. **Demonstrate real-time** - Open multiple tabs, submit opinions from different "users"
5. **Show mobile view** - Responsive design works on phones too

## Expected Behavior

### Without Backend
- Dev showcase (`/dev`) works perfectly
- Mock data displays
- All UI interactions work
- No data persistence

### With Backend
- Full user flow works
- Data persists in database
- Real-time updates via WebSocket
- AI clustering processes opinions
- Clusters update dynamically

## Success Criteria

✅ Can create topics
✅ Can share via QR code  
✅ Participants can join easily
✅ Opinions can be submitted
✅ Clusters visualize automatically
✅ Real-time updates work
✅ Chat interface functional
✅ Responsive on mobile

If all these work, your consensus.io platform is ready!
