from typing import Dict, Any
import asyncpg
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token
from app.core.errors import AppException


class AuthService:
    def __init__(self, pool: asyncpg.Pool):
        self.repo = UserRepository(pool)

    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        user = await self.repo.get_by_email(email.lower().strip())
        if not user or not verify_password(password, user["password_hash"]):
            raise AppException("Credenciales incorrectas: verifique correo y contraseña.", status_code=401)

        token = create_access_token(subject=str(user["id"]), role=user["role"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"],
            "user_id": user["id"]
        }