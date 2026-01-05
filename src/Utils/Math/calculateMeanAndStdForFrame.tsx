import { FrameData, Landmark } from "../Constants/types";

export function calculateMeanAndStdForFrame(
    buffers: FrameData[],
    currentFrame: FrameData,
    visibilityThreshold: number,
    buffersSize: number,
    frameIndex: number,
    frames: FrameData[]
) {
    buffers.push(currentFrame);
    if (buffers.length > buffersSize) buffers.shift();
    if (frameIndex < buffersSize / 2) return;

    const meanFrame: Landmark[] = [];
    const elementsUsedToCalculateMeanFrame: number[] = [];
    const stdFrame: Landmark[] = [];

    buffers.forEach((fd, i) => {
        fd.landmarks.forEach((lm, j) => {
            if (lm.visibility > visibilityThreshold) {
                if (i > 0 && buffers[i - 1].landmarks[j].visibility > visibilityThreshold) {
                    if (!meanFrame[j]) {
                        meanFrame[j] = {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                        if (!stdFrame[j])
                            stdFrame[j] = {
                                x: 0,
                                y: 0,
                                z: 0
                            }
                        if (!elementsUsedToCalculateMeanFrame[j])
                            elementsUsedToCalculateMeanFrame[j] = 0;
                    }
                    elementsUsedToCalculateMeanFrame[j] += 1;
                    meanFrame[j] = {
                        x: meanFrame[j].x + Math.abs(lm.x - buffers[i - 1].landmarks[j].x),
                        y: meanFrame[j].y + Math.abs(lm.y - buffers[i - 1].landmarks[j].y),
                        z: meanFrame[j].z + Math.abs(lm.z - buffers[i - 1].landmarks[j].z)
                    }
                }
            }
        });
    });

    meanFrame.forEach((lm, i) => {
        if (elementsUsedToCalculateMeanFrame[i] > 0) {
            lm.x /= elementsUsedToCalculateMeanFrame[i];
            lm.y /= elementsUsedToCalculateMeanFrame[i];
            lm.z /= elementsUsedToCalculateMeanFrame[i];

            frames[frameIndex - buffersSize / 2].landmarks[i].frameMean = {
                x: lm.x,
                y: lm.y,
                z: lm.z
            }

            if (frameIndex === frames.length - 1) {
                for (let j = frameIndex - buffersSize / 2; j < frames.length; j++) {
                    frames[j].landmarks[i].frameMean = {
                        x: lm.x,
                        y: lm.y,
                        z: lm.z
                    }
                }
            }
        }


    });

    buffers.forEach((fd, i) => {
        fd.landmarks.forEach((lm, j) => {
            if (lm.visibility > visibilityThreshold) {
                const fm = frames[frameIndex - buffersSize / 2].landmarks[j].frameMean;
                if (fm && i > 0 && buffers[i - 1].landmarks[j].visibility > visibilityThreshold) {
                    stdFrame[j] = {
                        x: stdFrame[j].x + (Math.abs(lm.x - buffers[i - 1].landmarks[j].x) - fm.x) ** 2,
                        y: stdFrame[j].y + (Math.abs(lm.y - buffers[i - 1].landmarks[j].y) - fm.y) ** 2,
                        z: stdFrame[j].z + (Math.abs(lm.z - buffers[i - 1].landmarks[j].z) - fm.z) ** 2
                    }
                }
            }
        });
    });

    stdFrame.forEach((f, i) => {
        if (elementsUsedToCalculateMeanFrame[i] > 1) {
            f.x = Math.sqrt(f.x / (elementsUsedToCalculateMeanFrame[i] - 1));
            f.y = Math.sqrt(f.y / (elementsUsedToCalculateMeanFrame[i] - 1));
            f.z = Math.sqrt(f.z / (elementsUsedToCalculateMeanFrame[i] - 1));

            frames[frameIndex - buffersSize / 2].landmarks[i].frameStd = {
                x: f.x,
                y: f.y,
                z: f.z
            }

            if (frameIndex === frames.length - 1) {
                for (let j = frameIndex - buffersSize / 2; j < frames.length; j++) {
                    frames[j].landmarks[i].frameStd = {
                        x: f.x,
                        y: f.y,
                        z: f.z
                    }
                }
            }
        }
    });
}