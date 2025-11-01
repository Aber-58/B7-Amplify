import os
FLASK_PORT = port = os.getenv("FLASK_PORT")
from flask import Flask, send_from_directory
from pages import routes
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
app.register_blueprint(routes, url_prefix='/api')
CORS(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=FLASK_PORT)
