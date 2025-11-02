# API Reference - Consensus.io Backend

Complete API endpoint documentation for the Consensus.io backend.

## Base URL

```
Development: http://localhost:4200/api
Production: Set via REACT_APP_API_URL environment variable
```

## Authentication

Most endpoints require a session cookie set by `/api/login`.

**Cookie Name**: `sessionCookie`  
**Attributes**: HttpOnly, SameSite=Lax, Path=/

## Endpoints

### Health Check

#### `GET /api/status`

Check if server is running.

**Response:**
```
200 OK
"Ok!"
```

---

### Authentication

#### `POST /api/login`

Create a user session (login).

**Request Body:**
```json
{
  "username": "alice"
}
```

**Response:**
```
200 OK
Set-Cookie: sessionCookie=<session-id>
{
  "message": "Login successful"
}
```

**Notes:**
- Creates or updates user in database
- Returns session cookie for subsequent requests
- Cookie used for authentication on other endpoints

---

### Topic Management

#### `POST /api/admin`

Create a new topic.

**Request Body:**
```json
{
  "topic": "How can we improve team collaboration?"
}
```

**Response:**
```json
{
  "uuid": "abc-123-def-456",
  "deadline": 1234567890
}
```

**Error Responses:**
- `400 Bad Request`: `{"error": "topic is required"}`

---

#### `GET /api/admin`

Get all topics with their opinions.

**Response:**
```json
{
  "opinions": {
    "topic-uuid-1": {
      "content": "How can we improve team collaboration?",
      "opinions": [
        ["Use better communication tools", 8, "alice"],
        ["Implement regular check-ins", 7, "bob"]
      ]
    },
    "topic-uuid-2": {
      "content": "Another topic",
      "opinions": [...]
    }
  }
}
```

**Note**: Opinions array format: `[opinion_text, weight, username]`

---

#### `DELETE /api/admin/:uuid`

Delete a topic and all related data.

**Path Parameters:**
- `uuid` (string): Topic UUID

