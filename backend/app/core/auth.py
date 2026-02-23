from uuid import UUID
from typing import Optional
from fastapi import Header, HTTPException


def get_current_user_context(
    x_user_id: Optional[str] = Header(default=None, alias="x-user-id"),
    x_user_email: Optional[str] = Header(default=None, alias="x-user-email"),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing x-user-id header")

    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid x-user-id header")

    return user_id, x_user_email

