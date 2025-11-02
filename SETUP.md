# Setup Guide

This guide will help you set up Amplify for local development or production deployment.

## Quick Start (5 minutes)

### Prerequisites Check

```bash
# Check Python version (3.12+ required)
python3 --version

# Check Node.js version (18+ required)
node --version

# Check Docker (optional, for containerized deployment)
docker --version
```

### Local Development Setup

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd B7-Amplify
```

#### Step 2: Backend Setup

```bash
# Navigate to project root
cd code

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

**Note**: First-time installation may take 5-10 minutes as it downloads ML models (~300MB).

#### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install
```

#### Step 4: Initialize Database

```bash
# Navigate to backend directory
cd ../backend

# Create state directory
mkdir -p ../../state

# Initialize database
python3 -c "import database as db; db.init()"
```

#### Step 5: Run Application

**Option A: Development Mode (Recommended)**

Terminal 1 - Backend:
```bash
cd code/backend
export FLASK_PORT=4200
export STATE_DIR=../../state
export DB_FILE=$STATE_DIR/db.sqlite
python app.py
```

Terminal 2 - Frontend:
```bash
cd code/frontend
npm start
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4200

**Option B: Production Build**

Build frontend:
```bash
cd code/frontend
npm run build
```

Run backend:
```bash
cd code/backend
export FLASK_PORT=4200
python app.py
```

Access: http://localhost:4200

## Docker Setup

### Build Docker Image

```bash
# From project root
docker build -f code/deploy/Dockerfile -t amplify:latest .
```

### Run Container

```bash
# Create state directory
mkdir -p state

# Run container
docker run -d \
  --name amplify-app \
  -p 4200:4200 \
  -v $(pwd)/state:/state \
  -e FLASK_PORT=4200 \
  amplify:latest
```

### Check Logs

```bash
docker logs -f amplify-app
```

### Stop Container

```bash
docker stop amplify-app
docker rm amplify-app
```

## Environment Configuration

### Local Development

Create `.env` file in project root:

```bash
# .env
FLASK_PORT=4200
STATE_DIR=./state
DB_FILE=./state/db.sqlite
PYTHONUNBUFFERED=1
```

### Production

Set environment variables in your deployment platform:

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | Auto-set by platform | Server port (Render.com sets this) |
| `FLASK_PORT` | `4200` | Fallback port |
| `STATE_DIR` | `/state` | Persistent data directory |
| `DB_FILE` | `/state/db.sqlite` | Database file path |
| `PYTHONUNBUFFERED` | `1` | Python output buffering |

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 4200
lsof -i :4200  # macOS/Linux
netstat -ano | findstr :4200  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 2. Model Download Fails

```bash
# Set HuggingFace cache directory
export HF_HOME=~/.cache/huggingface

# Or in Python
import os
os.environ['HF_HOME'] = '/path/to/cache'
```

#### 3. Database Locked

- Ensure only one instance accesses SQLite
- Check for zombie processes
- Delete database and reinitialize if needed

#### 4. Frontend Build Fails

```bash
# Clear node modules and reinstall
cd code/frontend
rm -rf node_modules package-lock.json
npm install
```

#### 5. Memory Issues with ML Models

- Ensure sufficient RAM (2GB+ recommended)
- Close other applications
- Use smaller models if available

### Dependency Issues

#### Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

#### Node Dependencies

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Hot Reload

- **Frontend**: Enabled by default with `npm start`
- **Backend**: Flask auto-reloads on file changes

### Database Inspection

```bash
# SQLite command line
sqlite3 state/db.sqlite

# Useful commands
.tables
.schema
SELECT * FROM Topics;
```

### Testing Sentiment Analyzer

```bash
cd code/backend
python3
>>> from sentiment_analyzer import SentimentAnalyzer
>>> analyzer = SentimentAnalyzer()
>>> result = analyzer.analyze("I love this product!")
>>> print(result)
```

### API Testing

```bash
# Using curl
curl -X POST http://localhost:4200/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# Health check
curl http://localhost:4200/health
```

## Production Checklist

Before deploying to production:

- [ ] Frontend built (`npm run build`)
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Health check endpoint working
- [ ] CORS configured correctly
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Security headers set
- [ ] Database migration (if using PostgreSQL)
- [ ] Backup strategy in place
- [ ] Monitoring configured

## Next Steps

- Read [README.md](./README.md) for usage instructions
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for cloud deployment

---

*Need help? Open an issue on GitHub.*

