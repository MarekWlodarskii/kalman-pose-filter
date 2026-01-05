import { DisplayMode, DisplayType } from "../Constants/enums";
import { Joint, VideoPoseData } from "../Constants/types";
import { drawSkeleton } from "./drawSkeleton";

export const drawLandmarks = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  poseData: VideoPoseData | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabledJoints: Record<number, boolean>,
  displayModeRef: React.RefObject<DisplayMode>,
  displayTypeRef: React.RefObject<DisplayType>,
  canvasSizeRef: React.RefObject<number>,
  textColorRef: React.RefObject<string>
) => {

  if (!videoRef.current || !canvasRef.current || !poseData || poseData.frames.length === 0) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";
  canvas.style.display = "block";
  canvas.style.top = "0";
  canvas.style.left = "0";

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentTime = video.currentTime;
  const frame = poseData.frames.reduce((prev, curr) => {
    if (Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime))
      return curr;
    return prev;
  });
  if (!frame || !displayModeRef.current) return;

  let textToDisplay: number | null | undefined;

  let frameToDraw: Joint[] = frame.landmarks;

  if (displayModeRef.current === DisplayMode.BOTH_KALMAN_FILTERS) {
    if (!frame.landmarksCorrected) return;
    frameToDraw = frame.landmarksCorrected;
  }

  

  frameToDraw.forEach((point) => {
    textToDisplay = null;
    if (enabledJoints[point.name] === false) return;

    let landmarkX = point.x;
    let landmarkY = point.y;

    if (displayModeRef.current === DisplayMode.KALMAN_FILTER_FORWARD && point.kalmanPredictions?.forwardPrediction) {
      landmarkX = point.kalmanPredictions?.forwardPrediction.x;
      landmarkY = point.kalmanPredictions?.forwardPrediction.y;
      if (displayTypeRef.current === DisplayType.JOINT_ANGLES) textToDisplay = point.kalmanPredictionAngles?.forwardPrediction;
    }

    if (displayModeRef.current === DisplayMode.KALMAN_FILTER_BACKWARD && point.kalmanPredictions?.backwardPrediction) {
      landmarkX = point.kalmanPredictions?.backwardPrediction.x;
      landmarkY = point.kalmanPredictions?.backwardPrediction.y;
      if (displayTypeRef.current === DisplayType.JOINT_ANGLES) textToDisplay = point.kalmanPredictionAngles?.backwardPrediction;
    }

    const x = landmarkX * canvas.width;
    const y = landmarkY * canvas.height;

    if (displayTypeRef.current === DisplayType.JOINT_NAME) textToDisplay = point.name;
    if (displayTypeRef.current === DisplayType.JOINT_ANGLES) {
      if (displayModeRef.current === DisplayMode.MACHINE_LEARNING_MODEL || displayModeRef.current === DisplayMode.BOTH_KALMAN_FILTERS) {
        textToDisplay = point.angle;
      }
    }

    if (textToDisplay === null || textToDisplay === undefined) return;

    ctx.fillStyle = textColorRef.current ?? "red";
    ctx.font = `${canvasSizeRef.current}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const displayText: string = displayTypeRef.current === DisplayType.JOINT_ANGLES ? textToDisplay.toString() + "°" : textToDisplay.toString();
    ctx.fillText(displayText, x, y);
  });

}

