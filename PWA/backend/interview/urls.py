"""SkillSetu — Interview App URL Routes"""
from django.urls import path
from . import views

urlpatterns = [
    path('candidate/register', views.register_candidate, name='register-candidate'),
    path('questions', views.list_questions, name='list-questions'),
    path('submit', views.submit_answer, name='submit-answer'),
    path('tts', views.tts_proxy, name='tts-proxy'),
]
