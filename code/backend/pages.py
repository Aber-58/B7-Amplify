from flask import Blueprint, request, make_response
import uuid
import time

import database as db
import opinion_clustering

from utils_llm import choose_proposed_solutions, ask_mistral
from utils_chat import get_chat_LV_popularity
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

    opinion_dict = {}

    for (uuid, content, opinion, username, weight) in raw_opinions:
        if uuid not in opinion_dict:
            opinion_dict[uuid] = {
                "content": content,
                "opinions": [(opinion, weight, username)]
            }
        else:
            opinion_dict[uuid]["opinions"].append((opinion, weight, username))

    print(opinion_dict)

    return {"opinions": opinion_dict}


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
    resp.set_cookie("sessionCookie", session_id, httponly=True, samesite="Strict")

    return resp


@routes.route('/poll/<uuid_param>', methods=['POST'])
def poll(uuid_param):

    # RequestHeader
    session_cookie = request.cookies.get("sessionCookie")

    # RequestBody
    data = request.get_json() or request.form
    opinion = data.get("opinion")
    rating = data.get("rating")

    # Example placeholder logic
    if not session_cookie:
        return {"error": "missing session cookie"}, 401
    if not opinion or rating is None:
        return {"error": "opinion and rating are required"}, 400

    username = db.get_username_by_session_id(session_cookie)
    # error if session_cookie does not exist
    db.insert_raw_opinion(username, uuid_param, opinion, rating)
    return {"message": "Poll response recorded"}


@routes.route('/live/<uuid_param>', methods=['GET'])
def live(uuid_param):
    # RequestHeader
    session_cookie = request.cookies.get("sessionCookie")

@routes.route('/error')
def error():
    return "displays an error message"

    if not session_cookie:
        return {"error": "missing session cookie"}, 401

    username = db.get_username_by_session_id(session_cookie)
    is_leader = db.is_leader(uuid_param, username)
    # TODO send more data (tbd)
    return {
        "isLeader": is_leader
    }


@routes.route('/trigger_clustering/<uuid_param>', methods=['POST'])
@rate_limit(1.0)
def trigger_clustering(uuid_param):
    opinion_clustering.trigger(uuid_param)
    return {"status": "success", "cooldown": 1.0}

cluster_processed = {}
cluster_circle_sizes = {} # A dict with the names
@routes.route('/clusters/<uuid_param>', methods=['GET'])
def get_clusters(uuid_param):
    """Get all clustered opinions with their constituent raw opinions and users for a topic"""
    
    if uuid_param in cluster_processed.keys():
        return cluster_processed[uuid_param]

    result = db.get_content_by_uuid(uuid_param)
    if not result:
        return {"error": "Topic not found"}, 404
    
    clusters = db.get_clustered_opinions_with_raw_opinions(uuid_param)
    cluster_data = {"clusters": clusters}
    title, prompt = choose_proposed_solutions(cluster_data)
    mistral_result = ask_mistral(prompt)
    result = {"title":title, "mistral_result":mistral_result}
    cluster_processed[uuid_param] = result
    cluster_circle_sizes[uuid_param] = {key:50/3 for key in mistral_result.keys()}
    return result


@routes.route('/get_circle_sizes/<uuid_param>', methods=['GET'])
def get_circle_sizes(uuid_param):
    circle_sizes = cluster_circle_sizes[uuid_param]
    # total = sum(circle_sizes.values())
    # circle_sizes = {k: v * 50 / total for k, v in circle_sizes.items()} # Normalize so that all values sum up to 50
    # cluster_circle_sizes[uuid_param] = circle_sizes
    return circle_sizes

chat_messages = []
new_chat_messages = []


# ==========================
# 💬 Chat message utilities
# ==========================

def add_message(msg):
    """Add a new chat message."""
    global chat_messages, new_chat_messages
    chat_messages.append(msg)
    new_chat_messages.append(msg)


def get_last_messages(limit=10):
    """Return the last X messages."""
    return chat_messages[-limit:]


def get_new_messages():
    """Return all new messages, then clear the list."""
    global new_chat_messages
    messages = new_chat_messages.copy()
    new_chat_messages.clear()
    return messages

# <uuid_param>
def update_ball_sizes(uuid_param):
    global cluster_circle_sizes


    LVs = list(cluster_circle_sizes[uuid_param].keys())
    texts = get_new_messages()
    if len(texts) == 0:
        return 'No msgs found'
    adjustments = get_chat_LV_popularity(LVs, texts)


    original = cluster_circle_sizes[uuid_param].copy()

    print("original dict:", cluster_circle_sizes)
    print("adjustments dict:", adjustments)

    adjusted = {k: original.get(k, 0) + adjustments.get(k, 0) for k in original}

    total = sum(adjusted.values())
    cluster_circle_sizes[uuid_param] = {k: v * 50 / total for k, v in adjusted.items()}

    return 'worked'

# ==========================
# 💬 Chat API routes
# ==========================

@routes.route('/chat/add', methods=['POST'])
def chat_add():
    data = request.get_json() or {}
    msg = data.get("message")

    if not msg:
        return {"error": "Message is required"}, 400

    add_message(msg)
    return {"status": "ok"}, 200


@routes.route('/chat/last/<int:limit>', methods=['GET'])
def chat_last(limit):
    """Return the last X chat messages."""
    return {"messages": get_last_messages(limit)}, 200

@routes.route('/update_ball_sizes/<uuid_param>', methods=['POST'])
def post_update_ball_sizes(uuid_param):
    if len(new_chat_messages)<2:
        return {"status": "less than 2 msgs, not doing anything"}, 200
    try:
        update_ball_sizes(uuid_param)  # Call your function
        return {"status": "success"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500
