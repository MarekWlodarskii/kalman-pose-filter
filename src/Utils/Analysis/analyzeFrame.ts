import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { FrameData, Joint, Landmark, PairOfJoints, STDDistance } from "../Constants/types";
import { calculateDistance3D } from "../Math/calculateDistance3D";

export const analyzeFrame = async (
    result: PoseLandmarkerResult,
    previousFrameJoints: Joint[] | null,
    frameIndex: number,
    wantedLandmarks: number[],
    visibilityThreshold: number,
    pairsOfJoints: PairOfJoints[],
    distanceVisibleFrames: STDDistance[],
    frames: FrameData[]
) => {

    const joints: Joint[] = [];
    const landmarksExists = result.landmarks.length > 0;

    if (!landmarksExists) {
        console.log("Brak landmarkow");
        return;
    }

    result.landmarks[0].forEach((joint, i) => {

        if (!wantedLandmarks.includes(i)) return;

        const previousFrameJoint = previousFrameJoints?.find(joint => joint.name === i);
        const passesVisibilityThreshold = joint.visibility > visibilityThreshold;

        if (passesVisibilityThreshold) {
            if (previousFrameJoint && previousFrameJoint.visibility > visibilityThreshold) 
                {
                const element = distanceVisibleFrames.find(j => j.jointName === i);
                const currentFrameJointLandmark: Landmark = {
                    x: joint.x,
                    y: joint.y,
                    z: joint.z
                }

                const previousFrameJointLandmark: Landmark = {
                    x: previousFrameJoint.x,
                    y: previousFrameJoint.y,
                    z: previousFrameJoint.z
                }

                const separateFrameJointDistance: Landmark = {
                    x: Math.abs(joint.x - previousFrameJoint.x),
                    y: Math.abs(joint.y - previousFrameJoint.y),
                    z: Math.abs(joint.z - previousFrameJoint.z)
                }

                if (element && element.sumDistance != null && element.sumDistanceLandmark != null) {
                    element.elementsUsed += 1;
                    element.sumDistance = element.sumDistance + calculateDistance3D(currentFrameJointLandmark, previousFrameJointLandmark);
                    element.sumDistanceLandmark = {
                        x: element.sumDistanceLandmark.x + separateFrameJointDistance.x,
                        y: element.sumDistanceLandmark.y + separateFrameJointDistance.y,
                        z: element.sumDistanceLandmark.z + separateFrameJointDistance.z
                    };
                }
                else {
                    distanceVisibleFrames.push({
                        jointName: i,
                        elementsUsed: 0,
                        sumDistance: 0,
                        sumDistanceLandmark: {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                    });
                }
            }
        }

        joints.push({
            name: i,
            x: joint.x,
            y: joint.y,
            z: joint.z,
            visibility: joint.visibility
        });

    });

    pairsOfJoints.forEach((pair) => {
        const joint1Visibility = joints.find((joint) => { return joint.name === pair.joint1; })?.visibility;
        const joint2Visibility = joints.find((joint) => { return joint.name === pair.joint2; })?.visibility;

        const jointsMeanVisibility = (joint1Visibility! + joint2Visibility!) / 2;
        const jointsMinVisibility = Math.min(joint1Visibility!, joint2Visibility!);

        if (pair.bestMeanVisibility == null || jointsMeanVisibility > pair.bestMeanVisibility) {
            pair.bestMeanVisibility = jointsMeanVisibility;
            pair.bestMeanVisibilityFrameIndex = frameIndex;
        }

        if (pair.bestMinVisibility == null || jointsMinVisibility > pair.bestMinVisibility) {
            pair.bestMinVisibility = jointsMinVisibility;
            pair.bestMinVisibilityFrameIndex = frameIndex;
        }
    });

    return joints;
}