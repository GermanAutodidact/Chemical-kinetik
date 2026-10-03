/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MetalModelParams,
  MetalResult,
  MetalPoint,
  SimpleModelParams,
  SimpleModelResult,
  SimpleModelPoint,
  AdvancedModelParams,
  AdvancedModelResult,
  AdvancedPoint,
  SensitivityRow,
} from '../types';

/**
 * Solves S + K * ln(S) = 1 - eta * U for S in (0, 1] using Newton's method in log space.
 * Let w = ln(S) <= 0, then e^w + K * w = T, where T = 1 - eta * U.
 * g(w) = e^w + K * w - T = 0
 * g'(w) = e^w + K
 */
export function solveSubstrate(K: number, target: number): number {
  if (K <= 0) {
    return Math.max(0, Math.min(1, target));
  }

  // If target >= 1, S = 1
  if (target >= 1) return 1.0;

  // Initial guess in log space
  let w = Math.min(0, (target - 1) / (1 + K));
  for (let iter = 0; iter < 20; iter++) {
    const ew = Math.exp(w);
    const f = ew + K * w - target;
    const df = ew + K;
    const step = f / df;
    w -= step;
    if (w > 0) w = 0;
    if (Math.abs(step) < 1e-12) break;
  }

  const s = Math.exp(w);
  return Math.max(0, Math.min(1, s));
}

/**
 * Capacity balance model (M3)
 */
export function calculateMetalModel(params: MetalModelParams): MetalResult {
  const { capacity: C0, flux: J0, eta, K, geometry } = params;

  if (geometry !== 'foil' && geometry !== 'solid') {
    throw new Error('Ungültige Geometriebezeichnung: nur "foil" oder "solid" zulässig');
  }
  if (
    !Number.isFinite(C0) ||
    !Number.isFinite(J0) ||
    !Number.isFinite(eta) ||
    !Number.isFinite(K) ||
    C0 <= 0 ||
    J0 <= 0 ||
    eta < 0 ||
    eta > 1 ||
    K < 0
  ) {
    throw new Error('Ungültige Parameter für Modell M3: C0 > 0, J0 > 0, 0 <= eta <= 1, K >= 0');
  }

  // Metal end time tau_metal
  // foil: alpha = 0 => tau = C0 / J0
  // solid: alpha = 2/3 => tau = 3 * C0 / J0
  const tauMetal = geometry === 'foil' ? C0 / J0 : (3 * C0) / J0;

  // Window maximum tau
  const tauMax = Math.max(1.1, tauMetal * 1.1);
  const numSteps = 220;
  const dt = tauMax / numSteps;

  const points: MetalPoint[] = [];

  for (let i = 0; i <= numSteps; i++) {
    const tau = i * dt;
    let C: number;

    if (tau >= tauMetal) {
      C = 0;
    } else if (geometry === 'foil') {
      C = Math.max(0, C0 - J0 * tau);
    } else {
      const frac = Math.max(0, 1 - (J0 * tau) / (3 * C0));
      C = C0 * Math.pow(frac, 3);
    }

    const U = Math.min(C0, C0 - C);
    const target = 1 - eta * U;
    const S = solveSubstrate(K, target);
    const P = 1 - S;

    points.push({
      tau,
      metal: (C / C0) * 100,
      product: P * 100,
      substrate: S * 100,
      capacityRest: C,
      consumedCapacity: U,
    });
  }

  // Values at exactly tau_metal
  const uEnd = C0;
  const sEnd = solveSubstrate(K, 1 - eta * uEnd);
  const pEnd = 1 - sEnd;
  const productiveCapacity = pEnd;
  const sideCapacity = C0 - pEnd;

  return {
    tauMetal,
    productAtTauMetal: pEnd * 100,
    substrateAtTauMetal: sEnd * 100,
    sideConsumptionAtTauMetal: sideCapacity,
    balance: {
      c0: C0,
      productive: productiveCapacity,
      side: sideCapacity,
      remaining: 0,
    },
    points,
  };
}

/**
 * Analytical model (M1): S -> P -> D, S -> B
 */