**Response:**
```json
{
  "message": "Topic deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: `{"error": "Topic not found"}`
- `500 Internal Server Error`: `{"error": "Failed to delete topic"}`

**Note**: Deletes topic, all opinions, clusters, votes, and messages for this topic.

---

#### `POST /api/admin/:uuid/opinion`

Add a manual opinion to a topic (admin feature, no session required).

**Path Parameters:**
- `uuid` (string): Topic UUID

**Request Body:**
```json
{
  "opinion": "We should use Slack for team communication",
  "rating": 8,
  "username": "admin"
}
```

**Response:**
```json
{
  "message": "Opinion added successfully"
}
```

**Error Responses:**
- `400 Bad Request`: `{"error": "opinion is required"}` or `{"error": "rating must be between 1 and 10"}`
- `404 Not Found`: `{"error": "Topic not found"}`

---

#### `GET /api/topic/:uuid`

Get topic information.

**Path Parameters:**
- `uuid` (string): Topic UUID

**Response:**
```json
{
  "topic": "How can we improve team collaboration?",
  "state": "question"
}
```

**State Values:**
- `"question"`: Accepting opinions
- `"loading"`: Processing clustering
- `"live"`: Showing results
- `"result"`: Final results

**Error Responses:**
- `404 Not Found`: `{"error": "Topic not found"}`

---

### Opinion Submission

#### `POST /api/join/:uuid`

Join a topic session.

**Path Parameters:**
- `uuid` (string): Topic UUID

**Headers:**
- `Cookie: sessionCookie=<session-id>` (required)

**Response:**
```json
{
  "topic": "How can we improve team collaboration?",
  "state": "question",
  "username": "alice"
}
```

**Error Responses:**
- `401 Unauthorized`: `{"error": "missing session cookie"}`
- `404 Not Found`: Topic not found

---

#### `POST /api/poll/:uuid`

Submit an opinion.

**Path Parameters:**
- `uuid` (string): Topic UUID

**Headers:**
- `Cookie: sessionCookie=<session-id>` (required)

**Request Body:**
```json
{
  "opinion": "We should use better communication tools",
  "rating": 8
}
```

**Response:**
```json
{
  "message": "Poll response recorded"
}
```

**Error Responses:**
- `400 Bad Request`: `{"error": "opinion and rating are required"}`
- `401 Unauthorized`: `{"error": "missing session cookie"}` or `{"error": "invalid session cookie"}`

**Notes:**
- Rating must be integer between 1-10
- Opinion text is required
- Creates user if doesn't exist

---

### Clustering

#### `GET /api/clusters/:uuid`

Get clustered opinions for a topic.

**Path Parameters:**
- `uuid` (string): Topic UUID

**Response:**
```json
{
  "clusters": [
    {
      "cluster_id": 1,
      "heading": "Use better communication tools",
      "leader_id": "alice",
      "raw_opinions": [
        {
          "raw_id": 1,
          "username": "alice",
          "opinion": "We should use Slack",
          "weight": 8
        },
        {
          "raw_id": 2,
          "username": "bob",
          "opinion": "Teams is better",
          "weight": 7
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: `{"error": "Topic not found"}`

**Notes:**
- Returns empty array if clustering not run yet
- Leader is opinion with highest weight + centrality
- Heading is leader's opinion text

---

#### `POST /api/trigger_clustering/:uuid`

Trigger clustering process for a topic.

**Path Parameters:**
- `uuid` (string): Topic UUID

**Response:**
```json
{
  "status": "success",
  "cooldown": 1.0
}
```

**Error Responses:**
- `429 Too Many Requests`: Rate limited
  ```json
  {
    "error": "Rate limited",
    "retry_after": 0.5
  }
  ```

**Notes:**
- Rate limited to 1 request per second per topic
- Clustering runs in background worker process
- Use `GET /api/clusters/:uuid` to check when complete

**Clustering Process:**
1. Loads all opinions for topic
2. Generates semantic embeddings
3. Runs HDBSCAN clustering algorithm
4. Selects cluster leaders
5. Saves clusters to database

---

### Live View

#### `GET /api/live/:uuid`

Get live view data (topic, messages, opinions).

**Path Parameters:**
- `uuid` (string): Topic UUID

**Headers:**
- `Cookie: sessionCookie=<session-id>` (required)

**Response:**
```json
{
  "problemTitle": "How can we improve team collaboration?",
  "opinions": [
    {
      "opinion": "Use better communication tools",
      "author": "alice"
    }
  ],
  "solutions": [],
  "sortedMessages": [
    {
      "text": "I agree with using Slack",
      "author": "bob",
      "timestamp": "2024-01-01T12:00:00",
      "sentiment": 0.7,
      "clusterId": 1
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: `{"error": "missing session cookie"}`
- `404 Not Found`: `{"error": "Topic not found"}`

**Notes:**
- Messages sorted by timestamp
- Sentiment values range from -1 to 1
- clusterId links message to cluster (optional)

---

### Session Validation

#### `GET /api/validate`

Validate current session.

**Headers:**
- `Cookie: sessionCookie=<session-id>` (required)

**Response:**
```json
{
  "status": "OK!"
}
```

**Error Responses:**
- `401 Unauthorized`: `{"error": "missing session cookie"}` or `{"error": "session cookie not found in database"}`

---

## Data Models

### Topic
```typescript
{
  uuid: string
  content: string
  current_state: number  // 0=question, 1=loading, 2=live, 3=result
  deadline: number       // Unix timestamp
}
```

### Raw Opinion
```typescript
{
  raw_id: number
  username: string
  uuid: string           // Topic UUID
  opinion: string
  weight: number         // 1-10
  clustered_opinion_id?: number
}
```

### Clustered Opinion
```typescript
{
  cluster_id: number
  uuid: string           // Topic UUID
  current_heading: string
  leader_id: string      // Username of leader
}
```

### User
```typescript
{
  username: string
  session_id: string
}
```

---

## Error Handling

All endpoints follow consistent error format:

**Success:**
- Status: `200 OK`
- Body: JSON response with data

**Client Errors (4xx):**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid session
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded

**Server Errors (5xx):**
- `500 Internal Server Error`: Server-side error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

**Clustering Endpoint:**
- Limit: 1 request per second per topic
- Response includes `retry_after` in seconds
- Returns `429` status code when exceeded

---

## CORS Configuration

CORS is enabled with credentials support:

```python
CORS(app, supports_credentials=True)
```

**Allowed:**
- All origins (can be restricted in production)
- Credentials (cookies)
- All HTTP methods

---

## WebSocket (Optional)

**Connection URL:**
```
ws://localhost:4200/ws/:uuid
```

**Events:**
- `cluster_update` - Clusters have been updated
- `new_opinion` - New opinion submitted
- `chat_message` - New chat message

**Not currently implemented** - Frontend has fallback to polling.

---

## Examples

### Complete Flow

```bash
# 1. Login
curl -X POST http://localhost:4200/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}' \
  -c cookies.txt

# 2. Create topic
curl -X POST http://localhost:4200/api/admin \
  -H "Content-Type: application/json" \
  -d '{"topic": "How to improve?"}' \
  -b cookies.txt

# Response: {"uuid": "abc-123", "deadline": 1234567890}

# 3. Submit opinion
curl -X POST http://localhost:4200/api/poll/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"opinion": "Use better tools", "rating": 8}' \
  -b cookies.txt

# 4. Trigger clustering
curl -X POST http://localhost:4200/api/trigger_clustering/abc-123 \
  -b cookies.txt

# 5. Get clusters
curl http://localhost:4200/api/clusters/abc-123
```

---

## Testing

Use the simulation script for testing:

```bash
cd backend
python simulate_poll.py --topic "Test" --opinions 100
```

This creates realistic test data for development.

---

## Notes

- All timestamps are Unix timestamps (seconds since epoch)
- UUIDs are UUIDv4 format
- Text encoding is UTF-8
- JSON content-type required for POST/PUT requests
- Session cookies must be included for authenticated endpoints

