/** One webcam frame reduced to what the classifier needs. Coordinates are MediaPipe normalized image coords. */
export type Point3 = [number, number, number];

export interface Frame {
  /** capture time, ms */
  t: number;
  /** slot 0 = MediaPipe "Left", slot 1 = "Right"; 21 points flattened to 63 numbers, null = not detected */
  hands: [number[] | null, number[] | null];
  /** pose landmarks 11 and 12 (left/right shoulder), null = no body detected */
  shoulders: [Point3, Point3] | null;
}

export interface Prediction {
  label: string;
  prob: number;
}
