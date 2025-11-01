from flask import Blueprint, request, make_response
import uuid
import time

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
