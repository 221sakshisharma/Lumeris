from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    backend_cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = ""
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    supabase_url: str = ""
    supabase_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
