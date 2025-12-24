import { FrameData, Joint } from "../Constants/types";

export const smoothLandmarks = (
    frames: FrameData[],
    smoothWindowSize: number
): FrameData[] => {
    const smoothedFrames: FrameData[] = [];

    frames.forEach((frame, frameIterator) => {
        let meanPositionOfJoints: Joint[] = [];

        frame.landmarks.forEach((landmark, landmarkIterator) => {
            let meanPosition: Joint = { ...landmark };
            let framesUsedtoCalculateMean = 1;

            for (let smoothWindowIterator = 1; smoothWindowIterator < smoothWindowSize + 1; smoothWindowIterator++) {
                let consideredFrame = frames.at(frameIterator - smoothWindowIterator);
                if (consideredFrame && consideredFrame.landmarks[landmarkIterator]) {
                    meanPosition.x += consideredFrame?.landmarks[landmarkIterator]?.x;
                    meanPosition.y += consideredFrame?.landmarks[landmarkIterator]?.y;
                    meanPosition.z += consideredFrame?.landmarks[landmarkIterator]?.z;
                    meanPosition.visibility += consideredFrame?.landmarks[landmarkIterator]?.visibility;
                    framesUsedtoCalculateMean++;
                }

                consideredFrame = frames.at(frameIterator + smoothWindowIterator);
                if (consideredFrame && consideredFrame.landmarks[landmarkIterator]) {
                    meanPosition.x += consideredFrame?.landmarks[landmarkIterator]?.x;
                    meanPosition.y += consideredFrame?.landmarks[landmarkIterator]?.y;
                    meanPosition.z += consideredFrame?.landmarks[landmarkIterator]?.z;
                    meanPosition.visibility += consideredFrame?.landmarks[landmarkIterator]?.visibility;
                    framesUsedtoCalculateMean++;
                }
            }

            meanPosition.x /= framesUsedtoCalculateMean;
            meanPosition.y /= framesUsedtoCalculateMean;
            meanPosition.z /= framesUsedtoCalculateMean;
            meanPosition.visibility /= framesUsedtoCalculateMean;

            meanPositionOfJoints.push({
                name: landmark.name,
                x: meanPosition.x,
                y: meanPosition.y,
                z: meanPosition.z,
                visibility: meanPosition.visibility
            });
        });

        smoothedFrames.push({
            frameIndex: frame.frameIndex,
            timestamp: frame.timestamp,
            landmarks: meanPositionOfJoints
        });
    });

    return smoothedFrames;
}