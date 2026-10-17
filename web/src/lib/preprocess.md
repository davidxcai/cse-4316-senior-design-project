Port of `ml/dataset.py` (`load_clip` -> `trim` -> `to_tensor`, hands group, no augmentation). Any change to the Python
preprocessing must be mirrored here. Non-obvious: numpy rounds half to even (`roundHalfEven`), body-frame medians are
computed over the whole clip *before* trimming, and trimming happens after normalization. Verified against Python on val
clip 0 (max abs diff 3e-7); to re-verify, dump that clip's raw landmarks as `Frame[]` and compare with `public/model/fixture.json`.
