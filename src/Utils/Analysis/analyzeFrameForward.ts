import { FrameData, STDDistance, Landmark, Joint } from "../Constants/types";
import { createKalmanFilters } from "../Kalman/createKalmanFilters";
import { calculateDistance3D } from "../Math/calculateDistance3D";
import { KalmanFilter1D } from "../Kalman/kalmanFilter1D";

export const analyzeFrameForward = async (
    frames: FrameData[],
    frameIndex: number,
    previousFrameIndex: number,
    lastVisibleFrame: Map<number, number>,
    kalmanFilters: Record<number, { x: any, y: any, z: any }>,
    previousCorrectedStates: Record<number, { x?: any, y?: any, z?: any }>,
    visibilityThreshold: number,
    fps: number,
    distanceVisibleFrames: STDDistance[],
    buffers: FrameData[]
) => {

    const currentFrame = frames[frameIndex].landmarks;
    const landmarksExists = currentFrame.length > 0;

    if (!landmarksExists) return;



    currentFrame.forEach((joint, i) => {

        const jointName = joint.name;
        let kf = kalmanFilters[jointName];

        if (!kf) return;

        const previousFrameJoint = previousFrameIndex >= 0 && previousFrameIndex < frames.length ? frames[previousFrameIndex].landmarks.find(j => j.name === joint.name) : null;
        const passesVisibilityThreshold = joint.visibility > visibilityThreshold;
        const previousFrameLastSeenFrameExists = frameIndex > previousFrameIndex ? previousFrameJoint?.lastSeenFrames?.previous : previousFrameJoint?.lastSeenFrames?.next;
        const framesBetweenCurrentAndLastVisibleFrame = frameIndex > previousFrameIndex ? frameIndex - (previousFrameJoint?.lastSeenFrames?.previous ?? 0) : (previousFrameJoint?.lastSeenFrames?.next ?? frameIndex + fps * 4) - frameIndex;

        if (passesVisibilityThreshold) {
            lastVisibleFrame.set(jointName, frameIndex);

            if (previousFrameLastSeenFrameExists) {
                if (framesBetweenCurrentAndLastVisibleFrame >= fps) {/*
                    const dt = 1 / fps;
                    kf = {
                        x: new KalmanFilter1D({
                            dt,
                            processNoise: 0.03,
                            measurementNoise: 0.00005,
                        }),
                        y: new KalmanFilter1D({
                            dt,
                            processNoise: 0.03,
                            measurementNoise: 0.00005,
                        }),
                        z: new KalmanFilter1D({
                            dt,
                            processNoise: 0.03,
                            measurementNoise: 0.00005,
                        })
                    }*/
                }
            }
        }
        let mean = currentFrame[i].frameMean;
        let std = currentFrame[i].frameStd;
        joint.adjustedPosition = {
            x: joint.x,
            y: joint.y,
            z: joint.z
        }
        /*if (joint && mean && std && previousFrameJoint && previousFrameJoint.adjustedPosition && (!passesVisibilityThreshold)) {
            let res = asd(joint.x, previousFrameJoint.adjustedPosition.x, mean.x, std.x);
            if (res) {
                joint.adjustedPosition.x = res;
            }
            res = asd(joint.y, previousFrameJoint.adjustedPosition.y, mean.y, std.y);
            if (res) {
                joint.adjustedPosition.y = res;
            }
            res = asd(joint.z, previousFrameJoint.adjustedPosition.z, mean.z, std.z);
            if (res) {
                joint.adjustedPosition.z = res;
            }
        }*/

        const Rx = joint.frameStd?.x ? joint.frameStd!.x * joint.frameStd!.x : 0.0002;
        const Ry = joint.frameStd?.y ? joint.frameStd!.y * joint.frameStd!.y : 0.0002;
        const Rz = joint.frameStd?.z ? joint.frameStd!.z * joint.frameStd!.z : 0.0002;



        //kf.x.adaptProcessNoise(computeQ(1, joint.visibility, joint.frameMean?.x));
        //kf.y.adaptProcessNoise(computeQ(1, joint.visibility, joint.frameMean?.y));
        //kf.z.adaptProcessNoise(computeQ(1, joint.visibility, joint.frameMean?.z));

        let fx = kf.x.predict();
        let fy = kf.y.predict();
        let fz = kf.z.predict();

        fx = kf.x.update(joint.x, Rx);
        fy = kf.y.update(joint.y, Ry);
        fz = kf.z.update(joint.z, Rz);

        // === 3. ZAPIS PREDYKCJI ===
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

function asd(current: number, previous: number, mean: number, std: number) {
    if (Math.abs(current - previous) > 2 * std) {
        return current > previous ? previous + mean : previous - mean;
    }
    return false;
}


function computeQ(baseQ: number, visibility: number, delta: number = 0) {
    const visFactor = 0.7 + (1 - visibility);              // niewidoczny → Q rośnie
    const deltaFactor = delta * 1000;             // szybki ruch → Q rośnie

    // Zwracamy Q jako wariancję
    return baseQ * visFactor * deltaFactor;
}