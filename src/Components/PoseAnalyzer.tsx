import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import React, { useRef, useState, useEffect } from "react";
import { VideoPoseData, Resolution } from "../Utils/Constants/types";
import { handleVideoChange } from "../Utils/Video/handleVideoChange";
import { drawLandmarks } from "../Utils/Video/drawLandmarks";
import { initialAnalyze } from "../Utils/Analysis/initialAnalyze";
import { DisplayMode, DisplayType } from "../Utils/Constants/enums";
import { kalmanFilterAnalyzeVideo } from "../Utils/Analysis/kalmanFilterAnalyzeVideo";
import '../Styles/PoseAnalyzer.css';
import { drawSkeleton } from "../Utils/Video/drawSkeleton";

const PoseAnalyzer: React.FC = () => {
  const [visibilityThreshold, setVisibilityThreshold] = useState<number>(70);
  const visibilityThresholdRef = useRef(visibilityThreshold);
  const animationFrameRef = useRef<number | null>(null);
  const [poseData, setPoseData] = useState<VideoPoseData | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRefPoints = useRef<HTMLCanvasElement>(null);
  const canvasRefSkeleton = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const fps: number = 60;
  const [allowControl, setAllowControl] = useState<boolean>(false);
  const initialLandmarksToDisplay = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const jointsToDisplayAngles = [13, 14, 25, 26, 27, 28];
  const JOINTS = [
    { id: 0, name: "Nos" },

    { id: 1, name: "Lewe Oko (wewnętrzne)" },
    { id: 2, name: "Lewe Oko" },
    { id: 3, name: "Lewe Oko (zewnętrzne)" },

    { id: 4, name: "Prawe Oko (wewnętrzne)" },
    { id: 5, name: "Prawe Oko" },
    { id: 6, name: "Prawe Oko (zewnętrzne)" },

    { id: 7, name: "Lewe Ucho" },
    { id: 8, name: "Prawe Ucho" },

    { id: 9, name: "Usta (lewa strona)" },
    { id: 10, name: "Usta (prawa strona)" },

    { id: 11, name: "Lewy Bark" },
    { id: 12, name: "Prawy Bark" },

    { id: 13, name: "Lewy Łokieć" },
    { id: 14, name: "Prawy Łokieć" },

    { id: 15, name: "Lewy Nadgarstek" },
    { id: 16, name: "Prawy Nadgarstek" },

    { id: 17, name: "Lewy Mały Palec" },
    { id: 18, name: "Prawy Mały Palec" },

    { id: 19, name: "Lewy Palec Wskazujący" },
    { id: 20, name: "Prawy Palec Wskazujący" },

    { id: 21, name: "Lewy Kciuk" },
    { id: 22, name: "Prawy Kciuk" },

    { id: 23, name: "Lewy Kolec Biodrowy" },
    { id: 24, name: "Prawy Kolec Biodrowy" },

    { id: 25, name: "Lewe Kolano" },
    { id: 26, name: "Prawe Kolano" },

    { id: 27, name: "Lewa Kostka" },
    { id: 28, name: "Prawa Kostka" },

    { id: 29, name: "Lewa Pięta" },
    { id: 30, name: "Prawa Pięta" },

    { id: 31, name: "Lewy Palec Stopy" },
    { id: 32, name: "Prawy Palec Stopy" }
  ];
  const [enabledJoints, setEnabledJoints] = useState<Record<number, boolean>>(
    () =>
      Object.fromEntries(
        JOINTS.map(j => initialLandmarksToDisplay.includes(j.id) ? [j.id, true] : [j.id, false])
      ) as Record<number, boolean>
  );
  const enabledJointsRef = useRef(enabledJoints);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [progress, setProgress] = useState(0);
  const analysisCancelRef = useRef<boolean>(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.BOTH_KALMAN_FILTERS);
  const displayModeRef = useRef<DisplayMode>(displayMode);
  const displayModeOptions: DisplayMode[] = [
    DisplayMode.BOTH_KALMAN_FILTERS,
    DisplayMode.KALMAN_FILTER_FORWARD,
    DisplayMode.KALMAN_FILTER_BACKWARD,
    DisplayMode.MACHINE_LEARNING_MODEL
  ];
  const displayModeOptionLabels: Record<DisplayMode, string> = {
    [DisplayMode.BOTH_KALMAN_FILTERS]: "Średnia z obu filtrów",
    [DisplayMode.KALMAN_FILTER_FORWARD]: "Filtr Kalmana w przód",
    [DisplayMode.KALMAN_FILTER_BACKWARD]: "Filtr Kalmana w tył",
    [DisplayMode.MACHINE_LEARNING_MODEL]: "Model ML"
  };
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const runningMode = "VIDEO";
  const [canvasSizePoints, setCanvasSizePoints] = useState<number>(25);
  const canvasSizePointsRef = useRef<number>(canvasSizePoints);
  const [canvasSizeSkeleton, setCanvasSizeSkeleton] = useState<number>(5);
  const canvasSizeSkeletonRef = useRef<number>(canvasSizePoints);
  const [displayType, setDisplayType] = useState<DisplayType>(DisplayType.JOINT_NAME);
  const displayTypeRef = useRef<DisplayType>(displayType);
  const displayTypeOptions: DisplayType[] = [
    DisplayType.JOINT_NAME,
    DisplayType.JOINT_ANGLES
  ];
  const displayTypeOptionLabels: Record<DisplayType, string> = {
    [DisplayType.JOINT_NAME]: "Nazwy (Id) punktów",
    [DisplayType.JOINT_ANGLES]: "Kąty zgięcia stawów"
  };
  const [textColorPoints, setTextColorPoints] = useState<string>("red");
  const textColorPointsRef = useRef<string>(textColorPoints);
  const [textColorSkeleton, setTextColorSkeleton] = useState<string>("green");
  const textColorSkeletonRef = useRef<string>(textColorSkeleton);
  const textColorPointsOptions: Record<string, string> = {
    "red": "Czerwony",
    "blue": "Niebieski",
    "green": "Zielony",
    "black": "Czarny"
  };
  const [drawLinesBetweenJoints, setDrawLinesBetweenJoints] = useState<boolean>(false);
  const drawLinesBetweenJointsRef = useRef<boolean>(drawLinesBetweenJoints);

  const toggleJoint = (id: number) => {
    setEnabledJoints(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    canvasSizeSkeletonRef.current = canvasSizeSkeleton;
  }, [canvasSizeSkeleton]);

  useEffect(() => {
    enabledJointsRef.current = enabledJoints;
  }, [enabledJoints]);

  useEffect(() => {
    textColorSkeletonRef.current = textColorSkeleton;
  }, [textColorSkeleton]);

  useEffect(() => {
    drawLinesBetweenJointsRef.current = drawLinesBetweenJoints;
  }, [drawLinesBetweenJoints]);

  useEffect(() => {
    textColorPointsRef.current = textColorPoints;
  }, [textColorPoints]);

  useEffect(() => {
    canvasSizePointsRef.current = canvasSizePoints;
  }, [canvasSizePoints]);

  useEffect(() => {
    displayModeRef.current = displayMode;
  }, [displayMode]);

  useEffect(() => {
    displayTypeRef.current = displayType;
  }, [displayType]);

  const drawLoop = () => {
    if (drawLinesBetweenJoints === true) drawSkeleton(
      displayModeRef,
      canvasRefSkeleton,
      enabledJoints,
      canvasSizeSkeletonRef,
      textColorSkeletonRef,
      videoRef,
      poseData,
      drawLinesBetweenJointsRef
    );

    drawLandmarks(
      videoRef,
      poseData,
      canvasRefPoints,
      enabledJointsRef.current,
      displayModeRef,
      displayTypeRef,
      canvasSizePointsRef,
      textColorPointsRef
    );

    animationFrameRef.current = requestAnimationFrame(drawLoop);
  }

  useEffect(() => {
    visibilityThresholdRef.current = visibilityThreshold;
  }, [visibilityThreshold]);

  const handleVisibilityThresholdChange = (): void => {
    poseData?.frames.forEach(frame => {
      frame.landmarksCorrected = null;
    })
    kalmanFilterAnalyzeVideo(
      fps,
      visibilityThreshold / 100,
      setPoseData,
      poseData?.frames
    );
  }

  const videoOnLoadedMetadata = async () => {
    if (!videoRef.current) return;
    const vision = await FilesetResolver.forVisionTasks("/wasm");

    poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/pose_landmarker_heavy.task",
        delegate: "GPU",
      },
      runningMode: runningMode,
      numPoses: 1,
    });

    analysisCancelRef.current = false;
    initialAnalyze(
      videoRef,
      poseLandmarkerRef,
      setAllowControl,
      fps,
      visibilityThreshold,
      setPoseData,
      setIsAnalyzing,
      setProgress,
      analysisCancelRef
    );
    const heightScale = 0.8;
    const ratio = videoRef.current?.width / videoRef.current?.height;
    const height = window.innerHeight * 0.8;
    const width = height * ratio;
    setResolution({ width: width, height: height, heightScale: heightScale, widthToHeightRatio: ratio });
  }

  const videoOnPlay = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    drawLoop();
  }

  const inputVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleVideoChange(
      e,
      animationFrameRef,
      setPoseData,
      setVideoSrc,
      setIsAnalyzing,
      setProgress,
      analysisCancelRef,
      poseLandmarkerRef
    );
  }

  return (
    <div
      className="poseAnalyzerContainer"
    >
      <label
        className="fileUploadLabel"
        htmlFor="videoInput"
      >
        Wybierz wideo
      </label>
      <input
        id="videoInput"
        type="file"
        accept="video/*"
        onChange={inputVideoChange}
      />

      {isAnalyzing && videoSrc && (
        <div
          className="progressionPopUp"
        >
          <div>
            Analiza wideo...
          </div>
          <div>
            {progress}%
          </div>
        </div>
      )}

      {videoSrc && (
        <div
          className="mainContent"
          style={{
            width: resolution?.width,
            height: resolution?.height,
            borderWidth: !isAnalyzing ? "5px" : undefined,
            borderStyle: !isAnalyzing ? "solid" : undefined
          }}
        >
          <div
            className="videoWrapper"
          >
            <video
              ref={videoRef}
              src={videoSrc}
              onLoadedMetadata={videoOnLoadedMetadata}
              onPlay={videoOnPlay}
              controls={allowControl}
              className="videoComponent"
              style={{ display: isAnalyzing ? "none" : "block" }}
            />

            <canvas
              ref={canvasRefSkeleton}
              className="canvasComponent"
            />

            <canvas
              ref={canvasRefPoints}
              className="canvasComponent"
            />
          </div>

          {!isAnalyzing &&
            <div
              className="optionsPanel"
            >
              <div
                className="displayMode"
              >
                <label
                  htmlFor="displayType"
                >
                  Typ wyświetlania:
                </label>

                <select
                  id="displayType"
                  value={displayType}
                  onChange={(e) => setDisplayType(Number(e.target.value) as DisplayType)}
                >
                  {displayTypeOptions.map(option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {displayTypeOptionLabels[option]}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="displayMode"
              >
                <label
                  htmlFor="displayMode"
                >
                  Tryb wyświetlania:
                </label>

                <select
                  id="displayMode"
                  value={displayMode}
                  onChange={(e) => setDisplayMode(Number(e.target.value) as DisplayMode)}
                >
                  {displayModeOptions.map(option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {displayModeOptionLabels[option]}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="sectionDivider"
              />

              <div
                className="visibilityOption"
              >
                <label
                  htmlFor="visibilityThreshold"
                >
                  Próg Widoczności: <b>{visibilityThreshold}%</b>
                </label>
                <input
                  id="visibilityThreshold"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={visibilityThreshold}
                  onChange={e => {
                    setVisibilityThreshold(Number(e.target.value));
                  }}
                />
                <button
                  onClick={() => handleVisibilityThresholdChange()}
                >
                  Zastosuj
                </button>
              </div>

              <div
                className="sectionDivider"
              />

              <div
                className="displayMode"
              >
                <label
                  htmlFor="textColor"
                >
                  Kolor tekstu:
                </label>

                <select
                  id="textColor"
                  value={textColorPoints}
                  onChange={(e) => setTextColorPoints(e.target.value)}
                >
                  {Object.entries(textColorPointsOptions).map(option => (
                    <option
                      key={option[0]}
                      value={option[0]}
                    >
                      {option[1]}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="visibilityOption"
              >
                <label
                  htmlFor="canvasSizePoints"
                >
                  Wielkość tekstu <b>{canvasSizePoints}px</b>
                </label>
                <input
                  id="canvasSizePoints"
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={canvasSizePoints}
                  onChange={e => {
                    setCanvasSizePoints(Number(e.target.value))
                  }}
                />
              </div>

              <div
                className="sectionDivider"
              />

              <div
                className="jointsOption"
                style={{ marginBottom: drawLinesBetweenJoints === true ? "2.5%" : "7.5%" }}
              >
                <input
                  type="checkbox"
                  checked={drawLinesBetweenJoints}
                  onChange={() => setDrawLinesBetweenJoints(!drawLinesBetweenJoints)}
                />
                <span>
                  Rysuj linie pomiędzy punktami
                </span>
              </div>

              {drawLinesBetweenJoints && (
                <div>
                  <div
                    className="displayMode"
                  >
                    <label
                      htmlFor="textColor"
                    >
                      Kolor linii:
                    </label>

                    <select
                      id="textColor"
                      value={textColorSkeleton}
                      onChange={(e) => setTextColorSkeleton(e.target.value)}
                    >
                      {Object.entries(textColorPointsOptions).map(option => (
                        <option
                          key={option[0]}
                          value={option[0]}
                        >
                          {option[1]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="visibilityOption"
                  >
                    <label
                      htmlFor="canvasSizeSkeleton"
                    >
                      Grubość kreski: <b>{canvasSizeSkeleton}px</b>
                    </label>
                    <input
                      id="canvasSizeSkeleton"
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={canvasSizeSkeleton}
                      onChange={e => {
                        setCanvasSizeSkeleton(Number(e.target.value))
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                className="sectionDivider"
              />

              <div
                className="jointContainer"
              >
                {
                  JOINTS
                    .filter(joint => displayType === DisplayType.JOINT_NAME
                      ? true : jointsToDisplayAngles.includes(joint.id))
                    .map(joint => (
                      <div
                        key={joint.id}
                        className="jointsOption"
                      >
                        <input
                          type="checkbox"
                          checked={enabledJoints[joint.id]}
                          onChange={() => toggleJoint(joint.id)}
                        />
                        <span>
                          {joint.id} - {joint.name}
                        </span>
                      </div>
                    ))
                }
              </div>
            </div>
          }
        </div>
      )}
    </div>
  );
}

export default PoseAnalyzer;