import { Joint } from "../Constants/types";

export const determineLastSeenFrames = (
    joint: Joint,
    frameIndex: number,
    previousFrameIndex: number,
    lastVisibleFrame: Map<number, number>,
    visibilityThreshold: number
): void => {
    const jointName = joint.name;

    const passesVisibilityThreshold = joint.visibility > visibilityThreshold;

    if (passesVisibilityThreshold) lastVisibleFrame.set(jointName, frameIndex);

    if (!joint.lastSeenFrames) joint.lastSeenFrames = {};

    if (frameIndex > previousFrameIndex) {
        joint.lastSeenFrames.previous = lastVisibleFrame.get(jointName);

    } else {
        joint.lastSeenFrames.next = lastVisibleFrame.get(jointName);
    }

}