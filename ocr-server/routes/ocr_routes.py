"""
OCR Routes
Handles image upload and text extraction endpoints.
"""
import os
import tempfile
import logging
import traceback
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)

ocr_bp = Blueprint('ocr', __name__)

# Reference to core engines (set by server.py on init)
ocr_engine = None
ai_engine = None


def init_ocr_routes(ocr, ai):
    """Initialize route dependencies after engines are created."""
    global ocr_engine, ai_engine
    ocr_engine = ocr
    ai_engine = ai


@ocr_bp.route('/extract-text', methods=['POST'])
def extract_text():
    """Extract raw text from uploaded image using OCR only."""
    tmp_path = None
    try:
        logger.info(f"OCR request received, files: {list(request.files.keys())}")

        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        file = request.files['image']
        logger.info(f"Processing file: {file.filename}, type: {file.content_type}")

        if file.filename == '':
            return jsonify({'success': False, 'error': 'Empty filename'}), 400

        file_ext = os.path.splitext(file.filename)[1].lower() or '.png'

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        result = ocr_engine.extract_text(tmp_path)

        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'text': result['text'],
                    'text_lines': result['text_lines'],
                    'confidence': result['total_confidence'],
                    'line_count': result['line_count']
                }
            })
        else:
            return jsonify({'success': False, 'error': result.get('error')}), 500

    except Exception as e:
        logger.error(f"OCR extraction error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass


@ocr_bp.route('/extract-all', methods=['POST'])
def extract_all():
    """Full pipeline: Upload image → OCR → AI extraction."""
    tmp_path = None
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        file = request.files['image']
        logger.info(f"Full pipeline for: {file.filename}")

        file_ext = os.path.splitext(file.filename)[1].lower() or '.png'
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        # Step 1: OCR extraction
        logger.info("Running OCR...")
        ocr_result = ocr_engine.extract_text(tmp_path)

        if not ocr_result['success']:
            return jsonify({'success': False, 'error': 'OCR failed: ' + ocr_result.get('error', '')}), 500

        logger.info(f"OCR complete: {len(ocr_result['text'])} characters extracted")

        # Step 2: AI structuring
        logger.info("Running AI extraction...")
        ai_result = ai_engine.extract_transaction(
            ocr_result['text'], file.filename
        ) if ai_engine else {'success': False, 'error': 'AI engine not available'}

        logger.info(f"AI extraction: {'success' if ai_result['success'] else 'failed'}")

        return jsonify({
            'success': True,
            'ocr': {
                'text': ocr_result['text'],
                'confidence': ocr_result['total_confidence'],
                'text_lines': ocr_result['text_lines']
            },
            'transaction': ai_result.get('transaction') if ai_result['success'] else None,
            'ai_success': ai_result['success'],
            'ai_error': ai_result.get('error') if not ai_result['success'] else None,
            'extraction_method': 'ollama'
        })

    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass