import { FrameData, PairOfJoints, Joint, Landmark } from "../Constants/types";
import { findIntersectionSphere } from "./findIntersectionSphere";

export const adjustPositionUsingDistance = (
    frame: FrameData,
    pairsOfJoints: PairOfJoints[]
): void => {

    if(!frame.landmarksCorrected) return;

    const joints = frame.landmarksCorrected;
    const sorted = [...joints].sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));

    sorted.forEach((joint) => {
        pairsOfJoints.forEach((pair) => {
            if (!pair.distance) return;
            let adjustedJointName: number | null = null;

            if (pair.joint1 === joint.name) adjustedJointName = pair.joint2;
            if (pair.joint2 === joint.name) adjustedJointName = pair.joint1;

            if (adjustedJointName === null) return;

            const adjustedJoint: Joint = joints.find(joint => joint.name === adjustedJointName)!;
            const adjustedJointVisibility = adjustedJoint.visibility;

            if (!(joint.visibility >= adjustedJointVisibility) || joint.visibility < 0.7) return;

            const betterVisibleJoint: Landmark = {
                x: joint.x,
                y: joint.y,
                z: joint.z
            };

            const worseVisibleJoint: Landmark = {
                x: adjustedJoint.x,
                y: adjustedJoint.y,
                z: adjustedJoint.z
            };

            const distance = pair.distance;

            const adjustedPosition: Landmark = findIntersectionSphere(
                betterVisibleJoint,
                worseVisibleJoint,
                distance
            );

            adjustedJoint.x = adjustedPosition.x;
            adjustedJoint.y = adjustedPosition.y;
            adjustedJoint.z = adjustedPosition.z;
        })
    });

}