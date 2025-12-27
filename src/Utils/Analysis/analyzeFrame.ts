import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { Joint } from "../Constants/types";

export const analyzeFrame = async (
    result: PoseLandmarkerResult,
    wantedLandmarks: number[]
) => {

    const joints: Joint[] = [];
    const landmarksExists = result.landmarks.length > 0;

    if (!landmarksExists) {
        console.log("Brak landmarkow");
        return;
    }

    result.landmarks[0].forEach((joint, i) => {

        if (!wantedLandmarks.includes(i)) return;

        joints.push({
            name: i,
            x: joint.x,
            y: joint.y,
            z: joint.z,
            visibility: joint.visibility
        });

    });

    return joints;
}