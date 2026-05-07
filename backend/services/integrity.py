import base64
import logging
import numpy as np
import cv2

logger = logging.getLogger(__name__)

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
    # Equalize histogram for better detection in poor lighting
    gray = cv2.equalizeHist(gray)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor  = 1.1,
        minNeighbors = 3,   # Lowered from 5 — less strict, fewer false negatives
        minSize      = (20, 20)  # Lowered from 30 — detect faces at greater distance
    )
    return faces


def _check_single_keyframe(keyframe_b64: str) -> dict:
    """Check a single keyframe for face integrity."""
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


def check_integrity(keyframes: list[str]) -> dict:
    """
    Check integrity across multiple keyframes (PWA sends 3).
    Returns per-frame results. Only flags if MAJORITY of frames fail.
    """
    if not keyframes:
        logger.warning("[INTEGRITY] No keyframes provided, skipping check")
        return {
            "flag_raised": False,
            "flag_type": None,
            "per_frame": {"frame_1": True, "frame_2": True, "frame_3": True},
        }

    per_frame = {}
    fail_count = 0
    last_flag_type = None

    for idx, kf in enumerate(keyframes):
        result = _check_single_keyframe(kf)
        frame_key = f"frame_{idx + 1}"
        per_frame[frame_key] = not result["flag_raised"]  # True = passed

        if result["flag_raised"]:
            fail_count += 1
            last_flag_type = result["flag_type"]
            logger.warning(
                f"[INTEGRITY] Frame {idx + 1}/{len(keyframes)} FAILED — {result['flag_type']}"
            )
        else:
            logger.info(f"[INTEGRITY] Frame {idx + 1}/{len(keyframes)} PASSED")

    # Only flag if majority of frames fail (2 out of 3)
    majority_failed = fail_count >= 2

    if majority_failed:
        logger.warning(f"[INTEGRITY] FLAGGED — {fail_count}/{len(keyframes)} frames failed")
    else:
        logger.info(f"[INTEGRITY] PASSED — {fail_count}/{len(keyframes)} frames failed (below majority)")

    return {
        "flag_raised": majority_failed,
        "flag_type": last_flag_type if majority_failed else None,
        "per_frame": per_frame,
    }