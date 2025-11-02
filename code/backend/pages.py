from flask import Blueprint, request, make_response
import uuid
import time
import datetime

import database as db
import opinion_clustering

routes = Blueprint('routes', __name__)

def rate_limit(seconds):
    def decorator(func):
        func._last_call = 0
        def wrapper(*args, **kwargs):
            current_time = time.time()
            time_since_last = current_time - func._last_call

            if time_since_last < seconds:
                remaining = seconds - time_since_last
                resp = make_response({"error": "Rate limited", "retry_after": remaining}, 429)
                resp.headers['Retry-After'] = str(int(remaining) + 1)
                return resp

            func._last_call = current_time
            return func(*args, **kwargs)
        return wrapper
    return decorator


@routes.route('/status')
def status():
    return "Ok!"


@routes.route('/admin', methods=['POST'])
def admin():
    # RequestBody
    data = request.get_json()
    topic = data.get("topic")

    if not topic:
        return {"error": "topic is required"}, 400

    topic_uuid = str(uuid.uuid4())

    # TODO adjust deadline 
    deadline = int(time.time()) + 10*60 # 10 min


    db.insert_topic(topic_uuid, topic, deadline)

    # ResponseBody
    return {"uuid": topic_uuid, "deadline": deadline}

@routes.route('/admin', methods=['GET'])
def admin_get_opinion():
    raw_opinions = db.get_raw_opinions()

    # First, get all topics (even without opinions)
    all_topics = db.get_all_topics()

    # Initialize opinion_dict with all topics
    opinion_dict = {}
    for topic_tuple in all_topics:
        topic_uuid = topic_tuple[0]
        topic_content = topic_tuple[1]
        opinion_dict[topic_uuid] = {
            "content": topic_content,
            "opinions": []
        }

    # Then add opinions to their respective topics
    for opinion_tuple in raw_opinions:
        opinion_uuid = opinion_tuple[0]
        opinion_content = opinion_tuple[1]
        opinion_text = opinion_tuple[2]
        username = opinion_tuple[3]
        weight = opinion_tuple[4]

        if opinion_uuid in opinion_dict:
            opinion_dict[opinion_uuid]["opinions"].append(
                (opinion_text, weight, username)
            )
        else:
            # Topic not found in all_topics (shouldn't happen)
            opinion_dict[opinion_uuid] = {
                "content": opinion_content,
                "opinions": [(opinion_text, weight, username)]
            }

    print(opinion_dict)

    return {"opinions": opinion_dict}


@routes.route('/admin/<uuid_param>', methods=['DELETE'])
def delete_topic_endpoint(uuid_param):
    """Delete a topic and all its related data"""
    
    # Verify topic exists
    result = db.get_content_by_uuid(uuid_param)
    if not result:
        return {"error": "Topic not found"}, 404
    
    try:
        db.delete_topic(uuid_param)
        return {"message": "Topic deleted successfully"}, 200
    except Exception as e:
        print(f"Error deleting topic: {e}")
        return {"error": "Failed to delete topic"}, 500


@routes.route('/admin/reset', methods=['DELETE'])
def reset_everything_endpoint():
    """Reset entire database - delete all topics, opinions, clusters, votes, messages"""
    try:
        db.reset_everything()
        return {"message": "Everything has been reset successfully"}, 200
    except Exception as e:
        print(f"Error resetting database: {e}")
        return {"error": "Failed to reset database"}, 500


@routes.route('/admin/<uuid_param>/opinion', methods=['POST'])
def add_manual_opinion(uuid_param):
    """Add a manual opinion for a topic (admin only, no session required)"""
    
    # Verify topic exists
    result = db.get_content_by_uuid(uuid_param)
    if not result:
        return {"error": "Topic not found"}, 404
    
    # RequestBody
    data = request.get_json()
    opinion = data.get("opinion")
    rating = data.get("rating")
    username = data.get("username", "admin")
    
    # Validate request body
    if not opinion:
        return {"error": "opinion is required"}, 400
    if rating is None:
        return {"error": "rating is required"}, 400
    if not isinstance(rating, int) or rating < 1 or rating > 10:
        return {"error": "rating must be between 1 and 10"}, 400
    
    try:
        # Create or update user (for admin opinions, we'll use the provided username)
        session_id = str(uuid.uuid4())
        db.insert_user(username, session_id)
        
        # Insert the opinion
        db.insert_raw_opinion(username, uuid_param, opinion, rating)
        
        return {"message": "Opinion added successfully"}, 200
    except Exception as e:
        print(f"Error adding opinion: {e}")
        return {"error": "Failed to add opinion"}, 500


