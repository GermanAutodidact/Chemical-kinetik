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
function integrateM2(
  p: AdvancedModelParams,
  tauEnd = 6.0,
  dt = 0.005
): { tau: number; S: number; I: number; P: number; B: number; D: number }[] {
  const steps = Math.round(tauEnd / dt);
  let S = 1.0;
  let I = 0.0;
  let P = 0.0;
  let B = 0.0;
  let D = 0.0;

  const results: { tau: number; S: number; I: number; P: number; B: number; D: number }[] = [
    { tau: 0, S, I, P, B, D },
  ];

  const deriv = (
    tau: number,
    s: number,
    i: number,
    prod: number
  ): [number, number, number, number, number] => {
    const a = p.a0 * Math.exp(-p.lambda * tau);
    const h = (a * p.m) / (a + p.m);
    const dS = -h * s - p.q * s;
    const dI = h * s - p.u * h * i;
    const dP = p.u * h * i - p.r * prod;
    const dB = p.q * s;
    const dD = p.r * prod;
    return [dS, dI, dP, dB, dD];
  };

  for (let step = 0; step < steps; step++) {
    const t = step * dt;

    const [k1S, k1I, k1P, k1B, k1D] = deriv(t, S, I, P);
    const [k2S, k2I, k2P, k2B, k2D] = deriv(
      t + 0.5 * dt,
      S + 0.5 * dt * k1S,
      I + 0.5 * dt * k1I,
      P + 0.5 * dt * k1P
    );
    const [k3S, k3I, k3P, k3B, k3D] = deriv(
      t + 0.5 * dt,
      S + 0.5 * dt * k2S,
      I + 0.5 * dt * k2I,
      P + 0.5 * dt * k2P
    );
    const [k4S, k4I, k4P, k4B, k4D] = deriv(
      t + dt,
      S + dt * k3S,
      I + dt * k3I,
      P + dt * k3P
    );

    S += (dt / 6) * (k1S + 2 * k2S + 2 * k3S + k4S);
    I += (dt / 6) * (k1I + 2 * k2I + 2 * k3I + k4I);
    P += (dt / 6) * (k1P + 2 * k2P + 2 * k3P + k4P);
    B += (dt / 6) * (k1B + 2 * k2B + 2 * k3B + k4B);
    D += (dt / 6) * (k1D + 2 * k2D + 2 * k3D + k4D);

    // Guard bounds
    if (S < 0) S = 0;
    if (I < 0) I = 0;
    if (P < 0) P = 0;

    results.push({ tau: (step + 1) * dt, S, I, P, B, D });
  }

  return results;
}

/**
 * Jacobi eigenvalue algorithm for symmetric 6x6 matrix
 */
function jacobiEigenvalues(A: number[][], maxIter = 100): number[] {
  const n = A.length;
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  const D = A.map((row) => [...row]);

  for (let iter = 0; iter < maxIter; iter++) {
    let maxOff = 0;
    let p = 0;
    let q = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(D[i][j]) > maxOff) {
          maxOff = Math.abs(D[i][j]);
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < 1e-12) break;

    const diff = D[q][q] - D[p][p];
    let t: number;
    if (Math.abs(D[p][q]) < 1e-15) {
      t = 0;
    } else {
      const phi = diff / (2 * D[p][q]);
      t = 1 / (Math.abs(phi) + Math.sqrt(phi * phi + 1));
      if (phi < 0) t = -t;
    }

    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    const tau = s / (1 + c);

    const tempDpq = D[p][q];
    D[p][q] = 0;
    D[q][p] = 0;
    D[p][p] -= t * tempDpq;
    D[q][q] += t * tempDpq;

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const dip = D[i][p];
        const diq = D[i][q];
        D[i][p] = dip - s * (diq + tau * dip);
        D[p][i] = D[i][p];
        D[i][q] = diq + s * (dip - tau * diq);
        D[q][i] = D[i][q];
      }
    }

    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }

  const eigenvalues = Array.from({ length: n }, (_, i) => D[i][i]);
  eigenvalues.sort((a, b) => b - a);
  return eigenvalues;
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
  // diff = rate_formation - rate_side
  const crossings: { tau: number; type: 'formation_takes_over' | 'side_takes_over' }[] = [];
  let prevDiff = 0;

  for (let idx = 0; idx < grid.length; idx++) {
    const pt = grid[idx];
    const a = params.a0 * Math.exp(-params.lambda * pt.tau);
    const h = (a * params.m) / (a + params.m);
    const rForm = params.u * h * pt.I;
    const rSide = params.q * pt.S + params.r * pt.P;
    const diff = rForm - rSide;

    if (idx > 0) {
      if (prevDiff < 0 && diff >= 0) {
        // Linear interpolation
        const prevTau = grid[idx - 1].tau;
        const cross = prevTau + ((0 - prevDiff) / (diff - prevDiff)) * (pt.tau - prevTau);
        crossings.push({ tau: cross, type: 'formation_takes_over' });
      } else if (prevDiff > 0 && diff <= 0) {
        const prevTau = grid[idx - 1].tau;
        const cross = prevTau + ((0 - prevDiff) / (diff - prevDiff)) * (pt.tau - prevTau);
        crossings.push({ tau: cross, type: 'side_takes_over' });
      }
    }
    prevDiff = diff;
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

  // Compute J^T * J (6x6)
  const numParams = 6;
  const numObs = JCols[0].length;
  const JTJ: number[][] = Array.from({ length: numParams }, () =>
    Array(numParams).fill(0)
  );

  for (let i = 0; i < numParams; i++) {
    for (let j = 0; j < numParams; j++) {
      let sum = 0;
      for (let k = 0; k < numObs; k++) {
        sum += JCols[i][k] * JCols[j][k];
      }
      JTJ[i][j] = sum;
    }
  }

  const eigenvalues = jacobiEigenvalues(JTJ);
  const singularValues = eigenvalues.map((e) => Math.sqrt(Math.max(0, e)));

  // Numerical rank with threshold 10^-5 relative to largest singular value
  const sMax = singularValues[0] || 1;
  const rank = singularValues.filter((s) => s / sMax >= 1e-5).length;

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
