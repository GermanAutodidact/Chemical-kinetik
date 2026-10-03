/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubstrateType = 'nitrostyrene' | 'nitropropene';

export interface SubstrateInfo {
  id: SubstrateType;
  name: string;
  iupacName: string;
  chemicalFormula: string;
  molecularWeight: number;
  productName: string;
  productIupac: string;
  productFormula: string;
  productWeight: number;
  intermediateName: string;
  intermediateFormula: string;
  byproductNote: string;
  electronsRequired: number;
  protonsRequired: number;
  eyebrowText: string;
}

export type MetalGeometry = 'foil' | 'solid';

export interface MetalModelParams {
  capacity: number; // C0 (0.1 - 3.0)
  flux: number;     // J0 (0.1 - 3.0)
  eta: number;      // eta (0.0 - 1.0)
  K: number;        // K (0.0 - 1.0)
  geometry: MetalGeometry;
}

export interface MetalPoint {
  tau: number;
  metal: number;     // % of initial metal capacity
  product: number;   // % of initial substrate
  substrate: number; // % of initial substrate
  capacityRest: number;
  consumedCapacity: number;
}

export interface MetalResult {
  tauMetal: number;
  productAtTauMetal: number;
  substrateAtTauMetal: number;
  sideConsumptionAtTauMetal: number;
  balance: {
    c0: number;
    productive: number;
    side: number;
    remaining: number;
  };
  points: MetalPoint[];
}

export interface SimpleModelParams {
  q: number; // k2 / k1 (0 - 2)
  r: number; // k3 / k1 (0 - 3)
}

export interface SimpleModelPoint {
  tau: number;
  S: number;       // %
  P: number;       // %
  BD: number;      // % (B + D)
  B: number;       // %
  D: number;       // %
}

export interface SimpleModelResult {
  peakTau: number;
  peakValue: number;
  crossTau: number | null;
  points: SimpleModelPoint[];
  tableRows: { tau: number; S: number; P: number; BD: number }[];
}

export interface AdvancedModelParams {
  a0: number;     // Surface activity (0.05 - 5.0)
  lambda: number; // Deactivation (0 - 2.0)
  m: number;      // Transport capacity (0.05 - 5.0)
  u: number;      // Intermediate conversion rate (0.05 - 5.0)
  q: number;      // Side route rate (0 - 2.0)
  r: number;      // Product loss rate (0 - 2.0)
  temperature_C?: number; // Optional reaction temperature in °C (must be >= -273.15 °C)
}

export interface AdvancedPoint {
  tau: number;
  S: number;
  I: number;
  P: number;
  BD: number;
  envMin: number;
  envMax: number;
}

export type KineticParamKey = 'a0' | 'lambda' | 'm' | 'u' | 'q' | 'r';

export interface SensitivityRow {
  name: string;
  key: KineticParamKey;
  rms: number;
  classification: string;
}

export interface AdvancedModelResult {
  points: AdvancedPoint[];
  peakTau: number;
  peakValue: number;
  isInteriorPeak: boolean;
  crossings: {
    tau: number;
    type: 'formation_takes_over' | 'side_takes_over';
  }[];
  sensitivities: SensitivityRow[];
  rank: number;
  totalParams: number;
  singularValues: number[];
  mostSimilarPair: {
    param1: string;
    param2: string;
    similarity: number;
  };
}
