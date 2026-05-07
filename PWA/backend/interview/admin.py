"""SkillSetu — Admin Registration"""
from django.contrib import admin
from .models import Candidate, Question, Submission


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone_hash', 'language', 'district', 'trade', 'created_at']
    list_filter = ['language', 'district', 'trade']
    search_fields = ['name', 'phone_hash']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_id', 'language', 'text']
    list_filter = ['language']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'candidate', 'question', 'integrity_flag', 'final_score', 'category', 'created_at']
    list_filter = ['integrity_flag', 'category', 'language']
    search_fields = ['candidate__name', 'transcript']
