/** Build-time feature flags. One edit here changes the whole app. */
export const flags = {
  /** S.11: handshape notes in the Learn step. Killswitch: set false and they vanish everywhere, no layout change. */
  showHandshapeNotes: true,
} as const;
