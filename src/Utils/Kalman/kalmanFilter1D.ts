import { KalmanOptions } from "../Constants/types";

export class KalmanFilter1D {
  public x = [[0], [0]];
  private P = [
    [1, 0],
    [0, 1],
  ];

  private F: number[][];
  private H = [[1, 0]];

  private Q: number[][];
  private R: number[][];

  constructor(private opts: KalmanOptions) {
    const { dt, processNoise, measurementNoise } = opts;

    this.F = [
      [1, dt],
      [0, 1],
    ];

    this.Q = this.buildQ(dt, processNoise);
    this.R = [[measurementNoise]];
  }

  predict() {
    this.x = mul(this.F, this.x);
    this.P = add(mul(mul(this.F, this.P), T(this.F)), this.Q);
    return this.x[0][0];
  }

  update(z: number, measurementNoise?: number) {
    if (measurementNoise !== undefined) {
      this.R = [[measurementNoise]];
    }

    const y = sub([[z]], mul(this.H, this.x));
    const S = add(mul(mul(this.H, this.P), T(this.H)), this.R);
    const K = mul(mul(this.P, T(this.H)), inv1x1(S));

    this.x = add(this.x, mul(K, y));

    const I = [
      [1, 0],
      [0, 1],
    ];

    this.P = mul(sub(I, mul(K, this.H)), this.P);

    return this.x[0][0];
  }

  adaptProcessNoise(factor: number) {
    this.Q = this.buildQ(this.opts.dt, this.opts.processNoise * factor);
  }

  get state() {
    return { x: this.x[0][0], v: this.x[1][0] };
  }

  private buildQ(dt: number, sigmaA2: number) {
    return [
      [0.25 * dt ** 4 * sigmaA2, 0.5 * dt ** 3 * sigmaA2],
      [0.5 * dt ** 3 * sigmaA2, dt ** 2 * sigmaA2],
    ];
  }
}

function mul(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) =>
    B[0].map((_, j) => row.reduce((sum, _, k) => sum + A[i][k] * B[k][j], 0))
  );
}

function add(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

function sub(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

function T(A: number[][]): number[][] {
  return A[0].map((_, i) => A.map(row => row[i]));
}

function inv1x1(A: number[][]): number[][] {
  return [[1 / A[0][0]]];
}
