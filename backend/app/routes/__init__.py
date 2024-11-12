# backend/app/routes/__init__.py

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    
    # Enable CORS with more permissive settings
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000"],
                 "methods": ["GET", "POST", "PUT", "DELETE"],
                 "allow_headers": ["Content-Type", "Authorization", "Accept"],
                 "expose_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True,
                 "max_age": 600
             }
         })
    
    # # After request handler
    # @app.after_request
    # def after_request(response):
    #     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    #     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    #     response.headers.add('Access-Control-Allow-Credentials', 'true')
    #     return response

    return app