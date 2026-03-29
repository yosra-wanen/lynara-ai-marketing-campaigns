from fastapi import UploadFile
from app.models.api_models import ApiError
from app.models.http_status_enum import HttpStatus

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
MAX_FILE_SIZE_BYTES = 800 * 1024  # 800 KB

def validate_image_file(file: UploadFile, contents: bytes) -> ApiError | None:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        return ApiError(
            message="INVALID_FILE_TYPE",
            detail=f"Received content type '{file.content_type}', accepted formats are image/jpeg, image/png, image/gif and image/webp",
            http_status=HttpStatus.BAD_REQUEST
        )
    if len(contents) > MAX_FILE_SIZE_BYTES:
        return ApiError(
            message="FILE_TOO_LARGE",
            detail=f"Received file size is {len(contents)} bytes, maximum allowed size is 819200 bytes (800KB)",
            http_status=HttpStatus.BAD_REQUEST
        )
    return None