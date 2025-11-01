from flask import Flask
from pages import routes

app = Flask(__name__)
app.register_blueprint(routes)

@app.route('/')
def home():
    return "Hello, Flask!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
