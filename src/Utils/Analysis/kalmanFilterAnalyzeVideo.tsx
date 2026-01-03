import { FrameData, Joint, Landmark, VideoPoseData } from "../Constants/types";
import { createKalmanFilters } from "../Kalman/createKalmanFilters";
import { calculatePostionUsingKalman } from "../Math/calculatePositionUsingKalman";
import { kalmanFilterAnalyzeFrame } from "./kalmanFilterAnalyzeFrame";
import { calculateMeanAndStdForFrame } from "../Math/calculateMeanAndStdForFrame";
import { calculateAngle } from "../Math/calculateAngle";
import { DisplayMode } from "../Constants/enums";

export const kalmanFilterAnalyzeVideo = async (
    fps: number,
    visibilityThreshold: number,
    setPoseData: (value: React.SetStateAction<VideoPoseData | null>) => void,
    frames: FrameData[] | undefined
) => {
    if (!frames) return;

    const allLandmarks = Array.from({ length: 33 }, (_, i) => i);
    let kalmanFilters = createKalmanFilters(
        allLandmarks,
        fps
    );

    const lastVisibleFrame = new Map();
    let buffers: FrameData[] = [];

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {

        calculateMeanAndStdForFrame(
            buffers,
            frames[frameIndex],
            0,
            20,
            frameIndex,
            frames
        );
    }

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {

        kalmanFilterAnalyzeFrame(
            frames,
            frameIndex,
            frameIndex - 1,
            lastVisibleFrame,
            kalmanFilters,
            visibilityThreshold
        );

    }

    lastVisibleFrame.clear();
    kalmanFilters = createKalmanFilters(
        allLandmarks,
        fps
    );

    buffers = [];

    for (let frameIndex = frames.length - 1; frameIndex >= 0; frameIndex--) {

        kalmanFilterAnalyzeFrame(
            frames,
            frameIndex,
            frameIndex + 1,
            lastVisibleFrame,
            kalmanFilters,
            visibilityThreshold
        );
    }

    calculatePostionUsingKalman(
        frames
    );

    const setOfJointsToCalculateAngle = [
        [11, 13, 15],
        [12, 14, 16],
        [23, 25, 27],
        [24, 26, 28],
        [25, 27, 31],
        [26, 28, 32]
    ];

    const findJoint = (
        joints: Joint[],
        jointName: number
    ): Joint | undefined => {
        return joints.find(j => j.name === jointName);
    }

    const calculateAngleForSet = (
        joints: Joint[],
        displayMode: DisplayMode
    ) => {
        setOfJointsToCalculateAngle.forEach(([j1, j2, j3]) => {
            const joint1 = findJoint(joints, j1);
            const joint2 = findJoint(joints, j2);
            const joint3 = findJoint(joints, j3);
            if (!joint1 || !joint2 || !joint3) return;

            const landmark1 = jointToLandmark(joint1, displayMode);
            const landmark2 = jointToLandmark(joint2, displayMode);
            const landmark3 = jointToLandmark(joint3, displayMode);
            if (!landmark1 || !landmark2 || !landmark3) return;

            const angle = calculateAngle(landmark1, landmark2, landmark3);

            if (displayMode === DisplayMode.KALMAN_FILTER_FORWARD) {
                if (!joint2.kalmanPredictionAngles) joint2.kalmanPredictionAngles = {};
                joint2.kalmanPredictionAngles.forwardPrediction = angle;
            } else if (displayMode === DisplayMode.KALMAN_FILTER_BACKWARD) {
                if (!joint2.kalmanPredictionAngles) joint2.kalmanPredictionAngles = {};
                joint2.kalmanPredictionAngles.backwardPrediction = angle;
            } else {
                joint2.angle = angle;
            }
        });
    }

    const jointToLandmark = (
        joint: Joint,
        displayMode: DisplayMode
    ): Landmark | null => {
        if (displayMode === DisplayMode.KALMAN_FILTER_FORWARD)
            return joint.kalmanPredictions?.forwardPrediction ?? null;

        if (displayMode === DisplayMode.KALMAN_FILTER_BACKWARD)
            return joint.kalmanPredictions?.backwardPrediction ?? null;

        return {
            x: joint.x,
            y: joint.y,
            z: joint.z
        };
    }

    frames.forEach(frame => {
        if (!frame.landmarks) return;
        calculateAngleForSet(frame.landmarks, DisplayMode.MACHINE_LEARNING_MODEL);
        calculateAngleForSet(frame.landmarks, DisplayMode.KALMAN_FILTER_FORWARD);
        calculateAngleForSet(frame.landmarks, DisplayMode.KALMAN_FILTER_BACKWARD);
        if (!frame.landmarksCorrected) return;
        calculateAngleForSet(frame.landmarksCorrected, DisplayMode.BOTH_KALMAN_FILTERS);
    });

    setPoseData({ fps: fps, frames: frames });
    console.log("Pose data:", { fps: fps, frames });
}