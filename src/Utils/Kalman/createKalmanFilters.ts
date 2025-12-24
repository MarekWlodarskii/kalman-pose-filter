import { KalmanFilter1D } from './kalmanFilter1D';

export const createKalmanFilters = (
  wantedLandmarks: number[],
  fps: number
) => {
  const filters: Record<number, { x: any, y: any, z: any }> = {};
  const dt = 1 / fps;
  wantedLandmarks.forEach((landmarkId) => {
    filters[landmarkId] = {
      x: new KalmanFilter1D({
        dt,
        processNoise: 0.03,
        measurementNoise: 0.00002,
      }),
      y: new KalmanFilter1D({
        dt,
        processNoise: 0.03,
        measurementNoise: 0.00002,
      }),
      z: new KalmanFilter1D({
        dt,
        processNoise: 0.03,
        measurementNoise: 0.0002,
      })
    }
  });
  return filters;
}