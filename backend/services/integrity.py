import base64
import numpy as np
import cv2

# OpenCV built-in face detector
# No Python version restrictions
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def decode_keyframe(keyframe_b64: str) -> np.ndarray:
    img_bytes = base64.b64decode(keyframe_b64)
    np_arr    = np.frombuffer(img_bytes, np.uint8)
    img       = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def detect_faces(img: np.ndarray) -> list:
    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor  = 1.1,
        minNeighbors = 5,
        minSize      = (30, 30)
    )
    return faces

def check_integrity(keyframe_b64: str) -> dict:
    try:
        img   = decode_keyframe(keyframe_b64)
        faces = detect_faces(img)

        if len(faces) == 0:
            return {"flag_raised": True, "flag_type": "no_face"}

        if len(faces) > 1:
            return {"flag_raised": True, "flag_type": "multiple_faces"}

        return {"flag_raised": False, "flag_type": None}

    except Exception:
        return {"flag_raised": False, "flag_type": None}