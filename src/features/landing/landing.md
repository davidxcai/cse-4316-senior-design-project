# features/landing

Signed-out landing page at `/` (wireframes L0, LP.3–LP.14). PublicShell (navbar, LP.1–2) wraps it from the route layout.

- `LandingPage` composes the hero and the sections; the route file only renders it.
- `TryItHero` is the only stateful piece: `useTryItDemo` (hooks/) owns the recognizer flow, `LearnCard` and `ProduceCard` are independent and are wired together here.
- `tryItConfig.ts` holds the HELLO item and the reference clip. `videoId` is `null` until a fluent-signer clip is chosen, which renders a daisyUI skeleton frame. Embeds use youtube-nocookie.com.
- Custom markup is limited to the video/camera frame (the camera needs a `<video>` with overlays; no daisyUI component covers it). Everything else is daisyUI.
- Mission has a heading only; copy is pending from the user.
- LP.4: hand landmarks are drawn by the recognizer onto a `<canvas>` stacked over the video (`start(video, { overlay: canvas })`). The canvas uses the same `-scale-x-100 object-cover` as the video, or the points drift off the hands.
