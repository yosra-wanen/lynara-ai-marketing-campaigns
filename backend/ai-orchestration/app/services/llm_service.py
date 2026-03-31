"""LLM Service - AI provider abstraction layer."""
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "mistralai/mistral-7b-instruct")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")

async def call_llm(prompt: str, system: str = "", max_tokens: int = 2000) -> str:
    """Call the configured LLM provider."""
    if not AI_API_KEY:
        raise ValueError("AI_API_KEY is not configured")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{AI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "messages": [
                    {"role": "system", "content": system or "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens,
            }
        )
        data = response.json()
        print(f"LLM response status: {response.status_code}")
        print(f"LLM response data: {data}")
        
        if "error" in data:
            raise ValueError(f"LLM error: {data['error']['message']}")
        if "choices" not in data:
            raise ValueError(f"Unexpected LLM response: {data}")
        return data["choices"][0]["message"]["content"]