export function calculateSimpleModel(params: SimpleModelParams): SimpleModelResult {
  const { q, r } = params;
  const K = 1 + q;
  const tauEnd = 6.0;
  const numSteps = 240;
  const dt = tauEnd / numSteps;

  const points: SimpleModelPoint[] = [];

  for (let i = 0; i <= numSteps; i++) {
    const tau = i * dt;
    const S = Math.exp(-K * tau);
    const delta = K - r;
    let P: number;

    if (Math.abs(delta) < 1e-10) {
      P = tau * S;
    } else if (delta > 0) {
      P = (Math.exp(-r * tau) * -Math.expm1(-delta * tau)) / delta;
    } else {
      P = (S * Math.expm1(delta * tau)) / delta;
    }

    const B = (q / K) * -Math.expm1(-K * tau);
    const D = Math.max(0, 1 - S - P - B);
    const BD = B + D;

    points.push({
      tau,
      S: S * 100,
      P: P * 100,
      BD: BD * 100,
      B: B * 100,
      D: D * 100,
    });
  }

  // Peak calculation
  let peakTau = 0;
  let peakValue = 0;

  if (r > 0) {
    const delta = K - r;
    if (Math.abs(delta) < 1e-10) {
      peakTau = 1 / K;
      peakValue = peakTau * Math.exp(-K * peakTau);
    } else {
      peakTau = Math.log(K / r) / delta;
      peakValue =
        delta > 0
          ? (Math.exp(-r * peakTau) * -Math.expm1(-delta * peakTau)) / delta
          : (Math.exp(-K * peakTau) * Math.expm1(delta * peakTau)) / delta;
    }
  } else {
    // r = 0 => plateau 1 / K
    peakTau = tauEnd;
    peakValue = (1 - Math.exp(-K * tauEnd)) / K;
  }

  // Rate crossing: rate_formation = S, rate_side = q*S + r*P
  // Equal when (1 - q)*S = r*P
  let crossTau: number | null = null;
  if (q >= 1) {
    crossTau = 0.0;
  } else if (r === 0) {
    // (1 - q)*S = 0 => S = 0 => tau -> inf
    crossTau = null;
  } else {
    // (1 - q) * exp(-K*tau) = r * [exp(-r*tau) - exp(-K*tau)] / (K - r)
    // [(1 - q) + r / (K - r)] * exp(-K*tau) = [r / (K - r)] * exp(-r*tau)
    const factorLeft = 1 - q + r / (K - r);
    const factorRight = r / (K - r);
    if (factorLeft > 0 && factorRight > 0) {
      const ratio = factorLeft / factorRight;
      crossTau = Math.log(ratio) / (K - r);
      if (crossTau < 0) crossTau = 0;
    }
  }

  // Specific table rows at [0.00, 0.50, 1.00, 2.00, 4.00, 6.00]
  const targetTaus = [0.0, 0.5, 1.0, 2.0, 4.0, 6.0];
  const tableRows = targetTaus.map((t) => {
    const S = Math.exp(-K * t);
    let P: number;
    if (Math.abs(K - r) < 1e-6) {
      P = t * Math.exp(-K * t);
    } else {
      P = (Math.exp(-r * t) - Math.exp(-K * t)) / (K - r);
    }
    const BD = Math.max(0, 1 - S - P);
    return {
      tau: t,
      S: S * 100,
      P: P * 100,
      BD: BD * 100,
    };
  });

  return {
    peakTau,
    peakValue: peakValue * 100,
    crossTau,
    points,
    tableRows,
  };
}

/**
 * Extended model (M2): S -> I -> P, S -> B, P -> D with surface deactivation and transport
 * a(tau) = a0 * exp(-lambda * tau)
 * h(tau) = (a * m) / (a + m)
 * S' = -h*S - q*S
 * I' = h*S - u*h*I
 * P' = u*h*I - r*P
 * B' = q*S
 * D' = r*P
 */
