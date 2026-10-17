# ASL Recognition Pipeline Plan

## Architecture

```
OFFLINE (Python)
 ASL Citizen videos -> MediaPipe Holistic (per frame) -> landmark sequences
   -> normalize + augment -> train sequence classifier (label = gloss)
   -> export to browser format (ONNX / TFLite / TF.js)

ONLINE (browser)
 webcam -> MediaPipe Tasks JS (web worker) -> rolling buffer (~1-2 s of landmarks)
   -> same preprocessing as training -> model -> top-k signs + confidence
```

- MediaPipe is only the feature extractor (landmarks). It does not know ASL.
- The built-in Gesture Recognizer is single-frame static poses, so it is not suitable. Model Maker is deprecated.
- ASL Citizen = ~84k videos, 2,731 isolated signs, ~30 videos/sign, 52 signers, signer-independent train/val/test splits.
- Scope: isolated signs only, not continuous sentences.

## Current status (2026-10-17)

Phases 0-4 done on a 50-sign subset. Baseline GRU reaches **~85-89% val top-1, ~95-97% val top-5** (chance = 2%). Test split not touched yet. Next: error analysis, multiple seeds, scale vocabulary, then export + browser (see Next steps).

### Results (50 signs, val split: 191 clips, 6 signers)

| Features                    | Input dim/frame | Best val top-1 | Final-epoch top-1 | Final-epoch top-5 |
| --------------------------- | --------------- | -------------- | ----------------- | ----------------- |
| hands                       | 256             | 89.0%          | 88.5%             | 96.3%             |
| hands + pose                | 298             | 86.9%          | 85.9%             | 95.3%             |
| hands + pose + face + blend | 762             | 87.4%          | 84.8%             | 97.4%             |

How to read this:
- The three feature sets are statistically indistinguishable (gaps of 2-3 points; 1 val clip = 0.5 points; run-to-run noise is probably similar).
- "Best" is the best epoch picked using val accuracy, so it is slightly optimistic. Final-epoch is the more honest number.
- Train accuracy reaches 100% while val sits ~85%: the model overfits (memorizes training signers).
- 50 signs chosen for having the most train clips. Says nothing yet about the full 2,731-sign vocabulary, where pose/face may matter more. Do not drop them yet.
- Each run takes ~4 min on the Mac (`mps`). Checkpoints: `ml/runs/<name>/best.pt`, per-epoch log: `ml/runs/<name>/log.json`.

## Dataset facts (verified)

- Location: `/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen/` with `splits/{train,val,test}.csv` (columns: `Participant ID, Video file, Gloss, ASL-LEX Code`) and `videos/`.
- 83,399 videos; train 40,154 (35 signers), val 10,304 (6), test 32,941 (11). No signer appears in more than one split; every sign is in all three splits. Train clips per sign: min 9, median 15, max 24.
- Gloss to ASL-LEX Code is 1:1. Numeric suffixes (`SOCCER2`, `SAIL1`) are sign variants. Seed signer P52 is in train.
- `videos/` also contains ~83k macOS `._*.mp4` junk files (4 KB, from unzipping). Always load by filename from the CSVs, never by listing the folder.
- `use.txt` is the **Microsoft Research License**, not a file list. Non-commercial research use only; do not share/redistribute the data (keep it out of git); results may be published as long as no substantial portion of the data is included. Public/commercial deployment of a model trained on it is a gray area: check with the instructor or Microsoft first.

## Where things run

| Step                | Where                                        | Notes                                                  |
| ------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Dataset download    | Local                                        | 45.92 GB of videos                                     |
| Landmark extraction | Local, parallel across CPU cores             | CPU-bound; 1,870 clips took 25 min with 8 workers      |
| Training            | Local first (PyTorch `mps` on Apple Silicon) | Small model on landmarks, ~4 min per 60-epoch run      |
| Training, if slow   | Google Colab / Kaggle (free GPU)             | Upload the small `.npz` files, not the videos          |

Internal disk is nearly full (~13 GB free), so extracted landmarks live on the SSD: `/Volumes/Extreme SSD/asl-landmarks/` (1,870 `.npz`, 1.9 GB).

## How to run (everything in `ml/`)

