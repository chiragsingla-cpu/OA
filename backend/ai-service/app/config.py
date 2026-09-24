from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # The Anthropic SDK reads ANTHROPIC_API_KEY from the environment itself.
    anthropic_model: str = "claude-haiku-4-5"
    ai_internal_key: str = "change-me"

    mongodb_uri: str = "mongodb://localhost:27017/?directConnection=true"
    mongodb_db: str = "onboarding_assistant"

    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dims: int = 384
    embedding_cache_dir: str | None = None

    chunk_size: int = 800
    chunk_overlap: int = 100
    retrieval_top_k: int = 4
    history_limit: int = 6

    classify_max_tokens: int = 512
    answer_max_tokens: int = 1024


settings = Settings()
