import { Landmark } from "../Constants/types";

export const calculateDistance3D = (
    a: Landmark,
    b: Landmark
) => { 

    return Math.sqrt((Math.pow(b.x-a.x, 2))+(Math.pow(b.y-a.y, 2))+(Math.pow(b.z-a.z, 2)));
}