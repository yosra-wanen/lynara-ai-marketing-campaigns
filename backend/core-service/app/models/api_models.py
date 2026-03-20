from typing import Any, Optional
from fastapi import HTTPException
from pydantic import BaseModel
from app.models.http_status_enum import HttpStatus

class ApiResponse(BaseModel):
    message:     str
    data:        Optional[Any] = None
    http_status: HttpStatus = HttpStatus.OK

    def to_JSON(self):
        return {
            "message":     self.message,
            "data":        self.data,
            "http_status": self.http_status.value,
        }


class ApiError(BaseModel):
    message:     str = "error"
    detail:      Optional[str] = None
    http_status: HttpStatus

    def to_JSON(self):
        raise HTTPException(
            status_code=self.http_status.value,
            detail={
                "message":     self.message,
                "detail":      self.detail,
                "http_status": self.http_status.value,
            }
        )