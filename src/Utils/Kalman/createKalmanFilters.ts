import { KalmanFilter1D } from './kalmanFilter1D';

export const createKalmanFilters = (
  wantedLandmarks: number[],
  fps: number
) => {
  const filters: Record<number, { x: KalmanFilter1D, y: KalmanFilter1D, z: KalmanFilter1D }> = {};
  const dt = 1 / fps;
  wantedLandmarks.forEach((landmarkId) => {
    filters[landmarkId] = {
      x: new KalmanFilter1D({
        dt,
        processNoise: 100,
        measurementNoise: 0.00001,
      }),
      y: new KalmanFilter1D({
        dt,
        processNoise: 100,
        measurementNoise: 0.00001,
      }),
      z: new KalmanFilter1D({
        dt,
        processNoise: 100,
        measurementNoise: 0.0001,
      })
    }
  });
  return filters;
}