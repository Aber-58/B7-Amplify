# Consensus.io - Code Directory

This directory contains the complete source code for the Consensus.io platform, including both backend (Python/Flask) and frontend (React/TypeScript) components.

## 📁 Directory Structure

```
code/
├── backend/              # Python Flask backend application
│   ├── app.py           # Main Flask application (routes, CORS, static serving)
│   ├── pages.py         # API endpoint handlers (REST routes)
│   ├── database.py      # Database operations (SQLite queries)
│   ├── opinion_clustering.py  # AI clustering algorithm (ML/AI)
│   ├── sentiment_analyzer.py  # Sentiment analysis (NLP)
│   ├── utils_llm.py     # LLM integration (Mistral AI)
│   ├── simulate_poll.py # Test data generator script
│   └── SIMULATION_GUIDE.md  # How to use simulation script
│
├── frontend/            # React TypeScript frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── routes/       # Page-level components
│   │   ├── service/     # API client & type definitions
│   │   ├── store/       # Global state management
│   │   └── lib/         # Utility functions
│   ├── build/           # Production build (generated)
│   └── README.md        # Frontend-specific docs
│
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker container configuration
├── env.source          # Environment variable template
├── build.sh           # Build script for Docker
└── run.sh             # Docker run helper script
```

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r ../requirements.txt

# Set up environment variables
export STATE_DIR=../../state
export DB_FILE=$STATE_DIR/db.sqlite
export FLASK_PORT=4200
export MISTRAL_API_KEY=your-key-here  # Optional

# Initialize database
python -c "import database; database.init()"

# Start server
python app.py
```

The backend will start on `http://localhost:4200`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

### 3. Build Frontend for Production

```bash
cd frontend
npm run build
```

This creates `frontend/build/` which the backend serves as static files.

## 🔧 Development Workflow

### Running Both Backend and Frontend

**Terminal 1 - Backend:**
```bash
cd code/backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd code/frontend
npm start
```

**Production (Backend serves frontend):**
```bash
cd code/frontend
npm run build

cd ../backend
python app.py
# Visit http://localhost:4200
```

## 📋 Backend Architecture

### `app.py` - Application Entry Point
- Flask app initialization
- CORS configuration
- Static file serving (serves `frontend/build/`)
- Blueprint registration

### `pages.py` - API Routes
- **POST** `/api/admin` - Create topic
- **GET** `/api/admin` - Get all topics with opinions
- **DELETE** `/api/admin/:uuid` - Delete topic
- **POST** `/api/admin/:uuid/opinion` - Add manual opinion
- **GET** `/api/topic/:uuid` - Get topic info
- **POST** `/api/join/:uuid` - Join session
- **POST** `/api/poll/:uuid` - Submit opinion
- **GET** `/api/live/:uuid` - Get live view data
- **GET** `/api/clusters/:uuid` - Get clustered opinions
- **POST** `/api/trigger_clustering/:uuid` - Start clustering

### `database.py` - Database Layer
- SQLite database operations
- Schema definitions
- CRUD operations for:
  - Users (username, session_id)
  - Topics (uuid, content, state, deadline)
  - RawOpinions (opinion, weight, username)
  - ClusteredOpinions (heading, leader_id)
  - ChatMessages

### `opinion_clustering.py` - AI Clustering
- Text preprocessing and normalization
- Semantic embeddings using Sentence Transformers
- HDBSCAN clustering algorithm
- Adaptive parameter calculation
- Leader selection (weight + centrality)
- Quality metrics (silhouette score)

### `sentiment_analyzer.py` - Sentiment Analysis
- Multilingual sentiment analysis
- Batch processing support
- Confidence threshold validation

### `utils_llm.py` - LLM Integration
- Mistral AI API integration
- Cluster title generation
- Solution proposal generation

## 📋 Frontend Architecture

### Component Structure

**`components/`** - Reusable UI:
- `CloudMap.tsx` - Interactive cluster visualization
- `ChatBox.tsx` - Chat interface
- `OpinionForm.tsx` - Opinion submission form
- `QRBlock.tsx` - QR code display
- `Layout.tsx` - Page layout wrapper

**`routes/`** - Page Components:
- `admin/Admin.tsx` - Admin panel with topic management
- `poll/Poll.tsx` - Opinion submission page
- `live/Live.tsx` - Live results visualization
- `invite/Invite.tsx` - QR code invitation page
- `join/Join.tsx` - Join flow handler

**`service/`** - API Client:
- `fetchService.ts` - HTTP request functions
- `Endpoints.ts` - API endpoint enum
- `model/` - TypeScript type definitions

**`store/`** - State Management:
- `clusterStore.ts` - Zustand store for cluster data

**`lib/`** - Utilities:
- `ws.ts` - WebSocket client
- `sentiment.ts` - Sentiment color calculations
- `motion.ts` - Animation variants
- `colors.ts` - Color palette

## 🗄️ Database Schema

```sql
User (username, session_id)
  ↓
Topics (uuid, content, current_state, deadline)
  ↓
RawOpinion (raw_id, username, uuid, opinion, weight, clustered_opinion_id)
  ↓
ClusteredOpinion (cluster_id, uuid, current_heading, leader_id)
  ↓
RawOpinionClusteredOpinion (raw_opinion_id, clustered_opinion_id)
  ↓
LeaderVote (uuid, username, clustered_opinion_id)
ChatMessage (id, message, timestamp)
```

## 🔄 Data Flow

```
User Opinion Submission
    ↓
POST /api/poll/:uuid
    ↓
database.insert_raw_opinion()
    ↓
SQLite Storage
    ↓
Admin Triggers Clustering
    ↓
POST /api/trigger_clustering/:uuid
    ↓
opinion_clustering.trigger()
    ↓
Worker Process:
  - Load opinions from DB
  - Generate embeddings
  - Run clustering algorithm
  - Select leaders
  - Save clusters to DB
    ↓
GET /api/clusters/:uuid
    ↓
Frontend Visualization
```

## 🧪 Testing

### Generate Test Data

```bash
cd backend
python simulate_poll.py \
  --topic "Your topic here" \
  --opinions 100 \
  --messages 20
```

### Manual Testing

1. Start backend: `python app.py`
2. Start frontend: `npm start` (in frontend/)
3. Create topic in admin panel
4. Use simulation script to add opinions
5. Trigger clustering
6. View results in live view

## 🐳 Docker Deployment

```bash
# Build image
docker build -t consensus-app .

# Run container
docker run -p 4200:4200 \
  -v $(pwd)/../state:/state \
  -e MISTRAL_API_KEY=your-key \
  consensus-app
```

## 📝 Environment Variables

Create `env.source` or set these variables:

```bash
STATE_DIR=/state                    # Persistent data directory
DB_FILE=$STATE_DIR/db.sqlite       # Database file
FLASK_PORT=4200                     # Server port
MISTRAL_API_KEY=your-key-here       # Optional LLM features
```

## 🔍 Key Files Explained

### Backend Files

- **`app.py`**: Flask app setup, serves React build, handles 404s
- **`pages.py`**: All REST API endpoints, request/response handling
- **`database.py`**: All SQL queries, database operations
- **`opinion_clustering.py`**: Core ML clustering logic
- **`sentiment_analyzer.py`**: NLP sentiment analysis
- **`utils_llm.py`**: Mistral AI integration for summaries

### Frontend Files

- **`src/App.tsx`**: Main React app, routing setup
- **`src/service/fetchService.ts`**: All API calls to backend
- **`src/store/clusterStore.ts`**: Global cluster state
- **`src/routes/admin/Admin.tsx`**: Admin panel UI
- **`src/routes/live/Live.tsx`**: Live results page

## 🚨 Common Issues

### Import Errors
- Ensure all dependencies installed: `pip install -r requirements.txt` and `npm install`
- Check Python/Node versions match requirements

### Database Errors
- Verify `STATE_DIR` exists and is writable
- Check database permissions
- Reinitialize if corrupted: delete `db.sqlite` and restart

### Clustering Not Working
- Check model files downloaded to `/state`
- Verify enough memory for model loading
- Check worker process logs

### CORS Errors
- Ensure `supports_credentials=True` in `app.py`
- Check frontend is using `credentials: 'include'` in fetch calls

## 📚 Further Reading

- See [../README.md](../README.md) for project overview
- See [frontend/README.md](frontend/README.md) for frontend details
- See [backend/SIMULATION_GUIDE.md](backend/SIMULATION_GUIDE.md) for testing

