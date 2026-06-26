"""Degradation operators. Contract: float32 RGB, HWC, [0,1].

Faithful to the original MATLAB generation (generate_train.m):
- blur: 21x21 Gaussian kernel, replicate border
- noise: zero-mean Gaussian, sigma on the 0-255 scale, clipped (imnoise behavior)
- jpeg: real encode/decode round-trip
"""

import cv2
import numpy as np

KERNEL_SIZE = 21


def gaussian_blur(img: np.ndarray, sigma: float) -> np.ndarray:
    if sigma < 1e-3:
        return img.copy()
    return cv2.GaussianBlur(
        img,
        (KERNEL_SIZE, KERNEL_SIZE),
        sigmaX=float(sigma),
        sigmaY=float(sigma),
        borderType=cv2.BORDER_REPLICATE,
    )


def gaussian_noise(img: np.ndarray, sigma255: float, rng: np.random.Generator) -> np.ndarray:
    if sigma255 < 1e-6:
        return img.copy()
    noisy = img + rng.normal(0.0, sigma255 / 255.0, img.shape)
    return np.clip(noisy, 0.0, 1.0).astype(np.float32)


def jpeg_compress(img: np.ndarray, quality: float) -> np.ndarray:
    q = int(round(min(100.0, max(1.0, quality))))
    bgr = cv2.cvtColor((img * 255.0 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
    ok, buf = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), q])
    assert ok, "cv2.imencode failed"
    out = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    return cv2.cvtColor(out, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