function rk4Step(
  f: (t: number, y: number[]) => number[],
  t: number,
  y: number[],
  h: number
): number[] {
  const a = f(t, y);
  const b = f(t + h / 2, y.map((v, i) => v + (h * a[i]) / 2));
  const c = f(t + h / 2, y.map((v, i) => v + (h * b[i]) / 2));
  const d = f(t + h, y.map((v, i) => v + h * c[i]));
  return y.map((v, i) => v + (h * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6);
}

function integrateAdaptive(
  f: (t: number, y: number[]) => number[],
  t: number,
  y: number[],
  end: number,
  opts: { rtol?: number; atol?: number; maxStep?: number } = {}
): number[] {
  const { rtol = 1e-8, atol = 1e-10, maxStep = 0.05 } = opts;
  let h = Math.min(maxStep, end - t);
  let attempts = 0;
  while (t < end - 1e-13) {
    if (++attempts > 100000) throw new Error('Integrationslimit erreicht');
    h = Math.min(h, end - t);
    const whole = rk4Step(f, t, y, h);
    const half = rk4Step(f, t, y, h / 2);
    const fine = rk4Step(f, t + h / 2, half, h / 2);
    const estimate = fine.map((v, i) => v + (v - whole[i]) / 15);
    const error = Math.max(
      ...fine.map(
        (v, i) => Math.abs((v - whole[i]) / 15) / (atol + rtol * Math.max(Math.abs(y[i]), Math.abs(v)))
      )
    );
    if (!Number.isFinite(error)) throw new Error('Nichtendliche Integration');
    if (error <= 1 && estimate.every((v) => v >= -atol)) {
      y = estimate;
      t += h;
      h *= error === 0 ? 2 : Math.min(2, Math.max(0.2, 0.9 * Math.pow(error, -0.2)));
    } else {
      h *= 0.5;
    }
    if (h < 1e-12) throw new Error('Schrittweite zu klein');
  }
  return y;
}

function singularValuesOneSided(columns: number[][]): number[] {
  const b = columns.map((c) => c.slice());
  const n = b.length;
  const dot = (a: number[], c: number[]) => a.reduce((s, v, i) => s + v * c[i], 0);
  for (let sweep = 0; sweep < 100; sweep++) {
    let changed = false;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const a = dot(b[p], b[p]);
        const d = dot(b[q], b[q]);
        const g = dot(b[p], b[q]);
        if (!a || !d || Math.abs(g) <= 1e-14 * Math.sqrt(a * d)) continue;
        const z = (d - a) / (2 * g);
        const t = (z >= 0 ? 1 : -1) / (Math.abs(z) + Math.sqrt(1 + z * z));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = c * t;
        for (let i = 0; i < b[p].length; i++) {
          const x = b[p][i];
          const y = b[q][i];
          b[p][i] = c * x - s * y;
          b[q][i] = s * x + c * y;
        }
        changed = true;
      }
    }
    if (!changed) break;
  }
  return b.map((c) => Math.sqrt(dot(c, c))).sort((a, b) => b - a);
}

function bisectEvent(f: (t: number) => number, a: number, b: number, tol = 1e-8): number {
  let fa = f(a);
  let fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) throw new Error('Kein eingeschlossener Vorzeichenwechsel');
  for (let i = 0; i < 70 && b - a > tol; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fa * fm <= 0) {
      b = m;
      fb = fm;
    } else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

function m2Rhs(
  t: number,
  y: number[],
  p: AdvancedModelParams
): [number, number, number, number, number] {
  const a = p.a0 * Math.exp(-p.lambda * t);
  const h = (a * p.m) / (a + p.m);
  const dS = -h * y[0] - p.q * y[0];
  const dI = h * y[0] - p.u * h * y[1];
  const dP = p.u * h * y[1] - p.r * y[2];
  const dB = p.q * y[0];
  const dD = p.r * y[2];
  return [dS, dI, dP, dB, dD];
}

function integrateM2(
  p: AdvancedModelParams,
  tauEnd = 6.0,
  step = 0.05
): { tau: number; S: number; I: number; P: number; B: number; D: number }[] {
  for (const k of ['a0', 'lambda', 'm', 'u', 'q', 'r'] as const) {
    if (!Number.isFinite(p[k]) || p[k] < 0) throw new Error('Ungültiger Parameter ' + k);
  }
  if (p.a0 === 0 || p.m === 0) throw new Error('Oberflächen- und Transportparameter müssen positiv sein');

  const numGrid = Math.round(tauEnd / 0.05);
  const rows: { tau: number; S: number; I: number; P: number; B: number; D: number }[] = [];
  let y = [1.0, 0.0, 0.0, 0.0, 0.0];
  let t = 0.0;
  rows.push({ tau: 0, S: y[0], I: y[1], P: y[2], B: y[3], D: y[4] });

  for (let i = 1; i <= numGrid; i++) {
    const targetT = i * 0.05;
    y = integrateAdaptive((time, state) => m2Rhs(time, state, p), t, y, targetT, {
      maxStep: step,
      rtol: 1e-8,
      atol: 1e-10,
    });
    t = targetT;
    rows.push({ tau: t, S: y[0], I: y[1], P: y[2], B: y[3], D: y[4] });
  }

  return rows;
}

export function calculateAdvancedModel(
  params: AdvancedModelParams,
  observe: 'product' | 'all' = 'product'
): AdvancedModelResult {
  const dt = 0.005;
  const tauEnd = 6.0;
  const dense = integrateM2(params, tauEnd, dt);

  // Subsample to 121 points (0.05 step)
  const sampleStride = 10; // 0.005 * 10 = 0.05
  const grid: { tau: number; S: number; I: number; P: number; B: number; D: number }[] = [];
  for (let i = 0; i < dense.length; i += sampleStride) {
    grid.push(dense[i]);
  }

  // Envelope calculation: +/-20% for each of the 6 parameters
  const paramKeys: (keyof AdvancedModelParams)[] = ['a0', 'lambda', 'm', 'u', 'q', 'r'];
  const pCurves: number[][] = [];

  for (const key of paramKeys) {
    const val = params[key];
    const pPlus = { ...params, [key]: val * 1.2 };
    const pMinus = { ...params, [key]: val * 0.8 };

    const densePlus = integrateM2(pPlus, tauEnd, dt);
    const denseMinus = integrateM2(pMinus, tauEnd, dt);

    const plusCurve: number[] = [];
    const minusCurve: number[] = [];
    for (let i = 0; i < dense.length; i += sampleStride) {
      plusCurve.push(densePlus[i].P * 100);
      minusCurve.push(denseMinus[i].P * 100);
    }
    pCurves.push(plusCurve, minusCurve);
  }

  const points: AdvancedPoint[] = grid.map((pt, idx) => {
    let envMin = pt.P * 100;
    let envMax = pt.P * 100;

    for (const curve of pCurves) {
      const v = curve[idx];
      if (v < envMin) envMin = v;
      if (v > envMax) envMax = v;
    }

    return {
      tau: pt.tau,
      S: pt.S * 100,
      I: pt.I * 100,
      P: pt.P * 100,
      BD: (pt.B + pt.D) * 100,
      envMin,
      envMax,
    };
  });

  // Find peak P on grid
  let maxP = -1;
  let maxTau = 0;
  for (const pt of points) {
    if (pt.P > maxP) {
      maxP = pt.P;
      maxTau = pt.tau;
    }
  }

  // Is interior peak or edge?
  const isInteriorPeak = maxTau > 0 && maxTau < tauEnd - 0.05;

  // Rate crossings
  // rate_formation = u * h * I
  // rate_side = q * S + r * P
  const crossings: { tau: number; type: 'formation_takes_over' | 'side_takes_over' }[] = [];

  for (let idx = 1; idx < grid.length; idx++) {
    const aPt = grid[idx - 1];
    const bPt = grid[idx];
    const aVal = params.a0 * Math.exp(-params.lambda * aPt.tau);
    const ha = (aVal * params.m) / (aVal + params.m);
    const fa = (params.q * aPt.S + params.r * aPt.P) - (params.u * ha * aPt.I);

    const bVal = params.a0 * Math.exp(-params.lambda * bPt.tau);
    const hb = (bVal * params.m) / (bVal + params.m);
    const fb = (params.q * bPt.S + params.r * bPt.P) - (params.u * hb * bPt.I);

    if (fa * fb < 0) {
      const evalDiffAt = (timeVal: number) => {
        const yState = integrateAdaptive(
          (t, y) => m2Rhs(t, y, params),
          aPt.tau,
          [aPt.S / 100, aPt.I / 100, aPt.P / 100, aPt.B / 100, aPt.D / 100],
          timeVal
        );
        const aT = params.a0 * Math.exp(-params.lambda * timeVal);
        const hT = (aT * params.m) / (aT + params.m);
        return params.q * yState[0] + params.r * yState[2] - params.u * hT * yState[1];
      };
      const cross = bisectEvent(evalDiffAt, aPt.tau, bPt.tau);
      crossings.push({
        tau: cross,
        type: fb > 0 ? 'side_takes_over' : 'formation_takes_over',
      });
    }
  }

  // Sensitivity Analysis
  // Sample points: tau in [0.5, 1.0, 2.0, 3.0, 4.0, 6.0]
  const obsTaus = [0.5, 1.0, 2.0, 3.0, 4.0, 6.0];
  const deltaLog = 0.001;

  // Helper to extract observation vector
  const getObsVector = (p: AdvancedModelParams): number[] => {
    const d = integrateM2(p, tauEnd, dt);
    const vec: number[] = [];
    for (const t of obsTaus) {
      const idx = Math.min(d.length - 1, Math.round(t / dt));
      if (observe === 'product') {
        vec.push(d[idx].P);
      } else {
        vec.push(d[idx].S, d[idx].I, d[idx].P);
      }
    }
    return vec;
  };

  const paramNames: Record<keyof AdvancedModelParams, string> = {
    a0: 'Oberflächenaktivität a₀',
    u: 'Zwischenprodukt-Umsatz u',
    m: 'Transportkapazität m',
    r: 'Produktverlust r',
    q: 'Nebenroute q',
    lambda: 'Deaktivierung λ',
  };

  // Sensitivity columns J_k
  const JCols: number[][] = [];
  const sensitivities: SensitivityRow[] = [];

  for (const key of paramKeys) {
    const val = params[key];
    let pPlus: AdvancedModelParams;
    let pMinus: AdvancedModelParams;

    if (val === 0) {
      pPlus = { ...params, [key]: 0.001 };
      pMinus = { ...params, [key]: 0 };
    } else {
      pPlus = { ...params, [key]: val * Math.exp(deltaLog) };
      pMinus = { ...params, [key]: val * Math.exp(-deltaLog) };
    }

    const yPlus = getObsVector(pPlus);
    const yMinus = getObsVector(pMinus);

    const col: number[] = [];
    let sumSq = 0;
    for (let i = 0; i < yPlus.length; i++) {
      const derivVal = (yPlus[i] - yMinus[i]) / (2 * deltaLog);
      col.push(derivVal);
      sumSq += derivVal * derivVal;
    }
    JCols.push(col);

    const rms = 100 * Math.sqrt(sumSq / yPlus.length);
    sensitivities.push({
      name: paramNames[key],
      key,
      rms,
      classification: 'Lokal am eingestellten Szenario',
    });
  }

  // Sort sensitivities descending by RMS
  sensitivities.sort((a, b) => b.rms - a.rms);

  const numParams = 6;
  const numObs = JCols[0].length;
  const singularValues = singularValuesOneSided(JCols);

  // Numerical rank with threshold 10^-5 relative to largest singular value
  const sMax = singularValues[0] || 1;
  const rank = singularValues.filter((s) => sMax > 0 && s / sMax >= 1e-5).length;

  // Pairwise cosine similarity
  let maxSim = -1;
  let bestP1 = '';
  let bestP2 = '';

  const shortKeys: Record<keyof AdvancedModelParams, string> = {
    a0: 'a₀',
    lambda: 'λ',
    m: 'm',
    u: 'u',
    q: 'q',
    r: 'r',
  };

  for (let i = 0; i < numParams; i++) {
    for (let j = i + 1; j < numParams; j++) {
      let dot = 0;
      let n1 = 0;
      let n2 = 0;
      for (let k = 0; k < numObs; k++) {
        dot += JCols[i][k] * JCols[j][k];
        n1 += JCols[i][k] * JCols[i][k];
        n2 += JCols[j][k] * JCols[j][k];
      }
      const denom = Math.sqrt(n1) * Math.sqrt(n2);
      const sim = denom > 1e-12 ? Math.abs(dot) / denom : 0;
      if (sim > maxSim) {
        maxSim = sim;
        bestP1 = shortKeys[paramKeys[i]];
        bestP2 = shortKeys[paramKeys[j]];
      }
    }
  }

  return {
    points,
    peakTau: maxTau,
    peakValue: maxP,
    isInteriorPeak,
    crossings,
    sensitivities,
    rank,
    totalParams: numParams,
    singularValues,
    mostSimilarPair: {
      param1: bestP1,
      param2: bestP2,
      similarity: maxSim,
    },
  };
}