```
cd ml
.venv/bin/python make_subset.py 50     # picks the 50 glosses with most train clips -> data/subset.csv (950 train / 191 val / 729 test clips)
.venv/bin/python extract.py 8          # landmarks for every clip, 8 workers, resumable (skips finished clips)
.venv/bin/python check_dataset.py      # sanity check of the Dataset (shapes, NaNs, labels)
.venv/bin/python train.py --groups hands pose            # also: --groups hands | hands pose face blend
```

| File              | Purpose                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `make_subset.py`  | Builds `data/subset.csv` (split, participant, video, gloss) for the N most-frequent glosses   |
| `extract.py`      | MediaPipe Tasks (hand, pose-lite, face landmarkers; VIDEO mode) -> one `.npz` per clip        |
| `dataset.py`      | `ClipDataset`: load, body-normalize, trim, augment (train only), resample to 64 frames        |
| `train.py`        | `SignGRU` (bi-GRU, 2 layers, hidden 128, ~0.56M params) + training loop, saves best val ckpt  |
| `check_dataset.py`| Sanity checks for `dataset.py`                                                                |
| `models/`         | Downloaded MediaPipe `.task` models (hand, pose lite, face)                                   |

Setup notes: Python 3.14, venv at `ml/.venv` with `mediapipe`, `opencv-python`, `numpy`, `torch` (no pandas; scripts use stdlib `csv`). `ml/.gitignore` excludes `.venv/`, `data/`, `models/`, and `runs/*/*.pt` (checkpoints are trained on licensed data, so they are not pushed).

Fresh checkout setup (the MediaPipe models are not in git):
```
cd ml && python3 -m venv .venv && .venv/bin/pip install mediapipe opencv-python numpy torch
mkdir -p models && cd models
curl -O https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
curl -O https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
curl -O https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```
Paths to the dataset (`ROOT` in `make_subset.py` / `extract.py` / `organize_videos.py`) and the landmark output (`OUT` in `extract.py`, `LANDMARK_DIR` in `dataset.py`) are hardcoded to the SSD; change them on another machine.

## Design decisions (what we actually built)

- **One-pass extraction, all feature groups saved**, so feature choices can change at training time with no re-extraction. Each `.npz` has: `hands [T,2,21,3]` (0 = MediaPipe "Left", 1 = "Right"; labels assume a mirrored image, harmless if train and browser agree), `pose [T,33,4]` (x,y,z,visibility), `face [T,478,3]`, `blend [T,52]` (expression scores). NaN = not detected.
- **Feature groups at training time:** `hands` (126 + 2 presence flags), `pose` (nose, shoulders, elbows, wrists), `face` (60 lip + eyebrow mesh points), `blend` (52). Velocity (frame-to-frame diff) is appended, doubling the dim.
- **Preprocessing (`dataset.py`):** shoulder midpoint = origin, shoulder width = 1 unit (falls back to clip median when pose missing); trim to frames where a hand is visible (+3 pad); nearest-frame resample to T=64; NaN -> 0 with presence flags.
- **Augmentation (train only):** rotation +/-10 deg, scale 0.9-1.1, shift, per-point jitter, random temporal crop (up to 10% per side), mirror with p=0.3 (swaps L/R hands and L/R pose points; face brows not swapped, minor).
- **Model/training:** bi-GRU on a linear projection, mean+max pooling over time, AdamW lr 1e-3 with OneCycle, label smoothing 0.1, dropout 0.3, grad clip 1.0, 60 epochs, early stopping on val top-1 (patience 15).
- **Same MediaPipe Tasks models** (hand, pose lite, face) are what the browser will use (`@mediapipe/tasks-vision`). Browser preprocessing must replicate `dataset.py` exactly.

## Known issues / observations

- Hands are detected in only ~25-45% of frames per clip (signers rest hands down at start/end, plus motion blur mid-sign). Verified visually on an APPLE clip: landmarks line up correctly.
- Trimmed clip length: min 14, median 42, max 456 frames. The 456-frame clip is likely an outlier (not yet inspected).
- Hand slot 0/1 comes from MediaPipe's Left/Right label, which assumes a mirrored image. The browser must feed frames the same way (mirrored or not) as the dataset videos, or the slots swap.

## Training basics

