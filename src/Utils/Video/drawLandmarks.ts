import { VideoPoseData } from "../Constants/types";

export const drawLandmarks = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  poseData: VideoPoseData | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  wantedLandmarks: number[]
) => {

  if (!videoRef.current || !canvasRef.current || !poseData) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  //const test = video.getBoundingClientRect();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";
  canvas.style.display = "block";
  canvas.style.top = "0";
  canvas.style.left = "0";

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentTime = video.currentTime;
  const closestFrame = Math.round(currentTime * poseData.fps);
  const frame = poseData.frames.reduce((prev, curr) => {
    if (Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime))
      return curr;
    return prev;
  });
  if (!frame) return;

  frame.landmarksCorrected?.forEach((point) => {
    if (!wantedLandmarks.includes(point.name)) return;
    const x = point.x * canvas.width;
    const y = point.y * canvas.height;

    /*ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "green";
    ctx.fill();*/

    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(point.name.toString(), x, y);
  });

}