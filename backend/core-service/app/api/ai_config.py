from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.shared.auth_dependency import get__authenticated_user
from app.shared.supabase_service import get_supabase
from app.shared.crypto_service import encrypt_key
from app.models.api_models import ApiResponse, ApiError
from app.models.http_status_enum import HttpStatus
from app.shared.crypto_service import encrypt_key, decrypt_key
from loguru import logger

router = APIRouter()
client = get_supabase()


@router.get("/")
async def get_ai_keys(
    company_id:   str,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        configs_result = client.schema("core").table("ai_configs") \
            .select("config_id, company_id, provider, is_active, is_default, api_key_encrypted, created_at, updated_at") \
            .eq("company_id", company_id) \
            .execute()

        configs = configs_result.data if configs_result and configs_result.data else []

        for config in configs:
            encrypted = config.pop("api_key_encrypted", None)
            if encrypted:
                try:
                    raw_key = decrypt_key(encrypted)
                    config["key_preview"] = raw_key[:6] + "..." + raw_key[-4:] if len(raw_key) > 10 else raw_key
                except Exception:
                    config["key_preview"] = "******"
            else:
                config["key_preview"] = "******"

        company_result = client.schema("core").table("companies") \
            .select("legal_name") \
            .eq("company_id", company_id) \
            .single() \
            .execute()

        company_name = company_result.data["legal_name"] if company_result and company_result.data else ""

        logger.info(f"AI keys fetched for company {company_id} by user {current_user.id}")
        return ApiResponse(
            message="AI keys fetched successfully",
            data={
                "configs":      configs,
                "company_name": company_name,
            },
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching AI keys for company {company_id}: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while fetching AI keys",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.post("/")
async def create_ai_key(
    company_id:   str,
    request_data: dict,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        provider = request_data.get("provider")
        raw_key  = request_data.get("raw_key")

        if not provider or not raw_key:
            return ApiError(
                message="MISSING_FIELDS",
                detail="Fields 'provider' and 'raw_key' are required",
                http_status=HttpStatus.BAD_REQUEST
            ).to_JSON()

        existing = client.schema("core").table("ai_configs") \
            .select("config_id") \
            .eq("company_id", company_id) \
            .eq("provider", provider) \
            .execute()

        if existing.data:
            return ApiError(
                message="AI_KEY_ALREADY_EXISTS",
                detail=f"A key for provider '{provider}' already exists for this company",
                http_status=HttpStatus.CONFLICT
            ).to_JSON()

        key_preview = raw_key[:6] + "..." + raw_key[-4:] if len(raw_key) > 10 else raw_key
        encrypted   = encrypt_key(raw_key)

        insert_result = client.schema("core").table("ai_configs").insert({
            "company_id":        company_id,
            "provider":          provider,
            "api_key_encrypted": encrypted,
            "key_preview":       key_preview,
            "model_name":        request_data.get("model_name", "default"),
            "is_active":         True,
            "is_default":        False,
            "additional_config": {},
            "created_by":        current_user.id,
            "updated_by":        current_user.id,
        }).execute()

        if not insert_result.data:
            return ApiError(
                message="AI_KEY_CREATION_FAILED",
                detail="Failed to insert AI key into database",
                http_status=HttpStatus.SERVER_ERROR
            ).to_JSON()

        response_data = insert_result.data[0]
        response_data.pop("api_key_encrypted", None)

        logger.info(f"AI key created: provider={provider} for company {company_id} by user {current_user.id}")
        return ApiResponse(
            message="AI key created successfully",
            data=response_data,
            http_status=HttpStatus.CREATED
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating AI key for company {company_id}: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while creating the AI key",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.delete("/{config_id}")
async def delete_ai_key(
    company_id:   str,
    config_id:    str,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        config_result = client.schema("core").table("ai_configs") \
            .select("config_id, provider") \
            .eq("config_id", config_id) \
            .eq("company_id", company_id) \
            .single() \
            .execute()

        if not config_result.data:
            return ApiError(
                message="AI_KEY_NOT_FOUND",
                detail="No AI key found with this id for the given company",
                http_status=HttpStatus.NOT_FOUND
            ).to_JSON()

        client.schema("core").table("ai_configs") \
            .delete() \
            .eq("config_id", config_id) \
            .execute()

        logger.info(f"AI key deleted: config_id={config_id} provider={config_result.data['provider']} for company {company_id} by user {current_user.id}")
        return ApiResponse(
            message="AI key deleted successfully",
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting AI key {config_id} for company {company_id}: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while deleting the AI key",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.patch("/{config_id}/toggle")
async def toggle_ai_key(
    company_id:   str,
    config_id:    str,
    request_data: dict,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        config_result = client.schema("core").table("ai_configs") \
            .select("config_id, provider, is_active") \
            .eq("config_id", config_id) \
            .eq("company_id", company_id) \
            .single() \
            .execute()

        if not config_result.data:
            return ApiError(
                message="AI_KEY_NOT_FOUND",
                detail="No AI key found with this id for the given company",
                http_status=HttpStatus.NOT_FOUND
            ).to_JSON()

        is_active = request_data.get("is_active")

        if is_active is None:
            return ApiError(
                message="MISSING_FIELDS",
                detail="Field 'is_active' is required",
                http_status=HttpStatus.BAD_REQUEST
            ).to_JSON()

        client.schema("core").table("ai_configs") \
            .update({
                "is_active":  is_active,
                "updated_by": current_user.id,
            }) \
            .eq("config_id", config_id) \
            .execute()

        action = "activated" if is_active else "deactivated"
        logger.info(f"AI key {action}: config_id={config_id} provider={config_result.data['provider']} for company {company_id} by user {current_user.id}")
        return ApiResponse(
            message=f"AI key {action} successfully",
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling AI key {config_id} for company {company_id}: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while toggling the AI key",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()