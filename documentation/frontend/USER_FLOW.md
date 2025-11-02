# consensus.io - User Flow Documentation

## Overview

consensus.io is a collective intelligence platform where users submit opinions, which are then clustered by AI and visualized in real-time.

## User Journey

### Phase 1: Admin Creates Topic

1. **Admin visits `/admin`**
   - Enters a topic/question in the input field
   - Clicks "Create Topic" button
   - Receives a UUID for the new topic
   - Automatically redirected to `/invite/:uuid`

### Phase 2: Invite Participants

2. **Admin sees QR Code page (`/invite/:uuid`)**
   - Displays QR code linking to `/join/:uuid`
   - Participants can scan QR code or click to join
   - Admin can also see the topic details

### Phase 3: Participants Join

3. **User scans QR or visits `/join/:uuid`**
   - Automatically redirected to `/poll/:uuid`
   - No login required (username auto-generated)

### Phase 4: Submit Opinion

4. **User on Poll page (`/poll/:uuid`)**
   - Sees the topic/question
   - Enters their opinion in text area
   - Selects rating (1-10) using slider
   - Clicks "Submit" button
   - Opinion submitted to backend
   - Automatically redirected to `/live/:uuid`

### Phase 5: View Live Results

5. **User sees Live view (`/live/:uuid`)**
   - Topic title displayed at top
   - **CloudMap visualization**: 
     - Clusters displayed as hand-drawn bubbles
     - Size = engagement level
     - Color = sentiment (-1 to 1, red to green)
     - Hover/click to see ConsensusCard with cluster details
   - **ChatBox**: 
     - Real-time messages from participants
     - Sentiment-colored message bubbles
     - Send messages to discuss clusters
   - Sentiment legend in bottom-right corner

### Phase 6: Admin Management

6. **Admin can manage topics (`/admin`)**
   - View all created topics
   - Click ▶ to expand and see all opinions
   - Click "QR" button to see QR code again
   - Click "Cluster" to trigger AI clustering
   - See which opinions belong to which clusters

## Current Flow Status

### ✅ Implemented
- ✅ Admin topic creation
- ✅ QR code generation and sharing
- ✅ Join flow (auto-redirect)
- ✅ Opinion submission form
- ✅ Live results page with CloudMap
- ✅ Chat interface
- ✅ Clustering visualization
- ✅ Real-time updates (via WebSocket when backend available)

### 🔄 Backend Dependent
- Opinion storage (needs `/api/poll/:uuid`)
- Clustering execution (needs `/api/trigger_clustering/:uuid`)
- Cluster data (needs `/api/clusters/:uuid`)
- Real-time updates (needs WebSocket or polling endpoint)
- Chat messages (needs chat endpoint)

### 📋 What You Need

1. **Backend API** implementing the endpoints (see `BACKEND_INTEGRATION.md`)
2. **Database** to store:
   - Topics (UUID, content, state)
   - Raw opinions (text, weight, username, topic UUID)
   - Clustered opinions (cluster_id, heading, leader_id)
   - Chat messages (optional)

3. **AI Clustering Service** to:
   - Process raw opinions
   - Generate clusters
   - Calculate sentiment (optional)
   - Determine cluster positions (optional)

## User Experience Highlights

### No Login Required
- Users join immediately via QR code
- Auto-generated usernames for simplicity
- Streamlined participation flow

### Visual Feedback
- Hand-drawn aesthetic (ScribbleMind style)
- Animated cluster visualization
- Real-time sentiment coloring
- Interactive hover states

### Accessibility
- Keyboard navigation support
- Respects `prefers-reduced-motion`
- WCAG AA contrast ratios
- Responsive design

## Demo Flow

1. **Start Dev Server**: `npm start`
2. **Go to `/dev`**: See all pages with mock data
3. **Or test real flow**:
   - Visit `/admin`
   - Create topic
   - Get UUID
   - Visit `/invite/:uuid`
   - Scan QR or visit `/join/:uuid`
   - Fill out poll at `/poll/:uuid`
   - See results at `/live/:uuid`

## Full Integration Checklist

- [ ] Backend API running on `http://localhost:4200`
- [ ] All endpoints implemented (see `BACKEND_INTEGRATION.md`)
- [ ] CORS enabled for frontend origin
- [ ] Database configured
- [ ] AI clustering service ready
- [ ] WebSocket server (optional, for real-time updates)
- [ ] Test full flow end-to-end
