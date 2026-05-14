"""Quick smoke-test for HF Inference router URLs."""

import os
import sys
import time

import requests
import urllib3
from dotenv import load_dotenv

# SSL verification fails on Windows with local Python due to missing CA certs.
# Docker/Linux has proper certs so verify=True is kept in production code.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
VERIFY_SSL = False

load_dotenv()

TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
if not TOKEN:
    print("ERROR: HUGGINGFACE_API_TOKEN not set in .env")
    sys.exit(1)

# (url, num_inference_steps) — FLUX.1-schnell is a 4-step distilled model
MODELS = [
    ("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", 4),
    ("https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers", 20),
    ("https://router.huggingface.co/hf-inference/models/Kwai-Kolors/Kolors", 20),
]

PROMPT = "A modern apartment in Tunis, professional real estate photography"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def test_model(url: str, num_steps: int) -> bool:
    payload = {
        "inputs": PROMPT,
        "parameters": {"num_inference_steps": num_steps, "width": 512, "height": 512},
    }
    print(f"\n{'='*60}")
    print(f"Model : {url.split('/')[-1]}")
    print(f"URL   : {url}")
    print(f"Steps : {num_steps}")

    for attempt in range(1, 4):
        print(f"  Attempt {attempt}/3 ...", end=" ", flush=True)
        try:
            resp = requests.post(url, headers=HEADERS, json=payload, timeout=120, verify=VERIFY_SSL)
        except Exception as e:
            print(f"NETWORK ERROR: {e}")
            return False

        print(f"HTTP {resp.status_code}")

        if resp.status_code == 200:
            content_type = resp.headers.get("content-type", "unknown")
            print(f"  OK -- {len(resp.content):,} bytes  content-type: {content_type}")
            out = f"test_output_{url.split('/')[-1]}.jpg"
            with open(out, "wb") as f:
                f.write(resp.content)
            print(f"  Saved -> {out}")
            return True

        print(f"  Body: {resp.text[:400]}")

        if resp.status_code == 503:
            try:
                wait = float(resp.json().get("estimated_time", 20))
            except Exception:
                wait = 20.0
            wait = max(5.0, min(wait, 30.0))
            print(f"  Model loading -- waiting {wait:.0f}s...")
            time.sleep(wait)
            continue

        print(f"  Non-retryable ({resp.status_code}) -- skipping model.")
        return False

    print("  All 3 attempts exhausted.")
    return False


if __name__ == "__main__":
    results = []
    for model_url, steps in MODELS:
        ok = test_model(model_url, steps)
        results.append((model_url.split("/")[-1], ok))

    print(f"\n{'='*60}")
    print("RESULTS:")
    for name, ok in results:
        status = "OK  " if ok else "FAIL"
        print(f"  [{status}] {name}")

    if any(ok for _, ok in results):
        print("\nAt least one model works -- image generation is ready.")
        sys.exit(0)
    else:
        print("\nNo model succeeded.")
        sys.exit(1)
