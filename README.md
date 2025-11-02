# Amplify

A real-time collaborative opinion polling and clustering platform powered by AI. Amplify enables teams to gather feedback, cluster similar opinions using machine learning, analyze sentiment, and generate actionable insights.

## 🚀 Features

- **Real-time Opinion Polling**: Create topics and gather participant feedback with ratings
- **AI-Powered Clustering**: Automatically groups similar opinions using sentence embeddings and HDBSCAN clustering
- **Sentiment Analysis**: Binary sentiment analysis (positive/negative) to understand opinion polarity
- **Live Collaboration**: Real-time live view for leaders to vote and discuss clustered solutions
- **LLM-Generated Insights**: Uses Mistral AI to generate proposed solutions from clustered opinions
- **QR Code Integration**: Easy session joining via QR codes
- **Session Management**: Cookie-based authentication with deadline tracking

## 🏗️ Architecture

- **Frontend**: React 19 with TypeScript, Tailwind CSS, React Router
- **Backend**: Flask (Python 3.12) with RESTful API
- **Database**: SQLite (can be migrated to PostgreSQL for production)
- **ML/AI**:
  - Sentence Transformers for opinion embeddings
  - HDBSCAN clustering algorithm
  - DistilBERT for binary sentiment analysis
  - Mistral AI for solution generation
- **Deployment**: Docker containerization, ready for Render.com and other platforms

## 📋 Prerequisites

- Python 3.12+
- Node.js 18+ (LTS)
- Docker (for containerized deployment)
- Git

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd B7-Amplify
   ```

2. **Backend Setup**
   ```bash
   cd code/backend
   pip install -r ../requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   ```bash
   # Create state directory for database
   mkdir -p ../../state
   
   # Set environment variables (optional, defaults are set)
   export STATE_DIR=../../state
   export DB_FILE=$STATE_DIR/db.sqlite
   export FLASK_PORT=4200
   ```

5. **Initialize Database**
   ```bash
   cd ../backend
   python -c "import database as db; db.init()"
   ```

6. **Run the Application**

   **Option A: Run separately**
   ```bash
   # Terminal 1: Backend
   cd code/backend
   python app.py
   
   # Terminal 2: Frontend (development)
   cd code/frontend
   npm start
   ```

   **Option B: Using Docker**
   ```bash
   cd code
   docker build -f deploy/Dockerfile -t amplify:latest ..
   docker run -p 4200:4200 -v $(pwd)/../state:/state amplify:latest
   ```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for Render.com and other platforms.

## 🎯 Usage

### For Administrators

1. **Create a Topic**
   - Navigate to `/admin`
   - Enter a topic/question
   - Share the generated QR code or UUID with participants

2. **Monitor Responses**
   - View all opinions in real-time
   - Trigger clustering when ready
   - Review sentiment analysis results

3. **Review Clustered Solutions**
   - Generated clusters with AI-generated headings
   - Leader selection for each cluster
   - LLM-generated solution proposals

### For Participants

1. **Join a Session**
   - Login with username at `/login/:uuid`
   - Or scan QR code from `/invite/:uuid`

2. **Submit Opinion**
   - Navigate to `/poll/:uuid`
   - Enter your opinion/feedback
   - Rate it (rating affects clustering weight)

3. **View Live Results**
   - Access `/live/:uuid` to see clustered opinions
   - Leaders can vote and chat in real-time

## 📁 Project Structure

```
B7-Amplify/
├── code/
│   ├── backend/
│   │   ├── app.py              # Flask application entry point
│   │   ├── pages.py            # API routes and endpoints
│   │   ├── database.py         # Database schema and operations
│   │   ├── opinion_clustering.py  # ML clustering logic
│   │   ├── sentiment_analyzer.py # Binary sentiment analysis
│   │   ├── utils_llm.py        # Mistral AI integration
│   │   └── utils_chat.py       # Chat utilities
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── routes/         # React route components
│   │   │   └── service/        # API client and models
│   │   └── package.json
│   ├── deploy/
│   │   └── Dockerfile          # Production Dockerfile
│   └── requirements.txt       # Python dependencies
├── documentation/             # API docs, notebooks, etc.
├── assets/                    # Images, videos, presentations
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - Create session with username

### Admin
- `POST /api/admin` - Create a new topic
- `GET /api/admin` - Get all opinions

### Polling
- `POST /api/poll/:uuid` - Submit opinion with rating
- `GET /api/topic/:uuid` - Get topic information

### Clustering
- `POST /api/trigger_clustering/:uuid` - Trigger opinion clustering
- `GET /api/clusters/:uuid` - Get clustered opinions with solutions

### Live View
- `GET /api/live/:uuid` - Get live view data (leader status)
- `POST /api/join/:uuid` - Join a session

See [documentation/api.md](./documentation/api.md) for complete API documentation.

## 🧪 Testing

### Sentiment Analyzer
```bash
cd code/backend
python -c "
from sentiment_analyzer import SentimentAnalyzer
analyzer = SentimentAnalyzer()
result = analyzer.analyze('I love this product!')
print(result)
"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_PORT` | Backend server port | `4200` |
| `PORT` | Render.com port (auto-set) | - |
| `STATE_DIR` | Directory for persistent data | `/state` |
| `DB_FILE` | SQLite database file path | `/state/db.sqlite` |
| `PYTHONUNBUFFERED` | Python output buffering | `1` |

### ML Model Configuration

- **Sentiment Model**: `distilbert-base-uncased-finetuned-sst-2-english`
- **Embedding Model**: `tencent/Youtu-Embedding`
- **Clustering**: HDBSCAN with cosine similarity

## 🐳 Docker Deployment

Build and run with Docker:

```bash
docker build -f code/deploy/Dockerfile -t amplify:latest .
docker run -d \
  --name amplify-app \
  -p 4200:4200 \
  -v $(pwd)/state:/state \
  amplify:latest
```

## 🌐 Cloud Deployment

### Render.com
1. Push code to GitHub
2. Connect repository in Render dashboard
3. Render auto-detects Dockerfile
4. Set environment variables
5. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](license.txt) file for details.

