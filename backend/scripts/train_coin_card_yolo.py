"""
Automated Training Script for Custom Coin & Card YOLOv8 ONNX Model
Generates synthetic domain-specific training data for:
- Indian Currency Coins (₹10 bimetallic, ₹5 brass, circular coins)
- Credit & ID Cards (ISO/IEC 7810 ID-1 standard)
Trains a lightweight YOLOv8n detector and exports to backend/models/coin_card_yolo.onnx
"""

import os
import shutil
import random
import cv2
import numpy as np
import yaml
from pathlib import Path
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = ROOT_DIR / "scripts" / "dataset_coin_card"
OUTPUT_MODEL_PATH = ROOT_DIR / "models" / "coin_card_yolo.onnx"

CLASSES = ["coin", "card"]

def create_synthetic_coin(size: int, coin_type: str = "coin_10") -> np.ndarray:
    """Create a realistic coin asset with metallic gradient and rim."""
    img = np.zeros((size, size, 4), dtype=np.uint8)
    center = (size // 2, size // 2)
    radius = size // 2 - 2

    if coin_type == "coin_10":
        # Outer nickel-silver ring
        cv2.circle(img, center, radius, (190, 195, 205, 255), -1)
        # Inner golden-brass center
        inner_r = int(radius * 0.68)
        cv2.circle(img, center, inner_r, (70, 165, 215, 255), -1)
        # Outer rim embossing
        cv2.circle(img, center, radius, (140, 145, 155, 255), 2)
        cv2.circle(img, center, inner_r, (50, 130, 180, 255), 1)
    else:
        # Brass/Nickel coin
        cv2.circle(img, center, radius, (120, 180, 200, 255), -1)
        cv2.circle(img, center, radius, (80, 140, 160, 255), 2)

    # Add subtle metallic noise/texture
    noise = np.random.randint(-15, 15, (size, size, 3), dtype=np.int16)
    rgb = np.clip(img[:, :, :3].astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img[:, :, :3] = rgb
    return img


def create_synthetic_card(width: int) -> np.ndarray:
    """Create a realistic ID/Credit card asset (ISO 7810 ID-1 ratio ~1.586)."""
    height = int(width / 1.586)
    img = np.zeros((height, width, 4), dtype=np.uint8)
    # Card base color (e.g. blue gradient, dark silver, or white/gold)
    base_color = random.choice([
        (180, 100, 40),   # Deep Blue
        (40, 130, 60),    # Emerald
        (60, 60, 60),     # Dark Slate
        (190, 190, 190),  # Silver
    ])
    cv2.rectangle(img, (0, 0), (width - 1, height - 1), (*base_color, 255), -1)
    cv2.rectangle(img, (0, 0), (width - 1, height - 1), (30, 30, 30, 255), 2)

    # Chip or magnetic stripe
    chip_w, chip_h = int(width * 0.16), int(height * 0.22)
    cv2.rectangle(img, (int(width * 0.15), int(height * 0.38)), 
                  (int(width * 0.15) + chip_w, int(height * 0.38) + chip_h), (80, 190, 220, 255), -1)
    return img


def generate_dataset(num_samples: int = 120):
    """Generate balanced synthetic training samples with bounding box labels."""
    if DATASET_DIR.exists():
        shutil.rmtree(DATASET_DIR)

    for split in ["train", "val"]:
        (DATASET_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (DATASET_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    img_w, img_h = 640, 640

    for i in range(num_samples):
        split = "val" if i % 6 == 0 else "train"

        # Background: wood table, countertop, or packaging background
        bg_type = random.choice(["wood", "counter", "plain"])
        if bg_type == "wood":
            bg_col = np.array([random.randint(30, 60), random.randint(60, 100), random.randint(110, 160)], dtype=np.uint8)
        elif bg_type == "counter":
            bg_col = np.array([random.randint(160, 220), random.randint(160, 220), random.randint(160, 220)], dtype=np.uint8)
        else:
            bg_col = np.array([random.randint(80, 140), random.randint(80, 140), random.randint(80, 140)], dtype=np.uint8)

        canvas = np.full((img_h, img_w, 3), bg_col, dtype=np.uint8)
        # Add random texture noise
        noise = np.random.randint(-15, 15, (img_h, img_w, 3), dtype=np.int16)
        canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        labels = []

        # Add 1-2 coins
        num_coins = random.randint(1, 2)
        for _ in range(num_coins):
            coin_sz = random.randint(45, 95)
            coin = create_synthetic_coin(coin_sz, random.choice(["coin_10", "coin_5"]))
            cx = random.randint(coin_sz, img_w - coin_sz)
            cy = random.randint(coin_sz, img_h - coin_sz)

            x0, y0 = cx - coin_sz // 2, cy - coin_sz // 2
            alpha = coin[:, :, 3] / 255.0
            for c in range(3):
                canvas[y0:y0+coin_sz, x0:x0+coin_sz, c] = (
                    alpha * coin[:, :, c] + (1 - alpha) * canvas[y0:y0+coin_sz, x0:x0+coin_sz, c]
                ).astype(np.uint8)

            # YOLO format: class x_center y_center width height (normalized)
            labels.append(f"0 {cx / img_w:.6f} {cy / img_h:.6f} {coin_sz / img_w:.6f} {coin_sz / img_h:.6f}")

        # In 50% of samples, also add a card
        if random.random() > 0.5:
            card_w = random.randint(120, 220)
            card = create_synthetic_card(card_w)
            card_h = card.shape[0]
            x0 = random.randint(10, img_w - card_w - 10)
            y0 = random.randint(10, img_h - card_h - 10)

            alpha = card[:, :, 3] / 255.0
            for c in range(3):
                canvas[y0:y0+card_h, x0:x0+card_w, c] = (
                    alpha * card[:, :, c] + (1 - alpha) * canvas[y0:y0+card_h, x0:x0+card_w, c]
                ).astype(np.uint8)

            labels.append(
                f"1 {(x0 + card_w / 2) / img_w:.6f} {(y0 + card_h / 2) / img_h:.6f} {card_w / img_w:.6f} {card_h / img_h:.6f}"
            )

        # Save image and label
        img_name = f"sample_{i:04d}.jpg"
        cv2.imwrite(str(DATASET_DIR / "images" / split / img_name), canvas)
        with open(DATASET_DIR / "labels" / split / f"sample_{i:04d}.txt", "w") as f:
            f.write("\n".join(labels))

    # Write data.yaml
    yaml_content = {
        "path": str(DATASET_DIR.resolve()),
        "train": "images/train",
        "val": "images/val",
        "names": {0: "coin", 1: "card"},
    }
    with open(DATASET_DIR / "data.yaml", "w") as f:
        yaml.dump(yaml_content, f, default_flow_style=False)

    print(f"Generated dataset with {num_samples} samples at: {DATASET_DIR}")


def train_and_export():
    """Train YOLOv8n on the synthetic dataset and export to ONNX."""
    print("Step 1: Generating training dataset...")
    generate_dataset(num_samples=100)

    print("Step 2: Initializing YOLOv8n model...")
    model = YOLO("yolov8n.pt")

    print("Step 3: Training model for 5 epochs...")
    data_yaml = str((DATASET_DIR / "data.yaml").resolve())
    model.train(
        data=data_yaml,
        epochs=5,
        imgsz=416,
        batch=8,
        workers=0,
        device="cpu",
        project=str(ROOT_DIR / "scripts" / "runs"),
        name="coin_card",
        verbose=True,
    )

    print("Step 4: Exporting model to ONNX format...")
    OUTPUT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    exported_path = model.export(format="onnx", imgsz=416, dynamic=False)

    if exported_path and os.path.exists(exported_path):
        shutil.copy(exported_path, OUTPUT_MODEL_PATH)
        print(f"Model successfully saved to: {OUTPUT_MODEL_PATH}")
    else:
        print("ONNX export completed.")


if __name__ == "__main__":
    train_and_export()
