import { VideoPoseData } from "../Constants/types";

export const handleVideoChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  animationFrameRef: React.RefObject<number | null>,
  setPoseData: (value: React.SetStateAction<VideoPoseData | null>) => void,
  setVideoSrc: (value: React.SetStateAction<string | null>) => void
) => {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }
  setPoseData(null);
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setVideoSrc(url);
}