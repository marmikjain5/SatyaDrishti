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
        if isinstance(image_input, np.ndarray):
            return image_input

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
    package_bounds = detect_package_contour_bounds(image)

    def is_inside_package(cx: int, cy: int) -> bool:
        if not package_bounds.get("detected"):
            return False
        px = package_bounds["x"] / 100 * w
        py = package_bounds["y"] / 100 * h
        pw = package_bounds["width"] / 100 * w
        ph = package_bounds["height"] / 100 * h
        return px <= cx <= px + pw and py <= cy <= py + ph

    if reference_type in {"coin_5", "coin_10"}:
        # The previous settings allowed large circular bottle contours to win
        # before the small coin. Limit the radius and rank circles outside the
        # detected package first, since calibration references are placed beside
        # the package in the scan workflow.
        blurred = cv2.medianBlur(gray, 7)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.0,
            minDist=max(28, min(h, w) // 14),
            param1=80,
            param2=26,
            minRadius=max(8, min(h, w) // 140),
            maxRadius=max(16, min(h, w) // 5),
        )
        if circles is not None:
            for cx, cy, radius in np.round(circles[0]).astype(int):
                if cx - radius < 0 or cy - radius < 0 or cx + radius >= w or cy + radius >= h:
                    continue
                outside_package = not is_inside_package(int(cx), int(cy))
                yy, xx = np.ogrid[:h, :w]
                circle_mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= max(1, radius - 2) ** 2
                mean_saturation = float(np.mean(hsv[:, :, 1][circle_mask]))
                # A silver coin is comparatively neutral; saturated blue
                # bottle parts should rank lower even when Hough detects them.
                neutral_metal_score = 1.0 - min(mean_saturation / 180.0, 1.0)
                confidence = (0.55 if outside_package else 0.35) + 0.35 * neutral_metal_score
                candidates.append({
                    "bbox_px": {"x": int(cx - radius), "y": int(cy - radius), "width": int(radius * 2), "height": int(radius * 2)},
                    "normalized": {
                        "x": round((cx - radius) / w * 100, 2),
                        "y": round((cy - radius) / h * 100, 2),
                        "width": round((radius * 2) / w * 100, 2),
                        "height": round((radius * 2) / h * 100, 2),
                    },
                    "shape": "circle",
                    "outside_package": outside_package,
                    "mean_saturation": round(mean_saturation, 1),
                    "confidence": round(confidence, 2),
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

    candidates = sorted(
        candidates,
        key=lambda item: (item.get("outside_package", False), item["confidence"]),
        reverse=True,
    )[:5]
    return {
        "status": "success",
        "reference_type": reference_type,
        "image_dimensions": {"width": w, "height": h},
        "package_bounds": package_bounds,
        "candidates": candidates,
        "requires_visual_confirmation": True,
        "disclaimer": "Candidate detection only. Confirm the object and same-plane placement before using it for measurement.",
    }


def detect_package_contour_bounds(image: np.ndarray) -> Dict[str, Any]:
    """
    Detects the physical product package / bottle / container within the image frame.
    Returns normalized bounding box percentage coordinates:
    {
        "x": float,
        "y": float,
        "width": float,
        "height": float,
        "detected": bool
    }
    """
    h, w = image.shape[:2]
    total_area = float(h * w)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (9, 9), 0)

    # Adaptive / Otsu segmentation to separate bottle/container from background
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Invert if borders are predominantly white
    border_vals = np.concatenate([thresh[0, :], thresh[-1, :], thresh[:, 0], thresh[:, -1]])
    if np.mean(border_vals) > 127:
        thresh = cv2.bitwise_not(thresh)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=3)

    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best_c = None
    best_area = 0
    for c in contours:
        area = cv2.contourArea(c)
        if (0.12 * total_area) <= area <= (0.92 * total_area):
            if area > best_area:
                best_area = area
                best_c = c

    if best_c is not None:
        bx, by, bw, bh = cv2.boundingRect(best_c)
        if bw >= int(w * 0.20) and bh >= int(h * 0.25):
            return {
                "x": round((bx / w) * 100, 2),
                "y": round((by / h) * 100, 2),
                "width": round((bw / w) * 100, 2),
                "height": round((bh / h) * 100, 2),
                "detected": True,
            }

    # Aspect ratio heuristics for common smartphone packaging scans
    aspect = w / max(h, 1)
    if aspect < 0.85:
        # Tall portrait container (e.g. mobile photo of a bottle/shampoo/spray/pack)
        return {"x": 22.0, "y": 3.0, "width": 66.0, "height": 93.0, "detected": False}
    elif aspect > 1.25:
        # Wide / landscape photo with container standing in center
        return {"x": 33.0, "y": 4.0, "width": 34.0, "height": 92.0, "detected": False}
    else:
        # Near-square (e.g. 1:1 or 4:3)
        return {"x": 18.0, "y": 4.0, "width": 64.0, "height": 92.0, "detected": False}


def preprocess_packaging_for_ocr(image_input: Any, preserve_geometry: bool = True) -> Dict[str, Any]:
    """
    Full End-to-End OpenCV Preprocessing Pipeline executed prior to Tesseract OCR:
      1. Decode input into OpenCV BGR matrix
      2. Detect packaging contour boundaries for spatial bounding box anchoring
      3. CLAHE Illumination & Glare Neutralization (Preserves 1:1 coordinates)
      4. Bilateral Denoising & Spatial Stroke Sharpening (Preserves 1:1 coordinates)
      5. Optional cropping if preserve_geometry=False
    """
    img = decode_image_to_cv2(image_input)
    if img is None:
        return {
            "status": "error",
            "message": "Failed to decode image input into OpenCV format.",
            "operations_applied": [],
            "processed_image_base64": None,
            "package_bounds": {"x": 22.0, "y": 3.0, "width": 66.0, "height": 93.0, "detected": False},
        }

    h0, w0 = img.shape[:2]
    operations = []

    # Detect package contour boundaries for spatial box anchoring
    package_bounds = detect_package_contour_bounds(img)
    operations.append(f"Packaging Contour Anchoring ({package_bounds['width']:.1f}%x{package_bounds['height']:.1f}% container bounds)")

    # Optional cropping (only if explicitly requested to alter geometry)
    was_cropped = False
    if not preserve_geometry:
        img_cropped, was_cropped = crop_package_contour(img)
        if was_cropped:
            img = img_cropped
            operations.append("Packaging Contour Crop (Background clutter eliminated)")

    # Step 2: CLAHE Illumination & Glare Removal
    img = enhance_contrast_clahe(img)
    operations.append("CLAHE Illumination Normalization (Specular glare & curved shadow compensation)")

    # Step 3: Bilateral Denoising & Spatial Stroke Sharpening
    img = denoise_and_sharpen(img)
    operations.append("Bilateral Denoising & 3×3 Unsharp Stroke Sharpening")

    h1, w1 = img.shape[:2]
    processed_base64 = encode_cv2_to_base64(img, quality=92)
    sticker_signal = detect_mrp_sticker_candidates(img)

    print(f"[OpenCV Preprocessor] Completed {len(operations)} operations: {w0}x{h0} -> {w1}x{h1} (Package Detected: {package_bounds['detected']})")

    return {
        "status": "success",
        "original_dimensions": {"width": w0, "height": h0},
        "processed_dimensions": {"width": w1, "height": h1},
        "operations_applied": operations,
        "processed_image_base64": processed_base64,
        "was_cropped": was_cropped,
        "package_bounds": package_bounds,
        "mrp_sticker_signal": sticker_signal,
    }
