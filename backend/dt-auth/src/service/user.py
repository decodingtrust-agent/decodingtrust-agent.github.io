from sqlalchemy.orm import Session
from src.model.user import User
from src.utils.crypto import hash_password


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id, User.is_active == True).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email, User.is_active == True).first()

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username, User.is_active == True).first()

    def create(self, email: str, username: str, password: str) -> User:
        user = User(
            email=email,
            username=username,
            hashed_password=hash_password(password),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def email_exists(self, email: str) -> bool:
        return self.db.query(User).filter(User.email == email).first() is not None

    def username_exists(self, username: str) -> bool:
        return self.db.query(User).filter(User.username == username).first() is not None
