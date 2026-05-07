"""
SkillSetu — DRF Serializers
"""
from rest_framework import serializers
from .models import Candidate, Question


class CandidateRegisterSerializer(serializers.Serializer):
    """Validates POST /candidate/register request body."""
    name = serializers.CharField(max_length=100)
    phone_hash = serializers.CharField(max_length=64)
    language = serializers.CharField(max_length=5, default='en')
    district = serializers.CharField(max_length=50, required=False, default='')
    trade = serializers.CharField(max_length=50, required=False, default='')


class CandidateResponseSerializer(serializers.ModelSerializer):
    """Shapes POST /candidate/register response."""
    candidate_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = Candidate
        fields = ['candidate_id', 'name']


class QuestionSerializer(serializers.ModelSerializer):
    """Shapes GET /questions response items."""
    class Meta:
        model = Question
        fields = ['question_id', 'text']


class SubmitRequestSerializer(serializers.Serializer):
    """Validates POST /submit request body."""
    candidate_id = serializers.UUIDField()
    question_id = serializers.IntegerField()
    language = serializers.CharField(max_length=5, default='en')
    audio_base64 = serializers.CharField()
    keyframes = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=3,
    )
