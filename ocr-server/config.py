"""
Application Configuration
Centralized settings for the OCR server.
"""
import os

class Config:
    # Server settings
    HOST = '127.0.0.1'
    PORT = int(os.environ.get('OCR_PORT', 5000))
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    KNOWN_NAMES_PATH = os.path.join(BASE_DIR, 'known_names.json')
    
    # OCR Settings
    OCR_LANGUAGES = ['en']
    
    # AI Settings
    AI_MODEL = 'qwen2.5:1.5b'
    
    # Database
    DB_PATH = 'transactions.db'
    SCREENSHOTS_DIR = 'screenshots'
    
    # Export
    CSV_EXPORT_LIMIT = 10000