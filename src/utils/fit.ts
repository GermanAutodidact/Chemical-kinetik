/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataRow {
  t: number;
  S: number | null;
  P: number;
}

export interface FitPrediction extends DataRow {
  predicted: {
    S: number;
    P: number;
    B: number;
    D: number;
  };
  holdout: boolean;
}

export interface FitResult {
  rates: number[];
  loss: number;
  bound: boolean;
  model: 'M1' | 'M0';
  trainingCount: number;
  holdoutCount: number;
  trainRMSE: number;
  holdoutRMSE: number;
  nearRates: [number, number][];
  solutions: number;
  nearSolutions: number;
  predictions: FitPrediction[];
}

export function parseCsvData(text: string): DataRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (!lines[0] || lines[0].trim() !== 't,S,P') {
    throw new Error('Kopfzeile muss t,S,P lauten; Dezimalpunkt verwenden.');
  }

  const rows = lines
    .slice(1)
    .filter((x) => x.trim())
    .map((line, i) => {
      const a = line.split(',').map((x) => x.trim());
      if (a.length !== 3 || a[0] === '' || a[2] === '') {
        throw new Error('Ungültige Zeile ' + (i + 2));
      }
      const t = Number(a[0]);
      const S = a[1] === '' ? null : Number(a[1]);
      const P = Number(a[2]);

      if (
        !Number.isFinite(t) ||
        t < 0 ||
        !Number.isFinite(P) ||
        P < 0 ||
        P > 1 ||
        (S !== null && (!Number.isFinite(S) || S < 0 || S > 1))
      ) {
        throw new Error('Zeit ≥ 0, Anteile zwischen 0 und 1 erforderlich.');
      }
      return { t, S, P };
    });

  if (rows.length < 8 || rows.length > 200) {
    throw new Error('8 bis 200 Datenzeilen erforderlich.');
  }

  if (rows.some((v, i) => i > 0 && v.t <= rows[i - 1].t)) {
    throw new Error('Zeiten müssen streng aufsteigend sein.');
  }

  return rows;
}

export function predictAt(rates: number[], t: number) {
  const k1 = rates[0];
  const k2 = rates[1];
  const k3 = rates[2] || 0;
  const q = k2 / k1;
  const r = k3 / k1;
  const tau = k1 * t;

  const K = 1 + q;
  const delta = K - r;
  const S = Math.exp(-K * tau);
  const P =
    Math.abs(delta) < 1e-10
      ? tau * S
      : delta > 0
      ? (Math.exp(-r * tau) * -Math.expm1(-delta * tau)) / delta
      : (S * Math.expm1(delta * tau)) / delta;
  const B = (q / K) * -Math.expm1(-K * tau);
  const D = Math.max(0, 1 - S - P - B);

  return { S, P, B, D };
}

