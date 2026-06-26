"""DIV2K acquisition and splits (paper protocol: 1-750 train, 751-800 test, valid set as val)."""

import subprocess
import sys
import zipfile
from pathlib import Path

URLS = {
    "train": "https://data.vision.ee.ethz.ch/cvl/DIV2K/DIV2K_train_HR.zip",
    "valid": "https://data.vision.ee.ethz.ch/cvl/DIV2K/DIV2K_valid_HR.zip",
}
SPLITS = {"train": (1, 750), "test": (751, 800), "val": (801, 900)}
_SUBDIR = {"train": "DIV2K_train_HR", "test": "DIV2K_train_HR", "val": "DIV2K_valid_HR"}


def image_paths(root: str | Path, split: str) -> list[Path]:
    lo, hi = SPLITS[split]
    folder = Path(root) / _SUBDIR[split]
    return [
        p for p in sorted(folder.glob("*.png")) if p.stem.isdigit() and lo <= int(p.stem) <= hi
    ]


def verify(root: str | Path) -> tuple[bool, str]:
    for split, count in [("train", 750), ("test", 50), ("val", 100)]:
        n = len(image_paths(root, split))
        if n != count:
            return False, f"{split}: expected {count} images, found {n}"
    return True, "DIV2K complete: 750 train / 50 test / 100 val"


def download(root: str | Path, keep_zip: bool = False) -> None:
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    for name, url in URLS.items():
        zip_path = root / Path(url).name
        marker = root / _SUBDIR["train" if name == "train" else "val"]
        if marker.exists() and verify(root)[0]:
            print(f"{marker.name} already extracted and verified, skipping")
            continue
        print(f"downloading {url} -> {zip_path} (resumable)")
        subprocess.run(["curl", "-L", "-C", "-", "-o", str(zip_path), url], check=True)
        print(f"extracting {zip_path}")
        try:
            with zipfile.ZipFile(zip_path) as zf:
                zf.extractall(root)
        except zipfile.BadZipFile:
            sys.exit(f"corrupt zip at {zip_path}: delete it and rerun download")
        if not keep_zip:
            zip_path.unlink()  # spec disk rule: 30 GB free total
    ok, msg = verify(root)
    print(msg)
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="DIV2K download/verify")
    ap.add_argument("cmd", choices=["download", "verify"], nargs="?", default="verify")
    ap.add_argument("root", nargs="?", default="data/DIV2K")
    args = ap.parse_args()
    if args.cmd == "download":
        download(args.root)
    else:
        ok, msg = verify(args.root)
        print(msg)
        sys.exit(0 if ok else 1)
