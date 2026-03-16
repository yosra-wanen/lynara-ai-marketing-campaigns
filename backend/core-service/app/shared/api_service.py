from enum import Enum
from typing import Any, Optional
from fastapi import HTTPException
from pydantic import BaseModel


class HttpStatus(Enum):
    OK           = 200
    CREATED      = 201
    BAD_REQUEST  = 400
    UNAUTHORIZED = 401
    NOT_FOUND    = 404
    SERVER_ERROR = 500


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