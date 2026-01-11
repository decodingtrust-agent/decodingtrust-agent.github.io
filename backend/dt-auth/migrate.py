"""Database migration script - creates all tables."""
from src.model import Base, engine


def run_migrations():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    run_migrations()