- Input: one clip's landmark sequence (e.g. 64 frames x N features). Label: the sign.
- Loop: guess -> loss measures error -> optimizer adjusts weights. One pass over the data = one epoch (~20-100 epochs).
- Splits: train (learn), val (tune / early stopping), test (use once for the final number).
- Main risk is overfitting (memorizing signers). Counter with augmentation, dropout, smaller model, early stopping.

## Checklist

### Phase 0: Setup

- [x] Start ASL Citizen download (Microsoft Research page)
- [x] Check dataset license terms for our use (non-commercial research only; see Dataset facts)
- [x] Confirm free disk space (internal disk nearly full -> outputs go to the SSD)
- [x] Create `ml/` folder in the repo for Python work
- [x] Python env: `mediapipe`, `numpy`, `torch`, `opencv-python` (pandas not needed)
- [x] **Done when:** can open one video and read its frames in Python

### Phase 1: Explore the data

- [x] Read metadata CSVs (file name, gloss, signer, split)
- [ ] Watch a few videos
- [x] Pick a subset (~50 glosses, all their videos)
- [x] **Done when:** `subset.csv` exists and train/val/test clip counts per sign are known

### Phase 2: Landmark extraction

- [x] Function: video -> per-frame landmark arrays
    - [x] Hands: 21 points each
    - [x] Pose (all 33 saved; subset chosen at training time)
    - [x] Face mesh + blendshapes (saved too, one pass)
- [x] Use the same MediaPipe Tasks models as the browser (avoid train/serve mismatch)
- [x] Test on one video and overlay landmarks to verify visually
- [x] Run over the subset with `multiprocessing`, save one `.npz` per clip
- [x] **Done when:** every subset clip has a `.npz`, a few spot-checked (1,870/1,870, 0 errors; only the first 10 clips were overlay-checked, on an earlier version of the extractor)

### Phase 3: Preprocessing and dataset code

- [x] Normalize relative to body (subtract shoulder midpoint, divide by shoulder width)
- [x] Resample to fixed length (64 frames)
- [x] Handle missing hands (zero-fill + presence flags)
- [x] PyTorch `Dataset` with augmentation (rotation, scaling, temporal crop, mirroring)
- [x] **Done when:** a batch loads with consistent tensor shapes

### Phase 4: Baseline model and first training run

- [x] Small GRU
- [x] Log train/val loss and accuracy per epoch
- [x] Beat chance (50 signs -> 2%): ~85-89% val top-1
- [x] **Done when:** learning curve and a val accuracy number exist

### Phase 5: Improve and evaluate

- [ ] Error analysis: confusion matrix on val, inspect the 456-frame outlier clip
- [ ] Train with several seeds to measure run-to-run noise before comparing feature sets
- [ ] Change one thing at a time (augmentation, model size, velocity features, dropout)
- [ ] Evaluate on test split once; report top-1 and top-5
- [ ] Confusion matrix to find mixed-up signs
- [ ] Scale up vocabulary (100-200 signs) and re-check whether pose/face help
- [ ] **Done when:** final model + honest test numbers

### Next steps

1. Error analysis + multi-seed runs (quick).
2. Scale vocabulary.
3. Optionally start Phases 6-7 early with the current model so the full browser path gets tested sooner.

### Phase 6: Export

- [ ] Export (PyTorch -> ONNX -> `onnxruntime-web`, or Keras -> TF.js / LiteRT)
- [ ] Verify exported model output matches Python on the same input
- [ ] **Done when:** model loads in a browser test page and matches Python

### Phase 7: Web app integration

- [ ] MediaPipe in a web worker on webcam feed
- [ ] Rolling landmark buffer with identical preprocessing to Phase 3
- [ ] Run model on window, smooth predictions, confidence threshold
- [ ] Show top results in the UI
- [ ] **Done when:** signing into the webcam shows the right word

### Phase 8: Real-world testing

- [ ] Test with teammates / people who know ASL (lighting, camera position, speed)
- [ ] Collect failure cases
- [ ] Consider recording own clips to add to training

## Risks / decisions

- Vocabulary size: start with ~50-200 signs; full 2.7k is much harder (published baselines roughly 60s% top-1, verify in the paper).
- Webcam domain gap: hold out our own recordings as a sanity test.
- Isolated-sign scope must be stated in project goals.
