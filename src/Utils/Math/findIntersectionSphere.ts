import { Landmark } from "../Constants/types";
import { calculateDistance3D } from "./calculateDistance3D";

export const findIntersectionSphere = (
    a: Landmark,
    b: Landmark,
    r: number
): Landmark => {

    const d = calculateDistance3D(a, b);

    if(d === 0) return {x: 0, y: 0, z: 0};

    const result: Landmark = {
        x: ((b.x - a.x) / d) * r + a.x,
        y: ((b.y - a.y) / d) * r + a.y,
        z: ((b.z - a.z) / d) * r + a.z
    }
    
    return result;
}