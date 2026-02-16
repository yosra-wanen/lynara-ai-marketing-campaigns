"""Endpoints OCR - Extraction de texte depuis images."""

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter()


class OCRResult(BaseModel):
    """Résultat OCR."""

    text: str
    confidence: float | None = None


@router.post("/extract", response_model=OCRResult)
async def extract_text(file: UploadFile = File(...)):
    """Extraction de texte depuis une image - Pipeline OCR."""
    # TODO: Intégration Tesseract / Google Vision / AWS Textract
    # import pytesseract
    # from PIL import Image
    # img = Image.open(file.file)
    # text = pytesseract.image_to_string(img)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Fichier image requis")
    return OCRResult(text="", confidence=None)
