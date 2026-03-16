import os
from typing import Annotated, Optional
from fastapi import APIRouter, File, HTTPException, Depends, Request, UploadFile
from pydantic import BaseModel
from app.shared.auth_dependency import get__authenticated_user
from app.shared.supabase_service import get_supabase
from app.shared.api_service import HttpStatus, ApiResponse, ApiError

router = APIRouter()
client = get_supabase()


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone:     Optional[str] = None
    email:     Optional[str] = None


@router.get("/me")
async def get_current_user(current_user: Annotated[dict, Depends(get__authenticated_user)]):
    try:
        result = client.schema("core").table("profiles") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()

        if not result.data:
            return ApiError(
                message="PROFILE_NOT_FOUND",
                detail="No profile was found for the authenticated user in the database",
                http_status=HttpStatus.NOT_FOUND
            ).to_JSON()

        return ApiResponse(
            message="Profile fetched successfully",
            data=result.data,
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception:
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while fetching the profile",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.put("/me")
async def update_current_user(request: Request, request_data: UpdateProfileRequest, current_user: Annotated[dict, Depends(get__authenticated_user)]):
    try:
        result = client.rpc("update_user_profile", {
            "p_user_id":   current_user.id,
            "p_full_name": request_data.full_name,
            "p_phone":     request_data.phone,
            "p_type_user": False,
        }).execute()

        if not result.data:
            return ApiError(
                message="PROFILE_NOT_FOUND",
                detail="No profile was found for the authenticated user, update could not be applied",
                http_status=HttpStatus.NOT_FOUND
            ).to_JSON()

        if request_data.email and request_data.email != current_user.email:
            try:
                token = request.cookies.get("access_token")
                client.auth.set_session(access_token=token, refresh_token=token)
                client.auth.update_user({"email": request_data.email})
            except Exception:
                return ApiError(
                    message="EMAIL_UPDATE_FAILED",
                    detail="The email address could not be updated in database, the session or token may be invalid",
                    http_status=HttpStatus.BAD_REQUEST
                ).to_JSON()

        return ApiResponse(
            message="Profile updated successfully",
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception:
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while updating the profile",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get__authenticated_user)):
    try:
        if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            return ApiError(
                message="INVALID_FILE_TYPE",
                detail=f"Received content type '{file.content_type}', accepted formats are image/jpeg, image/png, image/gif and image/webp",
                http_status=HttpStatus.BAD_REQUEST
            ).to_JSON()

        contents = await file.read()

        if len(contents) > 800 * 1024:
            return ApiError(
                message="FILE_TOO_LARGE",
                detail=f"Received file size is {len(contents)} bytes, maximum allowed size is 819200 bytes (800KB)",
                http_status=HttpStatus.BAD_REQUEST
            ).to_JSON()

        user_id   = current_user.id
        ext       = file.filename.split(".")[-1]
        file_path = f"{user_id}/avatar.{ext}"

        try:
            client.storage.from_("avatars").upload(
                path=file_path,
                file=contents,
                file_options={"content-type": file.content_type, "upsert": "true"}
            )
        except Exception:
            return ApiError(
                message="UPLOAD_FAILED",
                detail=f"Failed to upload the file to database at path '{file_path}'",
                http_status=HttpStatus.SERVER_ERROR
            ).to_JSON()

        avatar_url = client.storage.from_("avatars").get_public_url(file_path)

        client.schema("core").table("profiles") \
            .update({"avatar_url": avatar_url}) \
            .eq("user_id", user_id) \
            .execute()

        return ApiResponse(
            message="Avatar uploaded successfully",
            data={"avatar_url": avatar_url},
            http_status=HttpStatus.CREATED
        ).to_JSON()

    except HTTPException:
        raise
    except Exception:
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while processing the avatar upload",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()