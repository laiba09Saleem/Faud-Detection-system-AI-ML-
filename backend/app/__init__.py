from flask import Flask
from flask_cors import CORS

from .api.routes import api_blueprint


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(api_blueprint)

    return app
