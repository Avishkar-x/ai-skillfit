from dotenv import load_dotenv
load_dotenv()
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE answers ADD COLUMN audio_url VARCHAR;"))
        print("Added audio_url column.")
    except Exception as e:
        print(f"audio_url already exists or error: {e}")
        
    try:
        conn.execute(text("ALTER TABLE answers ADD COLUMN keyframe_urls VARCHAR;"))
        print("Added keyframe_urls column.")
    except Exception as e:
        print(f"keyframe_urls already exists or error: {e}")
        
    conn.commit()
    print("Database schema migration complete.")
