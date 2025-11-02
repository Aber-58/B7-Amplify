# Consensus.io - Collective Intelligence Platform

A modern web application for collecting, clustering, and visualizing group opinions using AI-powered semantic analysis and real-time visualization.

## 🎯 What is This?

Consensus.io is a collective intelligence platform that helps groups reach consensus by:

1. **Collecting opinions** from participants via polls
2. **Clustering similar ideas** using AI/ML semantic similarity analysis
3. **Visualizing patterns** in real-time with interactive cluster maps
4. **Enabling discussion** through integrated chat features

### Use Cases

- Team retrospectives and feedback sessions
- Event surveys and participant engagement
- Public consultation and stakeholder input
- Any scenario requiring collective opinion gathering and analysis

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │  Admin   │  │   Poll   │  │   Live   │  │   Join   ││
│  │  Panel   │  │  Form    │  │   View   │  │   Flow   ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘│
│       │             │              │             │       │
│       └─────────────┴──────────────┴─────────────┘       │
│                           │                               │
│                  ┌────────▼────────┐                     │
│                  │  API Service    │                     │
│                  │  (fetchService) │                     │
│                  └────────┬────────┘                     │
└───────────────────────────┼─────────────────────────────┘
                             │ HTTP/WebSocket
┌───────────────────────────▼─────────────────────────────┐
│                    Backend (Flask)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   API Routes │  │   Database   │  │   Clustering │  │
│  │   (pages.py) │  │  (SQLite)    │  │   (ML/AI)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                 │          │
│         └──────────────────┴─────────────────┘          │
│                              │                           │
│         ┌────────────────────▼──────────────┐          │
│         │  Opinion Clustering Pipeline      │          │
│         │  1. Text Preprocessing            │          │
│         │  2. Semantic Embeddings (ML)     │          │
│         │  3. HDBSCAN Clustering            │          │
│         │  4. Leader Selection               │          │
│         └────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
B7-Amplify/
├── code/
│   ├── backend/              # Python Flask backend
│   │   ├── app.py            # Flask app initialization & static serving
│   │   ├── pages.py          # API route handlers
│   │   ├── database.py       # SQLite database operations
│   │   ├── opinion_clustering.py  # AI clustering algorithm
│   │   ├── sentiment_analyzer.py  # Sentiment analysis
│   │   ├── utils_llm.py      # Mistral AI integration
│   │   └── simulate_poll.py  # Test data generator
│   │
│   ├── frontend/             # React TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   │   ├── CloudMap.tsx      # Cluster visualization
│   │   │   │   ├── ChatBox.tsx       # Chat interface
│   │   │   │   ├── OpinionForm.tsx   # Opinion submission form
│   │   │   │   └── ...
│   │   │   ├── routes/       # Page components
│   │   │   │   ├── admin/    # Admin panel
│   │   │   │   ├── poll/     # Opinion submission
│   │   │   │   ├── live/     # Live results view
│   │   │   │   └── ...
│   │   │   ├── service/      # API client layer
│   │   │   │   ├── fetchService.ts  # HTTP requests
│   │   │   │   └── model/    # TypeScript type definitions
│   │   │   ├── store/        # State management (Zustand)
│   │   │   └── lib/          # Utilities
│   │   └── build/            # Production build output
│   │
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile           # Docker configuration
│   └── env.source           # Environment variables
│
├── documentation/            # Additional documentation
│   ├── api.md              # API specification
│   └── *.ipynb             # Jupyter notebooks for analysis
│
└── state/                   # Persistent data (created at runtime)
    └── db.sqlite            # SQLite database
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** with pip
- **Node.js 16+** and npm
- **Docker** (optional, for containerized deployment)

### Option 1: Local Development

#### Backend Setup

```bash
cd code/backend

# Install Python dependencies
pip install -r ../requirements.txt

# Set environment variables
export STATE_DIR=../state
export DB_FILE=$STATE_DIR/db.sqlite
export FLASK_PORT=4200
export MISTRAL_API_KEY=your-api-key-here  # Optional, for LLM features

# Initialize database
python -c "import database; database.init()"

# Start Flask server
python app.py
```

Backend will run on `http://localhost:4200`

#### Frontend Setup

```bash
cd code/frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

### Option 2: Docker Deployment

```bash
cd code

# Build Docker image
docker build -t consensus-app .

# Run container
docker run -p 4200:4200 \
  -v $(pwd)/../state:/state \
  -e MISTRAL_API_KEY=your-api-key \
  consensus-app
```

The app will be available at `http://localhost:4200`

## 🔄 How It Works

### User Flow

1. **Admin creates a topic** (`/admin`)
   - Enters a question/topic text
   - Receives a unique UUID
   - Generates QR codes for invitation

2. **Participants join** (`/join/:uuid`)
   - Scan QR code or visit invite link
   - No login required (auto-generated username)

3. **Participants submit opinions** (`/poll/:uuid`)
   - Enter opinion text
   - Rate importance (1-10)
   - Submit to backend

4. **Admin triggers clustering** (`/admin`)
   - Clicks "Cluster" button
   - AI processes opinions:
     - Generates semantic embeddings
     - Groups similar opinions using HDBSCAN
     - Selects cluster leaders (highest weight + centrality)

