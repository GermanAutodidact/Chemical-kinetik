/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { calculateSimpleModel, calculateAdvancedModel } from '../utils/kinetics';
import { GitCompare, Sliders } from 'lucide-react';

export const ModelOverlayComparator: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [sharedQ, setSharedQ] = useState(0.25);
  const [sharedR, setSharedR] = useState(0.15);
  const [advLambda, setAdvLambda] = useState(0.25);
  const [advM, setAdvM] = useState(0.8);

  const m1Result = useMemo(() => {
    return calculateSimpleModel({ q: sharedQ, r: sharedR });
  }, [sharedQ, sharedR]);

  const m2Result = useMemo(() => {
    return calculateAdvancedModel(
      {
        a0: 1.0,
        lambda: advLambda,
        m: advM,
        u: 1.0,
        q: sharedQ,
        r: sharedR,
      },
      'product'
    );
  }, [sharedQ, sharedR, advLambda, advM]);

  if (!showOverlay) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700/80 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          onClick={() => setShowOverlay(true)}
        >
          <GitCompare className="w-3.5 h-3.5" />
          Modell-Overlay öffnen: M1 (Ideal) vs. M2 (Mit Transport &amp; Alterung)
        </button>
      </div>
    );
  }

  // SVG coordinate mapping
  const svgWidth = 974;
  const svgHeight = 280;
  const xLeft = 52;
  const xRight = 958;
  const yTop = 20;
  const yBottom = 240;
  const plotWidth = xRight - xLeft;
  const plotHeight = yBottom - yTop;
  const tauMax = 6.0;

  const mapX = (tau: number) => xLeft + (tau / tauMax) * plotWidth;
  const mapY = (valPercent: number) => yBottom - (valPercent / 100) * plotHeight;

  // Paths
  const m1PPath = m1Result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.P).toFixed(2)}`)
    .join(' ');

  const m2PPath = m2Result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.P).toFixed(2)}`)
    .join(' ');

  return (
    <section className="panel border-sky-500/30 bg-slate-950/70 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-semibold m-0 text-slate-100">
            Direktes Modell-Overlay: M1 (Ideale Kaskade) vs. M2 (Grenzfläche &amp; Transport)
          </h2>
        </div>
        <button
          type="button"
          className="text-xs text-slate-400 hover:text-slate-200"
          onClick={() => setShowOverlay(false)}
        >
          Schließen ✕
        </button>
      </div>

      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
        Vergleiche die Produktkurven bei identischen Nebenrouten (q={sharedQ}) und Produktverlusten (r={sharedR}). 
        Die durchgezogene blaue Linie zeigt das ideale Modell M1; die gestrichelte cyanfarbene Linie zeigt Modell M2 
        unter Berücksichtigung von Transporthemmung (m={advM}) und Oberflächenalterung (λ={advLambda}).
      </p>

      {/* Mini Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
        <div>
          <label className="text-slate-400 block mb-1">
            Nebenroute q: <span className="text-sky-300 font-mono">{sharedQ}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={sharedQ}
            onChange={(e) => setSharedQ(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">
            Produktverlust r: <span className="text-sky-300 font-mono">{sharedR}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={sharedR}
            onChange={(e) => setSharedR(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">
            Deaktivierung λ: <span className="text-teal-300 font-mono">{advLambda}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={advLambda}
            onChange={(e) => setAdvLambda(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">
            Transportkapazität m: <span className="text-teal-300 font-mono">{advM}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={advM}
            onChange={(e) => setAdvM(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="legend mb-2 text-xs">
        <span>
          <i className="p"></i>Modell M1: Ideale Lösung (Peak: {m1Result.peakValue.toFixed(1)}% bei τ={m1Result.peakTau.toFixed(2)})
        </span>
        <span>
          <i className="i-intermediate"></i>Modell M2: Realistische Grenzfläche (Peak: {m2Result.peakValue.toFixed(1)}% bei τ={m2Result.peakTau.toFixed(2)})
        </span>
      </div>

      <svg
        role="img"
        aria-label="Modell Overlay M1 vs M2"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full rounded bg-slate-900 border border-slate-800"
      >
        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = mapY(val);
          return (
            <g key={val}>
              <line x1={xLeft} x2={xRight} y1={y} y2={y} stroke="#2a3b54" />
              <text x={xLeft - 8} y={y + 4} textAnchor="end" fill="#b3c1d5" fontSize="11">
                {val}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 2, 4, 6].map((t) => (
          <text key={t} x={mapX(t)} y={262} textAnchor="middle" fill="#b3c1d5" fontSize="11">
            {t}
          </text>
        ))}

        {/* M1 Curve */}
        <path d={m1PPath} stroke="#79bdff" strokeWidth="2.5" fill="none" />

        {/* M2 Curve */}
        <path d={m2PPath} stroke="#73d9c5" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
      </svg>
    </section>
  );
};
