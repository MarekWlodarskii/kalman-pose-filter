import { POSE_CONNECTIONS } from "@mediapipe/pose";
import { Joint, Landmark, VideoPoseData } from "../Constants/types";
import { DisplayMode } from "../Constants/enums";

export const drawSkeleton = (
    displayModeRef: React.RefObject<DisplayMode>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    enabledJoints: Record<number, boolean>,
    canvasSizeRef: React.RefObject<number>,
    textColorRef: React.RefObject<string>,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    poseData: VideoPoseData | null,
    drawLinesBetweenJointsRef: React.RefObject<boolean>
): void => {
    

    if (!videoRef.current || !canvasRef.current || !poseData || poseData.frames.length === 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(drawLinesBetweenJointsRef.current === false) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.display = "block";
    canvas.style.top = "0";
    canvas.style.left = "0";

    ctx.strokeStyle = textColorRef.current ?? "red";
    ctx.lineWidth = canvasSizeRef.current;

    const currentTime = video.currentTime;
    const frame = poseData.frames.reduce((prev, curr) => {
        if (Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime))
            return curr;
        return prev;
    });
    if (!frame) return;

    const displayMode = displayModeRef.current;
    const points = displayMode === DisplayMode.BOTH_KALMAN_FILTERS ? frame.landmarksCorrected : frame.landmarks;

    if(!points) return;

    POSE_CONNECTIONS.forEach(([a, b]) => {
        if (enabledJoints[a] === false || enabledJoints[b] === false) return;
        if (!points[a] || !points[b]) return;

        let p1: Landmark = jointToLandmark(points[a]);
        let p2: Landmark = jointToLandmark(points[b]);

        if (displayMode === DisplayMode.KALMAN_FILTER_FORWARD) {
            const jointA = points[a];
            const jointB = points[b];
            if (jointA.kalmanPredictions?.forwardPrediction === undefined) return;
            p1 = jointA.kalmanPredictions?.forwardPrediction;
            if (jointB.kalmanPredictions?.forwardPrediction === undefined) return;
            p2 = jointB.kalmanPredictions?.forwardPrediction;
        }

        if (displayMode === DisplayMode.KALMAN_FILTER_BACKWARD) {
            const jointA = points[a];
            const jointB = points[b];
            if (jointA.kalmanPredictions?.backwardPrediction === undefined) return;
            p1 = jointA.kalmanPredictions?.backwardPrediction;
            if (jointB.kalmanPredictions?.backwardPrediction === undefined) return;
            p2 = jointB.kalmanPredictions?.backwardPrediction;
        }

        if (!p1 || !p2) return;

        const p1X = p1.x * canvas.width;
        const p1Y = p1.y * canvas.height;
        const p2X = p2.x * canvas.width;
        const p2Y = p2.y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.stroke();
    });
};

function jointToLandmark(joint: Joint): Landmark {
    return {
        x: joint.x,
        y: joint.y,
        z: joint.z
    };
}