"""
AI Career Coach - Configuration Module
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env.local'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv(Path(__file__).parent / '.env')

BASE_DIR = Path(__file__).parent

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
    PORT = int(os.getenv('FLASK_PORT', 3000))
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Database
    DATABASE_PATH = BASE_DIR / 'data' / 'career_coach.db'
    
    # File uploads
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
    
    # AI Configuration
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini')
    AI_API_KEY  = os.getenv('AI_API_KEY', '')
    AI_MODEL    = os.getenv('AI_MODEL', 'gemini-3.5-flash-lite')
    AI_API_BASE = os.getenv('AI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai/')

    @classmethod
    def ai_available(cls):
        """Return True when a usable API key is configured in .env.local."""
        env_key = cls.AI_API_KEY.strip()
        return bool(env_key and env_key not in ('your-api-key-here', ''))
    
    @classmethod
    def ensure_dirs(cls):
        """Create required directories."""
        cls.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        cls.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
