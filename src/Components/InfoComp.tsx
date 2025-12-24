import { useEffect, useState } from "react";
import { VideoPoseData } from "../Utils/Constants/types";

type Props = {
    poseData: VideoPoseData | null,
    videoRef: React.RefObject<HTMLVideoElement | null>
}

const InfoComp: React.FC<Props> = ({ poseData, videoRef }) => {

    const [currentFrame, setCurrentFrame] = useState<number | null>(null);

    useEffect(() => {
        if (!videoRef.current || !poseData) return;

        const video = videoRef.current;

        const updateFrame = () => {
            const currentTime = video.currentTime;

            const frame = poseData.frames.reduce((prev, curr) => {
                if (Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime))
                    return curr;
                return prev;
            });

            if (frame) setCurrentFrame(frame.frameIndex);
        };

        video.addEventListener("timeupdate", updateFrame);

        return () => {
            video.removeEventListener("timeupdate", updateFrame);
        };
    }, [videoRef, poseData]);

    return (
        <div>
            {currentFrame !== null && poseData && (
                <div>
                    Frame: {currentFrame}
                    {poseData.frames.filter(frame => frame.frameIndex === currentFrame).map((frame, index) => (
                        <div>
                            {frame.landmarks.map(lm => (
                                <div>
                                    <p>Name: {lm.name}</p>
                                    <p>x: {lm.x}</p>
                                    <p>y: {lm.y}</p>
                                    <p>z: {lm.z}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default InfoComp;