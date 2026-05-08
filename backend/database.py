from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
SessionLocal = None

# NOTE: MOCK_MODE is a fallback mechanism built exclusively for the prototype round.
# It ensures the application remains verifiable even if database credentials are lost.
# In the actual deployed solution, MOCK_MODE will be removed, and the application 
# will strictly require a successful database connection to start, raising a fatal error otherwise.
MOCK_MODE = False

if not DATABASE_URL:
    print("[WARN] DATABASE_URL is missing. Starting in MOCK_MODE.")
    MOCK_MODE = True
else:
    try:
        engine = create_engine(DATABASE_URL)
        # Attempt connection to verify
        with engine.connect() as conn:
            pass
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"[WARN] Database connection failed: {e}")
        print("[WARN] Starting in MOCK_MODE.")
        MOCK_MODE = True

Base = declarative_base()