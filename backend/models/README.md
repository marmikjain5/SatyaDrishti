# SatyaSetu AI Reference Models Directory

This directory hosts custom deep learning models for detecting physical calibration objects:
- **Coins**: Indian currency coins (₹10, ₹5, ₹2, ₹1)
- **ID Cards / Credit Cards**: Standard ISO/IEC 7810 ID-1 cards (85.6mm × 53.98mm)
- **Barcodes**: 1D GS1 EAN-13 barcodes

## Supported ONNX Models

Place your exported ONNX model files here:
1. `backend/models/coin_card_yolo.onnx` (Highest priority)
2. `backend/models/reference_detector.onnx` (Secondary priority)
3. `backend/yolov8n.onnx` (Fallback baseline)

## 2-Stage Cascaded Detection Architecture

1. **Stage 1 (Deep Learning Proposal)**:
   - Evaluates the photo via `onnxruntime` (CPU or GPU).
   - Identifies candidate bounding regions for coins and cards.
   - 100% stable on Windows, Linux, and macOS without PyTorch/TorchVision DLL dependencies.

2. **Stage 2 (Sub-Pixel Geometric Refinement)**:
   - For Coins: Uses circular contour analysis ($4\pi \cdot \frac{\text{Area}}{\text{Perimeter}^2} \ge 0.55$) and fill ratio ($\ge 0.60$) to snap the rectangular proposal onto the exact physical coin rim.
   - For Cards: Uses 4-point convex polygon approximation fitting the ISO/IEC 7810 aspect ratio ($1.586 \pm 0.15$).

3. **Stage 3 (Standalone Fail-Safe & Direct Canvas Placement)**:
   - If no model file is provided, multi-scale adaptive contour & edge-verified Hough circle detection runs automatically.
   - The user can also click or drag directly on the canvas to place or fine-tune the reticle.
