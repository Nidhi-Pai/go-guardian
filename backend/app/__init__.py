# backend/app/__init__.py

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from .models import db
from .config import Config
from .services.gemini_service import GeminiService, GeminiServiceError
 
load_dotenv()

def create_app():
    app = Flask(__name__)

    try:
        Config.validate()
        app.config.from_object(Config)
    except ValueError as e:
        print(f"Configuration error: {e}")
        
    
    # Enable CORS - Updated configuration
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True
             }
         })
    
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///go_guardian.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
    
    # Initialize database
    db.init_app(app)

    # Initialize Gemini Service
    try:
        app.gemini_service = GeminiService()
        print("Gemini Service initialized successfully")
    except GeminiServiceError as e:
        print(f"Error initializing Gemini service: {e}")
        app.gemini_service = None
    
    # Debug route
    @app.route('/debug/routes')
    def list_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'path': str(rule)
            })
        return jsonify(routes)
    
    # Initialize database
    with app.app_context():
        db.create_all()
        app.logger.info("Database initialized")
        
    return app

    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
            
            # Create a default user if none exists
            from .models import User
            if not User.query.first():
                default_user = User(
                    email="default@example.com",
                    name="Default User",
                    phone="+1234567890"
                )
                db.session.add(default_user)
                db.session.commit()
                print("Default user created successfully")
        except Exception as e:
            print(f"Error initializing database: {str(e)}")
    
    # Register blueprints
    from .routes.safety_routes import safety_bp
    from .routes.emergency_routes import emergency_bp
    from .routes.monitoring_routes import monitoring_bp
    from .routes.voice_routes import voice_bp
    
    # Register core blueprints
    app.register_blueprint(safety_bp, url_prefix='/api/safety')
    app.register_blueprint(emergency_bp, url_prefix='/api/emergency')
    
    # Register new feature blueprints
    app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
    app.register_blueprint(voice_bp, url_prefix='/api/voice')
    
    @app.route('/health')
    def health_check():
        return {
            "status": "healthy",
            "services": {
                "ai": "available" if app.gemini_service else "unavailable",
                "database": "connected" if db.engine else "disconnected",
                "monitoring": "active",
                "voice": "active"
            },
            "version": "1.0.0"
        }

    # Global error handler
    @app.errorhandler(Exception)
    def handle_error(error):
        print(f"Unexpected error: {str(error)}")
        return jsonify({
            "error": str(error),
            "status": "error"
        }), 500

    return app