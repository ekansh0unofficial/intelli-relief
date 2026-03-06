from typing import Generic, TypeVar, Type, Optional, List, Any, Dict, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select , func

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    """
    Generic async CRUD repository.

    All service-specific repositories extend this class and 
    create / get / get_all / update / delete for free.
    """
    def __init__(self , model: Type[ModelType], db: AsyncSession) -> None:
        self.model = model 
        self.db = db
    
    # Create
    async def create(self , **kwargs: Any) -> ModelType:
        """ Create and persist a new record. """
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    # Read
    async def get_by_id(self, record_id: UUID) -> Optional[ModelType]:
        """ Fetch one record by primary key. Returns None if not found. """
        result = await self.db.execute(
            select(self.model).where(self.model.id == record_id)       
        )    
        return result.scalar_one_or_none()

    async def get_all(
        self,
        limit: int = 50,
        offset: int = 0,
        filters: Optional[List[Any]] = None,
        order_by: Optional[Any] = None,
    ) -> Tuple[List[ModelType], int]:
        """
        Fetch a paginated list.
        Returns (items, total_count) tuple.
        """
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)

        if order_by is not None:
            query = query.order_by(order_by)

        query = query.limit(limit).offset(offset)

        items_result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        return list(items_result.scalars().all()) , count_result.scalar()  # type: ignore

    # Update
    async def update(
        self, record_id: UUID, updates: Dict[str, Any]  
    ) -> Optional[ModelType]:
        """
        Apply a dict of field updates to an existing record.
        Returns the updated record or None is not found.
        """                
        instance = await self.get_by_id(record_id)
        if instance is None:
            return None
        
        for field , value in updates.items():
            if hasattr(instance, field) and value is not None:
                setattr(instance, field , value)

        await self.db.flush()
        await self.db.refresh(instance)
        return instance        

    # Delete
    async def delete(self , record_id: UUID) -> bool:
        """
        Hard-delete a record.
        Returns True is deleted, False if not found.
        """    
        instance = await self.get_by_id(record_id)
        if instance is None:
            return False
        
        await self.db.delete(instance)
        await self.db.flush()
        return True

    # Helpers
    async def exists(self , record_id: UUID) -> bool:
        result = await self.db.execute(
            select(func.count())
            .select_from(self.model)
            .where(self.model.id == record_id)
        )        
        return result.scalar() > 0 # type: ignore