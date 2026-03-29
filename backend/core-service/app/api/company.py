from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.shared.auth_dependency import get__authenticated_user
from app.shared.supabase_service import get_supabase
from app.models.api_models import ApiResponse, ApiError
from app.models.http_status_enum import HttpStatus
from app.models.company_request_model import CreateCompanyRequest, UpdateCompanyRequest
from loguru import logger
from app.shared.file_service import validate_image_file

router = APIRouter()
client = get_supabase()


@router.get("/")
async def get_my_companies(current_user: Annotated[dict, Depends(get__authenticated_user)]):
    try:
        result = client.schema("core").table("company_members") \
            .select("role, status, companies(*, addresses!addresses_company_id_fkey(*))") \
            .eq("user_id", current_user.id) \
            .eq("status", "active") \
            .execute()

        companies = []
        for member in result.data:
            if member.get("companies"):
                company          = member["companies"]
                company["role"]   = member["role"]
                company["status"] = member["status"]
                companies.append(company)

        return ApiResponse(
            message="Companies fetched successfully",
            data=companies,
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception:
        return ApiError(
            detail="SERVER_ERROR",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.post("/")
async def create_company(
    request_data: CreateCompanyRequest,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        company_result = client.schema("core").table("companies").insert({
            "legal_name":           request_data.legal_name,
            "capital_social":       request_data.capital_social,
            "director_name":        request_data.director_name,
            "start_date":           request_data.start_date,
            "industry":             request_data.industry,
            "activity_description": request_data.activity_description,
            "email":                request_data.email,
            "phone":                request_data.phone,
            "country":              request_data.country,
            "currency":             request_data.currency,
        }).execute()

        if not company_result.data:
            return ApiError(
                detail="COMPANY_CREATION_FAILED",
                http_status=HttpStatus.SERVER_ERROR
            ).to_JSON()

        company_id = company_result.data[0]["company_id"]

        client.schema("core").rpc("setup_company", {
            "p_company_id":  company_id,
            "p_user_id":     current_user.id,
            "p_street":      request_data.address.line1       if request_data.address else None,
            "p_city":        request_data.address.city        if request_data.address else None,
            "p_state":       request_data.address.state       if request_data.address else None,
            "p_postal_code": request_data.address.postal_code if request_data.address else None,
            "p_country":     request_data.address.country     if request_data.address else None,
        }).execute()

        return ApiResponse(
            message="Company created successfully",
            data=company_result.data[0],
            http_status=HttpStatus.CREATED
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        return ApiError(
            message="SERVER_ERROR",
            detail=str(e),
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.put("/{company_id}")
async def update_company(
    company_id:   str,
    request_data: UpdateCompanyRequest,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        member_result = client.schema("core").table("company_members") \
            .select("role") \
            .eq("company_id", company_id) \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()

        if not member_result.data:
            return ApiError(
                message="COMPANY_NOT_FOUND",
                detail="No company found with this id for the authenticated user",
                http_status=HttpStatus.NOT_FOUND
            ).to_JSON()

        if member_result.data["role"] not in ["owner", "admin"]:
            return ApiError(
                message="UNAUTHORIZED_ROLE",
                detail="Only owner or admin can update the company",
                http_status=HttpStatus.UNAUTHORIZED
            ).to_JSON()

        company_fields = request_data.model_dump(exclude_none=True, exclude={"address"})
        if company_fields:
            client.schema("core").table("companies") \
                .update(company_fields) \
                .eq("company_id", company_id) \
                .execute()

        if request_data.address:
            client.schema("core").rpc("update_company_address", {
                "p_company_id":  company_id,
                "p_street":      request_data.address.line1,
                "p_city":        request_data.address.city,
                "p_state":       request_data.address.state       or None,
                "p_postal_code": request_data.address.postal_code or None,
                "p_country":     request_data.address.country,
            }).execute()

        logger.info(f"Company updated: {company_id} by user {current_user.id}")
        return ApiResponse(
            message="Company updated successfully",
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company {company_id}: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail=str(e),
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.post("/{company_id}/logo")
async def upload_company_logo(
    company_id:   str,
    file:         UploadFile = File(...),
    current_user: dict       = Depends(get__authenticated_user)
):
    try:
        contents = await file.read()

        error = validate_image_file(file, contents)
        if error:
            return error.to_JSON()

        ext       = file.filename.split(".")[-1]
        file_path = f"{company_id}/logo.{ext}"

        try:
            client.storage.from_("company-logos").upload(
                path=file_path,
                file=contents,
                file_options={"content-type": file.content_type, "upsert": "true"}
            )
        except Exception as e:
            logger.error(f"Error uploading logo to storage: {e}")
            return ApiError(
                message="UPLOAD_FAILED",
                detail=f"Failed to upload logo to storage at path '{file_path}'",
                http_status=HttpStatus.SERVER_ERROR
            ).to_JSON()

        logo_url = client.storage.from_("company-logos").get_public_url(file_path)

        client.schema("core").table("companies") \
            .update({"logo_url": logo_url}) \
            .eq("company_id", company_id) \
            .execute()

        logger.info(f"Logo uploaded for company {company_id}")
        return ApiResponse(
            message="Logo uploaded successfully",
            data={"logo_url": logo_url},
            http_status=HttpStatus.CREATED
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading logo: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while uploading the logo",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()


@router.delete("/{company_id}")
async def delete_company(
    company_id:   str,
    current_user: Annotated[dict, Depends(get__authenticated_user)]
):
    try:
        member_result = client.schema("core").table("company_members") \
            .select("role") \
            .eq("company_id", company_id) \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()

        if not member_result.data:
            return ApiError(
                message="COMPANY_NOT_FOUND",
                detail="No company found with this id for the authenticated user",
                http_status=HttpStatus.NOT_FOUND
            ).to_JSON()

        if member_result.data["role"] != "owner":
            return ApiError(
                message="UNAUTHORIZED_ROLE",
                detail="Only owner can delete the company",
                http_status=HttpStatus.UNAUTHORIZED
            ).to_JSON()

        client.schema("core").table("company_members").delete().eq("company_id", company_id).execute()
        client.schema("core").table("addresses").delete().eq("company_id", company_id).execute()
        client.schema("core").table("companies").delete().eq("company_id", company_id).execute()

        logger.info(f"Company deleted: {company_id} by user {current_user.id}")
        return ApiResponse(
            message="Company deleted successfully",
            http_status=HttpStatus.OK
        ).to_JSON()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting company: {e}")
        return ApiError(
            message="SERVER_ERROR",
            detail="An unexpected error occurred while deleting the company",
            http_status=HttpStatus.SERVER_ERROR
        ).to_JSON()