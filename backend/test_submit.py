import requests

BASE_URL = "http://127.0.0.1:8000"

# Step 1 — Register candidate
register_response = requests.post(f"{BASE_URL}/candidate/register", json={
    "name":       "Test User",
    "phone_hash": "1234567890",
    "language":   "kn",
    "district":   "Bengaluru",
    "trade":      "Electrician"
})
candidate_id = register_response.json()["candidate_id"]
print("Registered:", candidate_id)

# Step 2 — Submit Q1 (normal)
r1 = requests.post(f"{BASE_URL}/submit", json={
    "candidate_id": candidate_id,
    "language":     "kn",
    "question_id":  1,
    "audio_b64":    "dGVzdA==",
    "keyframe_b64": "dGVzdA=="
})
print("Q1:", r1.json())

# Step 3 — Submit Q2 (integrity flag test)
r2 = requests.post(f"{BASE_URL}/submit", json={
    "candidate_id": candidate_id,
    "language":     "kn",
    "question_id":  2,
    "audio_b64":    "dGVzdA==",
    "keyframe_b64": "dGVzdA=="
})
print("Q2:", r2.json())

# Step 4 — Submit Q3 (classification)
r3 = requests.post(f"{BASE_URL}/submit", json={
    "candidate_id": candidate_id,
    "language":     "kn",
    "question_id":  3,
    "audio_b64":    "dGVzdA==",
    "keyframe_b64": "dGVzdA=="
})
print("Q3:", r3.json())