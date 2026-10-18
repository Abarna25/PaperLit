from typing import List, Optional
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "LitTrust AI"
    APP_ENV: str = Field(default="development", description="development, test, production")
    LOG_LEVEL: str = Field(default="INFO", description="DEBUG, INFO, WARNING, ERROR")
    
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = Field(default="", description="Supabase anon/publishable key")
    SUPABASE_URL: str = Field(default="", description="Supabase URL for backend")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase service role secret key")
    SUPABASE_STORAGE_BUCKET: str = Field(default="littrust-artifacts", description="Artifact storage bucket")
    
    # External APIs
    SEMANTIC_SCHOLAR_API_KEY: Optional[str] = Field(default=None, description="Optional S2 API key")
    CROSSREF_MAILTO: str = Field(default="researcher@littrust.ai", description="Polite mailto for Crossref")
    LLM_API_KEY: Optional[str] = Field(default=None, description="Optional LLM API Key")
    LLM_PROVIDER: str = Field(default="none", description="openai, gemini, or none")
    
    # Server & Networking
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    CORS_ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app"
    ]
    
    # Security & Limits
    HTTP_TIMEOUT_SECONDS: float = 20.0
    MAX_PDF_SIZE_BYTES: int = 30 * 1024 * 1024  # 30 MB
    MAX_PAPERS_PER_QUERY: int = 25
    MOCK_MODE: bool = False

settings = Settings()
