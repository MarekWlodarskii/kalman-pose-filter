import { NormalizedLandmark, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { Joint } from "../Constants/types";

export const checkIfSameFrame = (
    j1: Joint[],
    j2: NormalizedLandmark[] | Joint[],
    epsilon = 1e-5
) => {
    if(!j1 || !j2) return false;

    for(let i = 0; i < j1.length; i++){
        const x = Math.abs(j1[i].x - j2[i].x);
        const y = Math.abs(j1[i].y - j2[i].y);
        const z = Math.abs(j1[i].z - j2[i].z);

        if(x > epsilon || y > epsilon || z > epsilon) return false;
    }

    return true;
}