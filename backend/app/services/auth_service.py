from datetime import timedelta
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_access_token,
    verify_password,
    verify_refresh_token,
)
from app.models.user import Role, User
from app.schemas.auth import TokenResponse, UserCreate, UserUpdate


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def authenticate(self, username: str, password: str) -> User:
        stmt = select(User).where(
            (User.username == username.lower()) | (User.email == username.lower())
        )
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationError("Invalid credentials")
        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid credentials")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated. Contact admin.")

        return user

    async def create_tokens(self, user: User) -> TokenResponse:
        additional_claims = {
            "roles": user.role_names,
            "is_superuser": user.is_superuser,
        }
        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            additional_claims=additional_claims,
        )
        refresh_token = create_refresh_token(subject=str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        payload = verify_refresh_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid refresh token")

        user = await self.session.get(User, uuid.UUID(user_id))
        if not user or not user.is_active:
            raise AuthenticationError("User not found or deactivated")

        return await self.create_tokens(user)

    async def get_user_by_id(self, user_id: uuid.UUID) -> User:
        user = await self.session.get(User, user_id)
        if not user:
            raise NotFoundError("User", str(user_id))
        return user

    async def get_user_from_token(self, token: str) -> User:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")

        user = await self.session.get(User, uuid.UUID(user_id))
        if not user:
            raise AuthenticationError("User not found")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated")

        return user

    async def create_user(self, user_in: UserCreate) -> User:
        # Check email uniqueness
        existing = await self.session.execute(
            select(User).where(User.email == user_in.email.lower())
        )
        if existing.scalar_one_or_none():
            raise ConflictError(f"User with email '{user_in.email}' already exists")

        # Check username uniqueness
        existing_username = await self.session.execute(
            select(User).where(User.username == user_in.username.lower())
        )
        if existing_username.scalar_one_or_none():
            raise ConflictError(f"Username '{user_in.username}' is already taken")

        # Resolve roles
        roles: List[Role] = []
        for role_name in user_in.role_names:
            role_result = await self.session.execute(
                select(Role).where(Role.name == role_name)
            )
            role = role_result.scalar_one_or_none()
            if not role:
                role = Role(name=role_name)
                self.session.add(role)
                await self.session.flush()
            roles.append(role)

        user = User(
            email=user_in.email.lower(),
            username=user_in.username.lower(),
            full_name=user_in.full_name,
            hashed_password=get_password_hash(user_in.password),
            roles=roles,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update_user(self, user_id: uuid.UUID, user_in: UserUpdate) -> User:
        user = await self.get_user_by_id(user_id)

        if user_in.full_name is not None:
            user.full_name = user_in.full_name
        if user_in.email is not None:
            user.email = user_in.email.lower()
        if user_in.is_active is not None:
            user.is_active = user_in.is_active
        if user_in.password is not None:
            user.hashed_password = get_password_hash(user_in.password)
        if user_in.role_names is not None:
            roles: List[Role] = []
            for role_name in user_in.role_names:
                role_result = await self.session.execute(
                    select(Role).where(Role.name == role_name)
                )
                role = role_result.scalar_one_or_none()
                if not role:
                    role = Role(name=role_name)
                    self.session.add(role)
                    await self.session.flush()
                roles.append(role)
            user.roles = roles

        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def ensure_default_roles_exist(self) -> None:
        """Create default roles if they don't exist."""
        default_roles = [
            ("admin", "System administrator"),
            ("manager", "Fleet manager"),
            ("dispatcher", "Trip dispatcher"),
            ("viewer", "Read-only access"),
        ]
        for name, description in default_roles:
            existing = await self.session.execute(select(Role).where(Role.name == name))
            if not existing.scalar_one_or_none():
                role = Role(name=name, description=description)
                self.session.add(role)
        await self.session.flush()
