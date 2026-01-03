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
  kalmanPredictionAngles?: KalmanPredictionAngles;
  frameMean?: Landmark;
  frameStd?: Landmark;
  adjustedPosition?: Landmark;
  angle?: number | null;
}

export interface KalmanPredictions {
  forwardPrediction?: Landmark;
  backwardPrediction?: Landmark;
}

export interface KalmanPredictionAngles {
  forwardPrediction?: number | null;
  backwardPrediction?: number | null;
}

export interface FrameData {
  frameIndex: number;
  timestamp: number;
  landmarks: Joint[];
  landmarksCorrected?: Joint[] | null;
}

export interface VideoPoseData {
  fps: number;
  frames: FrameData[];
}

export type Landmark = {
  x: number;
  y: number;
  z: number;
};

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