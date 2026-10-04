"""
SatyaDrishti OpenCV Optical Packaging Preprocessing Service

Prepares product packaging and label imagery before passing into Tesseract OCR:
1. Package & Label Segmentation: Detects package contour, removes irrelevant table/background clutter.
2. Perspective Correction: Identifies 4-corner packaging boundaries and applies a homographic perspective transform to flatten angled/slanted package shots into a flat rectangle.
3. Optical Deskewing: Detects rotational text skew angle and rotates upright.
4. CLAHE Dynamic Range Normalization: Neutralizes shadows, camera flash glare, and curved surface reflections.
5. Super-Resolution / Upscaling: Upscales small text (batch numbers, USP, font height) with cubic interpolation.
6. Edge Sharpening & Denoising: Unsharp spatial convolution and bilateral filtering for clean character stroke definition.
"""

import cv2
import numpy as np
import base64
import math
from typing import Dict, List, Optional, Tuple, Any, Union
from pathlib import Path


def decode_image_to_cv2(image_input: Union[str, bytes, Path]) -> Optional[np.ndarray]:
    """
    Decodes diverse image input formats (base64 data URL, raw base64 string,
    binary bytes, or local file path) into an OpenCV BGR numpy array.
    """
    try:
        if isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if isinstance(image_input, (str, Path)):
            str_input = str(image_input).strip()
            # Handle Base64 strings
            if str_input.startswith("data:image") or len(str_input) > 260 and not Path(str_input).exists():
                if "," in str_input:
                    str_input = str_input.split(",", 1)[1]
                img_bytes = base64.b64decode(str_input)
                nparr = np.frombuffer(img_bytes, np.uint8)
                return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Handle File path
            p = Path(str_input)
            if p.exists():
                # cv2.imread fails on non-ASCII paths on Windows; use imdecode instead
                with open(p, "rb") as f:
                    nparr = np.frombuffer(f.read(), np.uint8)
                    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    except Exception as e:
        print(f"[OpenCV Preprocessor] Decode error: {e}")
    return None


def encode_cv2_to_base64(image: np.ndarray, format: str = ".jpg", quality: int = 92) -> str:
    """Encodes an OpenCV image to a base64 Data URL string."""
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    success, buffer = cv2.imencode(format, image, encode_params)
    if not success:
        raise ValueError("Failed to encode image to JPEG buffer.")
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Orders 4 polygon points in order:
    top-left, top-right, bottom-right, bottom-left.
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def four_point_perspective_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    Performs a 4-point homographic perspective transformation to warp an angled
    packaging photograph into a flat, top-down rectangular view.
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # Width of new image = maximum distance between bottom-right and bottom-left or top-right and top-left
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    # Height of new image = maximum distance between top-right and bottom-right or top-left and bottom-left
    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    # Avoid degenerated aspect ratios
    if max_width < 100 or max_height < 100:
        return image

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height), flags=cv2.INTER_CUBIC)
    return warped


def detect_and_correct_perspective(image: np.ndarray) -> Tuple[np.ndarray, bool]:
    """
    Detects packaging label quadrangle and transforms angled view to flat rectangle.
    Returns (warped_image, True) if applied, or (original_image, False) if not applicable.
    """
    h, w = image.shape[:2]
    total_area = h * w

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 40, 150)

    # Dilate edges to close gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edged, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.025 * peri, True)
        area = cv2.contourArea(approx)

        # Look for a 4-point polygon that occupies between 15% and 92% of the image area
        if len(approx) == 4 and (0.15 * total_area) <= area <= (0.92 * total_area):
            pts = approx.reshape(4, 2).astype("float32")
            warped = four_point_perspective_transform(image, pts)
            wh, ww = warped.shape[:2]
            # Ensure transformation didn't produce an extreme distortion
            aspect = max(ww, wh) / (min(ww, wh) + 1e-5)
            if aspect <= 6.0 and ww >= 200 and wh >= 200:
                return warped, True

    return image, False


def crop_package_contour(image: np.ndarray) -> Tuple[np.ndarray, bool]:
    """
    Crops out background clutter (tables, shelves, background objects) to focus OCR
    exclusively on the packaging container/label.
    """
    h, w = image.shape[:2]
    total_area = h * w

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)

    # Otsu thresholding to find prominent foreground object
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Invert if edges are mostly white
    edge_mean = np.mean([
        np.mean(thresh[0, :]), np.mean(thresh[-1, :]),
        np.mean(thresh[:, 0]), np.mean(thresh[:, -1])
    ])
    if edge_mean > 127:
        thresh = cv2.bitwise_not(thresh)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=3)

    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image, False

    largest_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest_contour)

    # Only crop if package occupies between 15% and 92% of frame area
    if (0.15 * total_area) <= area <= (0.92 * total_area):
        x, y, cw, ch = cv2.boundingRect(largest_contour)
        
        # Guard against aggressive over-cropping: if bounding box would discard >35% of width,
        # it is likely segmenting only the central label of a curved bottle and clipping stamps/barcodes
        if cw < int(w * 0.60):
            # Expand horizontally to preserve curved packaging edges
            expand_w = int(w * 0.15)
            x = max(0, x - expand_w)
            cw = min(w - x, cw + (2 * expand_w))

        # Generous margin padding (10% of dimension, min 40px) to prevent clipping text
        pad_x = max(40, int(cw * 0.10))
        pad_y = max(40, int(ch * 0.10))
        x0 = max(0, x - pad_x)
        y0 = max(0, y - pad_y)
        x1 = min(w, x + cw + pad_x)
        y1 = min(h, y + ch + pad_y)

        # If crop still covers >85% of both dimensions, keeping original image avoids resampling artifacts
        if (x1 - x0) >= int(w * 0.88) and (y1 - y0) >= int(h * 0.88):
            return image, False

        cropped = image[y0:y1, x0:x1]
        if cropped.shape[0] >= 150 and cropped.shape[1] >= 150:
            return cropped, True

    return image, False


