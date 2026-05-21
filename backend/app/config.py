from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str
    tavily_api_key: str
    openai_model: str = "gpt-4o"
    max_search_results: int = 5
    agent_timeout_seconds: int = 30


settings = Settings()  # type: ignore[call-arg]
