import { FrameData } from "../Constants/types";
import { KalmanFilter1D } from "../Kalman/kalmanFilter1D";

export const analyzeFrameForward = async (
    frames: FrameData[],
    frameIndex: number,
    previousFrameIndex: number,
    lastVisibleFrame: Map<number, number>,
    kalmanFilters: Record<number, { x: KalmanFilter1D, y: KalmanFilter1D, z: KalmanFilter1D }>,
    visibilityThreshold: number
) => {
    const vt = 0.2;
    const currentFrame = frames[frameIndex].landmarks;
    const landmarksExists = currentFrame.length > 0;

    if (!landmarksExists) return;

    currentFrame.forEach((joint, i) => {

        const jointName = joint.name;
        let kf = kalmanFilters[jointName];

        if (!kf) return;

        const previousFrameJoint = previousFrameIndex >= 0 && previousFrameIndex < frames.length ? frames[previousFrameIndex].landmarks.find(j => j.name === joint.name) : null;
        const passesVisibilityThreshold = joint.visibility > visibilityThreshold;

        if (passesVisibilityThreshold) lastVisibleFrame.set(jointName, frameIndex);
        
        let std = currentFrame[i].frameStd;

        let fx = kf.x.predict();
        let fy = kf.y.predict();
        let fz = kf.z.predict();

        const xPredictedK_1 = kf.x.x[0][0];
        const yPredictedK_1 = kf.y.x[0][0];
        const zPredictedK_1 = kf.z.x[0][0];

        kf.x.adaptProcessNoise(calculateQ(joint.visibility, joint.x, previousFrameJoint?.x, xPredictedK_1));
        kf.y.adaptProcessNoise(calculateQ(joint.visibility, joint.y, previousFrameJoint?.y, yPredictedK_1));
        kf.z.adaptProcessNoise(calculateQ(joint.visibility, joint.z, previousFrameJoint?.z, zPredictedK_1));

        const rX = calculateR(joint.visibility, vt, joint.x, previousFrameJoint?.x, std?.x);
        const rY = calculateR(joint.visibility, vt, joint.y, previousFrameJoint?.y, std?.y);
        const rZ = calculateR(joint.visibility, vt, joint.z, previousFrameJoint?.z, std?.z);

        fx = kf.x.update(joint.x, rX);
        fy = kf.y.update(joint.y, rY);
        fz = kf.z.update(joint.z, rZ);

        if (!joint.kalmanPredictions) joint.kalmanPredictions = {};
        if (!joint.lastSeenFrames) joint.lastSeenFrames = {};

        if (frameIndex > previousFrameIndex) {
            joint.kalmanPredictions.forwardPrediction = { x: fx, y: fy, z: fz };
            joint.lastSeenFrames.previous = lastVisibleFrame.get(jointName);

        } else {
            joint.kalmanPredictions.backwardPrediction = { x: fx, y: fy, z: fz };
            joint.lastSeenFrames.next = lastVisibleFrame.get(jointName);
        }
    });
}

function calculateQ(frameVisibility: number, currentPosition: number, previousPosition?: number, predicted?: number) {
    let q = 1;

    if (previousPosition !== undefined) {
        q *= 1 + Math.abs(currentPosition - previousPosition) * 10 * frameVisibility;
    }

    if (predicted !== undefined) {
        q *= 1 + Math.abs(currentPosition - predicted) * 10 * frameVisibility;
    }

    return q;
}

function calculateR(frameVisibility: number, visibilityThreshold: number, currentPosition: number, previousPosition?: number, std?: number) {
    const rMin = 0.0005;
    let rMax = 0.005;

    if (((std && previousPosition !== undefined && Math.abs(previousPosition - currentPosition) >= std * 2) || !std) && frameVisibility < visibilityThreshold) {
        rMax *= 10;
    }

    return rMin + (1 - frameVisibility) ** 2 * (rMax - rMin);
}