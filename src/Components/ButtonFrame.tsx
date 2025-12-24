import { useEffect, useState } from "react";
import { VideoPoseData } from "../Utils/Constants/types";

type Props = {
    poseData: VideoPoseData | null,
    videoRef: React.RefObject<HTMLVideoElement | null>
}

const ButtonFrame: React.FC<Props> = ({ poseData, videoRef }) => {

    const [currentFrame, setCurrentFrame] = useState<number | null>();

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

    const changeFrameButton = (
        sign: number
    ) => {

        if (!currentFrame || !poseData || !videoRef.current) return;

        const frame = currentFrame + sign * 1;

        if (frame < 0 || frame >= poseData?.frames.length) return;

        const time = poseData.frames.find(fd => fd.frameIndex === frame)?.timestamp;

        if (!time) return;

        console.log(time);
        videoRef.current.currentTime = time;
        setCurrentFrame(frame);
    }

    return (
        <div>
            <button
                onClick={() => changeFrameButton(-1)}
            >
                -
            </button>
            <input
            >
            </input>
            <button
                onClick={() => changeFrameButton(1)}
            >
                +
            </button>
        </div>
    );
}

export default ButtonFrame;