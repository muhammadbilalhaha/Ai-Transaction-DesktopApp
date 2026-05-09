"""
AI Routes
Handles transaction extraction from already-extracted OCR text.
"""
import logging
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai', __name__)

ai_engine = None


def init_ai_routes(ai):
    """Initialize AI engine reference."""
    global ai_engine
    ai_engine = ai


@ai_bp.route('/extract-transaction', methods=['POST'])
def extract_transaction():
    """Extract structured transaction data from raw OCR text using local AI."""
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({'success': False, 'error': 'No OCR text provided'}), 400

        ocr_text = data['text']
        filename = data.get('filename', 'unknown')

        logger.info(f"Extracting transaction from {len(ocr_text)} chars of OCR text")

        if ai_engine is None:
            return jsonify({'success': False, 'error': 'AI Extractor not available'}), 500

        result = ai_engine.extract_transaction(ocr_text, filename)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Transaction extraction failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500