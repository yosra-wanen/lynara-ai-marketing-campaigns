"""OpenRouter AI client."""

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "mistralai/mistral-7b-instruct")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")

async def call_ai(prompt: str, system: str = "", max_tokens: int = 2000) -> str:
    """Call OpenRouter AI with a prompt."""
    if not AI_API_KEY:
        return _mock_ai_response(prompt)
    
    try:
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
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AI call failed: {e}")
        return _mock_ai_response(prompt)

def _mock_ai_response(prompt: str) -> str:
    """Mock response when API key is not available."""
    return """[
        {"customer_name": "Ahmed Ben Ali", "customer_email": "ahmed.benali@techsolutions.tn", "customer_phone": "+21620123456", "company_name": "Tech Solutions TN", "industry": "Technologie", "billing_city": "Tunis", "billing_country": "Tunisie", "website": "https://techsolutions.tn", "score": 85, "rating": "hot", "source": "web_collection"},
        {"customer_name": "Sara Trabelsi", "customer_email": "sara.trabelsi@digitalagency.tn", "customer_phone": "+21625987654", "company_name": "Digital Agency", "industry": "Marketing", "billing_city": "Sfax", "billing_country": "Tunisie", "website": "https://digitalagency.tn", "score": 72, "rating": "hot", "source": "web_collection"},
        {"customer_name": "Karim Mansour", "customer_email": "karim.mansour@consulting.tn", "customer_phone": "+21698765432", "company_name": "Consulting Group", "industry": "Conseil", "billing_city": "Sousse", "billing_country": "Tunisie", "website": "https://consulting.tn", "score": 58, "rating": "warm", "source": "web_collection"}
    ]"""