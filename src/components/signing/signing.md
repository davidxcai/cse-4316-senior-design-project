# components/signing

Shared sign-exercise pieces used by the landing demo, the lesson page and Practice. Nothing here knows about lessons or practice sessions.

- `RecognizeStep`, `SignStep`, `LessonCamera`: the Recognize and Sign cards and their camera wrapper, shared by lessons and Practice. Behavior is described in features/lesson/lesson.md. `SignStep` owns the camera, so callers keep it mounted (unkeyed) across consecutive Sign cards.

- `SignVideo`: YouTube clip (youtube-nocookie via the IFrame Player API, `useYouTubeClip`). `clip: null` renders a skeleton frame. A transparent layer over the iframe swallows clicks so it can't be paused or opened on YouTube; the replay and ½× buttons are ours. `hideTitle` puts a solid bar over the top 3.5rem to hide YouTube's title overlay in Recognize (wireframes §3b open issue 1). It also hides that strip of the signer's frame, so check it against real clips. Space replays the clip (`useHotkeys`), except when a focused button or field owns Space.
- `CameraView`: `<video>` + landmark `<canvas>` (same `-scale-x-100 object-cover`, or the points drift), loading spinner, Start camera, `CameraError`, `PhaseCue` and `VerdictIcon` on top, plus an optional `errorAction` shown with a camera error. Takes the object returned by `useSignCamera`. Custom markup because no daisyUI component stacks a canvas on a video.
- `CameraError`: C.1–C.3 plus model-load. Camera in use shows Retry (and hides Start camera); other errors keep Start camera so the learner can try again after fixing access. "A webcam is required" is the user-specified second line of C.1.
- `PhaseCue`: ✋ Ready / ● Watching / ⋯ Checking (S.18, user-specified words).
- `VerdictIcon`: ✓ / ✗ / neutral try-again for `rejected`.
- `ChoiceGrid`: 2×2 answer buttons. Locks once picked, outlines the correct choice green (dashed if the learner missed it) and a wrong pick red (no separate ✓/✗ row; a screen-reader-only status announces the result). Used by Recognize and Culture. Locked state uses `inert` on the grid rather than `disabled`/`aria-disabled`: daisyUI styles `.btn[aria-disabled=true]` as disabled, which greys out the success/error colours.

Hooks: `src/hooks/useYouTubeClip.ts`, `src/hooks/useSignCamera.ts`.

## useYouTubeClip
Loads the IFrame API script once. The player is created in an imperatively-added child of the container, because `YT.Player` replaces its target element and React must not own it. Autoplays muted. Looping: a 100 ms timer seeks back to `clip.start` when `getCurrentTime() >= clip.end` (the ENDED state is only a fallback, so the end screen never shows). Slow motion is `setPlaybackRate(0.5)`; it persists across loops and across player re-creation (kept in a ref). Replay seeks to start and plays. The player is rebuilt only when `videoId`, `start` or `end` change.

## useSignCamera
Wraps `useRecognizer` with the video/canvas refs, the saved camera (`useCameraPreference`) and the dominant hand (`user?.dominantHand ?? "right"`, so signed-out visitors get right, LP.9). `startCamera` is the only thing that starts the camera. Stops the camera on unmount, which is how leaving a Learn/Sign step or page releases it.
