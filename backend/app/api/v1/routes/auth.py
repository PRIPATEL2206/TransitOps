from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    TokenRefreshRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse, summary="Login with username/email and password")
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    user = await auth_service.authenticate(login_data.username, login_data.password)
    return await auth_service.create_tokens(user)


# Alias: /auth/token works the same as /auth/login (for frontend compatibility)
@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def login_token_alias(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    user = await auth_service.authenticate(login_data.username, login_data.password)
    return await auth_service.create_tokens(user)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(
    refresh_data: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    return await auth_service.refresh_tokens(refresh_data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
):
    # In a stateless JWT system, logout is client-side.
    # In production, add the token to a Redis blacklist here.
    return None


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    return current_user


@router.put("/me", response_model=UserResponse, summary="Update current user profile")
async def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    return await auth_service.update_user(current_user.id, user_in)


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user (admin only)",
)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.api.deps import require_role
    auth_service = AuthService(db)
    return await auth_service.create_user(user_in)
