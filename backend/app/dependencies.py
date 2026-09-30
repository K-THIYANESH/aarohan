from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, TokenBlacklist, UserRole
from app.utils.exceptions import UnauthorizedError, ForbiddenError, hash_token

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    token_h = hash_token(token)

    # Check blacklist
    blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token_hash == token_h).first()
    if blacklisted:
        raise UnauthorizedError("Token has been revoked")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError("Invalid token payload")
    except JWTError:
        raise UnauthorizedError("Could not validate access token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise UnauthorizedError("User inactive or non-existent")

    return user

def require_role(role: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != role:
            raise ForbiddenError(f"Operation requires {role.value} role")
        return current_user
    return role_checker

require_field_officer = require_role(UserRole.FIELD_OFFICER)
require_revenue_officer = require_role(UserRole.REVENUE_OFFICER)
