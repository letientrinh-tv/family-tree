import os
import re
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

_raw_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/familytree")
# psycopg3 dialect — replace postgres:// or postgresql:// with postgresql+psycopg://
DATABASE_URL = re.sub(r"^postgres(ql)?://", "postgresql+psycopg://", _raw_url)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
