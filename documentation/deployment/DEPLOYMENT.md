# Deployment Guide - Amplify.io

## Quick Start

### Using Docker Compose

```bash
docker-compose up -d
```

The application will be available at `http://localhost:4200`

### Using Docker

```bash
docker build -t amplify:latest .
docker run -p 4200:4200 -v ./state:/state amplify:latest
```

## Environment Variables

- `FLASK_PORT`: Port for Flask server (default: 4200)
- `STATE_DIR`: Directory for persistent state (default: /state)
- `DB_FILE`: Database file path (default: $STATE_DIR/db.sqlite)

## Production Deployment

1. Build the Docker image:
   ```bash
   docker build -t amplify:latest .
   ```

2. Run with volumes for persistence:
   ```bash
   docker run -d \
     --name amplify-app \
     -p 4200:4200 \
     -v ./state:/state \
     --restart unless-stopped \
     amplify:latest
   ```

## Development

### Backend
```bash
cd code/backend
pip install -r ../requirements.txt
python app.py
```

### Frontend
```bash
cd code/frontend
npm install
npm start
```

## Health Check

The application includes a health check endpoint:
```
GET /api/status
```

## CI/CD

GitHub Actions workflow is configured in `.github/workflows/ci.yml`:
- Runs linting and tests on push/PR
- Builds Docker image
- Can be extended for deployment

