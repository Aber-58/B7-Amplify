# Backend Integration Guide for consensus.io

## Overview

This guide explains how to connect the consensus.io frontend to your backend API. The frontend is designed to work seamlessly once the backend endpoints are properly configured.

## Backend Configuration

### API Endpoint

The frontend expects your backend API at:
- **Development**: `http://localhost:4200/api`
- **Production**: Set via environment variable `REACT_APP_API_URL`

To change the API endpoint, update `src/service/fetchService.ts`:

```typescript
const API_ENDPOINT = process.env.REACT_APP_API_URL || `http://localhost:4200/api`;
```

## Required Backend Endpoints

### 1. Admin Endpoints

#### `POST /api/admin`
**Purpose**: Create a new topic/discussion

**Request**:
```json
{
  "topic": "How can we improve team collaboration?"
}
```

**Response**:
```json
{
  "uuid": "00000000-0000-0000-0000-000000000000",
  "deadline": 1234567890
}
```

#### `GET /api/admin`
**Purpose**: Get all topics with their opinions

**Response**:
```json
{
  "opinions": {
    "topic-uuid-1": {
      "content": "Topic name",
      "opinions": [
        ["opinion text", weight, "username"],
        ["another opinion", weight, "username"]
      ]
    }
  }
}
```

### 2. Topic Endpoints

#### `GET /api/topic/:uuid`
**Purpose**: Get topic information

**Response**:
```json
{
  "topic": "Topic name",
  "state": "question" | "loading" | "live" | "result"
}
```

### 3. Join/Poll Endpoints

#### `POST /api/join/:uuid`
**Purpose**: Join a session (currently not required, but available for future use)

**Response**:
```json
{
  "topic": "Topic name",
  "state": "question",
  "username": "generated-username"
}
```

#### `POST /api/poll/:uuid`
**Purpose**: Submit an opinion

**Request**:
```json
{
  "opinion": "I think we should...",
  "rating": 7
}
```

**Response**: `200 OK` (empty body)

### 4. Clustering Endpoints

#### `GET /api/clusters/:uuid`
**Purpose**: Get clustered opinions for a topic

**Response**:
```json
{
  "clusters": [
    {
      "cluster_id": 1,
      "heading": "Cluster heading/summary",
      "leader_id": "username",
      "raw_opinions": [
        {
          "raw_id": 1,
          "username": "user1",
          "opinion": "opinion text",
          "weight": 5
        }
      ],
      "sentiment_avg": 0.7,  // Optional: -1 to 1
      "engagement": 25,      // Optional: number of opinions
      "position2d": {         // Optional: for visualization
        "x": 0.5,
        "y": 0.3
      }
    }
  ],
  "title": "AI-generated consensus title",  // Optional
  "mistral_result": "..."                   // Optional
}
```

#### `POST /api/trigger_clustering/:uuid`
**Purpose**: Trigger clustering process

**Response**:
```json
{
  "status": "success",
  "cooldown": 1.0
}
```

### 5. Live View Endpoint

#### `GET /api/live/:uuid`
**Purpose**: Get live view data (topic, messages, etc.)

**Response**:
```json
{
  "problemTitle": "Topic name",
  "sortedMessages": [
    {
      "text": "Message text",
      "author": "username",
      "timestamp": "2024-01-01T12:00:00Z",
      "sentiment": 0.5,      // Optional
      "clusterId": 1         // Optional
    }
  ],
  "opinions": [],            // Optional
  "solutions": []            // Optional
}
```

## WebSocket Support (Optional)

The frontend supports WebSocket for real-time updates. Configure in `src/lib/ws.ts`:

```typescript
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4200';
```

### WebSocket Events

Connect to: `ws://localhost:4200/ws/:uuid`

**Events to send from backend**:
```json
{
  "type": "cluster_update",
  "payload": { /* cluster data */ }
}

{
  "type": "new_opinion",
  "payload": { /* opinion data */ }
}

{
  "type": "chat_message",
  "payload": {
    "text": "Message",
    "author": "username",
    "timestamp": 1234567890,
    "sentiment": 0.5,
    "clusterId": 1
  }
}
```

If WebSocket is unavailable, the frontend falls back to polling (currently commented out - can be enabled).

## Data Format Requirements

### Clusters
- `cluster_id`: Unique identifier
- `heading`: Display name for the cluster
- `leader_id`: Username of cluster leader
- `raw_opinions`: Array of opinion objects
- `sentiment_avg`: -1 to 1 (optional)
- `engagement`: Number or count (optional)
- `position2d`: `{x: 0-1, y: 0-1}` for visualization (optional)

### Opinions
- `opinion`: Text content
- `weight`: Numeric value (1-10)
- `username`: Author identifier

### Messages
- `text`: Message content
- `author`: Username
- `timestamp`: Date or timestamp
- `sentiment`: -1 to 1 (optional)
- `clusterId`: Associated cluster (optional)

## CORS Configuration

Ensure your backend allows CORS requests from the frontend:

```python
# Example for Flask
from flask_cors import CORS
CORS(app, origins=["http://localhost:3000"])
```

## Environment Variables

Create a `.env` file in the frontend root:

```env
REACT_APP_API_URL=http://localhost:4200/api
REACT_APP_WS_URL=ws://localhost:4200
```

## Testing Without Backend

The frontend includes a dev showcase page (`/dev`) that works entirely with mock data, perfect for development and testing the UI without a backend.

## Next Steps

1. Update `API_ENDPOINT` in `src/service/fetchService.ts` to match your backend URL
2. Ensure your backend implements all required endpoints
3. Test endpoints with the dev showcase (`/dev`) first
4. Connect real data and test the full flow

For questions or issues, check the service layer in `src/service/fetchService.ts` for API call implementations.
