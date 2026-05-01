import uuid
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id               = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name             = Column(String)
    language         = Column(String)
    district         = Column(String)
    trade            = Column(String)
    phone_hash       = Column(String)
    fitment_category = Column(String)
    final_score      = Column(Float)
    confidence_score = Column(Float)
    created_at       = Column(DateTime, server_default=func.now())


class Answer(Base):
    __tablename__ = "answers"

    id                   = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id         = Column(String, ForeignKey("candidates.id"))
    question_id          = Column(Integer)
    transcript           = Column(String)
    relevance_score      = Column(Float)
    completeness_score   = Column(Float)
    clarity_score        = Column(Float)
    per_question_summary = Column(String)
    created_at           = Column(DateTime, server_default=func.now())


class IntegrityFlag(Base):
    __tablename__ = "integrity_flags"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.id"))
    flag_type    = Column(String)
    created_at   = Column(DateTime, server_default=func.now())


class Summary(Base):
    __tablename__ = "summaries"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id    = Column(String, ForeignKey("candidates.id"))
    overall_summary = Column(String)