/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { SimpleModelParams } from '../types';
import { calculateSimpleModel } from '../utils/kinetics';
import { exportCsv, downloadFile } from '../utils/export';
import { Download, Sliders } from 'lucide-react';

export const SimpleModelSection: React.FC = () => {
  const [params, setParams] = useState<SimpleModelParams>({
    q: 0.25,
    r: 0.15,
  });

  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    tau: number;
    S: number;
    P: number;
    BD: number;
  } | null>(null);

  const [copiedNotification, setCopiedNotification] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const result = useMemo(() => {
    return calculateSimpleModel(params);
  }, [params]);

  const handlePreset = (preset: 'ideal' | 'default' | 'loss' | 'byproduct') => {
    if (preset === 'ideal') {
      setParams({ q: 0.05, r: 0.05 });
    } else if (preset === 'default') {
      setParams({ q: 0.25, r: 0.15 });
    } else if (preset === 'loss') {
      setParams({ q: 0.15, r: 0.75 });
    } else if (preset === 'byproduct') {
      setParams({ q: 0.85, r: 0.1 });
    }
  };

  // SVG coordinate mapping
  // viewBox="0 0 710 310"
  const svgWidth = 710;
  const svgHeight = 310;
  const xLeft = 54;
  const xRight = 694;
  const yTop = 22;
  const yBottom = 260;
  const plotWidth = xRight - xLeft;
  const plotHeight = yBottom - yTop;
  const tauMax = 6.0;

  const mapX = (tau: number) => xLeft + (tau / tauMax) * plotWidth;
  const mapY = (valPercent: number) => yBottom - (valPercent / 100) * plotHeight;

  // Paths
  const sPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.S).toFixed(2)}`)
    .join(' ');

  const pPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.P).toFixed(2)}`)
    .join(' ');

  const pAreaPath = `${result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.P).toFixed(2)}`)
    .join(' ')} L${mapX(result.points[result.points.length - 1].tau).toFixed(2)},${yBottom} L${mapX(0).toFixed(2)},${yBottom} Z`;

  const bdPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.BD).toFixed(2)}`)
    .join(' ');

  // Peak circle coords
  const peakX = mapX(result.peakTau);
  const peakY = mapY(result.peakValue);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgWidth;

    if (svgX < xLeft || svgX > xRight) {
      setHoverData(null);
      return;
    }

    const curTau = ((svgX - xLeft) / plotWidth) * tauMax;
    let closest = result.points[0];
    let minDiff = Infinity;
    for (const pt of result.points) {
      const diff = Math.abs(pt.tau - curTau);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    if (closest) {
      setHoverData({
        x: mapX(closest.tau),
        y: mapY(closest.P),
        tau: closest.tau,
        S: closest.S,
        P: closest.P,
        BD: closest.BD,
      });
    }
  };

  const handleExportCsv = () => {
    const rows = result.points.map((pt) => [
      pt.tau.toFixed(2).replace('.', ','),
      pt.S.toFixed(2).replace('.', ','),
      pt.P.toFixed(2).replace('.', ','),
      pt.BD.toFixed(2).replace('.', ','),
    ]);
    exportCsv(
      `M1_Modellwerte_q${params.q}_r${params.r}.csv`,
      ['tau = k1*t', 'Substrat S (%)', 'Produkt P (%)', 'Nebenanteile B+D (%)'],
      rows
    );
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgContent = new XMLSerializer().serializeToString(svgRef.current);
    downloadFile(`pea_m1_kinetik_q${params.q}_r${params.r}.svg`, svgContent, 'image/svg+xml;charset=utf-8');
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <section id="modell" className="panel">
      <div className="section-head mb-2">
        <div>
          <span className="eyebrow">INTERAKTIVER MODELLVERGLEICH</span>
          <h2>Wann entsteht ein Ausbeutemaximum?</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="secondary-btn text-xs inline-flex items-center gap-1.5"
            onClick={handleExportSvg}
            title="Diagramm als SVG herunterladen"
          >
            <Download className="w-3.5 h-3.5" />
            {copiedNotification ? 'SVG heruntergeladen!' : 'Plot als SVG'}
          </button>
        </div>
      </div>

      <div className="notice">
        <strong>Hypothetisches Modell, keine PEA-Prognose.</strong> Die Regler setzen frei gewählte
        dimensionslose Ratenverhältnisse. τ = k₁t ist keine Zeitangabe in Minuten und keiner der
        vier Temperaturen zugeordnet.
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap mb-4 text-xs font-sans">
        <span className="text-slate-400 font-medium inline-flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-sky-400" /> Presets:
        </span>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
          onClick={() => handlePreset('default')}
        >
          Referenz (q=0,25, r=0,15)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('ideal')}
        >
          Minimale Verluste (q=0,05, r=0,05)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('loss')}
        >
          Hoher Produktverlust (r=0,75)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('byproduct')}
        >
          Dominante Nebenroute (q=0,85)
        </button>
      </div>

      <div className="model-layout">
        <div className="controls">
          <label htmlFor="q">
            Nebenroute <span>q = k₂/k₁</span>
            <output id="qval">{params.q.toFixed(2).replace('.', ',')}</output>
          </label>
          <input
            id="q"
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={params.q}
            onChange={(e) => setParams((prev) => ({ ...prev, q: parseFloat(e.target.value) }))}
          />

          <label htmlFor="r">
            Produktverlust <span>r = k₃/k₁</span>
            <output id="rval">{params.r.toFixed(2).replace('.', ',')}</output>
          </label>
          <input
            id="r"
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={params.r}
            onChange={(e) => setParams((prev) => ({ ...prev, r: parseFloat(e.target.value) }))}
          />

          <p className="small">
            Bei r = 0 steigt die Produktmenge auf ein Plateau. Bei r &gt; 0 besitzt dieses Modell ein
            endliches Maximum.
          </p>

          <div className="network" aria-hidden="true">
            S → P → D<br />
            <span>S → B</span>
          </div>

          <p className="small">
            S: Substrat · P: Produkt
            <br />
            B: Nebenroute · D: Produktverlust
            <br />
            Alle Anteile in Substratäquivalenten.
          </p>
        </div>

        <div>
          <div className="legend">
            <span>
              <i className="s"></i>Substrat S
            </span>
            <span>
              <i className="p"></i>Produkt P
            </span>
            <span>
              <i className="b"></i>Nebenanteile B + D
            </span>
          </div>

          <svg
            ref={svgRef}
            id="plot"
            role="img"
            aria-label={`Hypothetisches Modell q=${params.q}, r=${params.r}. Produktmaximum ${result.peakValue.toFixed(2)} Prozent bei dimensionsloser Zeit ${result.peakTau.toFixed(2)}.`}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
          >
            <defs>
              <linearGradient id="m1ProdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#79bdff" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#79bdff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = mapY(val);
              return (
                <g key={val}>
                  <line x1={xLeft} y1={y} x2={xRight} y2={y} stroke="#2a3b54" />
                  <text x={xLeft - 9} y={y + 4} textAnchor="end" fill="#b3c1d5" fontSize="12">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-axis ticks */}
            {[0, 2, 4, 6].map((t) => (
              <text key={t} x={mapX(t)} y={282} textAnchor="middle" fill="#b3c1d5" fontSize="12">
                {t}
              </text>
            ))}

            <text x={xLeft} y={14} fill="#b3c1d5" fontSize="12">
              Anteil (%)
            </text>
            <text x={svgWidth / 2} y={304} textAnchor="middle" fill="#b3c1d5" fontSize="12">
              Dimensionslose Zeit τ = k₁t
            </text>

            {/* Area fill under Product curve */}
            <path d={pAreaPath} fill="url(#m1ProdGrad)" />

            {/* S curve */}
            <path d={sPath} fill="none" stroke="#b3c1d5" strokeWidth="2" strokeDasharray="5 4" />

            {/* B+D curve */}
            <path d={bdPath} fill="none" stroke="#ffc478" strokeWidth="2" />

            {/* P curve */}
            <path d={pPath} fill="none" stroke="#79bdff" strokeWidth="3" />

            {/* Peak indicator dot */}
            {params.r > 0 && result.peakTau <= tauMax && (
              <g>
                <circle
                  cx={peakX}
                  cy={peakY}
                  r="5"
                  fill="#79bdff"
                  stroke="#111d30"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Hover tooltip */}
            {hoverData && (
              <g>
                <line
                  x1={hoverData.x}
                  x2={hoverData.x}
                  y1={yTop}
                  y2={yBottom}
                  stroke="rgba(255,255,255,0.4)"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={hoverData.x}
                  cy={mapY(hoverData.P)}
                  r="5"
                  fill="#79bdff"
                  stroke="#111d30"
                  strokeWidth="2"
                />
                <rect
                  x={Math.min(hoverData.x + 10, svgWidth - 170)}
                  y={Math.max(hoverData.y - 60, 25)}
                  width="155"
                  height="62"
                  rx="4"
                  fill="#111d30"
                  stroke="#2a3b54"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(hoverData.x + 18, svgWidth - 162)}
                  y={Math.max(hoverData.y - 44, 41)}
                  fill="#edf3fc"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  τ = {hoverData.tau.toFixed(2)}
                </text>
                <text
                  x={Math.min(hoverData.x + 18, svgWidth - 162)}
                  y={Math.max(hoverData.y - 30, 55)}
                  fill="#79bdff"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Produkt: {hoverData.P.toFixed(1)}%
                </text>
                <text
                  x={Math.min(hoverData.x + 18, svgWidth - 162)}
                  y={Math.max(hoverData.y - 16, 69)}
                  fill="#b3c1d5"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Substrat: {hoverData.S.toFixed(1)}%
                </text>
                <text
                  x={Math.min(hoverData.x + 18, svgWidth - 162)}
                  y={Math.max(hoverData.y - 2, 83)}
                  fill="#ffc478"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Nebenroute: {hoverData.BD.toFixed(1)}%
                </text>
              </g>
            )}
          </svg>

          <div className="results" aria-live="polite">
            <p>
              <span>Produktmaximum</span>
              <strong id="peak">
                {result.peakValue.toFixed(2).replace('.', ',')} % bei τ ={' '}
                {result.peakTau.toFixed(2).replace('.', ',')}
              </strong>
            </p>
            <p>
              <span>Nebenraten = Bildungsrate</span>
              <strong id="cross">
                {result.crossTau !== null
                  ? `τ = ${result.crossTau.toFixed(2).replace('.', ',')}`
                  : 'Keine Kreuzung im Zeitfenster'}
              </strong>
            </p>
          </div>
        </div>
      </div>

      <details>
        <summary>Berechnete Werte des aktuellen hypothetischen Modells</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>τ</th>
                <th>S (%)</th>
                <th>P (%)</th>
                <th>B + D (%)</th>
              </tr>
            </thead>
            <tbody id="modelrows">
              {result.tableRows.map((row) => (
                <tr key={row.tau}>
                  <td>{row.tau.toFixed(2).replace('.', ',')}</td>
                  <td>{row.S.toFixed(2).replace('.', ',')}</td>
                  <td>{row.P.toFixed(2).replace('.', ',')}</td>
                  <td>{row.BD.toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button id="export" type="button" className="primary-btn" onClick={handleExportCsv}>
          Modellwerte als CSV speichern
        </button>
      </details>
    </section>
  );
};
