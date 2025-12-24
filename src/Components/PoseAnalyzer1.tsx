import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import React, { useRef, useState, useEffect } from "react";
import { JointNames } from "../Utils/Constants/enums";
import { VideoPoseData, PairOfJoints, Resolution } from "../Utils/Constants/types";
import { handleVideoChange } from "../Utils/Video/handleVideoChange";
import { drawLandmarks } from "../Utils/Video/drawLandmarks";
import { analyzeVideo } from "../Utils/Analysis/analyzeVideo";
import ButtonResolution from "./ButtonResolution";
import ButtonFrame from "./ButtonFrame";
import InfoComp from "./InfoComp";

const PoseAnalyzer1: React.FC = () => {
  const visibilityThreshold = 0.7;
  const [videoDuration, setVideoDuration] = useState<number>();
  const [interval, setInterval] = useState<number>();
  const animationFrameRef = useRef<number | null>(null);
  const [poseData, setPoseData] = useState<VideoPoseData | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const fps = 30;
  const [allowControl, setAllowControl] = useState<boolean>(false);
  const wantedLandmarks = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const pairsOfJoints: PairOfJoints[] = [
    { joint1: JointNames.LEFT_FEET, joint2: JointNames.LEFT_KNEE, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.LEFT_KNEE, joint2: JointNames.LEFT_HIP, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.RIGHT_FEET, joint2: JointNames.RIGHT_KNEE, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.RIGHT_KNEE, joint2: JointNames.RIGHT_HIP, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.LEFT_WRIST, joint2: JointNames.LEFT_ELBOW, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.LEFT_SHOULDER, joint2: JointNames.LEFT_ELBOW, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.RIGHT_WRIST, joint2: JointNames.RIGHT_ELBOW, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
    { joint1: JointNames.RIGHT_SHOULDER, joint2: JointNames.RIGHT_ELBOW, bestMeanVisibility: null, bestMeanVisibilityFrameIndex: null, bestMinVisibility: null, bestMinVisibilityFrameIndex: null, distance: null },
  ]

  const [resolution, setResolution] = useState<Resolution | null>(null);

  const runningMode = "VIDEO";

  useEffect(() => {
    const createPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks("/wasm");

      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_heavy.task",
          delegate: "GPU",
        },
        runningMode: runningMode,
        numPoses: 1,
      });
    }

    createPoseLandmarker();
  }, []);

  const drawLoop = () => {
    drawLandmarks(
      videoRef,
      poseData,
      canvasRef,
      wantedLandmarks
    );
    animationFrameRef.current = requestAnimationFrame(drawLoop);
  }

  return (
    <div>

      <input type="file" accept="video/*" onChange={e => handleVideoChange(
        e,
        animationFrameRef,
        setPoseData,
        setVideoSrc
      )} />

      {videoSrc && (

        <div
          style={{ position: "relative", display: "inline-block", width: resolution?.width, height: resolution?.height }}
        >

          <video
            ref={videoRef}
            src={videoSrc}
            onLoadedMetadata={() => {
              analyzeVideo(
                videoRef,
                poseLandmarkerRef,
                setAllowControl,
                setVideoDuration,
                setInterval,
                fps,
                canvasRef,
                wantedLandmarks,
                visibilityThreshold,
                pairsOfJoints,
                setPoseData
              );
              if (!videoRef.current) return;
              const heightScale = 0.8;
              const ratio = videoRef.current?.width / videoRef.current?.height;
              const height = window.innerHeight * 0.8;
              const width = height * ratio;
              setResolution({ width: width, height: height, heightScale: heightScale, widthToHeightRatio: ratio });
            }
            }
            onPlay={() => {
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }
              drawLoop();
            }}
            controls={allowControl}
            style={{ width: "100%", height: "100%" }}
          />

          <canvas
            ref={canvasRef}
            style={{ display: "none", width: "100%", height: "100%" }}
          />
        </div>
      )}
      <ButtonResolution
        resolution={resolution}
        setResolution={setResolution}
      />
      <ButtonFrame
        poseData={poseData}
        videoRef={videoRef}
      />
      <InfoComp
        poseData={poseData}
        videoRef={videoRef}
      />
    </div>
  );
}

export default PoseAnalyzer1;
