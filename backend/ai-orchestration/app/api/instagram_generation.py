"""Instagram AI generation — captions and images."""

import asyncio
import json
import os
import re
import time
import uuid
from typing import Optional

import httpx
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

from app.services.ai_client import call_ai
from app.config.settings import SUPABASE_URL, SUPABASE_SERVICE_KEY

router = APIRouter()

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")

# (url, num_inference_steps) — FLUX.1-schnell is a 4-step distilled model
HF_MODELS = [
    ("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", 4),
    ("https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers", 20),
]
STORAGE_BUCKET = "instagram-images"

supabase: Optional[Client] = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_KEY
    else None
)


# ── Request schemas ───────────────────────────────────────────────────────────

class CaptionRequest(BaseModel):
    company_id: str
    draft_id: Optional[str] = None
    context: str
    tone: str = "professionnel"     # professionnel | enthousiaste | informatif | persuasif
    language: str = "fr"            # fr | en | ar
    catalog_item_id: Optional[str] = None


class ImproveCaptionRequest(BaseModel):
    company_id: str
    draft_id: Optional[str] = None
    existing_caption: str
    instructions: str
    language: str = "fr"


class ImageRequest(BaseModel):
    company_id: str
    draft_id: Optional[str] = None
    prompt: str
    style: str = "moderne"          # moderne | lumineux | élégant | minimaliste
    content_type: str = "post"      # post | carousel | story | reel


# ── Prompts ───────────────────────────────────────────────────────────────────

CAPTION_SYSTEM = (
    "Tu es un expert en marketing Instagram pour l'immobilier tunisien. "
    "Tu génères des légendes professionnelles et engageantes. "
    "Réponds UNIQUEMENT en JSON valide sans texte avant/après. "
    'Format: {"caption": "...", "hashtags": ["#...", "..."], "cta": "..."}'
)

IMPROVE_SYSTEM = (
    "Tu es un expert en copywriting Instagram. "
    "Tu améliores les légendes selon les instructions données. "
    "Réponds UNIQUEMENT en JSON valide. "
    'Format: {"caption": "...", "hashtags": ["#...", "..."], "cta": "..."}'
)

_TONE_MAP = {
    "professionnel": "professionnel et sobre",
    "enthousiaste":  "enthousiaste et dynamique",
    "informatif":    "informatif et détaillé",
    "persuasif":     "persuasif et convaincant",
}
_LANG_MAP = {
    "fr": "français",
    "ar": "arabe dialectal tunisien",
    "en": "anglais",
}

_STYLE_MAP = {
    "moderne":     "modern minimalist architecture, clean lines, contemporary design",
    "lumineux":    "bright airy atmosphere, natural light, warm golden tones",
    "élégant":     "elegant luxury interior, sophisticated, premium materials",
    "minimaliste": "minimalist style, simple composition, clean white space",
}


def _caption_prompt(context: str, tone: str, language: str) -> str:
    return (
        f"Crée une légende Instagram pour ce contenu:\n\n"
        f"Contexte: {context}\n"
        f"Ton: {_TONE_MAP.get(tone, tone)}\n"
        f"Langue: {_LANG_MAP.get(language, 'français')}\n\n"
        "Exigences:\n"
        "- Commence par un emoji accrocheur\n"
        "- Corps naturel et humain (max 2200 chars)\n"
        "- 8 à 12 hashtags pertinents (immobilier tunisien)\n"
        "- CTA clair et incitatif\n\n"
        'Réponds en JSON: {"caption": "...", "hashtags": ["#...", "..."], "cta": "..."}'
    )


def _improve_prompt(caption: str, instructions: str, language: str) -> str:
    return (
        f"Améliore cette légende Instagram:\n\n"
        f"Légende actuelle:\n{caption}\n\n"
        f"Instructions: {instructions}\n"
        f"Langue: {_LANG_MAP.get(language, 'français')}\n\n"
        'Réponds en JSON: {"caption": "...", "hashtags": ["#...", "..."], "cta": "..."}'
    )


