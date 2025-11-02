# Backend - Consensus.io

Python Flask backend application providing REST API and AI-powered opinion clustering.

## 🏗️ Architecture

The backend is organized into logical modules:

- **API Layer** (`pages.py`) - REST endpoints
- **Database Layer** (`database.py`) - Data persistence
- **AI/ML Layer** (`opinion_clustering.py`, `sentiment_analyzer.py`) - Clustering and NLP
- **LLM Integration** (`utils_llm.py`) - Mistral AI for summaries
- **Application Setup** (`app.py`) - Flask configuration

## 📋 Module Overview

### `app.py` - Flask Application

Main application entry point:
- Initializes Flask app
- Configures CORS for frontend
- Serves React build files from `../frontend/build`
- Handles 404s by serving React app (SPA routing)
- Initializes database and clustering workers

**Key Functions:**
- `app = Flask(...)` - Creates Flask instance
- `CORS(app, supports_credentials=True)` - Enables cookies
- `serve(path)` - Serves static files or index.html

### `pages.py` - API Routes

All REST API endpoints:

**Topic Management:**
- `POST /api/admin` - Create new topic
- `GET /api/admin` - Get all topics with opinions
- `DELETE /api/admin/:uuid` - Delete topic and all data
- `GET /api/topic/:uuid` - Get topic information

**Opinions:**
- `POST /api/poll/:uuid` - Submit opinion (requires session)
- `POST /api/admin/:uuid/opinion` - Add manual opinion (admin)

**Clustering:**
- `GET /api/clusters/:uuid` - Get clustered opinions
- `POST /api/trigger_clustering/:uuid` - Trigger clustering (rate limited)

**User Flow:**
- `POST /api/login` - Create session (returns cookie)
- `POST /api/join/:uuid` - Join topic session
- `GET /api/live/:uuid` - Get live view data

**Response Format:**
All endpoints return JSON. Errors return `{"error": "message"}` with appropriate HTTP status codes.

### `database.py` - Database Operations

SQLite database wrapper with schema management.

**Schema:**

```sql
User (username PRIMARY KEY, session_id UNIQUE)
Topics (uuid PRIMARY KEY, content, current_state, deadline)
RawOpinion (raw_id PRIMARY KEY, username, uuid, opinion, weight, clustered_opinion_id)
ClusteredOpinion (cluster_id PRIMARY KEY, uuid, current_heading, leader_id)
RawOpinionClusteredOpinion (raw_opinion_id, clustered_opinion_id)
LeaderVote (uuid, username, clustered_opinion_id)
ChatMessage (id PRIMARY KEY, message, timestamp)
```

**Key Functions:**
- `init()` - Create tables if not exist
- `insert_topic()`, `insert_raw_opinion()`, etc. - CRUD operations
- `get_raw_opinions_for_topic()` - Query opinions by topic
- `get_clustered_opinions_with_raw_opinions()` - Get clusters with opinions
- `replace_clusters_for_topic()` - Replace all clusters for a topic
- `delete_topic()` - Delete topic and all related data

**Transaction Handling:**
- Uses `PRAGMA foreign_keys = ON` for referential integrity
- Rollback on errors
- Commits on success

### `opinion_clustering.py` - Clustering Algorithm

AI-powered opinion clustering using semantic similarity.

**Algorithm:**
1. **Text Preprocessing**: Normalize and clean opinion text
2. **Embedding Generation**: Convert text to semantic vectors using Sentence Transformers
3. **Clustering**: Apply HDBSCAN algorithm (density-based)
4. **Leader Selection**: Choose best opinion per cluster (weight + centrality)
5. **Quality Metrics**: Calculate silhouette score and noise ratio

**Features:**
- Model caching (singleton pattern) for efficiency
- Adaptive parameters based on data size
- Noise point handling (outliers become single-opinion clusters)
- Smart leader selection combining user weight and cluster centrality

**Configuration:**
- `MODEL_NAME = 'all-MiniLM-L6-v2'` - Fast, efficient embedding model
- Adaptive `min_cluster_size` and `min_samples` based on opinion count

**Worker Process:**
- Multi-process architecture for parallel clustering
- Background task queue
- Error handling and logging

### `sentiment_analyzer.py` - Sentiment Analysis

Multilingual sentiment analysis using Hugging Face transformers.

**Features:**
- Batch processing support
- Confidence threshold validation
- 5-class to 3-class label mapping
- Text preprocessing

**Usage:**
```python
from sentiment_analyzer import SentimentAnalyzer
analyzer = SentimentAnalyzer()
result = analyzer.analyze("This is great!")
# Returns: {'label': 'POSITIVE', 'score': 0.95}
```

### `utils_llm.py` - LLM Integration

Mistral AI integration for generating cluster summaries and titles.

**Functions:**
- `ask_mistral(prompt, model)` - Send prompt to Mistral API
- `choose_proposed_solutions(cluster_data)` - Generate solution proposals
- `get_category_titles_prompt(texts, labels)` - Generate category titles

**Requirements:**
- `MISTRAL_API_KEY` environment variable must be set
- Optional feature - clustering works without it

