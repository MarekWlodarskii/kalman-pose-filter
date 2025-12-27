import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import React, { useRef, useState, useEffect } from "react";
import { VideoPoseData, Resolution } from "../Utils/Constants/types";
import { handleVideoChange } from "../Utils/Video/handleVideoChange";
import { drawLandmarks } from "../Utils/Video/drawLandmarks";
import { analyzeVideo } from "../Utils/Analysis/initialAnalyze";
import ButtonResolution from "./ButtonResolution";
import ButtonFrame from "./ButtonFrame";
import InfoComp from "./InfoComp";

const PoseAnalyzer: React.FC = () => {
  const visibilityThreshold = 0.7;
  const animationFrameRef = useRef<number | null>(null);
  const [poseData, setPoseData] = useState<VideoPoseData | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const fps = 60;
  const [allowControl, setAllowControl] = useState<boolean>(false);
  const wantedLandmarks = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

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
                fps,
                wantedLandmarks,
                visibilityThreshold,
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

export default PoseAnalyzer;