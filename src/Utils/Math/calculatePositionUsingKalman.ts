import { FrameData } from "../Constants/types";

export const calculatePostionUsingKalman = (
    frames: FrameData[],
    visibilityThreshold: number
) => {

    if (!frames) return;

    frames.forEach((frame, frameIndex) => {

        const landmarks = frame.landmarks;
        const landmarksCorrected = frame.landmarksCorrected;
        if (!landmarks) return;

        if (!frame.landmarksCorrected) {
            frame.landmarksCorrected = [];
        }

        landmarks.forEach(joint => {

            if (!joint) return;

            let x: number | null = null;
            let y: number | null = null;
            let z: number | null = null;

            const forwardPrediction = joint.kalmanPredictions?.forwardPrediction;
            const backwardPrediction = joint.kalmanPredictions?.backwardPrediction;

            let forwardLastSeenFrameDistance = joint.lastSeenFrames?.previous != null ? frameIndex - joint.lastSeenFrames?.previous : null;
            let backwardLastSeenFrameDistance = joint.lastSeenFrames?.next != null ? joint.lastSeenFrames?.next - frameIndex : null;

            if (forwardLastSeenFrameDistance === 0) forwardLastSeenFrameDistance = 1;
            if (backwardLastSeenFrameDistance === 0) backwardLastSeenFrameDistance = 1;

            if (forwardLastSeenFrameDistance === null && backwardLastSeenFrameDistance === null) return;

            if (forwardLastSeenFrameDistance === null) {
                x = backwardPrediction?.x!;
                y = backwardPrediction?.y!;
                z = backwardPrediction?.z!;
            }

            if (backwardLastSeenFrameDistance === null) {
                x = forwardPrediction?.x!;
                y = forwardPrediction?.y!;
                z = forwardPrediction?.z!;
            }

            if (forwardLastSeenFrameDistance !== null && backwardLastSeenFrameDistance !== null) {
                let lastSeenFrameDistance = forwardLastSeenFrameDistance + backwardLastSeenFrameDistance;

                x = forwardPrediction?.x! * backwardLastSeenFrameDistance / lastSeenFrameDistance + backwardPrediction?.x! * forwardLastSeenFrameDistance / lastSeenFrameDistance;
                y = forwardPrediction?.y! * backwardLastSeenFrameDistance / lastSeenFrameDistance + backwardPrediction?.y! * forwardLastSeenFrameDistance / lastSeenFrameDistance;
                z = forwardPrediction?.z! * backwardLastSeenFrameDistance / lastSeenFrameDistance + backwardPrediction?.z! * forwardLastSeenFrameDistance / lastSeenFrameDistance;
            }

            frame.landmarksCorrected?.push({
                name: joint.name,
                x: x === null ? joint.x : x,
                y: y === null ? joint.y : y,
                z: z === null ? joint.z : z,
                visibility: joint.visibility
            })

        });

    });

}