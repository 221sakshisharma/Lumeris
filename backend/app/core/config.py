import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    backend_cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = ""
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    supabase_url: str = ""
    supabase_key: str = ""

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return value

        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []

            # Support JSON arrays in env, e.g. '["http://localhost:3000"]'
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
                except json.JSONDecodeError:
                    pass

            # Support comma-separated origins in env, e.g. "http://a,http://b"
            return [origin.strip() for origin in raw.split(",") if origin.strip()]

        return ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
