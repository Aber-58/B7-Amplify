#!/usr/bin/env python3
"""
Simulation script to create a topic and populate it with 100 poll responses
and optionally add chat messages that can influence clustering.

Usage:
    python simulate_poll.py --topic "How can we improve team collaboration?" --opinions 100 --messages 20
    python simulate_poll.py --topic-id <existing-topic-uuid> --opinions 50
"""

import os
import sys
import argparse
import uuid
import time
import random
from typing import List, Tuple

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database as db

# Sample opinions for different topics
OPINION_TEMPLATES = {
    "collaboration": [
        "Implement regular team check-ins and standups",
        "Use better communication tools like Slack or Teams",
        "Create shared documentation and wikis",
        "Establish clear communication channels",
        "Promote cross-team collaboration",
        "Hold regular team-building activities",
        "Set up virtual coffee breaks",
        "Use project management tools",
        "Create a knowledge-sharing culture",
        "Establish mentorship programs",
        "Improve meeting effectiveness",
        "Use collaborative whiteboards",
        "Share progress updates regularly",
        "Create feedback loops",
        "Establish clear roles and responsibilities",
    ],
    "remote": [
        "Provide better home office equipment",
        "Offer flexible working hours",
        "Improve work-life balance",
        "Create virtual social spaces",
        "Better remote onboarding process",
        "More virtual team events",
        "Clearer remote work policies",
        "Better remote access tools",
        "Improved cybersecurity for remote work",
        "Mental health support for remote workers",
    ],
    "default": [
        "Improve communication channels",
        "Better collaboration tools",
        "Regular team meetings",
        "Clearer project documentation",
        "More feedback opportunities",
        "Better training programs",
        "Improved processes",
        "Enhanced tools and resources",
        "Better support systems",
        "More transparency",
    ]
}

# Sample chat messages that can influence clustering
CHAT_MESSAGES = [
    "I think we should focus on communication first",
    "What about using more collaborative tools?",
    "Regular check-ins would really help",
    "Documentation is key for remote teams",
    "We need better feedback mechanisms",
    "Training would address many of these concerns",
    "Let's prioritize the most urgent items",
    "These suggestions could be grouped by theme",
    "I agree with the collaboration focus",
    "Remote work tools are essential now",
]

def detect_topic_category(topic: str) -> str:
    """Detect the category of the topic to use appropriate opinion templates."""
    topic_lower = topic.lower()
    if any(word in topic_lower for word in ["collaboration", "team", "work together"]):
        return "collaboration"
    elif any(word in topic_lower for word in ["remote", "work from home", "distributed"]):
        return "remote"
    return "default"


def generate_opinions(topic: str, count: int) -> List[Tuple[str, int]]:
    """Generate diverse opinions with ratings for a topic."""
    category = detect_topic_category(topic)
    templates = OPINION_TEMPLATES.get(category, OPINION_TEMPLATES["default"])
    
    opinions = []
    for i in range(count):
        # Use templates and variations
        base_opinion = random.choice(templates)
        
        # Add variations
        variations = [
            base_opinion,
            f"{base_opinion}",
            f"We should {base_opinion.lower()}",
            f"Let's {base_opinion.lower()}",
            f"I believe {base_opinion.lower()} is important",
            f"Consider {base_opinion.lower()}",
        ]
        opinion = random.choice(variations)
        
        # Generate rating (weight) between 1-10, with some skew toward middle-high values
        rating = random.choices(
            range(1, 11),
            weights=[1, 1, 2, 3, 4, 5, 6, 7, 8, 5]  # More likely to be 5-8
        )[0]
        
        opinions.append((opinion, rating))
    
    return opinions


def generate_usernames(count: int) -> List[str]:
    """Generate unique usernames."""
    names = [
        "alice", "bob", "charlie", "diana", "eve", "frank", "grace", "henry",
        "iris", "jack", "kate", "liam", "maya", "noah", "olivia", "paul",
        "quinn", "rachel", "sam", "tina", "uma", "victor", "willa", "xander",
        "yara", "zoe"
    ]
    
    usernames = []
    for i in range(count):
        base_name = random.choice(names)
        username = f"{base_name}{i}" if i > 0 else base_name
        usernames.append(username)
    
    # Ensure uniqueness
    return list(set(usernames))[:count] + [f"user{i}" for i in range(count - len(set(usernames)))]


