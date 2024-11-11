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
        
        # Get Gemini API key from environment
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
            
        # Initialize Gemini service with API key
        app.gemini_service = GeminiService(api_key=gemini_api_key)
        
    except ValueError as e:
        print(f"Configuration error: {e}")
        raise
    
    # Configure CORS
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000"],
                 "methods": ["GET", "POST", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True
             }
         },
         allow_credentials=True)
    
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///go_guardian.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
    
    # Initialize database
    db.init_app(app)

    

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
    
     # Initialize Gemini service with API key
    app.gemini_service = GeminiService(api_key=gemini_api_key)

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