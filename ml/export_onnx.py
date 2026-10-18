"""Phase 6 (quick version): export a trained checkpoint to ONNX for the browser demo.

Usage: python export_onnx.py [run=hands]
Writes ../public/model/{sign_gru.onnx,labels.json,fixture.json}.
fixture.json holds one real val clip's input tensor + the PyTorch logits, so the browser
preprocessing/runtime can be checked against Python (see src/lib/signModel.md).
"""
import json, sys
from pathlib import Path
import numpy as np
import onnxruntime as ort
import torch
from dataset import ClipDataset
from train import SignGRU

run = sys.argv[1] if len(sys.argv) > 1 else "hands"
out = Path("../public/model")
out.mkdir(parents=True, exist_ok=True)

ck = torch.load(Path("runs") / run / "best.pt", map_location="cpu")
assert ck["groups"] == ["hands"], "browser demo only implements the 'hands' feature group"
labels = ck["labels"]  # gloss -> index
model = SignGRU(ck["in_dim"], len(labels))
model.load_state_dict(ck["model"])
model.eval()

dummy = torch.zeros(1, 64, ck["in_dim"])
torch.onnx.export(model, dummy, str(out / "sign_gru.onnx"), input_names=["x"], output_names=["logits"],
                  opset_version=17, dynamo=False)
json.dump([g for g, _ in sorted(labels.items(), key=lambda kv: kv[1])], open(out / "labels.json", "w"))

# parity check on a real val clip
va = ClipDataset("val", ["hands"], labels=labels)
x, y = va[0]
with torch.no_grad():
    ref = model(x[None]).numpy()[0]
got = ort.InferenceSession(str(out / "sign_gru.onnx")).run(None, {"x": x[None].numpy()})[0][0]
print("max |torch - onnx| =", float(np.abs(ref - got).max()), "| true label", y, "| pred", int(got.argmax()))
json.dump(dict(video=va.videos[0], label=int(y), input=x.numpy().tolist(), logits=ref.tolist()), open(out / "fixture.json", "w"))
print("wrote", out)