### `simulate_poll.py` - Test Data Generator

Command-line tool to generate test opinions and messages.

**Usage:**
```bash
# Create new topic with 100 opinions
python simulate_poll.py --topic "How can we improve X?" --opinions 100

# Add to existing topic
python simulate_poll.py --topic-id <uuid> --opinions 50

# Include chat messages
python simulate_poll.py --topic "..." --opinions 100 --messages 20
```

**Features:**
- Intelligent opinion generation based on topic category
- Diverse opinion variations
- Weighted ratings (skewed toward middle-high values)
- Unique usernames

## 🔄 Request/Response Examples

### Create Topic
```http
POST /api/admin
Content-Type: application/json

{
  "topic": "How can we improve team collaboration?"
}

Response: 200 OK
{
  "uuid": "abc-123-def-456",
  "deadline": 1234567890
}
```

### Submit Opinion
```http
POST /api/poll/abc-123-def-456
Content-Type: application/json
Cookie: sessionCookie=xyz

{
  "opinion": "We should use better communication tools",
  "rating": 8
}

Response: 200 OK
{
  "message": "Poll response recorded"
}
```

### Get Clusters
```http
GET /api/clusters/abc-123-def-456

Response: 200 OK
{
  "clusters": [
    {
      "cluster_id": 1,
      "heading": "Use better communication tools",
      "leader_id": "alice",
      "raw_opinions": [...]
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables

Set in `env.source` or export directly:

```bash
export STATE_DIR=/state              # Persistent data directory
export DB_FILE=$STATE_DIR/db.sqlite # Database file path
export FLASK_PORT=4200              # Server port
export MISTRAL_API_KEY=sk-...       # Optional: Mistral AI key
```

### CORS Configuration

Configured in `app.py`:
```python
CORS(app, supports_credentials=True)
```

This allows:
- Cookie-based authentication
- Cross-origin requests from frontend
- Credentials in fetch requests

## 🚀 Running the Backend

### Development Mode

```bash
cd backend
export FLASK_PORT=4200
export DB_FILE=../state/db.sqlite
export STATE_DIR=../state
python app.py
```

### Production Mode

1. Build frontend first:
```bash
cd ../frontend
npm run build
```

2. Start backend (serves frontend build):
```bash
cd ../backend
python app.py
```

Visit `http://localhost:4200` - backend serves both API and frontend.

## 🧪 Testing

### Manual API Testing

```bash
# Check server status
curl http://localhost:4200/api/status

# Create topic
curl -X POST http://localhost:4200/api/admin \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test topic"}'

# Generate test data
python simulate_poll.py --topic "Test" --opinions 10
```

### Unit Testing

See `test.py` for example tests (expand as needed).

## 🐛 Debugging

### Enable Debug Mode

In `app.py`, change:
```python
app.run(host='0.0.0.0', port=FLASK_PORT, debug=True)
```

### View Logs

- Check console output for clustering progress
- Worker processes log to stdout
- Database errors printed to console

### Common Issues

**Database locked:**
- SQLite doesn't handle concurrent writes well
- Use connection pooling if needed
- Check for unclosed connections

**Clustering slow:**
- Model loading takes time on first run
- Subsequent runs use cached model
- Check memory usage for large datasets

**Model download fails:**
- Check internet connection
- Verify `/state` directory is writable
- Model downloads to `MODEL_CACHE_FOLDER`

## 📊 Performance Considerations

- **Model caching**: Sentence transformer loaded once, reused
- **Worker processes**: Parallel clustering for multiple topics
- **Batch processing**: Opinions processed in batches
- **Adaptive clustering**: Parameters scale with data size

## 🔐 Security Notes

- Session cookies are HttpOnly and SameSite=Lax
- Input validation on all endpoints
- Parameterized SQL queries (prevents injection)
- Rate limiting on clustering endpoint
- CORS configured for specific origins

## 📚 Dependencies

See `requirements.txt` for full list. Key dependencies:

- `Flask` - Web framework
- `flask-cors` - CORS support
- `sentence-transformers` - Semantic embeddings
- `scikit-learn` - Clustering algorithms
- `torch` - PyTorch (for transformers)
- `mistralai` - Mistral AI SDK

## 🔄 Database Migrations

Current approach: Tables created automatically on first run via `init()`.

For schema changes:
1. Modify `database.py` `init()` function
2. Delete old `db.sqlite` or create migration script
3. Restart application

## 📝 Adding New Endpoints

1. Add route in `pages.py`:
```python
@routes.route('/api/new-endpoint', methods=['POST'])
def new_endpoint():
    data = request.get_json()
    # Process data
    return {"result": "success"}, 200
```

2. Add to `Endpoints` enum in frontend `service/Endpoints.ts`
3. Add function in frontend `service/fetchService.ts`
4. Use in frontend components

## 🚀 Deployment

### Docker

See `../Dockerfile` for containerized deployment.

### Production Considerations

- Use proper WSGI server (gunicorn, uwsgi)
- Set up reverse proxy (nginx)
- Use production database (PostgreSQL recommended for scale)
- Enable HTTPS
- Set up monitoring and logging