export function fitDataToModel(rows: DataRow[], model: 'M1' | 'M0' = 'M1'): FitResult {
  const scale = rows[rows.length - 1].t;
  if (!(scale > 0)) throw new Error('Positive Zeitspanne erforderlich');

  const cut = Math.max(5, Math.floor(rows.length * 0.8));
  const train = rows.slice(0, cut);
  const test = rows.slice(cut);
  const dim = model === 'M0' ? 2 : 3;

  const unpack = (x: number[]) => [
    Math.exp(x[0]) / scale,
    Math.exp(x[1]) / scale,
    dim === 3 ? Math.exp(x[2]) / scale : 0,
  ];

  const loss = (rates: number[], data: DataRow[]) => {
    let sum = 0;
    let n = 0;
    for (const d of data) {
      const p = predictAt(rates, d.t);
      sum += (p.P - d.P) ** 2;
      n++;
      if (d.S !== null) {
        sum += (p.S - d.S) ** 2;
        n++;
      }
    }
    return sum / n;
  };

  const starts = [
    [0, -1, -2],
    [1, -2, -1],
    [2, 0, -3],
    [-1, -1, 0],
    [1, 1, 1],
    [3, -3, 0],
  ];
  const fits: Array<{ rates: number[]; loss: number; bound: boolean }> = [];

  for (const start of starts) {
    let x = start.slice(0, dim);
    let value = loss(unpack(x), train);
    let step = 1;

    for (let iter = 0; iter < 350 && step > 1e-5; iter++) {
      let changed = false;
      for (let j = 0; j < dim; j++) {
        for (const sign of [-1, 1]) {
          const y = x.slice();
          y[j] = Math.max(-12, Math.min(8, y[j] + sign * step));
          const v = loss(unpack(y), train);
          if (v < value) {
            x = y;
            value = v;
            changed = true;
          }
        }
      }
      if (!changed) step *= 0.5;
    }
    fits.push({ rates: unpack(x), loss: value, bound: x.some((v) => v <= -11.99 || v >= 7.99) });
  }

  fits.sort((a, b) => a.loss - b.loss);
  const best = fits[0];
  const near = fits.filter((v) => v.loss <= best.loss * 1.02 + 1e-8);

  const nearRates = best.rates.map((_, i) => [
    Math.min(...near.map((v) => v.rates[i])),
    Math.max(...near.map((v) => v.rates[i])),
  ]) as [number, number][];

  return {
    ...best,
    model,
    trainingCount: train.length,
    holdoutCount: test.length,
    trainRMSE: Math.sqrt(best.loss),
    holdoutRMSE: Math.sqrt(loss(best.rates, test)),
    nearRates,
    solutions: fits.length,
    nearSolutions: near.length,
    predictions: rows.map((d, i) => ({
      ...d,
      predicted: predictAt(best.rates, d.t),
      holdout: i >= cut,
    })),
  };
}

export interface ProfilePoint {
  val: number;
  loss: number;
  deltaChi2: number;
  rates: number[];
}

export interface ProfileLikelihoodResult {
  paramIndex: number;
  paramName: string;
  bestVal: number;
  thresholdChi2: number; // heuristic reference threshold; not a calibrated confidence interval
  identifiable: boolean;
  points: ProfilePoint[];
}

/**
 * Calculates 1D Profile Likelihood (inspired by pyPESTO and Raue et al. 2009).
 * Fixes target parameter theta_i across a grid and re-optimizes remaining parameters.
 */
