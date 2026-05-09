import os
import sys
import easyocr
import logging
import numpy as np
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCREngine:
    def __init__(self):
        """Initialize EasyOCR engine"""
        logger.info("Initializing EasyOCR engine...")
        try:
            self.reader = easyocr.Reader(
                ['en'],
                gpu=False,
                model_storage_directory='./models',
                download_enabled=True,
            )
            logger.info("EasyOCR engine initialized successfully!")
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {str(e)}")
            raise

    def preprocess_image(self, image_path):
        """Preprocess image to remove watermarks and improve OCR"""
        try:
            import cv2
            
            img = cv2.imread(image_path)
            
            if img is None:
                logger.error(f"Failed to read image: {image_path}")
                return image_path
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            denoised = cv2.bilateralFilter(gray, 9, 75, 75)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            enhanced = clahe.apply(denoised)
            
            processed_path = image_path + '_enhanced.png'
            cv2.imwrite(processed_path, enhanced)
            logger.info(f"Saved enhanced image: {processed_path}")
            
            return processed_path
            
        except Exception as e:
            logger.warning(f"Preprocessing failed, using original: {str(e)}")
            return image_path

    def extract_text(self, image_path):
        """Extract text from image using EasyOCR"""
        try:
            logger.info(f"Processing image: {image_path}")
            
            if not os.path.exists(image_path):
                return {'success': False, 'error': f'File not found: {image_path}'}
            
            processed_path = self.preprocess_image(image_path)
            
            results = self.reader.readtext(processed_path)
            
            if not results:
                logger.warning("No text detected")
                return {
                    'success': True,
                    'text': '',
                    'text_lines': [],
                    'total_confidence': 0,
                    'line_count': 0
                }
            
            text_lines = []
            confidences = []
            
            for bbox, text, confidence in results:
                text_lines.append({
                    'text': text.strip(),
                    'confidence': round(confidence, 3),
                })
                confidences.append(confidence)
            
            full_text = ' '.join([line['text'] for line in text_lines])
            avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0
            
            logger.info(f"EasyOCR extracted {len(text_lines)} lines, confidence: {avg_confidence}")
            logger.info(f"Text: {full_text[:300]}")
            
            if processed_path != image_path and os.path.exists(processed_path):
                try:
                    os.unlink(processed_path)
                except:
                    pass
            
            return {
                'success': True,
                'text': full_text,
                'text_lines': text_lines,
                'total_confidence': avg_confidence,
                'line_count': len(text_lines)
            }
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'text_lines': []
            }

ocr_engine = None

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = OCREngine()
    return ocr_engine