5. **View live results** (`/live/:uuid`)
   - Interactive cluster visualization
   - Real-time chat
   - Sentiment analysis

### Technical Flow

```
Opinion Submission
    ↓
Database Storage (SQLite)
    ↓
Trigger Clustering
    ↓
Text Preprocessing & Normalization
    ↓
Semantic Embeddings (Sentence Transformers)
    ↓
HDBSCAN Clustering Algorithm
    ↓
Leader Selection (Weight + Centrality)
    ↓
Database Update (Clustered Opinions)
    ↓
Real-time Visualization (d3-force + RoughJS)
```

## 🛠️ Key Technologies

### Backend
- **Flask**: Web framework and API server
- **SQLite**: Lightweight database
- **Sentence Transformers**: Semantic text embeddings
- **scikit-learn**: HDBSCAN clustering algorithm
- **Mistral AI**: LLM for generating cluster summaries

### Frontend
- **React + TypeScript**: UI framework
- **TailwindCSS**: Styling
- **Framer Motion**: Animations
- **RoughJS**: Hand-drawn aesthetic graphics
- **d3-force**: Physics simulation for cluster positioning
- **Zustand**: State management

## 📚 Documentation

### Main Documentation Files

- **[Frontend README](code/frontend/README.md)** - Frontend-specific documentation
- **[Backend Integration Guide](code/frontend/BACKEND_INTEGRATION.md)** - API documentation
- **[User Flow Guide](code/frontend/USER_FLOW.md)** - Detailed user journey
- **[Demo Walkthrough](code/frontend/DEMO_WALKTHROUGH.md)** - Demo preparation guide
- **[Simulation Guide](code/backend/SIMULATION_GUIDE.md)** - Test data generation

### Code Documentation

- **`code/backend/app.py`**: Flask application setup and static file serving
- **`code/backend/pages.py`**: All API endpoint definitions
- **`code/backend/database.py`**: Database schema and query functions
- **`code/backend/opinion_clustering.py`**: AI clustering algorithm implementation
- **`code/frontend/src/service/fetchService.ts`**: API client functions

## 🔧 Configuration

### Environment Variables

**Backend** (`code/env.source`):
```bash
STATE_DIR=/state              # Directory for persistent data
DB_FILE=$STATE_DIR/db.sqlite # Database file path
FLASK_PORT=4200              # Server port
MISTRAL_API_KEY=...          # Optional: Mistral AI API key
```

**Frontend** (`.env` file):
```bash
REACT_APP_API_URL=http://localhost:4200/api  # Backend API URL
REACT_APP_WS_URL=ws://localhost:4200         # WebSocket URL (optional)
```

## 🧪 Testing & Development

### Generate Test Data

```bash
cd code/backend

# Create topic with 100 opinions
python simulate_poll.py \
  --topic "How can we improve team collaboration?" \
  --opinions 100 \
  --messages 20

# Add opinions to existing topic
python simulate_poll.py \
  --topic-id <uuid> \
  --opinions 50
```

### Development Showcase

Visit `http://localhost:3000/dev` to see all components with mock data (no backend required).

## 🎨 Features

### Admin Panel
- ✅ Create topics
- ✅ Generate QR codes (Invite & Live Results)
- ✅ View all opinions
- ✅ Trigger AI clustering
- ✅ Delete topics
- ✅ Add manual opinions
- ✅ Advanced features toggle

### Participant Experience
- ✅ Join via QR code (no login required)
- ✅ Submit opinions with ratings
- ✅ View live cluster visualization
- ✅ Real-time chat interface

### AI Clustering
- ✅ Semantic similarity analysis
- ✅ Adaptive clustering parameters
- ✅ Noise point handling
- ✅ Smart leader selection (weight + centrality)
- ✅ Cluster quality metrics

## 🔐 Security & Best Practices

- **CORS**: Configured for secure cross-origin requests
- **Cookie-based sessions**: HttpOnly, SameSite=Lax
- **Input validation**: Both frontend and backend
- **SQL injection protection**: Parameterized queries
- **Rate limiting**: Applied to clustering endpoint

## 📈 Performance

- **Model caching**: Sentence transformer loaded once per worker
- **Parallel processing**: Multiple worker processes for clustering
- **Efficient embeddings**: Batch processing for multiple opinions
- **Adaptive clustering**: Parameters scale with data size

## 🤝 Contributing

This is a research/educational project. For contributions:

1. Follow the existing code structure
2. Add TypeScript types for new features
3. Document API changes
4. Test with simulation script before submitting

## 📄 License

See [license.txt](license.txt) for details.

## 🆘 Troubleshooting

### Backend not connecting
- Check `FLASK_PORT` environment variable
- Verify backend is running: `curl http://localhost:4200/api/status`
- Check CORS configuration in `app.py`

### Clustering not working
- Ensure Python dependencies installed: `pip install -r requirements.txt`
- Check model downloads to `/state` directory
- Review logs in console for errors

### Frontend build issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 16+)
- Verify environment variables are set

### Database issues
- Ensure `STATE_DIR` exists and is writable
- Check database file permissions
- Reinitialize database if corrupted: Delete `db.sqlite` and restart

## 📞 Support

For issues or questions, check:
1. This README
2. Component-specific documentation
3. Code comments in relevant files

