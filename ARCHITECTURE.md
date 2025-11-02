# Architecture Documentation

## System Overview

Amplify is a full-stack web application for real-time collaborative opinion polling with AI-powered clustering and sentiment analysis.

## Technology Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Routing**: React Router 7.9.5
- **Styling**: Tailwind CSS 3.4.18
- **Build Tool**: Create React App / react-scripts 5.0.1
- **QR Codes**: react-qr-code 2.0.18

### Backend
- **Framework**: Flask 3.1.2
- **Language**: Python 3.12
- **Database**: SQLite (production-ready for PostgreSQL)
- **CORS**: flask-cors 6.0.1

### Machine Learning & AI
- **Embeddings**: sentence-transformers with Tencent Youtu-Embedding model
- **Clustering**: scikit-learn HDBSCAN algorithm
- **Sentiment Analysis**: transformers 4.53.3 with DistilBERT model
- **LLM**: mistralai SDK for solution generation

### Infrastructure
- **Containerization**: Docker
- **Deployment**: Render.com compatible

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Admin   │  │   Poll   │  │   Live   │  │  Invite  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│         │            │            │            │             │
│         └────────────┴────────────┴────────────┘             │
│                            │                                 │
│                     API Service Layer                        │
└────────────────────────────┼───────────────────────────────┘
                              │ HTTP/REST API
┌─────────────────────────────┼───────────────────────────────┐
│                      Backend (Flask)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes      │  │  Database    │  │   Clustering │     │
│  │  (pages.py)   │  │  (database)  │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │               │                    │              │
│         │               │                    │              │
│  ┌──────┴───────┬───────┴──────┬────────────┴──────┐      │
│  │              │              │                     │      │
│  │    SQLite    │  Sentiment   │  Sentence Transform │      │
│  │   Database   │   Analyzer   │  + HDBSCAN Clust.   │      │
│  │              │              │                     │      │
│  └──────────────┴──────────────┴─────────────────────┘      │
│                              │                              │
│                      Mistral AI API                        │
└──────────────────────────────┼──────────────────────────────┘
                               │
┌───────────────────────────────┴──────────────────────────────┐
│                    External Services                          │
│  - Hugging Face (Model Downloads)                            │
│  - Mistral AI (LLM Solution Generation)                     │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Opinion Submission Flow

```
User → Login → Poll Page → Submit Opinion → Backend
                                              │
                                              ├─→ Database (SQLite)
                                              ├─→ Sentiment Analysis
                                              └─→ Response
```

### 2. Clustering Flow

```
Admin → Trigger Clustering → Backend
                                │
                                ├─→ Get Raw Opinions (Database)
                                ├─→ Generate Embeddings (Sentence Transformers)
                                ├─→ Cluster (HDBSCAN)
                                ├─→ Select Leaders (Weighted Random)
                                ├─→ Generate Headings (LLM)
                                ├─→ Store Clusters (Database)
                                └─→ Return Clustered Data
```

### 3. Live View Flow

```
User → Live View → Backend
                     │
                     ├─→ Get Clustered Opinions
                     ├─→ Check Leader Status
                     ├─→ Get Votes/Chat
                     └─→ Return Live Data
```

## Database Schema

### Tables

1. **User**
   - `username` (PRIMARY KEY)
   - `session_id` (UNIQUE)

2. **Topics**
   - `uuid` (PRIMARY KEY)
   - `content` (Topic text)
   - `current_state` (Enum: 0=question, 1=loading, 2=live, 3=result)
   - `deadline` (Unix timestamp)

3. **RawOpinion**
   - `raw_id` (PRIMARY KEY, AUTOINCREMENT)
   - `username` (FOREIGN KEY → User)
   - `uuid` (FOREIGN KEY → Topics)
   - `opinion` (Text)
   - `weight` (Rating)
   - `clustered_opinion_id` (FOREIGN KEY → ClusteredOpinion)

4. **ClusteredOpinion**
   - `cluster_id` (PRIMARY KEY, AUTOINCREMENT)
   - `uuid` (FOREIGN KEY → Topics)
   - `current_heading` (AI-generated heading)
   - `leader_id` (FOREIGN KEY → User)

5. **RawOpinionClusteredOpinion** (Junction Table)
   - `raw_opinion_id` (FOREIGN KEY → RawOpinion)
   - `clustered_opinion_id` (FOREIGN KEY → ClusteredOpinion)

6. **LeaderVote**
   - `uuid` (FOREIGN KEY → Topics)
   - `username` (FOREIGN KEY → User)
   - `cluster_id` (FOREIGN KEY → ClusteredOpinion)

7. **LeaderChat**
   - `uuid` (FOREIGN KEY → Topics)
   - `username` (FOREIGN KEY → User)
   - `message` (Text)

