from flask import Blueprint
import uuid

routes = Blueprint('routes', __name__)


@routes.route('/status')
def status():
    return "Ok!"


@routes.route('/admin')
def admin():
    return "admin dashboard. create qr codes for topics here"


@routes.route('/invite/<uuid_param>')
def invite(uuid_param):
    return "display qr code here"


@routes.route('/join/<uuid_param>')
def join(uuid_param):
    return "where qr code points to"


@routes.route('/login')
def login():
    return "page to enter username (html form?). give user a session id"


@routes.route('/poll/<uuid_param>')
def poll(uuid_param):
    return "give opinion on topic"


@routes.route('/live/<uuid_param>')
def live(uuid_param):
    return "live room with cool clusters of opinions (and leader chat after clusters have been formed)"
