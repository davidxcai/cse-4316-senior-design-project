# features/devtest

Pieces of the dev-only recognizer test page (`src/routes/dev/test.tsx`, `/dev/test`). Not linked from the app.

- `ReferenceClips`: reference clips as skeletons from `dev-data/unit1-2.landmarks.json.gz` (~3 MB, made by
  `ml/export_reference.py`, committed). Under `npm run dev` it loads automatically; it is fetched, never imported, so
  it isn't in the production build. The file button loads another export instead (and is the only way on a build).
  - Only clips of the words on the page (`TEST_WORDS` in test.tsx) are kept. Clips match a word by `glossKey`, so
    DEAF1/DEAF2 and THANK-YOU/THANKYOU meet. Letters have no ASL Citizen clips; digits aren't exported yet.
  - Per word: up to 8 held-out clips (test/val: signers the model never trained on) then up to 4 train clips, each
    with a split badge.
  - Why skeletons and not video: Safari (macOS 27.2 beta) showed a running timeline but no frames for the ASL Citizen
    MP4s, even opened directly. Skeletons also show exactly what the model saw.
- `SkeletonPlayer`: canvas playback at 30 fps, as the signer is seen (not mirrored). Hand slot 0 = primary colour,
  slot 1 = secondary (MediaPipe handedness slots, so colour only), arms faint, an oval head at the nose (the file has
  no face points). Pause, scrub, ½× speed.
  Body units: shoulder midpoint = 0, shoulder width = 1, trimmed to when a hand is visible, same as training.
  Custom canvas because no daisyUI component draws landmarks.
- `TrainCountBadges`: how much data the word's classifier trained on, from `trainCounts.json`.
  - signs: train-split clips (summed over variants), the variant count, and ⇄ if it's also trained reversed
  - letters/digits: ASL Citizen videos, ASL-HG photos (after subsampling) and ASL-HG signers; J/Z show "rule"
- Regenerate from `ml/` after retraining: `.venv/bin/python train_counts.py` (counts, committed) and
  `.venv/bin/python export_reference.py` (writes dev-data/; pass another glosses list for other units and point
  `DEV_REFERENCE_URL` at it).
