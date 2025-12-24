import { useState } from "react";
import { Resolution } from "../Utils/Constants/types";

type Props = {
    resolution: Resolution | null,
    setResolution: (newResolution: Resolution | null) => void
}

const ButtonResolution: React.FC<Props> = ({ resolution, setResolution }) => {

    const [changeResolution, setChangeResolution] = useState<string>(String(resolution?.heightScale) ?? "");

    const changeResolutionInput = () => {
        const regex = /^[1-9][0-9]{1,2}$/;
        if (!changeResolution) return;
        const isMatch = regex.test(changeResolution);
        if (!isMatch) {
            setChangeResolution(String(resolution?.heightScale ? resolution.heightScale*100 : ""));
            return;
        }

        const heightScale = Number(changeResolution) / 100;
        if (heightScale < 0.5 || heightScale > 1) {
            setChangeResolution(String(resolution?.heightScale ? resolution.heightScale*100 : ""));
            return;
        }

        if (!resolution) return;
        const height = window.innerHeight * heightScale;
        const width = height * resolution.widthToHeightRatio;
        setResolution({ ...resolution, width: width, height: height, heightScale: heightScale});
    }

    const changeResolutionButton = (
        sign: number
    ) => {
        if (!resolution) return;
        const heightScale = resolution?.heightScale + sign * 0.01;
        if (heightScale < 0.5 || heightScale > 1) return;
        const height = window.innerHeight * heightScale;
        const width = height * resolution.widthToHeightRatio;
        setResolution({ ...resolution, width: width, height: height, heightScale: heightScale});
        setChangeResolution(String(heightScale * 100));
    }

    return (
        <div>
            <button
                onClick={() => changeResolutionButton(-1)}
            >
                -
            </button>
            <input
                onChange={(e) => setChangeResolution(e.target.value)}
                onBlur={changeResolutionInput}
                value={changeResolution}
                onKeyDown={(e) => {
                    if(e.key === "Enter") changeResolutionInput();
                }}
            >
            </input>
            <button
                onClick={() => changeResolutionButton(1)}
            >
                +
            </button>
        </div>
    );
}

export default ButtonResolution;