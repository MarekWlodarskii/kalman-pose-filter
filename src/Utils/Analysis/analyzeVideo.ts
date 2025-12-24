import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { FrameData, Joint, Landmark, PairOfJoints, STDDistance, VideoPoseData } from "../Constants/types";
import { createKalmanFilters } from "../Kalman/createKalmanFilters";
import { analyzeFrameBackward } from "./analyzeFrameBackward";
import { smoothLandmarks } from "../Math/smoothLandmarks";
import { calculatePostionUsingKalman } from "../Math/calculatePositionUsingKalman";
import { analyzeFrame } from "./analyzeFrame";
import { analyzeFrameForward } from "./analyzeFrameForward";
import { adjustPositionUsingDistance } from "../Math/adjustPositionUsingDistance";
import { useState } from "react";
import { calculateMeanAndStdForFrame } from "../Math/calculateMeanAndStdForFrame";

export const analyzeVideo = async (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    poseLandmarkerRef: React.RefObject<PoseLandmarker | null>,
    setAllowControl: (value: React.SetStateAction<boolean>) => void,
    setVideoDuration: (value: React.SetStateAction<number | undefined>) => void,
    setInterval: (value: React.SetStateAction<number | undefined>) => void,
    fps: number,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    wantedLandmarks: number[],
    visibilityThreshold: number,
    pairsOfJoints: PairOfJoints[],
    setPoseData: (value: React.SetStateAction<VideoPoseData | null>) => void
) => {
    if (!videoRef.current || !poseLandmarkerRef.current) return;
    setAllowControl(false);

    const video = videoRef.current;

    const duration = video.duration * 1000; // to do wywalenia pozniej
    console.log(duration);
    setVideoDuration(video.duration);
    const interval = 1000 / fps; // dasdas
    const frames: FrameData[] = [];

    let distanceVisibleFrames: STDDistance[] = [];

    for (let t = 1, frameIndex = 0; t < duration; t += interval, frameIndex++) {

        video.currentTime = t / 1000;
        await new Promise((resolve) => (video.onseeked = resolve));

        const result = await poseLandmarkerRef.current!.detectForVideo(video, t);

        const landmarks = result.landmarks?.[0];
        if (!landmarks || landmarks.length === 0) {
            //frames.push({ ...frames[frameIndex - 1] });
            continue;
        }

        const previousFrameJoints = frames[frameIndex - 1] ? frames[frameIndex - 1].landmarks : null;

        const analyzedFrame = await analyzeFrame(
            result,
            previousFrameJoints,
            frameIndex,
            wantedLandmarks,
            visibilityThreshold,
            pairsOfJoints,
            distanceVisibleFrames,
            frames
        );

        if (!analyzedFrame) continue;

        frames.push({
            frameIndex,
            timestamp: t / 1000,
            landmarks: analyzedFrame!,
        });
    }

    console.log(pairsOfJoints);

    distanceVisibleFrames.forEach(e => {
        if (!e.sumDistance || !e.elementsUsed || !e.sumDistanceLandmark) return;
        e.meanDistance = e.sumDistance / e.elementsUsed;
        e.meanDistanceLandmark = {
            x: e.sumDistanceLandmark.x / e.elementsUsed,
            y: e.sumDistanceLandmark.y / e.elementsUsed,
            z: e.sumDistanceLandmark.z / e.elementsUsed
        }
    });

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
        if (frameIndex === 0 || frames[frameIndex - 1].landmarks.length === 0) continue;
        distanceVisibleFrames.forEach(e => {
            const joint = frames[frameIndex].landmarks.find(j => j.name === e.jointName);
            const previousJoint = frames[frameIndex - 1].landmarks.find(j => j.name === e.jointName);

            if (!joint || !previousJoint || !e.meanDistance || !e.meanDistanceLandmark) return;

            if (!(joint.visibility > visibilityThreshold) || !(previousJoint.visibility > visibilityThreshold)) return;

            if (e.stdDistanceLandmark) {
                e.stdDistanceLandmark = {
                    x: e.stdDistanceLandmark.x + Math.pow(Math.abs(previousJoint.x - joint.x) - e.meanDistanceLandmark?.x, 2),
                    y: e.stdDistanceLandmark.y + Math.pow(Math.abs(previousJoint.y - joint.y) - e.meanDistanceLandmark?.y, 2),
                    z: e.stdDistanceLandmark.z + Math.pow(Math.abs(previousJoint.z - joint.z) - e.meanDistanceLandmark?.z, 2)
                }
            }
            else {
                e.stdDistanceLandmark = {
                    x: Math.pow(Math.abs(previousJoint.x - joint.x) - e.meanDistanceLandmark?.x, 2),
                    y: Math.pow(Math.abs(previousJoint.y - joint.y) - e.meanDistanceLandmark?.y, 2),
                    z: Math.pow(Math.abs(previousJoint.z - joint.z) - e.meanDistanceLandmark?.z, 2)
                }
            }
        });
    }

    distanceVisibleFrames.forEach(e => {
        if (!e.stdDistanceLandmark) return;
        e.stdDistanceLandmark = {
            x: Math.sqrt(e.stdDistanceLandmark.x / e.elementsUsed),
            y: Math.sqrt(e.stdDistanceLandmark.y / e.elementsUsed),
            z: Math.sqrt(e.stdDistanceLandmark.z / e.elementsUsed)
        }
    });


    let kalmanFilters = createKalmanFilters(wantedLandmarks, fps);
    let previousCorrectedStates: Record<number, { x?: any, y?: any, z?: any }> = {};
    const lastVisibleFrame = new Map();

    console.log(distanceVisibleFrames);
    let buffers: FrameData[] = [];


    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {

        calculateMeanAndStdForFrame(
            buffers,
            frames[frameIndex],
            visibilityThreshold
        );

        analyzeFrameForward(
            frames,
            frameIndex,
            frameIndex - 1,
            lastVisibleFrame,
            kalmanFilters,
            previousCorrectedStates,
            visibilityThreshold,
            fps,
            distanceVisibleFrames,
            buffers
        );

    }

    lastVisibleFrame.clear();
    kalmanFilters = createKalmanFilters(wantedLandmarks, fps);
    previousCorrectedStates = {};
    buffers = [];

    for (let frameIndex = frames.length - 1; frameIndex >= 0; frameIndex--) {

        calculateMeanAndStdForFrame(
            buffers,
            frames[frameIndex],
            visibilityThreshold
        );

        analyzeFrameForward(
            frames,
            frameIndex,
            frameIndex + 1,
            lastVisibleFrame,
            kalmanFilters,
            previousCorrectedStates,
            visibilityThreshold,
            fps,
            distanceVisibleFrames,
            buffers
        );
    }

    /*pairsOfJoints.forEach((pair, i) => {
        let joint1 = frames[pair.bestMinVisibilityFrameIndex!].landmarks.find((joint) => { return joint.name === pair.joint1 });
        let joint2 = frames[pair.bestMinVisibilityFrameIndex!].landmarks.find((joint) => { return joint.name === pair.joint2 });

        if (joint1 && joint2) {
            const distance = Math.sqrt(Math.pow(joint1.x - joint2.x, 2) + Math.pow(joint1.y - joint2.y, 2) + Math.pow(joint1.z - joint2.z, 2));

            pair.distance = distance;
            //console.log(joint1.name + " " + joint2.name + " " + pair.bestMinVisibilityFrameIndex + " " + pair.bestMinVisibility + " " + pair.distance);
        }
    });*/

    calculatePostionUsingKalman(
        frames,
        visibilityThreshold
    );

    /*frames.forEach((frame) => {
        adjustPositionUsingDistance(
            frame,
            pairsOfJoints
        );
    });*/

    //const smoothWindowSize = 3;
    //const smoothedLandmarks: FrameData[] = smoothLandmarks(frames, smoothWindowSize);

    setPoseData({ fps: fps, frames: frames });
    console.log("Pose data:", { fps: fps, frames });

    setAllowControl(true);
}

