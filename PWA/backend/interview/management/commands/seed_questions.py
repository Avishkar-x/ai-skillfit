"""
Seed Questions — Management Command

Usage: python manage.py seed_questions

Pre-populates 3 questions each in Kannada, Hindi, English (9 total).
"""
from django.core.management.base import BaseCommand
from interview.models import Question


QUESTIONS = [
    {'text': 'ನಿಮ್ಮ ಕೆಲಸದ ಅನುಭವ ಏನು?', 'language': 'kn'},
    {'text': 'ನೀವು ಯಾವ ಉಪಕರಣಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?', 'language': 'kn'},
    {'text': 'ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ನಿಮಗೆ ಏನು ಗೊತ್ತು?', 'language': 'kn'},
    {'text': 'आपका काम का अनुभव क्या है?', 'language': 'hi'},
    {'text': 'आप कौन से उपकरण उपयोग करते हैं?', 'language': 'hi'},
    {'text': 'सुरक्षा के बारे में आप क्या जानते हैं?', 'language': 'hi'},
    {'text': 'What is your work experience?', 'language': 'en'},
    {'text': 'What tools do you use?', 'language': 'en'},
    {'text': 'What do you know about safety?', 'language': 'en'},
]


class Command(BaseCommand):
    help = 'Seed the Question table with default interview questions.'

    def handle(self, *args, **options):
        created_count = 0
        for q in QUESTIONS:
            _, created = Question.objects.get_or_create(
                text=q['text'], language=q['language'],
            )
            if created:
                created_count += 1

        total = Question.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Done. {created_count} new questions added. {total} total in database.'
        ))
