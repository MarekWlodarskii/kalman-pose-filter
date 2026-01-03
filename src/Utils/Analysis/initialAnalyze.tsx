import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { FrameData, VideoPoseData } from "../Constants/types";
import { analyzeFrame } from "./analyzeFrame";
import { kalmanFilterAnalyzeVideo } from "./kalmanFilterAnalyzeVideo";

export const initialAnalyze = async (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    poseLandmarkerRef: React.RefObject<PoseLandmarker | null>,
    setAllowControl: (value: React.SetStateAction<boolean>) => void,
    fps: number,
    visibilityThreshold: number,
    setPoseData: (value: React.SetStateAction<VideoPoseData | null>) => void,
    setIsAnalyzing: (value: React.SetStateAction<boolean>) => void,
    setProgress: (value: React.SetStateAction<number>) => void,
    analysisCancelRef: React.RefObject<boolean>
) => {

    if (!videoRef.current || !poseLandmarkerRef.current) return;

    const visibilityThresholdNormalized: number = visibilityThreshold / 100;

    setAllowControl(false);

    const video = videoRef.current;
    const duration = video.duration * 1000;
    const interval = 1000 / fps;
    const frames: FrameData[] = [];


    for (let t = 1, frameIndex = 0; t < duration; t += interval, frameIndex++) {
        if (analysisCancelRef.current) return;

        video.currentTime = t / 1000;
        await new Promise((resolve) => (video.onseeked = resolve));

        const result = await poseLandmarkerRef.current!.detectForVideo(video, t);

        const analyzedFrame = await analyzeFrame(
            result
        );

        if (analyzedFrame) frames.push({
            frameIndex,
            timestamp: t / 1000,
            landmarks: analyzedFrame!,
        });

        setProgress(Math.ceil(t / duration * 100));
    }

    kalmanFilterAnalyzeVideo(
        fps,
        visibilityThresholdNormalized,
        setPoseData,
        frames
    );

    if (videoRef.current) {
        videoRef.current.currentTime = 0;
    }

    setIsAnalyzing(false);
    setAllowControl(true);
}