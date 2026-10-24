from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "YABATECH Campus Navigation API"
    api_v1_prefix: str = "/api/v1"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Paths
    data_dir: Path = Path(__file__).resolve().parents[3] / "data"

    # Optional external services (leave empty for offline/local mode)
    osrm_base_url: str = "https://router.project-osrm.org"
    supabase_url: str = ""
    supabase_service_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
