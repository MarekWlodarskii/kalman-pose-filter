export interface LastSeenFrames {
  previous?: number | null;
  next?: number | null;
}

export interface Joint {
  name: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
  lastSeenFrames?: LastSeenFrames;
  kalmanPredictions?: KalmanPredictions;
  frameMean?: Landmark;
  frameStd?: Landmark;
  adjustedPosition?: Landmark;
  adjustedPositionForward?: Landmark;
  adjustedPositionBackward?: Landmark;
}

export interface KalmanPredictions {
  forwardPrediction?: Landmark;
  backwardPrediction?: Landmark;
}

export interface FrameData {
  frameIndex: number;
  timestamp: number;
  landmarks: Joint[];
  landmarksCorrected?: Joint[];
}

export interface VideoPoseData {
  fps: number;
  frames: FrameData[];
}

export interface ConnectedJoints {
  frame: number;
  jointNames: PairOfJoints;
  sumVisibility: number;
  minVisibility: number;
}

export interface STDDistance {
  jointName: number;
  elementsUsed: number;
  sumDistance?: number;
  meanDistance?: number;
  sumDistanceLandmark?: Landmark;
  meanDistanceLandmark?: Landmark;
  stdDistance?: number;
  stdDistanceLandmark?: Landmark;
}

export type Landmark = {
  x: number;
  y: number;
  z: number;
};

export type PairOfJoints = {
  joint1: number;
  joint2: number;
  bestMeanVisibility: number | null;
  bestMeanVisibilityFrameIndex: number | null;
  bestMinVisibility: number | null;
  bestMinVisibilityFrameIndex: number | null;
  distance: number | null;
}

export type Resolution = {
  width: number;
  height: number;
  heightScale: number;
  widthToHeightRatio: number;
};

export type KalmanOptions = {
  dt: number;
  processNoise: number;
  measurementNoise: number;
};