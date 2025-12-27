import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { FrameData, VideoPoseData } from "../Constants/types";
import { createKalmanFilters } from "../Kalman/createKalmanFilters";
import { calculatePostionUsingKalman } from "../Math/calculatePositionUsingKalman";
import { analyzeFrame } from "./analyzeFrame";
import { analyzeFrameForward } from "./analyzeFrameForward";
import { calculateMeanAndStdForFrame } from "../Math/calculateMeanAndStdForFrame";

export const analyzeVideo = async (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    poseLandmarkerRef: React.RefObject<PoseLandmarker | null>,
    setAllowControl: (value: React.SetStateAction<boolean>) => void,
    fps: number,
    wantedLandmarks: number[],
    visibilityThreshold: number,
    setPoseData: (value: React.SetStateAction<VideoPoseData | null>) => void
) => {

    if (!videoRef.current || !poseLandmarkerRef.current) return;
    
    setAllowControl(false);

    const video = videoRef.current;
    const duration = video.duration * 1000;
    const interval = 1000 / fps;
    const frames: FrameData[] = [];

    for (let t = 1, frameIndex = 0; t < duration; t += interval, frameIndex++) {

        video.currentTime = t / 1000;
        await new Promise((resolve) => (video.onseeked = resolve));

        const result = await poseLandmarkerRef.current!.detectForVideo(video, t);

        const analyzedFrame = await analyzeFrame(
            result,
            wantedLandmarks
        );

        if (!analyzedFrame) continue;

        frames.push({
            frameIndex,
            timestamp: t / 1000,
            landmarks: analyzedFrame!,
        });
    }

    let kalmanFilters = createKalmanFilters(wantedLandmarks, fps);
    const lastVisibleFrame = new Map();
    let buffers: FrameData[] = [];

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {

        calculateMeanAndStdForFrame(
            buffers,
            frames[frameIndex],
            0,
            20,
            frameIndex,
            frames
        );
    }

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {

        analyzeFrameForward(
            frames,
            frameIndex,
            frameIndex - 1,
            lastVisibleFrame,
            kalmanFilters,
            visibilityThreshold
        );

    }

    lastVisibleFrame.clear();
    kalmanFilters = createKalmanFilters(wantedLandmarks, fps);
    buffers = [];

    for (let frameIndex = frames.length - 1; frameIndex >= 0; frameIndex--) {

        analyzeFrameForward(
            frames,
            frameIndex,
            frameIndex + 1,
            lastVisibleFrame,
            kalmanFilters,
            visibilityThreshold
        );
    }

    calculatePostionUsingKalman(
        frames
    );

    setPoseData({ fps: fps, frames: frames });
    console.log("Pose data:", { fps: fps, frames });

    setAllowControl(true);
}

