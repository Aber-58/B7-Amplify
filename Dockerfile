# Multi-stage build for Amplify.io
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependencies
COPY code/frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source and build
COPY code/frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_PORT=4200 \
    STATE_DIR=/state

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend requirements and install
COPY code/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -e git+https://github.com/shoeffner/Flask-Websockets.git@master#egg=Flask-Websockets

# Copy backend code
COPY code/backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create state directory
RUN mkdir -p /state

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4200/api/status || exit 1

# Run application
CMD ["python", "-u", "backend/app.py"]

