/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { calculateSimpleModel } from '../utils/kinetics';
import { SUBSTRATES } from '../data/substrates';
import { SimpleModelParams } from '../types';

describe('M1 Analytic Kinetic Solver', () => {
  // Test parameters representing nitrostyrene and 1-phenyl-2-nitropropene reaction conditions
  const nitrostyrenePresets: { name: string; params: SimpleModelParams }[] = [
    { name: 'Standard β-Nitrostyrol Default', params: { q: 0.25, r: 0.15 } },
    { name: 'Ideal Low-Loss Nitrostyrene', params: { q: 0.05, r: 0.05 } },
    { name: 'High-Temperature Rapid Degradation', params: { q: 0.15, r: 0.75 } },
  ];

  const nitropropenePresets: { name: string; params: SimpleModelParams }[] = [
    { name: 'P2NP Slower Hydrogenation / Ketoxime Accumulation', params: { q: 0.35, r: 0.40 } },
    { name: 'P2NP Steric Side-Route Dominance', params: { q: 0.85, r: 0.10 } },
    { name: 'P2NP Acid-Hydrolysis Loss Pathway', params: { q: 0.45, r: 0.65 } },
  ];

  describe('Substrate Metadata Verification', () => {
    it('verifies both nitrostyrene and 1-phenyl-2-nitropropene are defined with valid stoichiometry', () => {
      expect(SUBSTRATES.nitrostyrene).toBeDefined();
      expect(SUBSTRATES.nitropropene).toBeDefined();

      expect(SUBSTRATES.nitrostyrene.name).toBe('β-Nitrostyrol');
      expect(SUBSTRATES.nitrostyrene.electronsRequired).toBe(6);
      expect(SUBSTRATES.nitrostyrene.molecularWeight).toBe(149.15);

      expect(SUBSTRATES.nitropropene.name).toBe('1-Phenyl-2-nitropropen (P2NP)');
      expect(SUBSTRATES.nitropropene.electronsRequired).toBe(6);
      expect(SUBSTRATES.nitropropene.molecularWeight).toBe(163.17);
    });
  });

  describe('Mass Balance Conservation (S + P + B + D = 100%)', () => {
    it('preserves exact mass balance across all time steps for nitrostyrene presets', () => {
      for (const preset of nitrostyrenePresets) {
        const result = calculateSimpleModel(preset.params);
        expect(result.points.length).toBeGreaterThan(0);

        for (const pt of result.points) {
          const totalMass = pt.S + pt.P + pt.B + pt.D;
          // Verify sum of percentages equals 100% within numerical tolerance
          expect(totalMass).toBeCloseTo(100.0, 8);
          // Verify B + D equals BD
          expect(pt.BD).toBeCloseTo(pt.B + pt.D, 8);
        }
      }
    });

    it('preserves exact mass balance across all time steps for 1-phenyl-2-nitropropene presets', () => {
      for (const preset of nitropropenePresets) {
        const result = calculateSimpleModel(preset.params);
        expect(result.points.length).toBeGreaterThan(0);

        for (const pt of result.points) {
          const totalMass = pt.S + pt.P + pt.B + pt.D;
          expect(totalMass).toBeCloseTo(100.0, 8);
          expect(pt.BD).toBeCloseTo(pt.B + pt.D, 8);
        }
      }
    });

    it('preserves mass balance across an extensive (q, r) grid sweep', () => {
      const qValues = [0, 0.1, 0.25, 0.5, 1.0, 1.5, 2.0];
      const rValues = [0, 0.05, 0.15, 0.5, 1.0, 1.5, 2.0, 3.0];

      for (const q of qValues) {
        for (const r of rValues) {
          const result = calculateSimpleModel({ q, r });
          for (const pt of result.points) {
            const sum = pt.S + pt.P + pt.B + pt.D;
            expect(sum).toBeCloseTo(100.0, 8);
          }
        }
      }
    });
  });

  describe('Non-Negativity Constraints (S, P, B, D >= 0)', () => {
    it('ensures no concentration fraction becomes negative for nitrostyrene', () => {
      for (const preset of nitrostyrenePresets) {
        const result = calculateSimpleModel(preset.params);
        for (const pt of result.points) {
          expect(pt.S).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.P).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.B).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.D).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.BD).toBeGreaterThanOrEqual(-1e-12);
        }
      }
    });

    it('ensures no concentration fraction becomes negative for 1-phenyl-2-nitropropene', () => {
      for (const preset of nitropropenePresets) {
        const result = calculateSimpleModel(preset.params);
        for (const pt of result.points) {
          expect(pt.S).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.P).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.B).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.D).toBeGreaterThanOrEqual(-1e-12);
          expect(pt.BD).toBeGreaterThanOrEqual(-1e-12);
        }
      }
    });
  });

  describe('Initial Conditions & Monotonicity', () => {
    it('verifies exact initial conditions at tau = 0', () => {
      const result = calculateSimpleModel({ q: 0.25, r: 0.15 });
      const p0 = result.points[0];

      expect(p0.tau).toBe(0);
      expect(p0.S).toBeCloseTo(100.0, 10);
      expect(p0.P).toBeCloseTo(0.0, 10);
      expect(p0.B).toBeCloseTo(0.0, 10);
      expect(p0.D).toBeCloseTo(0.0, 10);
      expect(p0.BD).toBeCloseTo(0.0, 10);
    });

    it('verifies strictly non-increasing substrate S(tau) over time', () => {
      const result = calculateSimpleModel({ q: 0.35, r: 0.25 });
      for (let i = 1; i < result.points.length; i++) {
        expect(result.points[i].S).toBeLessThanOrEqual(result.points[i - 1].S);
      }
    });

    it('verifies strictly non-decreasing cumulative direct by-product B(tau)', () => {
      const result = calculateSimpleModel({ q: 0.5, r: 0.2 });
      for (let i = 1; i < result.points.length; i++) {
        expect(result.points[i].B).toBeGreaterThanOrEqual(result.points[i - 1].B - 1e-12);
      }
    });
  });

  describe('Analytical Edge Cases & Cancellation-Resistance', () => {
    it('handles the degenerate case K == r (repeated root delta -> 0) without division by zero', () => {
      // With q = 0.5, K = 1 + q = 1.5. Setting r = 1.5 yields delta = 0
      const resultExactEqual = calculateSimpleModel({ q: 0.5, r: 1.5 });
      expect(Number.isFinite(resultExactEqual.peakTau)).toBe(true);
      expect(Number.isFinite(resultExactEqual.peakValue)).toBe(true);

      // S(tau) = exp(-1.5 * tau), P(tau) = tau * exp(-1.5 * tau)
      const pMid = resultExactEqual.points.find((p) => Math.abs(p.tau - 1.0) < 0.01);
      expect(pMid).toBeDefined();
      if (pMid) {
        const expectedP = 1.0 * Math.exp(-1.5 * 1.0) * 100;
        expect(pMid.P).toBeCloseTo(expectedP, 4);
      }
    });

    it('handles nearly equal rates K ~= r with delta = 1e-9 avoiding catastrophic cancellation', () => {
      const q = 0.3;
      const K = 1 + q;
      const r = K + 1e-9;
      const resultNear = calculateSimpleModel({ q, r });

      for (const pt of resultNear.points) {
        expect(Number.isFinite(pt.P)).toBe(true);
        expect(pt.S + pt.P + pt.B + pt.D).toBeCloseTo(100.0, 7);
      }
    });

    it('handles zero product degradation (r = 0, no product loss)', () => {
      const q = 0.25;
      const K = 1 + q;
      const resultNoLoss = calculateSimpleModel({ q, r: 0 });

      // In r = 0, product never degrades: D must remain identically 0
      for (const pt of resultNoLoss.points) {
        expect(pt.D).toBeCloseTo(0.0, 10);
      }

      // As tau -> infinity, P -> 100 / K
      const lastPoint = resultNoLoss.points[resultNoLoss.points.length - 1];
      const expectedPAsymptotic = (100 / K) * (1 - Math.exp(-K * lastPoint.tau));
      expect(lastPoint.P).toBeCloseTo(expectedPAsymptotic, 4);
    });

    it('handles zero direct side reaction (q = 0)', () => {
      const resultNoSide = calculateSimpleModel({ q: 0, r: 0.2 });
      for (const pt of resultNoSide.points) {
        expect(pt.B).toBeCloseTo(0.0, 10);
      }
    });
  });

  describe('Peak Value & Rate Crossing Verification', () => {
    it('verifies that the analytical peak location matches the simulated maximum', () => {
      const result = calculateSimpleModel({ q: 0.25, r: 0.15 });
      const maxPoint = result.points.reduce((max, pt) => (pt.P > max.P ? pt : max), result.points[0]);

      // Peak value is in percent (0-100)
      expect(result.peakValue).toBeCloseTo(maxPoint.P, 1);
      // Peak tau location
      expect(Math.abs(result.peakTau - maxPoint.tau)).toBeLessThan(0.1);
    });

    it('verifies rate crossing calculation distinguishes side dominance from product peak', () => {
      const result = calculateSimpleModel({ q: 0.25, r: 0.15 });
      // When q < 1 and r > 0, crossing occurs
      expect(result.crossTau).not.toBeNull();
      if (result.crossTau !== null) {
        expect(result.crossTau).toBeGreaterThan(0);
        // Crossing must be a distinct numerical timestamp from peak tau
        expect(result.crossTau).not.toEqual(result.peakTau);
      }
    });
  });
});