# maybe a useless functionality
@routes.route('/validate', methods=['GET'])
def validate():
    session_cookie = request.cookies.get("sessionCookie")

    if not session_cookie:
        return {"error": "missing session cookie"}, 401
    
    username = db.get_username_by_session_id(session_cookie)

    if not username:
        return {"error": "session cookie not found in database"}, 401
    
    return {"status": "OK!"}, 200

topic_state_mapper = {
    0: "question",
    1: "loading",
    2: "live",
    3: "result"
}

@routes.route('/topic/<uuid_param>', methods=['GET'])
def get_topic(uuid_param):
    result = db.get_content_by_uuid(uuid_param)
    
    if not result:
        return {"error": "Topic not found"}, 404
    
    topic_content = result[0]
    topic_state = result[1]
    
    return {
        "topic": topic_content,
        "state": topic_state_mapper[topic_state]
    }

@routes.route('/join/<uuid_param>', methods=['POST'])
def join(uuid_param):
    
    session_cookie = request.cookies.get("sessionCookie")

    if not session_cookie:
        return {"error": "missing session cookie"}, 401

    result = db.get_content_by_uuid(uuid_param)
    topic_content = result[0]
    topic_state = result[1]
    # topic_deadline = result[2]

    username = db.get_username_by_session_id(session_cookie)

    # deadline is not met yet
    if topic_state == 0 and db.raw_opinion_submitted(uuid_param, username):
        topic_state = 1

    # ResponseBody
    return {
        "topic": topic_content,
        "state": topic_state_mapper[topic_state],
        "username": username
    }


@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json() or request.form
    username = data.get("username")

    if not username:
        return {"error": "username is required"}, 400

    session_id = str(uuid.uuid4())
    db.insert_user(username, session_id)

    resp = make_response({"message": "Login successful"})
    # Set cookie with path=/ to ensure it's available for all routes
    resp.set_cookie(
        "sessionCookie", 
        session_id, 
        httponly=True, 
        samesite="Lax",  # Changed from Strict to Lax for better compatibility
        path="/"
    )

    return resp


@routes.route('/poll/<uuid_param>', methods=['POST'])
def poll(uuid_param):

    # RequestHeader
    session_cookie = request.cookies.get("sessionCookie")

    # RequestBody
    data = request.get_json() or request.form
    opinion = data.get("opinion")
    rating = data.get("rating")

    # Check for session cookie
    if not session_cookie:
        return {"error": "missing session cookie"}, 401
    
    # Validate request body
    if not opinion or rating is None:
        return {"error": "opinion and rating are required"}, 400
    
    # Get username from session
    username = db.get_username_by_session_id(session_cookie)
    if not username:
        return {"error": "invalid session cookie"}, 401
    
    # Insert opinion
    db.insert_raw_opinion(username, uuid_param, opinion, rating)
    return {"message": "Poll response recorded"}


