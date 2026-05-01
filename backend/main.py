from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import Candidate, Answer, IntegrityFlag, Summary

app = FastAPI()


# -----------------------------
# DB Dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




# -----------------------------
# CANDIDATES LIST (Dashboard)
# -----------------------------
@app.get("/candidates")
def get_candidates(
    district: str = Query(None),
    trade: str = Query(None),
    language: str = Query(None),
    category: str = Query(None),
    db: Session = Depends(get_db)
):
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
            "score": c.final_score,
            "confidence": c.confidence_score,
            "category": c.fitment_category
        }
        for c in candidates
    ]


# -----------------------------
# CANDIDATE DETAIL (Dashboard)
# -----------------------------
@app.get("/candidate/{candidate_id}")
def get_candidate_detail(candidate_id: str, db: Session = Depends(get_db)):
    
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
        "score": candidate.final_score,
        "confidence": candidate.confidence_score,
        "category": candidate.fitment_category,

        "answers": [
            {
                "question_id": a.question_id,
                "transcript": a.transcript,
                "relevance": a.relevance_score,
                "completeness": a.completeness_score,
                "clarity": a.clarity_score,
                "summary": a.per_question_summary
            }
            for a in answers
        ],

        "flags": [f.flag_type for f in flags],

        "overall_summary": summary.overall_summary if summary else None
    }