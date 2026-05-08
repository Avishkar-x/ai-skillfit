# mock_data.py
# NOTE: This mock data is used purely for the prototype round to ensure the application 
# can be demonstrated even if the PostgreSQL database connection fails. 
# In the actual production solution, this file will be completely removed, and 
# all candidate data will be strictly fetched from the live, secure database.
MOCK_CANDIDATES = [
    {
        "id": "mock-001",
        "name": "Arjun Patel",
        "district": "Pune",
        "trade": "Electrician",
        "language": "hi",
        "final_score": 88.5,
        "confidence_score": 92.0,
        "fitment_category": "Job Ready",
        "integrity_flags": []
    },
    {
        "id": "mock-002",
        "name": "Priya Sharma",
        "district": "Mumbai",
        "trade": "Plumber",
        "language": "en",
        "final_score": 45.0,
        "confidence_score": 60.0,
        "fitment_category": "Needs Training",
        "integrity_flags": [
            {"flag_type": "multiple_faces"}
        ]
    }
]

MOCK_CANDIDATE_DETAIL = {
    "mock-001": {
        "id": "mock-001",
        "name": "Arjun Patel",
        "district": "Pune",
        "trade": "Electrician",
        "language": "hi",
        "final_score": 88.5,
        "confidence_score": 92.0,
        "fitment_category": "Job Ready",
        "answers": [
            {
                "question_id": 1,
                "transcript": "I have 5 years of experience in wiring and electrical maintenance.",
                "relevance_score": 9.5,
                "completeness_score": 8.0,
                "clarity_score": 9.0,
                "per_question_summary": "Clear and concise explanation of experience.",
                "audio_url": None,
                "keyframe_urls": []
            },
            {
                "question_id": 2,
                "transcript": "I use multimeters, wire strippers, and voltage testers regularly.",
                "relevance_score": 9.0,
                "completeness_score": 9.0,
                "clarity_score": 8.5,
                "per_question_summary": "Listed relevant tools appropriately.",
                "audio_url": None,
                "keyframe_urls": []
            }
        ],
        "integrity_flags": [],
        "overall_summary": "Candidate demonstrated strong understanding across all questions. Recommended for immediate placement."
    },
    "mock-002": {
        "id": "mock-002",
        "name": "Priya Sharma",
        "district": "Mumbai",
        "trade": "Plumber",
        "language": "en",
        "final_score": 45.0,
        "confidence_score": 60.0,
        "fitment_category": "Needs Training",
        "answers": [
            {
                "question_id": 1,
                "transcript": "I know a bit about pipes.",
                "relevance_score": 5.0,
                "completeness_score": 4.0,
                "clarity_score": 5.0,
                "per_question_summary": "Very brief answer, lacks detail.",
                "audio_url": None,
                "keyframe_urls": []
            }
        ],
        "integrity_flags": [
            {"flag_type": "multiple_faces"}
        ],
        "overall_summary": "Candidate showed basic understanding but needs upskilling before placement. Manual verification recommended due to integrity flags."
    }
}
