"""
SkillSetu — Database Models

Candidate : Registered interview candidate
Question  : Interview questions per language
Submission: One answer per question per candidate (audio + keyframes + results)
"""
import uuid
from django.db import models


class Candidate(models.Model):
    """A registered interview candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    phone_hash = models.CharField(max_length=64, unique=True, db_index=True)
    language = models.CharField(max_length=5, default='en')
    district = models.CharField(max_length=50, blank=True, default='')
    trade = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.phone_hash})"


class Question(models.Model):
    """An interview question in a specific language."""
    question_id = models.AutoField(primary_key=True)
    text = models.TextField()
    language = models.CharField(max_length=5, db_index=True)

    class Meta:
        ordering = ['language', 'question_id']

    def __str__(self):
        return f"[{self.language}] Q{self.question_id}: {self.text[:50]}"


class Submission(models.Model):
    """One recorded answer for a single question by a candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name='submissions'
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name='submissions'
    )
    language = models.CharField(max_length=5, default='en')

    # Raw data (base64-encoded)
    audio_base64 = models.TextField(blank=True, default='')
    keyframes = models.JSONField(default=list, blank=True)

    # Processing results
    transcript = models.TextField(blank=True, default='')
    relevance_score = models.FloatField(default=0.0)
    completeness_score = models.FloatField(default=0.0)
    clarity_score = models.FloatField(default=0.0)
    final_score = models.FloatField(default=0.0)
    category = models.CharField(max_length=30, blank=True, default='')

    # Integrity results
    integrity_flag = models.BooleanField(default=False)
    integrity_details = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['candidate', 'question'],
                name='unique_candidate_question'
            )
        ]

    def __str__(self):
        return f"{self.candidate.name} -> Q{self.question.question_id} ({self.final_score})"
