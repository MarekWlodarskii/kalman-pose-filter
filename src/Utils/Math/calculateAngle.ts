import { Landmark } from "../Constants/types";

export const calculateAngle = (
    vertexA: Landmark,
    vertexB: Landmark,
    vertexC: Landmark,
    facingDirection: number,
    angleDirection: number
  ): number => {
    const vectorBAx = vertexA.x - vertexB.x;
    const vectorBAy = vertexA.y - vertexB.y;
    const vectorBAz = vertexA.z - vertexB.z;

    const vectorBCx = vertexC.x - vertexB.x;
    const vectorBCy = vertexC.y - vertexB.y;
    const vectorBCz = vertexC.z - vertexB.z;

    const dotProduct = vectorBAx * vectorBCx + vectorBAy * vectorBCy + vectorBAz * vectorBCz;

    const magBA = Math.sqrt(vectorBAx * vectorBAx + vectorBAy * vectorBAy + vectorBAz * vectorBAz);
    const magBC = Math.sqrt(vectorBCx * vectorBCx + vectorBCy * vectorBCy + vectorBCz * vectorBCz);

    const cosAngle = dotProduct / (magBA * magBC);
    let angle: number = Math.acos(Math.min(Math.max(cosAngle, -1), 1)) * (180 / Math.PI);

    const ACx = vertexC.x - vertexA.x;
    const ACy = vertexC.y - vertexA.y;
    const ABx = vertexB.x - vertexA.x;
    const ABy = vertexB.y - vertexA.y;

    const cross = ACx * ABy - ACy * ABx;

    if (angleDirection * facingDirection * cross < 0) {
      return angle;
    }

    return 360 - angle;
  }