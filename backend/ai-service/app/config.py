from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # The Anthropic SDK reads ANTHROPIC_API_KEY from the environment itself.
    anthropic_model: str = "claude-haiku-4-5"
    # Shared secret Laravel sends as X-Internal-Key. The service refuses to start while it is weak (see main.py).
    ai_internal_key: str = ""

    mongodb_uri: str = "mongodb://localhost:27017/?directConnection=true"
    mongodb_db: str = "onboarding_assistant"

    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dims: int = 384
    embedding_cache_dir: str | None = None

    chunk_size: int = 800
    chunk_overlap: int = 100
    retrieval_top_k: int = 6
    # Vector score (0-1) at which a question the classifier marked out_of_scope is answered from the
    # documents anyway. Tuned for bge-small: off-topic questions scored up to ~0.79, product questions 0.81+.
    out_of_scope_rescue_score: float = 0.81
    history_limit: int = 6

    classify_max_tokens: int = 512
    answer_max_tokens: int = 1024


settings = Settings()