def _build_image_prompt(prompt: str, style: str) -> str:
    style_desc = _STYLE_MAP.get(style, "")
    return (
        f"{prompt}. {style_desc}. "
        "Professional real estate photography, Tunisia, high quality, "
        "Instagram-ready, photorealistic, 8k"
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    """Extract JSON from AI response, handling markdown fences."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start : end + 1])
            except Exception:
                pass
    return {
        "caption": raw[:500] if raw else "Légende générée automatiquement.",
        "hashtags": ["#immobilier", "#tunisie", "#realestate"],
        "cta": "Contactez-nous!",
    }


def _mock_caption(context: str, _tone: str, language: str) -> dict:
    bodies = {
        "fr": (
            f"🏡 Une opportunité exceptionnelle vous attend!\n\n"
            f"{context[:100]}{'...' if len(context) > 100 else ''}\n\n"
            "Investissez dans votre avenir dès aujourd'hui. "
            "Notre équipe d'experts est à votre disposition."
        ),
        "en": (
            f"🏡 An exceptional opportunity awaits!\n\n"
            f"{context[:100]}{'...' if len(context) > 100 else ''}\n\n"
            "Invest in your future today. Our team of experts is here to guide you."
        ),
        "ar": (
            f"🏡 فرصة استثنائية في انتظاركم!\n\n"
            f"{context[:100]}{'...' if len(context) > 100 else ''}\n\n"
            "استثمروا في مستقبلكم. فريقنا جاهز لمساعدتكم."
        ),
    }
    return {
        "caption": bodies.get(language, bodies["fr"]),
        "hashtags": [
            "#immobilier", "#tunisie", "#realestate", "#investissement",
            "#propriété", "#maison", "#tunis", "#habitat", "#achat", "#vente",
        ],
        "cta": "Contactez-nous maintenant pour plus d'informations!",
    }


def _is_lead_mock(raw: str) -> bool:
    """Detect when ai_client returned its lead-research mock instead of our result."""
    return not raw or raw.strip().startswith("[")


async def _save_caption(company_id: str, draft_id: Optional[str], prompt: str, result: dict, tone: str, language: str) -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{SUPABASE_URL}/rest/v1/instagram_caption_generations",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",

                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "company_id": company_id,
                    "draft_id": draft_id,
                    "prompt": prompt[:500],
                    "generated_caption": result.get("caption", ""),
                    "hashtags": result.get("hashtags", []),
                    "tone": tone,
                    "language": language,
                },
                timeout=10.0,
            )
    except Exception as e:
        print(f"[IG_GEN] caption save error: {e}")


async def _save_image(company_id: str, draft_id: Optional[str], prompt: str, url: str, style: str, content_type: str) -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{SUPABASE_URL}/rest/v1/instagram_image_generations",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",

                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "company_id": company_id,
                    "draft_id": draft_id,
                    "prompt": prompt[:500],
                    "generated_image_url": url,
                    "style": style,
                    "content_type": content_type,
                },
                timeout=10.0,
            )
    except Exception as e:
        print(f"[IG_GEN] image save error: {e}")


# ── Hugging Face image generation ─────────────────────────────────────────────

def _call_huggingface(prompt: str, width: int, height: int) -> bytes:
    """Synchronous HF Inference API call with model fallback and 503 retry.

    Tries each model in HF_MODELS in order. On 503 (model warming up) retries
    the same model up to 3 times with the wait time HF suggests. On any other
    non-200 it logs the full response and moves to the next model.
    """
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
    last_error = "Erreur inconnue"

    for model_url, num_steps in HF_MODELS:
        payload = {
            "inputs": prompt,
            "parameters": {"num_inference_steps": num_steps, "width": width, "height": height},
        }
        for attempt in range(1, 4):
            resp = requests.post(model_url, headers=headers, json=payload, timeout=120)

            if resp.status_code == 200:
                return resp.content

            print(f"[IG_GEN] {model_url} attempt {attempt}/3 → HTTP {resp.status_code}")
            print(f"[IG_GEN] Response body: {resp.text[:500]}")

            if resp.status_code == 503:
                try:
                    wait = float(resp.json().get("estimated_time", 20))
                except Exception:
                    wait = 20.0
                wait = max(5.0, min(wait, 30.0))
                print(f"[IG_GEN] Model loading — retrying in {wait:.0f}s...")
                time.sleep(wait)
                last_error = f"{model_url} en cours de chargement"
                continue

            # Any other error — log and try next model
            try:
                last_error = resp.json().get("error", f"HTTP {resp.status_code}")
            except Exception:
                last_error = f"HTTP {resp.status_code}"
            break  # stop retrying this model

    raise ValueError(f"Hugging Face: {last_error}")


def _upload_image(image_bytes: bytes, company_id: str) -> str:
    """Upload JPEG bytes to Supabase Storage and return the public URL."""
    if not supabase:
        raise ValueError("Supabase non configuré")
    path = f"{company_id}/{uuid.uuid4()}.jpg"
    supabase.storage.from_(STORAGE_BUCKET).upload(
        path,
        image_bytes,
        file_options={"content-type": "image/jpeg"},
    )
    return supabase.storage.from_(STORAGE_BUCKET).get_public_url(path)


async def _run_huggingface(prompt: str, width: int, height: int, company_id: str) -> str:
    image_bytes = await asyncio.to_thread(_call_huggingface, prompt, width, height)
    return await asyncio.to_thread(_upload_image, image_bytes, company_id)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate/caption")
async def generate_caption(payload: CaptionRequest):
    try:
        prompt  = _caption_prompt(payload.context, payload.tone, payload.language)
        raw     = await call_ai(prompt, system=CAPTION_SYSTEM, max_tokens=600)
        is_mock = _is_lead_mock(raw)
        result  = _mock_caption(payload.context, payload.tone, payload.language) if is_mock else _parse_json(raw)

        asyncio.create_task(_save_caption(payload.company_id, payload.draft_id, payload.context, result, payload.tone, payload.language))
        return {"data": result, "mock": is_mock or not bool(os.getenv("AI_API_KEY"))}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/improve-caption")
async def improve_caption(payload: ImproveCaptionRequest):
    try:
        prompt = _improve_prompt(payload.existing_caption, payload.instructions, payload.language)
        raw    = await call_ai(prompt, system=IMPROVE_SYSTEM, max_tokens=600)
        result = _parse_json(payload.existing_caption) if _is_lead_mock(raw) else _parse_json(raw)

        asyncio.create_task(_save_caption(payload.company_id, payload.draft_id, payload.instructions, result, "amélioration", payload.language))
        return {"data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/image")
async def generate_image(payload: ImageRequest):
    """Generate an image via Hugging Face SD, upload to Supabase Storage."""
    width  = 512
    height = 512

    if HUGGINGFACE_API_TOKEN:
        try:
            enhanced_prompt = _build_image_prompt(payload.prompt, payload.style)
            url = await _run_huggingface(enhanced_prompt, width, height, payload.company_id)
            is_mock = False
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Génération image échouée : {e}")
    else:
        seed = abs(hash(payload.prompt + payload.style)) % 1000
        url  = f"https://picsum.photos/seed/{seed}/{width}/{height}"
        is_mock = True

    asyncio.create_task(_save_image(payload.company_id, payload.draft_id, payload.prompt, url, payload.style, payload.content_type))

    result = {
        "url":    url,
        "prompt": payload.prompt,
        "style":  payload.style,
        "width":  width,
        "height": height,
    }
    response: dict = {"data": result}
    if is_mock:
        response["mock"] = True
        response["note"] = "Token HUGGINGFACE_API_TOKEN non configuré — image placeholder."
    return response
