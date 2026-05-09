"""
AI Transaction Extraction Assistant - OCR Server
Main entry point for the Flask API server.
Orchestrates OCR, AI extraction, database, and export services.
"""
import sys
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

from config import Config
from ocr_engine import get_ocr_engine
from ai_extractor import get_ai_extractor
from database import get_database

# Route blueprints
from routes.ocr_routes import ocr_bp, init_ocr_routes
from routes.ai_routes import ai_bp, init_ai_routes
from routes.db_routes import db_bp, init_db_routes
from routes.export_routes import export_bp, init_export_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)

    # Initialize core engines
    logger.info("Initializing OCR Engine...")
    try:
        ocr = get_ocr_engine()
        logger.info("OCR Engine ready")
    except Exception as e:
        logger.error(f"OCR Engine failed: {str(e)}")
        sys.exit(1)

    logger.info("Initializing AI Engine (Ollama)...")
    try:
        ai = get_ai_extractor()
        logger.info("AI Engine ready")
    except Exception as e:
        logger.error(f"AI Engine failed: {str(e)}")
        ai = None

    logger.info("Initializing Database...")
    try:
        db = get_database()
        logger.info("Database ready")
    except Exception as e:
        logger.error(f"Database failed: {str(e)}")
        db = None

    # Initialize route dependencies
    init_ocr_routes(ocr, ai)
    init_ai_routes(ai)
    init_db_routes(db)
    init_export_routes(db, ai, Config.KNOWN_NAMES_PATH)

    # Register blueprints
    app.register_blueprint(ocr_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(db_bp)
    app.register_blueprint(export_bp)

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'engine': 'EasyOCR + Ollama (Offline)',
            'database': db is not None,
            'ai_available': ai is not None
        })

    return app


if __name__ == '__main__':
    app = create_app()
    logger.info(f"Starting server on {Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT)