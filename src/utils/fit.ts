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