## API Design

### RESTful Principles

- **GET**: Retrieve resources
- **POST**: Create resources or trigger actions
- **PUT/PATCH**: Update resources (not currently used)
- **DELETE**: Remove resources (not currently used)

### Authentication

- **Method**: Cookie-based sessions
- **Cookie Name**: `sessionCookie`
- **Session Storage**: Database (User table)

### Response Format

Success:
```json
{
  "status": "success",
  "data": {...}
}
```

Error:
```json
{
  "error": "Error message",
  "code": 400
}
```

## Machine Learning Pipeline

### 1. Sentiment Analysis

**Model**: DistilBERT (distilbert-base-uncased-finetuned-sst-2-english)

**Process**:
1. Text preprocessing (clean URLs, emails, normalize whitespace)
2. Binary classification (positive/negative)
3. Confidence scoring
4. Return label, score, and confidence level

**Key Features**:
- Binary classification (no neutral)
- High confidence thresholds
- Batch processing support

### 2. Opinion Clustering

**Embedding Model**: Tencent Youtu-Embedding

**Clustering Algorithm**: HDBSCAN

**Process**:
1. Extract raw opinions for topic
2. Generate embeddings using sentence transformers
3. Apply HDBSCAN clustering (cosine similarity)
4. Select cluster leaders (weighted random based on ratings)
5. Generate cluster headings using Mistral AI
6. Store clustered data in database

**Configuration**:
- `min_samples=2`: Minimum samples per cluster
- `min_cluster_size=2`: Minimum cluster size
- `metric="cosine"`: Cosine similarity for embeddings
- `allow_single_cluster=True`: Allow single cluster if all opinions similar

### 3. Solution Generation

**LLM**: Mistral AI

**Process**:
1. Input clustered opinions
2. Generate structured prompt
3. Call Mistral API
4. Parse solution proposals
5. Return formatted results

## Security Considerations

1. **Session Management**
   - HttpOnly cookies
   - SameSite=Strict
   - Session validation on protected routes

2. **Rate Limiting**
   - Implemented for clustering trigger (1 second cooldown)
   - Can be extended to other endpoints

3. **Input Validation**
   - Topic validation
   - Opinion length checks
   - Rating bounds checking

4. **CORS**
   - Configured for frontend origin
   - Can be restricted in production

## Scalability Considerations

### Current Limitations

1. **SQLite Database**
   - Single connection
   - Not suitable for high concurrency
   - **Recommendation**: Migrate to PostgreSQL

2. **In-Memory Processing**
   - Clustering runs in worker processes
   - Models loaded per process
   - Memory intensive

3. **Stateless Clustering**
   - Clusters recalculated on each trigger
   - Results cached in memory (not persistent)

### Recommendations

1. **Database Migration**
   - PostgreSQL with connection pooling
   - Indexed queries for performance

2. **Caching Layer**
   - Redis for cluster results
   - Model caching
   - Session caching

3. **Background Jobs**
   - Celery for async clustering
   - Queue management
   - Job status tracking

4. **CDN for Static Assets**
   - Frontend build served via CDN
   - Model files cached

5. **Load Balancing**
   - Multiple Flask instances
   - Shared database
   - Session storage in Redis

## Deployment Architecture

### Development

```
Frontend (React Dev Server) :3000
        ↓
Backend (Flask) :4200
        ↓
SQLite Database
```

### Production (Docker)

```
Docker Container
├── Frontend Build (static files)
├── Flask Application
├── SQLite Database (volume mounted)
└── Model Cache
```

### Cloud (Render.com)

```
Render Web Service
├── Docker Build
├── Ephemeral Filesystem
├── Persistent Database (PostgreSQL recommended)
└── Environment Variables
```

## Monitoring & Logging

### Current Implementation

- Python logging module
- Console output
- Error handling with try/catch

### Recommendations

1. **Structured Logging**
   - JSON format
   - Log levels (DEBUG, INFO, WARNING, ERROR)
   - Request ID tracking

2. **Monitoring**
   - Health check endpoint (`/health`)
   - Metrics collection
   - Error tracking (Sentry)

3. **Performance**
   - Request timing
   - Database query performance
   - ML model inference time

## Future Improvements

1. **Real-time Updates**
   - WebSocket support
   - Server-Sent Events (SSE)

2. **Advanced Clustering**
   - Multiple clustering algorithms
   - Hierarchical clustering visualization
   - Cluster quality metrics

3. **Enhanced AI**
   - Fine-tuned models
   - Custom embeddings
   - Multi-language support

4. **Analytics**
   - Usage statistics
   - Opinion trends
   - Sentiment over time

---

*Last Updated: 2024*