def deskew_text(image: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Detects text line orientation and deskews image upright.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Threshold for dark-on-light or light-on-dark text
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 6
    )

    # Find foreground text pixel coordinates
    pts = np.column_stack(np.where(thresh > 0))
    if len(pts) < 100:
        return image, 0.0

    rect = cv2.minAreaRect(pts)
    angle = rect[-1]

    # Convert OpenCV angle representation to standard skew degree
    if angle < -45:
        angle = 90 + angle
    elif angle > 45:
        angle = angle - 90

    # Only rotate if noticeable skew exists (-35 deg to +35 deg)
    if 0.6 <= abs(angle) <= 35.0:
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        deskewed = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return deskewed, round(angle, 2)

    return image, 0.0


def enhance_contrast_clahe(image: np.ndarray) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) on the L-channel
    in LAB color space. Neutralizes specular glare from plastic packaging, shadows,
    and uneven illumination across curved surfaces.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    cl = clahe.apply(l)

    merged = cv2.merge((cl, a, b))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)


def upscale_for_small_text(image: np.ndarray, target_min_dim: int = 1400) -> Tuple[np.ndarray, bool]:
    """
    Upscales small packaging label images so tiny statutory text numerals
    (USP font height, MRP decimals, date digits) achieve optimal OCR recognition height.
    """
    h, w = image.shape[:2]
    max_dim = max(h, w)

    if max_dim < target_min_dim:
        scale = target_min_dim / max_dim
        new_w = int(w * scale)
        new_h = int(h * scale)
        upscaled = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        return upscaled, True

    return image, False


def denoise_and_sharpen(image: np.ndarray) -> np.ndarray:
    """
    Bilateral filter to smooth paper grain/sensor noise without blurring character edges,
    followed by unsharp spatial convolution to make printed lettering pop.
    """
    # Bilateral smoothing
    smoothed = cv2.bilateralFilter(image, d=5, sigmaColor=45, sigmaSpace=45)

    # 3x3 Unsharp Spatial Kernel
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ], dtype=np.float32)

    sharpened = cv2.filter2D(smoothed, -1, kernel)
    return sharpened


