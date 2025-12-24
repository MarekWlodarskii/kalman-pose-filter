import { join } from "path";
import { FrameData, Joint, STDDistance } from "../Constants/types";
import { createDynamicCovariance } from "../Kalman/createDynamicCovariance";
import { createKalmanFilters } from "../Kalman/createKalmanFilters";
import { checkIfSameFrame } from "./checkIfSameFrame";

export const analyzeFrameBackward = async (
    frames: FrameData[],
    frameIndex: number,
    previousFrameIndex: number,
    lastVisibleFrame: Map<number, number>,
    kalmanFilters: Record<number, { x: any, y: any, z: any }>,
    previousCorrectedStates: Record<number, { x?: any, y?: any, z?: any }>,
    visibilityThreshold: number,
    fps: number,
    distanceVisibleFrames: STDDistance[]
) => {

    const currentFrame = frames[frameIndex].landmarks;
    const landmarksExists = currentFrame.length > 0;

    if (!landmarksExists) return;

    currentFrame.forEach((joint) => {

        const previousFrameJoint = previousFrameIndex >= 0 && previousFrameIndex < frames.length - 1 ? frames[previousFrameIndex].landmarks.find(j => j.name === joint.name) : null;
        
        if(!previousFrameJoint) return;

        

    });

}