def create_topic(topic_text: str) -> str:
    """Create a new topic and return its UUID."""
    topic_uuid = str(uuid.uuid4())
    deadline = int(time.time()) + 10 * 60  # 10 minutes from now
    
    db.insert_topic(topic_uuid, topic_text, deadline)
    print(f"✓ Created topic: {topic_text}")
    print(f"  UUID: {topic_uuid}")
    
    return topic_uuid


def simulate_poll_responses(topic_uuid: str, topic_text: str, count: int):
    """Simulate poll responses by inserting opinions into the database."""
    print(f"\nGenerating {count} opinions...")
    
    # Generate opinions and usernames
    opinions = generate_opinions(topic_text, count)
    usernames = generate_usernames(count)
    
    # Create users and insert opinions
    created_count = 0
    for i, ((opinion, rating), username) in enumerate(zip(opinions, usernames)):
        # Create user with a session ID
        session_id = str(uuid.uuid4())
        db.insert_user(username, session_id)
        
        # Insert opinion (uuid is text, not int)
        db.insert_raw_opinion(username, topic_uuid, opinion, rating)
        created_count += 1
        
        if (i + 1) % 10 == 0:
            print(f"  Created {created_count}/{count} opinions...")
    
    print(f"✓ Successfully created {created_count} poll responses")
    print(f"  Users: {len(set(usernames))} unique users")


def add_chat_messages(topic_uuid: str, count: int):
    """Add chat messages to the database."""
    if count == 0:
        return
    
    print(f"\nAdding {count} chat messages...")
    
    # Generate usernames for messages
    message_usernames = generate_usernames(count)
    
    base_time = int(time.time())
    created_count = 0
    
    for i in range(count):
        message_id = str(uuid.uuid4())
        message_text = random.choice(CHAT_MESSAGES)
        # Distribute timestamps over last hour
        timestamp = base_time - random.randint(0, 3600) + i
        
        db.insert_chat_message(message_id, message_text, timestamp)
        created_count += 1
    
    print(f"✓ Successfully added {created_count} chat messages")


def main():
    parser = argparse.ArgumentParser(
        description="Simulate poll responses for a topic",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create new topic with 100 opinions and 20 messages
  python simulate_poll.py --topic "How can we improve team collaboration?" --opinions 100 --messages 20
  
  # Add opinions to existing topic
  python simulate_poll.py --topic-id <uuid> --opinions 50
  
  # Create topic with default 100 opinions, no messages
  python simulate_poll.py --topic "What should we prioritize this quarter?"
        """
    )
    
    parser.add_argument(
        "--topic",
        type=str,
        help="Topic text (creates new topic if provided)"
    )
    
    parser.add_argument(
        "--topic-id",
        type=str,
        help="Existing topic UUID (use this instead of --topic)"
    )
    
    parser.add_argument(
        "--opinions",
        type=int,
        default=100,
        help="Number of poll responses to generate (default: 100)"
    )
    
    parser.add_argument(
        "--messages",
        type=int,
        default=0,
        help="Number of chat messages to add (default: 0)"
    )
    
    parser.add_argument(
        "--db-file",
        type=str,
        default=None,
        help="Database file path (uses DB_FILE env var if not specified)"
    )
    
    args = parser.parse_args()
    
    # Initialize database if file specified
    if args.db_file:
        os.environ["DB_FILE"] = args.db_file
    
    # Initialize database
    db.init()
    
    # Determine topic UUID
    if args.topic_id:
        topic_uuid = args.topic_id
        # Verify topic exists
        result = db.get_content_by_uuid(topic_uuid)
        if not result:
            print(f"✗ Error: Topic with UUID {topic_uuid} not found")
            sys.exit(1)
        topic_text = result[0]
        print(f"Using existing topic: {topic_text}")
        print(f"  UUID: {topic_uuid}")
    elif args.topic:
        topic_uuid = create_topic(args.topic)
        topic_text = args.topic
    else:
        print("✗ Error: Must provide either --topic or --topic-id")
        parser.print_help()
        sys.exit(1)
    
    # Simulate poll responses
    simulate_poll_responses(topic_uuid, topic_text, args.opinions)
    
    # Add chat messages if requested
    if args.messages > 0:
        add_chat_messages(topic_uuid, args.messages)
    
    print(f"\n✓ Simulation complete!")
    print(f"\nYou can now:")
    print(f"  1. View the topic in Admin panel: http://localhost:4200/admin")
    print(f"  2. Trigger clustering: Click 'Cluster' button for this topic")
    print(f"  3. View live results: http://localhost:4200/live/{topic_uuid}")
    print(f"\nTopic UUID: {topic_uuid}")


if __name__ == "__main__":
    main()

