import hashlib
from fastapi import HTTPException, status
from pydantic import ValidationError as PydanticValidationError

class AarohanException(HTTPException):
    def __init__(self, status_code: int, error_code: str, message: str, fields: list = None):
        super().__init__(status_code=status_code, detail=message)
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.fields = fields or []

class NotFoundError(AarohanException):
    def __init__(self, resource: str, id_val: any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            message=f"{resource} with id '{id_val}' not found."
        )

class ValidationError(AarohanException):
    def __init__(self, fields: list, message: str = "Please check the following fields"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="validation_error",
            message=message,
            fields=fields
        )

class UnauthorizedError(AarohanException):
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            message=message
        )

class ForbiddenError(AarohanException):
    def __init__(self, reason: str = "Access denied for your role"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            message=reason
        )

class ServiceError(AarohanException):
    def __init__(self, service: str, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVICE_ERROR",
            message=f"Error in {service}: {detail}"
        )

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()
