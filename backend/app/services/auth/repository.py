from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.base_repository import BaseRepository
from app.services.auth.models import User

class UserRepository(BaseRepository[User]):
    """
    User data access layer.
    Extends BaseRepository with auth-specific queries.
    """

    def __init__(self , db: AsyncSession):
        super().__init__(User, db)

    async  def get_by_username(self , username: str) -> Optional[User]:
        """
        Find user by username.
        Used for login authentication
        """    
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self , email :str) -> Optional[User]:
        """
        Find user by email.
        Used to prevent duplicate email registration.
        """
        result = await self.db.execute(
            select(User).where( User.email == email) 
        )
        return result.scalar_one_or_none()
    
    async def username_exists(self, username : str) -> bool:
        """Checks if the username already exists"""
        user = await self.get_by_username(username)
        return user is not None 
    
    async def email_exists(self , email: str) -> bool:
        """Checks if the email already in use."""
        if not email:
            return False
        user = await self.get_by_email(email)
        return user is not None