def detect_mrp_sticker_candidates(image: np.ndarray) -> Dict[str, Any]:
    """Return visual sticker/overlay candidates for human review only.

    This deliberately does not call a sticker "fraud". It looks for rectangular,
    high-contrast overlay-like regions and reports evidence coordinates so an
    inspector can verify the original and covered MRP visually.
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 70, 180)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    image_area = float(w * h)

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < image_area * 0.002 or area > image_area * 0.35:
            continue
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue
        x, y, cw, ch = cv2.boundingRect(approx)
        aspect = cw / max(ch, 1)
        if aspect < 0.35 or aspect > 6.0:
            continue
        fill_ratio = area / max(float(cw * ch), 1.0)
        if fill_ratio < 0.55:
            continue
        candidates.append({
            "bbox_px": {"x": int(x), "y": int(y), "width": int(cw), "height": int(ch)},
            "normalized": {"x": round(x / w * 100, 2), "y": round(y / h * 100, 2), "width": round(cw / w * 100, 2), "height": round(ch / h * 100, 2)},
            "confidence": round(min(0.95, max(0.35, fill_ratio * 0.7 + min(area / image_area, 0.2))), 2),
            "signal": "rectangular_overlay_candidate",
        })

    candidates = sorted(candidates, key=lambda item: item["confidence"], reverse=True)[:8]
    return {
        "review_required": bool(candidates),
        "decision": "REVIEW_ONLY" if candidates else "NO_CANDIDATE_DETECTED",
        "candidates": candidates,
        "disclaimer": "Visual candidate only; not a fraud determination. Confirm against the original package and OCR evidence.",
    }


def detect_reference_object(image_input: Any, reference_type: str) -> Dict[str, Any]:
    """Detect a selected physical reference object for pixel-to-mm calibration.

    The detector returns a candidate box only. The caller must still verify that
    the object is flat beside the package and that the selected denomination/type
    matches the object in the image.
    """
    image = decode_image_to_cv2(image_input)
    if image is None:
        return {"status": "error", "message": "Could not decode reference image.", "candidates": []}

    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    candidates = []

    if reference_type in {"coin_5", "coin_10"}:
        blurred = cv2.medianBlur(gray, 5)
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=max(20, min(h, w) // 8),
            param1=100,
            param2=28,
            minRadius=max(8, min(h, w) // 80),
            maxRadius=max(12, min(h, w) // 3),
        )
        if circles is not None:
            for cx, cy, radius in np.round(circles[0]).astype(int)[:5]:
                if cx - radius < 0 or cy - radius < 0 or cx + radius >= w or cy + radius >= h:
                    continue
                candidates.append({
                    "bbox_px": {"x": int(cx - radius), "y": int(cy - radius), "width": int(radius * 2), "height": int(radius * 2)},
                    "shape": "circle",
                    "confidence": 0.7,
                })
    elif reference_type == "id_card":
        edges = cv2.Canny(gray, 60, 160)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        image_area = float(w * h)
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < image_area * 0.01 or area > image_area * 0.6:
                continue
            perimeter = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
            if len(approx) != 4:
                continue
            rx, ry, rw, rh = cv2.boundingRect(approx)
            aspect = max(rw, rh) / max(min(rw, rh), 1)
            if 1.35 <= aspect <= 2.15:
                fill_ratio = area / max(float(rw * rh), 1.0)
                candidates.append({
                    "bbox_px": {"x": int(rx), "y": int(ry), "width": int(rw), "height": int(rh)},
                    "shape": "quadrilateral",
                    "confidence": round(min(0.95, max(0.45, fill_ratio)), 2),
                })

    candidates = sorted(candidates, key=lambda item: item["confidence"], reverse=True)[:5]
    return {
        "status": "success",
        "reference_type": reference_type,
        "image_dimensions": {"width": w, "height": h},
        "candidates": candidates,
        "requires_visual_confirmation": True,
        "disclaimer": "Candidate detection only. Confirm the object and same-plane placement before using it for measurement.",
    }


def preprocess_packaging_for_ocr(image_input: Any) -> Dict[str, Any]:
    """
    Full End-to-End OpenCV Preprocessing Pipeline executed prior to Tesseract OCR:
      1. Decode input into OpenCV BGR matrix
      2. Perspective Correction (4-point homographic warp for angled shots)
      3. Package Contour Cropping (Background clutter removal)
      4. Text Deskewing (Rotational alignment)
      5. CLAHE Illumination & Glare Neutralization
      6. Super-Resolution Small Text Upscaling (2x bicubic)
      7. Edge Sharpening & Bilateral Denoising
    """
    img = decode_image_to_cv2(image_input)
    if img is None:
        return {
            "status": "error",
            "message": "Failed to decode image input into OpenCV format.",
            "operations_applied": [],
            "processed_image_base64": None,
        }

    h0, w0 = img.shape[:2]
    operations = []

    # Step 1: Perspective Correction (Flatten angled package shot)
    img_warped, was_perspective_corrected = detect_and_correct_perspective(img)
    if was_perspective_corrected:
        img = img_warped
        operations.append("Perspective Correction (4-point homography flat rectangle transform)")

    # Step 2: Package / Label Contour Cropping (Remove irrelevant table/background clutter)
    img_cropped, was_cropped = crop_package_contour(img)
    if was_cropped:
        img = img_cropped
        operations.append("Packaging Contour Crop (Background clutter eliminated)")

    # Step 3: Rotational Deskewing (Align text horizontally)
    img_deskewed, skew_deg = deskew_text(img)
    if abs(skew_deg) > 0.0:
        img = img_deskewed
        operations.append(f"Optical Deskewing (Rotated {skew_deg}° upright)")

    # Step 4: CLAHE Illumination & Glare Removal
    img = enhance_contrast_clahe(img)
    operations.append("CLAHE Illumination Normalization (Specular glare & curved shadow compensation)")

    # Step 5: Upscaling Small Text Numerals
    img_upscaled, was_upscaled = upscale_for_small_text(img, target_min_dim=1400)
    if was_upscaled:
        img = img_upscaled
        operations.append("Super-Resolution Upscaling (Bicubic interpolation for micro-text legibility)")

    # Step 6: Bilateral Denoising & Spatial Stroke Sharpening
    img = denoise_and_sharpen(img)
    operations.append("Bilateral Denoising & 3×3 Unsharp Stroke Sharpening")

    h1, w1 = img.shape[:2]
    processed_base64 = encode_cv2_to_base64(img, quality=90)
    sticker_signal = detect_mrp_sticker_candidates(img)

    print(f"[OpenCV Preprocessor] Completed {len(operations)} operations: {w0}x{h0} -> {w1}x{h1}")

    return {
        "status": "success",
        "original_dimensions": {"width": w0, "height": h0},
        "processed_dimensions": {"width": w1, "height": h1},
        "operations_applied": operations,
        "perspective_corrected": was_perspective_corrected,
        "background_cropped": was_cropped,
        "deskew_angle_deg": skew_deg,
        "mrp_sticker_signal": sticker_signal,
        "processed_image_base64": processed_base64,
    }
