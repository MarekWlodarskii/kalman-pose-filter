import { identity } from "simple-linalg";

export const createDynamicCovariance = (
    dt: number,
    scale: number
) => {
    const q = identity(3);

    q[0][0] = 1;
    q[1][1] = dt * dt;
    q[2][2] = dt ** 4 * scale;

    return q;
}