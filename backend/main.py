from fastapi import FastAPI, Depends, Query
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal, MOCK_MODE
from models import Candidate, Answer, IntegrityFlag, Summary
from services.auth import LoginRequest, authenticate, require_auth
import json
import os
from mock_data import MOCK_CANDIDATES, MOCK_CANDIDATE_DETAIL

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

# Mount media directory for serving audio/keyframes
MEDIA_DIR = os.path.join(os.path.dirname(__file__), 'media')
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# DB Dependency
# -----------------------------
def get_db():
    if MOCK_MODE:
        yield None
        return
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




# -----------------------------
# AUTH — Login
# -----------------------------
@app.post("/login")
def login(data: LoginRequest):
    return authenticate(data)


# -----------------------------
# CANDIDATES LIST (Dashboard — Protected)
# -----------------------------
@app.get("/candidates")
def get_candidates(
    district: str = Query(None),
    trade: str = Query(None),
    language: str = Query(None),
    category: str = Query(None),
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_auth),
):
    if db is None:
        return MOCK_CANDIDATES

    query = db.query(Candidate)

    if district:
        query = query.filter(func.lower(Candidate.district) == district.lower())

    if trade:
        query = query.filter(func.lower(Candidate.trade) == trade.lower())

    if language:
        query = query.filter(func.lower(Candidate.language) == language.lower())

    if category:
        query = query.filter(func.lower(Candidate.fitment_category) == category.lower())

    candidates = query.all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "district": c.district,
            "trade": c.trade,
            "language": c.language,
            "final_score": c.final_score,
            "confidence_score": c.confidence_score,
            "fitment_category": c.fitment_category,
            "integrity_flags": [
                {"flag_type": f.flag_type}
                for f in db.query(IntegrityFlag)
                .filter(IntegrityFlag.candidate_id == c.id)
                .all()
            ]
        }
        for c in candidates
    ]


# -----------------------------
# CANDIDATE DETAIL (Dashboard — Protected)
# -----------------------------
@app.get("/candidate/{candidate_id}")
def get_candidate_detail(
    candidate_id: str,
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_auth),
):
    if db is None:
        return MOCK_CANDIDATE_DETAIL.get(candidate_id, {"error": "Candidate not found in Mock Data"})

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"error": "Candidate not found"}

    answers = db.query(Answer).filter(Answer.candidate_id == candidate_id).all()
    flags = db.query(IntegrityFlag).filter(IntegrityFlag.candidate_id == candidate_id).all()
    summary = db.query(Summary).filter(Summary.candidate_id == candidate_id).first()

    return {
        "id": candidate.id,
        "name": candidate.name,
        "district": candidate.district,
        "trade": candidate.trade,
        "language": candidate.language,
        "final_score": candidate.final_score,
        "confidence_score": candidate.confidence_score,
        "fitment_category": candidate.fitment_category,

        "answers": [
            {
                "question_id": a.question_id,
                "transcript": a.transcript,
                "relevance_score": a.relevance_score,
                "completeness_score": a.completeness_score,
                "clarity_score": a.clarity_score,
                "per_question_summary": a.per_question_summary,
                "audio_url": a.audio_url,
                "keyframe_urls": json.loads(a.keyframe_urls) if a.keyframe_urls else [],
            }
            for a in answers
        ],

        "integrity_flags": [
            {"flag_type": f.flag_type}
            for f in flags
        ],

        "overall_summary": summary.overall_summary if summary else None
    }
from routes.interview import router as interview_router
app.include_router(interview_router)