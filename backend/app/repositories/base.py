import uuid
from typing import Any, Dict, Generic, List, Optional, Tuple, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """
    Generic repository providing standard CRUD operations and pagination.
    All methods accept an AsyncSession to keep the caller in control of transactions.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: uuid.UUID) -> Optional[ModelType]:
        result = await self.session.get(self.model, entity_id)
        return result

    async def get_all(
        self, *, skip: int = 0, limit: int = 100
    ) -> Tuple[List[ModelType], int]:
        count_stmt = select(func.count()).select_from(self.model)
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        stmt = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    async def create(self, obj_in: Dict[str, Any]) -> ModelType:
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(
        self, db_obj: ModelType, obj_in: Dict[str, Any]
    ) -> ModelType:
        for field, value in obj_in.items():
            if value is not None or field in obj_in:
                setattr(db_obj, field, value)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: ModelType) -> None:
        await self.session.delete(db_obj)
        await self.session.flush()

    async def exists(self, entity_id: uuid.UUID) -> bool:
        stmt = select(func.count()).where(self.model.id == entity_id)
        result = await self.session.execute(stmt)
        return result.scalar_one() > 0
