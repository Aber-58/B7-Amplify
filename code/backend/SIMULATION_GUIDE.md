# Simulation Guide - Populate Poll Data

This guide explains how to use the simulation script to create topics with poll responses for testing and demonstration.

## Quick Start

### 1. Create a New Topic with 100 Opinions

```bash
cd /path/to/B7-Amplify/code/backend
python simulate_poll.py --topic "How can we improve team collaboration?" --opinions 100 --messages 20
```

This will:
- Create a new topic with the specified text
- Generate 100 unique poll responses (opinions with ratings)
- Add 20 chat messages
- Return the topic UUID

### 2. Add Opinions to an Existing Topic

```bash
python simulate_poll.py --topic-id <your-topic-uuid> --opinions 50
```

This adds 50 more opinions to an existing topic.

## Full Usage

```bash
python simulate_poll.py [options]
```

### Options

- `--topic TEXT`: Create a new topic with this text
- `--topic-id UUID`: Use an existing topic UUID instead of creating new
- `--opinions N`: Number of poll responses to generate (default: 100)
- `--messages N`: Number of chat messages to add (default: 0)
- `--db-file PATH`: Database file path (uses DB_FILE env var if not specified)

### Examples

**Create a new topic with 100 opinions:**
```bash
python simulate_poll.py --topic "What should we prioritize this quarter?" --opinions 100
```

**Add 50 more opinions to existing topic:**
```bash
python simulate_poll.py --topic-id abc-123-def-456 --opinions 50
```

**Create topic with opinions and chat messages:**
```bash
python simulate_poll.py --topic "How can we improve remote work?" --opinions 100 --messages 30
```

**Use custom database:**
```bash
python simulate_poll.py --topic "Example topic" --db-file /path/to/db.sqlite --opinions 100
```

## What Gets Created

1. **Topic**: A new topic entry in the database
2. **Users**: Unique users for each opinion (username + session_id)
3. **Opinions**: Diverse opinions with ratings (1-10) related to the topic
4. **Chat Messages**: Optional chat messages that can influence clustering

## Opinion Generation

The script intelligently generates opinions based on the topic:

- **Collaboration topics**: Opinions about team check-ins, communication tools, documentation, etc.
- **Remote work topics**: Opinions about home office equipment, flexible hours, virtual spaces, etc.
- **Default**: General opinions about communication, processes, tools, etc.

Each opinion includes:
- **Text**: A relevant opinion statement
- **Rating**: A weight/rating from 1-10 (skewed toward middle-high values)

## After Simulation

1. **View in Admin Panel**: Navigate to `http://localhost:4200/admin`
   - You'll see your topic with all opinions listed

2. **Trigger Clustering**: Click the "Cluster" button for your topic
   - This will group similar opinions together

3. **View Live Results**: Navigate to `http://localhost:4200/live/<topic-uuid>`
   - See clustered opinions visualized
   - View chat messages (if added)
   - See the cluster map visualization

## Tips

- Start with 50-100 opinions for a good demonstration
- Add 10-30 chat messages to see how they influence clustering
- Try different topic categories (collaboration, remote work, etc.) to see diverse opinions
- The script ensures unique usernames for each opinion
- Opinions are varied enough to create interesting clusters

## Troubleshooting

**Database not found:**
- Ensure `DB_FILE` environment variable is set, or use `--db-file` option
- Check that the database directory exists

**Topic not found (when using --topic-id):**
- Verify the UUID is correct
- Check that the topic exists in the database

**No opinions generated:**
- Check database permissions
- Verify database file path is correct
- Check console output for error messages

