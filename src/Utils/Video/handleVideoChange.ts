import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { VideoPoseData } from "../Constants/types";

export const handleVideoChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  animationFrameRef: React.RefObject<number | null>,
  setPoseData: (value: React.SetStateAction<VideoPoseData | null>) => void,
  setVideoSrc: (value: React.SetStateAction<string | null>) => void,
  setIsAnalyzing: (value: React.SetStateAction<boolean>) => void,
  setProgress: (value: React.SetStateAction<number>) => void,
  analysisCancelRef: React.RefObject<boolean>,
  poseLandmarkerRef: React.RefObject<PoseLandmarker | null>
) => {
  if (poseLandmarkerRef.current) { poseLandmarkerRef.current.close(); poseLandmarkerRef.current = null; }

  analysisCancelRef.current = true;

  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setVideoSrc(url);

  setIsAnalyzing(true);
  setProgress(0);
  setPoseData(null);

  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }
}