export function calculateProfileLikelihood(
  rows: DataRow[],
  paramIndex: number,
  bestRates: number[],
  model: 'M1' | 'M0' = 'M1',
  steps = 15
): ProfileLikelihoodResult {
  if (!Number.isInteger(paramIndex) || paramIndex < 0 || paramIndex >= (model === 'M0' ? 2 : 3) || !Number.isInteger(steps) || steps < 3 || !Number.isFinite(bestRates[paramIndex]) || bestRates[paramIndex] <= 0) throw new Error('Invalid profile setting');
  const scale = rows[rows.length - 1].t;
  const cut = Math.max(5, Math.floor(rows.length * 0.8));
  const train = rows.slice(0, cut);
  const dim = model === 'M0' ? 2 : 3;
  const bestRate = bestRates[paramIndex];
  const paramNames = model === 'M0' ? ['k₁ (Bildung)', 'k₂ (Verlust S)'] : ['k₁ (Bildung)', 'k₂ (Verlust S)', 'k₃ (Verlust P)'];

  const loss = (rates: number[]) => {
    let sum = 0;
    let n = 0;
    for (const d of train) {
      const p = predictAt(rates, d.t);
      sum += (p.P - d.P) ** 2;
      n++;
      if (d.S !== null) {
        sum += (p.S - d.S) ** 2;
        n++;
      }
    }
    return sum / n;
  };

  const minLoss = loss(bestRates);
  const points: ProfilePoint[] = [];

  // Log-spaced variation around best rate: [0.2x, 5.0x]
  const logMin = Math.log(bestRate * 0.2);
  const logMax = Math.log(bestRate * 5.0);

  for (let s = 0; s < steps; s++) {
    const fixedLogRate = logMin + (s / (steps - 1)) * (logMax - logMin);
    const fixedRate = Math.exp(fixedLogRate);

    // Initial guess for remaining parameters from bestRates
    const xInit = bestRates.map((r) => Math.log(r * scale));
    xInit[paramIndex] = Math.log(fixedRate * scale);

    // Optimize other parameters with coordinate search
    let xOpt = xInit.slice(0, dim);
    let step = 0.5;

    for (let iter = 0; iter < 100 && step > 1e-4; iter++) {
      let changed = false;
      for (let j = 0; j < dim; j++) {
        if (j === paramIndex) continue; // Keep fixed parameter constant
        for (const sign of [-1, 1]) {
          const y = xOpt.slice();
          y[j] = Math.max(-12, Math.min(8, y[j] + sign * step));
          const currentRates = y.map((v) => Math.exp(v) / scale);
          if (loss(currentRates) < loss(xOpt.map((v) => Math.exp(v) / scale))) {
            xOpt = y;
            changed = true;
          }
        }
      }
      if (!changed) step *= 0.5;
    }

    const currentRates = xOpt.map((v) => Math.exp(v) / scale);
    const currentLoss = loss(currentRates);
    // Delta chi-squared approximation: N * (loss - minLoss) / minLoss
    const deltaChi2 = Math.max(0, train.reduce((n, row) => n + (row.S === null ? 1 : 2), 0) * ((currentLoss - minLoss) / Math.max(1e-12, minLoss)));

    points.push({
      val: fixedRate,
      loss: currentLoss,
      deltaChi2,
      rates: currentRates,
    });
  }

  // Illustrative reference only: the fitted noise model and asymptotic assumptions are not verified.
  const thresholdChi2 = 3.84;
  const leftCross = points.some((p) => p.val < bestRate && p.deltaChi2 >= thresholdChi2);
  const rightCross = points.some((p) => p.val > bestRate && p.deltaChi2 >= thresholdChi2);
  const identifiable = leftCross && rightCross;

  return {
    paramIndex,
    paramName: paramNames[paramIndex] || `k${paramIndex + 1}`,
    bestVal: bestRate,
    thresholdChi2,
    identifiable,
    points,
  };
}

/**
 * Generates standard PEtab-compatible TSV tables (measurements.tsv and parameters.tsv).
 * Based on open-source PEtab specification (github.com/PEtab-dev/PEtab).
 */
export function exportToPEtab(
  rows: DataRow[],
  fitResult?: FitResult | null
): { measurementsTsv: string; parametersTsv: string; observablesTsv: string } {
  // 1. measurements.tsv
  const mLines: string[] = ['observableId\tsimulationConditionId\ttime\tmeasurement'];
  for (const r of rows) {
    mLines.push(`obs_P\tcond1\t${r.t}\t${r.P}`);
    if (r.S !== null) {
      mLines.push(`obs_S\tcond1\t${r.t}\t${r.S}`);
    }
  }

  // 2. parameters.tsv
  const pLines: string[] = [
    'parameterId\tparameterScale\tlowerBound\tupperBound\tnominalValue\testimate',
  ];
  const pList = fitResult?.model === 'M0' ? ['k1', 'k2'] : ['k1', 'k2', 'k3'];
  pList.forEach((pid, idx) => {
    const val = fitResult ? fitResult.rates[idx] : 1.0;
    pLines.push(`${pid}\tlin\t1e-6\t100\t${val.toFixed(5)}\t1`);
  });

  // 3. observables.tsv
  const obsLines: string[] = [
    'observableId\tobservableFormula\tobservableTransformation\tnoiseFormula\tnoiseDistribution',
    'obs_P\tP\tlin\t0.05\tnormal',
    'obs_S\tS\tlin\t0.05\tnormal',
  ];

  return {
    measurementsTsv: mLines.join('\n'),
    parametersTsv: pLines.join('\n'),
    observablesTsv: obsLines.join('\n'),
  };
}
