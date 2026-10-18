# ASL sign demo (web)

Webcam -> MediaPipe hand + pose landmarks -> segment one sign -> same preprocessing as `ml/dataset.py` -> ONNX bi-GRU -> top-5.

```
npm install                                   # also copies the ONNX/MediaPipe wasm into public/
cp ml/models/{hand_landmarker,pose_landmarker_lite}.task public/mediapipe/
(cd ml && .venv/bin/python export_onnx.py hands)   # writes public/model/ (gitignored: licensed training data)
npm run dev
```

How it works: a sign starts when a hand appears and ends after 700 ms without hands (live guess updates every 300 ms in between).
Only the `hands` model is supported (shoulders from pose are used just for body normalization).

- `src/lib/preprocess.ts` is a port of `ml/dataset.py`; checked against Python on a real val clip (max diff 3e-7).
- **Mirror input** toggle: flips the image horizontally for the model. If predictions are bad but landmarks look right, try it (left/right hand slots depend on the training videos' orientation).

## Data, models and attribution

Educational, non-profit project (CSE 4316 senior design).

- **Training data:** [ASL Citizen](https://www.microsoft.com/en-us/research/project/asl-citizen/), released by Microsoft Research under the Microsoft Research License (non-commercial research use). Desai et al., *ASL Citizen: A Community-Sourced Dataset for Advancing Isolated Sign Language Recognition*, NeurIPS 2023 Datasets and Benchmarks. The dataset itself is not included in this repository; `public/model/` holds only the trained weights (a 50-sign subset).
- **Landmarks:** [MediaPipe](https://ai.google.dev/edge/mediapipe) hand and pose landmarkers (Google, Apache 2.0); the `.task` files in `public/mediapipe/` are Google's pretrained models.
- **Inference:** [ONNX Runtime Web](https://onnxruntime.ai/).