@routes.route('/live/<uuid_param>', methods=['GET'])
def live(uuid_param):
    # RequestHeader
    session_cookie = request.cookies.get("sessionCookie")

    if not session_cookie:
        return {"error": "missing session cookie"}, 401

    username = db.get_username_by_session_id(session_cookie)
    
    # Get topic information
    result = db.get_content_by_uuid(uuid_param)
    if not result:
        return {"error": "Topic not found"}, 404
    
    topic_content = result[0]
    
    # Get raw opinions for this topic
    raw_opinions_data = db.get_raw_opinions_for_topic(uuid_param)
    opinions = [
        {
            "opinion": op["opinion"],
            "author": op["username"]
        }
        for op in raw_opinions_data
    ]
    
    # Get chat messages with sentiment if available
    try:
        messages_data = db.get_chat_messages_with_sentiment(limit=100)
    except Exception:
        # Fallback to regular messages if sentiment fails
        messages_data = db.get_chat_messages(limit=100)
    
    # Transform messages to expected format
    # Note: ChatMessage table doesn't store author, so we use a placeholder
    # Convert timestamp (unix seconds) to ISO string for JavaScript Date compatibility
    sorted_messages = []
    for msg in messages_data:
        timestamp = msg.get("timestamp", 0)
        # Convert unix timestamp (seconds) to ISO string
        # If timestamp is 0 or invalid, use current time
        if timestamp and timestamp > 0:
            try:
                # Timestamp is in seconds, convert to datetime then ISO string
                dt = datetime.datetime.fromtimestamp(timestamp)
                timestamp_str = dt.isoformat()
            except (ValueError, OSError):
                timestamp_str = datetime.datetime.now().isoformat()
        else:
            timestamp_str = datetime.datetime.now().isoformat()
        
        sorted_messages.append({
            "text": msg.get("message", msg.get("text", "")),
            "author": msg.get("author", "Unknown"),
            "timestamp": timestamp_str,
            "sentiment": msg.get("sentiment"),
            "clusterId": msg.get("clusterId")
        })
    
    # Solutions array (empty for now, can be populated later)
    solutions = []
    
    return {
        "problemTitle": topic_content,
        "opinions": opinions,
        "solutions": solutions,
        "sortedMessages": sorted_messages
    }


@routes.route('/trigger_clustering/<uuid_param>', methods=['POST'])
@rate_limit(1.0)
def trigger_clustering(uuid_param):
    opinion_clustering.trigger(uuid_param)
    return {"status": "success", "cooldown": 1.0}


@routes.route('/clusters/<uuid_param>', methods=['GET'])
def get_clusters(uuid_param):
    """Get all clustered opinions with their constituent raw opinions and users for a topic"""
    
    result = db.get_content_by_uuid(uuid_param)
    if not result:
        return {"error": "Topic not found"}, 404
    
    clusters = db.get_clustered_opinions_with_raw_opinions(uuid_param)
    
    # Ensure clusters have the correct field names expected by frontend
    # Frontend expects: cluster_id, heading (not current_heading), leader_id, raw_opinions
    # Optional: sentiment_avg, engagement, position2d
    formatted_clusters = []
    for cluster in clusters:
        formatted_cluster = {
            "cluster_id": cluster.get("cluster_id"),
            "heading": cluster.get("heading") or cluster.get("current_heading"),
            "leader_id": cluster.get("leader_id"),
            "raw_opinions": cluster.get("raw_opinions", []),
        }
        # Add optional fields if they exist
        if "sentiment_avg" in cluster:
            formatted_cluster["sentiment_avg"] = cluster["sentiment_avg"]
        if "engagement" in cluster:
            formatted_cluster["engagement"] = cluster["engagement"]
        if "position2d" in cluster:
            formatted_cluster["position2d"] = cluster["position2d"]
        
        formatted_clusters.append(formatted_cluster)
    
    # Safety check: If no clusters found but topic has opinions, create a default cluster
    # This should rarely happen as clustering should always return at least one cluster
    if len(formatted_clusters) == 0:
        print(f"Warning: No clusters found for topic {uuid_param}, checking for opinions...")
        raw_opinions = db.get_raw_opinions_for_topic(uuid_param)
        if len(raw_opinions) > 0:
            print(f"Found {len(raw_opinions)} opinions but no clusters, creating emergency cluster")
            # Create a default cluster with all opinions
            if len(raw_opinions) > 0:
                first_opinion = raw_opinions[0]
                emergency_cluster = {
                    "cluster_id": 0,  # Temporary ID
                    "heading": first_opinion.get("opinion", "General opinions"),
                    "leader_id": first_opinion.get("username", "unknown"),
                    "raw_opinions": [{
                        "raw_id": op.get("raw_id"),
                        "username": op.get("username"),
                        "opinion": op.get("opinion"),
                        "weight": op.get("weight", 5)
                    } for op in raw_opinions],
                }
                formatted_clusters.append(emergency_cluster)
                print(f"Created emergency cluster with {len(raw_opinions)} opinions")
    
    # Return clusters array as expected by frontend (always at least one if opinions exist)
    return {"clusters": formatted_clusters}