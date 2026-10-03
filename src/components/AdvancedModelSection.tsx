/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { AdvancedModelParams } from '../types';
import { calculateAdvancedModel } from '../utils/kinetics';
import { exportJson, downloadFile } from '../utils/export';
import { Download, Sliders, BarChart3 } from 'lucide-react';

const DEFAULT_PARAMS: AdvancedModelParams = {
  a0: 1.0,
  lambda: 0.15,
  m: 1.0,
  u: 1.0,
  q: 0.25,
  r: 0.15,
};

export const AdvancedModelSection: React.FC = () => {
  const [params, setParams] = useState<AdvancedModelParams>(DEFAULT_PARAMS);
  const [observe, setObserve] = useState<'product' | 'all'>('product');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    tau: number;
    S: number;
    I: number;
    P: number;
    BD: number;
    envMin: number;
    envMax: number;
  } | null>(null);

  const result = useMemo(() => {
    return calculateAdvancedModel(params, observe);
  }, [params, observe]);

  const handleInputChange = (field: keyof AdvancedModelParams, valStr: string) => {
    setErrorMsg('');
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setErrorMsg('Ungültige Zahleneingabe.');
      return;
    }
    if (val < 0) {
      setErrorMsg('Parameter dürfen nicht negativ sein.');
      return;
    }
    setParams((prev) => ({ ...prev, [field]: val }));
  };

  const handlePreset = (preset: 'default' | 'passivation' | 'transport' | 'stagnant') => {
    setErrorMsg('');
    if (preset === 'default') {
      setParams(DEFAULT_PARAMS);
    } else if (preset === 'passivation') {
      setParams({ a0: 0.9, lambda: 0.7, m: 0.5, u: 1.0, q: 0.25, r: 0.15 });
    } else if (preset === 'transport') {
      setParams({ a0: 2.2, lambda: 0.15, m: 0.25, u: 1.0, q: 0.25, r: 0.15 });
    } else if (preset === 'stagnant') {
      setParams({ a0: 1.0, lambda: 0.15, m: 1.0, u: 0.2, q: 0.25, r: 0.15 });
    }
  };

  // SVG coordinate mapping
  // viewBox="0 0 974 330"
  const svgWidth = 974;
  const svgHeight = 330;
  const xLeft = 52;
  const xRight = 959;
  const yTop = 25;
  const yBottom = 282;
  const plotWidth = xRight - xLeft;
  const plotHeight = yBottom - yTop;
  const tauMax = 6.0;

  const mapX = (tau: number) => xLeft + (tau / tauMax) * plotWidth;
  const mapY = (valPercent: number) => yBottom - (valPercent / 100) * plotHeight;

  // Paths
  const sPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.S).toFixed(2)}`)
    .join(' ');

  const iPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.I).toFixed(2)}`)
    .join(' ');

  const pPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.P).toFixed(2)}`)
    .join(' ');

  const bdPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.BD).toFixed(2)}`)
    .join(' ');

  // Shaded envelope polygon
  const envTop = result.points.map(
    (pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.envMax).toFixed(2)}`
  );
  const envBottom = [...result.points]
    .reverse()
    .map((pt) => `L${mapX(pt.tau).toFixed(2)},${mapY(pt.envMin).toFixed(2)}`);
  const envPolygonPath = `${envTop.join(' ')} ${envBottom.join(' ')} Z`;

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
        I: closest.I,
        P: closest.P,
        BD: closest.BD,
        envMin: closest.envMin,
        envMax: closest.envMax,
      });
    }
  };

  const handleExportJson = () => {
    exportJson(`M2_Szenario_${observe}_a0_${params.a0}.json`, {
      titel: 'PEA Kinetik - Modell M2 (Erweitertes Hypothesenmodell)',
      parameter: params,
      beobachteteMengen: observe,
      ergebnisse: {
        groessterWert: result.peakValue,
        groessterWertTau: result.peakTau,
        istInneresMaximum: result.isInteriorPeak,
        ratenKreuzungen: result.crossings,
        singulaerwerte: result.singularValues,
        numerischerRang: `${result.rank}/${result.totalParams}`,
        sensitivitaeten: result.sensitivities,
        aehnlichstesPaar: result.mostSimilarPair,
      },
      punkte: result.points,
    });
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgContent = new XMLSerializer().serializeToString(svgRef.current);
    downloadFile(`pea_m2_advanced_a0_${params.a0}.svg`, svgContent, 'image/svg+xml;charset=utf-8');
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const crossingText =
    result.crossings.length > 0
      ? result.crossings
          .map(
            (c) =>
              `${c.tau.toFixed(2).replace('.', ',')} (${
                c.type === 'formation_takes_over' ? 'Bildung übernimmt' : 'Nebenraten übernehmen'
              })`
          )
          .join('; ')
      : 'Keine Ratenkreuzung';

  const maxRms = Math.max(...result.sensitivities.map((s) => s.rms), 1);

  return (
    <section id="analyse" className="panel">
      <div className="section-head mb-2">
        <div>
          <span className="eyebrow">NEU · SENSITIVITÄT &amp; IDENTIFIZIERBARKEIT</span>
          <h2>Welche Annahme verändert das Ergebnis?</h2>
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
        <strong>Erweitertes Hypothesenmodell M2.</strong> S → I → P, S → B, P → D. I ist ein
        unbestimmter Zwischenprodukt-Pool. Alle Werte sind dimensionslos und frei gewählt. Keine
        Parametrisierung des Al/Hg-Systems.
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
          Ausgangsszenario
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('passivation')}
        >
          Starke Passivierung (λ=0,7)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('transport')}
        >
          Transportlimitierung (m=0,25)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('stagnant')}
        >
          Zwischenstufen-Stau (u=0,2)
        </button>
      </div>

      <div className="legend">
        <span>
          <i className="s"></i>Substrat
        </span>
        <span>
          <i className="i-intermediate"></i>Zwischenpool
        </span>
        <span>
          <i className="p"></i>Produkt
        </span>
        <span>
          <i className="b"></i>Nebenanteile
        </span>
      </div>

      <svg
        ref={svgRef}
        id="advanced-plot"
        role="img"
        aria-label="Hypothetischer Verlauf mit Zwischenprodukt, Oberfläche und Transport"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
      >
        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = mapY(val);
          return (
            <g key={val}>
              <line x1={xLeft} x2={xRight} y1={y} y2={y} stroke="#2a3b54" />
              <text x={xLeft - 8} y={y + 4} textAnchor="end" fill="#b3c1d5" fontSize="12">
                {val}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 2, 4, 6].map((t) => (
          <text key={t} x={mapX(t)} y={304} textAnchor="middle" fill="#b3c1d5" fontSize="12">
            {t}
          </text>
        ))}

        <text x={xLeft} y={15} fill="#b3c1d5" fontSize="12">
          Substratäquivalente (%)
        </text>
        <text x={svgWidth / 2} y={325} fill="#b3c1d5" fontSize="12" textAnchor="middle">
          Dimensionslose Modellzeit τ
        </text>

        {/* Shaded envelope polygon */}
        <path d={envPolygonPath} fill="#79bdff" fillOpacity="0.14" />

        {/* S curve */}
        <path d={sPath} stroke="#b3c1d5" strokeWidth="2" fill="none" strokeDasharray="5 4" />

        {/* I curve (intermediate) */}
        <path d={iPath} stroke="#73d9c5" strokeWidth="2" fill="none" strokeDasharray="4 3" />

        {/* B+D curve */}
        <path d={bdPath} stroke="#ffc478" strokeWidth="2" fill="none" />

        {/* P curve */}
        <path d={pPath} stroke="#79bdff" strokeWidth="3" fill="none" />

        {/* Hover inspection */}
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
              x={Math.min(hoverData.x + 10, svgWidth - 190)}
              y={Math.max(hoverData.y - 75, 30)}
              width="180"
              height="85"
              rx="4"
              fill="#111d30"
              stroke="#2a3b54"
              strokeWidth="1"
            />
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 58, 47)}
              fill="#edf3fc"
              fontSize="11"
              fontFamily="monospace"
            >
              τ = {hoverData.tau.toFixed(2)}
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 44, 61)}
              fill="#79bdff"
              fontSize="11"
              fontFamily="monospace"
            >
              Produkt P: {hoverData.P.toFixed(1)}%
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 30, 75)}
              fill="#73d9c5"
              fontSize="11"
              fontFamily="monospace"
            >
              Zwischenstufen I: {hoverData.I.toFixed(1)}%
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 16, 89)}
              fill="#b3c1d5"
              fontSize="11"
              fontFamily="monospace"
            >
              Substrat S: {hoverData.S.toFixed(1)}%
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 2, 103)}
              fill="#ffc478"
              fontSize="11"
              fontFamily="monospace"
            >
              Nebenanteile: {hoverData.BD.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>

      <p id="adv-result" aria-live="polite">
        Größter Rasterwert: {result.peakValue.toFixed(2).replace('.', ',')} % bei τ ={' '}
        {result.peakTau.toFixed(2).replace('.', ',')}{' '}
        {result.isInteriorPeak
          ? '(inneres Maximum)'
          : '(rechter Rand; kein inneres Maximum belegt)'}
        . Ratenkreuzungen: {crossingText}.
      </p>

      <p className="small">
        Blaue Hülle: Produktkurven bei jeweils −20 % und +20 % eines Parameters. Kein
        Konfidenzintervall, keine gemeinsame Variation aller Parameter und kein vollständiger
        Unsicherheitsbereich. Fenster: τ = 0 bis 6; Rasterweite 0,05.
      </p>

      <details open>
        <summary>Sechs Modellannahmen einstellen</summary>
        <div id="advanced-inputs">
          <label>
            Oberflächenaktivität a₀
            <input
              type="number"
              min="0.05"
              max="5"
              step="0.01"
              id="adv-a0"
              value={params.a0}
              onChange={(e) => handleInputChange('a0', e.target.value)}
            />
          </label>
          <label>
            Deaktivierung λ
            <input
              type="number"
              min="0"
              max="2"
              step="0.01"
              id="adv-lambda"
              value={params.lambda}
              onChange={(e) => handleInputChange('lambda', e.target.value)}
            />
          </label>
          <label>
            Transportkapazität m
            <input
              type="number"
              min="0.05"
              max="5"
              step="0.01"
              id="adv-m"
              value={params.m}
              onChange={(e) => handleInputChange('m', e.target.value)}
            />
          </label>
          <label>
            Zwischenprodukt-Umsatz u
            <input
              type="number"
              min="0.05"
              max="5"
              step="0.01"
              id="adv-u"
              value={params.u}
              onChange={(e) => handleInputChange('u', e.target.value)}
            />
          </label>
          <label>
            Nebenroute q
            <input
              type="number"
              min="0"
              max="2"
              step="0.01"
              id="adv-q"
              value={params.q}
              onChange={(e) => handleInputChange('q', e.target.value)}
            />
          </label>
          <label>
            Produktverlust r
            <input
              type="number"
              min="0"
              max="2"
              step="0.01"
              id="adv-r"
              value={params.r}
              onChange={(e) => handleInputChange('r', e.target.value)}
            />
          </label>
        </div>

        {errorMsg && (
          <p id="advanced-error" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <button id="adv-reset" type="button" className="secondary-btn" onClick={() => handlePreset('default')}>
            Ausgangsszenario
          </button>
          <button id="adv-export" type="button" className="primary-btn" onClick={handleExportJson}>
            Szenario als JSON speichern
          </button>
        </div>
      </details>

      <div className="analysis-grid">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3>Lokale Empfindlichkeit (Tornado-Analyse)</h3>
            <span className="text-xs font-mono text-sky-400 inline-flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> RMS-Balken
            </span>
          </div>

          <p className="small mb-3">
            RMS von 100 · ∂Anteil/∂ln(Parameter), in Prozentpunkten je logarithmischer
            Parameteränderung. Höher bedeutet stärkeren lokalen Einfluss auf die gewählten
            Beobachtungen.
          </p>

          {/* Upgraded Visual Tornado Chart */}
          <div className="space-y-2 mb-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            {result.sensitivities.map((s) => {
              const widthPct = Math.min(100, Math.max(4, (s.rms / maxRms) * 100));
              return (
                <div key={s.key} className="text-xs">
                  <div className="flex justify-between text-slate-300 font-mono mb-1">
                    <span>{s.name}</span>
                    <span className="text-sky-300 font-semibold">{s.rms.toFixed(3).replace('.', ',')}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>RMS</th>
                  <th>Einordnung</th>
                </tr>
              </thead>
              <tbody id="sensrows">
                {result.sensitivities.map((s) => (
                  <tr key={s.key}>
                    <td>{s.name}</td>
                    <td>{s.rms.toFixed(3).replace('.', ',')}</td>
                    <td>{s.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3>Wie viele Größen sind unterscheidbar?</h3>
          <label htmlFor="observe" className="block text-sm text-slate-300 font-medium mb-1">
            Hypothetisch beobachtete Mengen
          </label>
          <select
            id="observe"
            value={observe}
            onChange={(e) => setObserve(e.target.value as 'product' | 'all')}
          >
            <option value="product">Nur Produkt P</option>
            <option value="all">Substrat S + Zwischenpool I + Produkt P</option>
          </select>

          <p className="rank" id="rank">
            Numerischer Rang {result.rank}/{result.totalParams}
          </p>

          <p id="rank-detail" className="small">
            P bei τ = 0,5; 1; 2; 3; 4; 6. Relative Singularwertschwelle 10⁻⁵. Kein Nachweis globaler
            oder praktischer Identifizierbarkeit.
          </p>

          <p>
            <strong>Ähnlichstes Parameterpaar</strong>
            <br />
            <span id="similarity" className="font-mono text-sky-400">
              {result.mostSimilarPair.param1} / {result.mostSimilarPair.param2}:{' '}
              {result.mostSimilarPair.similarity.toFixed(4).replace('.', ',')}
            </span>
          </p>

          <p className="small">
            Absoluter Kosinus der Sensitivitätsspalten; nahe 1 heißt ähnliche lokale Wirkung. Dies
            ist keine statistische Parameterkorrelation.
          </p>

          <details>
            <summary>Singularwerte der Sensitivitätsmatrix</summary>
            <p id="sv" className="small text-xs mt-2">
              {result.singularValues.map((v) => v.toExponential(3)).join(' · ')}
            </p>
            <p className="small mt-2">
              Keine Messfehlergewichte, keine Schätzung von Konfidenzintervallen. Ein numerisch
              voller Rang kann trotz starker Unsicherheit auftreten. Bei Nullparametern ist eine
              logarithmische Variation nicht aussagekräftig.
            </p>
          </details>
        </div>
      </div>

      <details>
        <summary>Gleichungen, Annahmen und numerisches Verfahren</summary>
        <div className="formula">
          a(τ) = a₀ exp(−λτ)<br />
          h(τ) = a(τ)m / [a(τ) + m]<br />
          S′ = −hS − qS<br />
          I′ = hS − uhI<br />
          P′ = uhI − rP<br />
          B′ = qS<br />
          D′ = rP
        </div>
        <p>
          Die harmonische Verknüpfung h ist ein vereinfachtes Modell zweier Widerstände. Sie ist
          kein nachgewiesener Stofftransportansatz für diesen Ansatz. Beide produktiven Schritte
          teilen hier denselben Faktor h; die Nebenroute q ist als Volumenreaktion angesetzt. Andere
          Zuordnungen wären eigene Modellhypothesen.
        </p>
        <p>
          λ ≥ 0 beschreibt ausschließlich Deaktivierung, nicht die Aktivierung des Metalls.
          Temperatur, Autokatalyse und eine Wärmebilanz werden in M2 nicht simuliert. Die bestehenden
          Temperaturzeilen bleiben unkalibriert.
        </p>
        <p>
          Integration: Adaptives Runge-Kutta-Verfahren 4. Ordnung mit Schrittverdopplung, lokaler
          Fehlerabschätzung und Richardson-Extrapolation (Toleranzen rtol = 10⁻⁸, atol = 10⁻¹⁰,
          maximale Schrittweite 0,05, Ausgaberaster Δτ = 0,05 auf [0, 6]).
          Lokale Ableitungen durch symmetrische logarithmische Variation um ±0,001.
          Singulärwerte und numerischer Rang über direkte einseitige Jacobi-SVD der Jacobimatrix J.
          Ratenkreuzungen werden durch Bisektion (Toleranz 10⁻⁸) verfeinert.
          (Hinweis: Die Python-Referenzimplementierung in <code>python/models/model_m2.py</code> verwendet
          zum Vergleich ein festes RK4-Verfahren mit Zeitschrittverkürzung am Intervallende.)
        </p>
      </details>

      <details>
        <summary>Exaktes Gegenbeispiel: Eine perfekte Kurve kann mehrdeutig sein</summary>
        <p>
          Setze λ = 0. Dann ist h konstant. Mit a₀ = 1 und m = 1 ergibt sich h = 0,5. Mit a₀ = 2 und
          m = 2/3 ergibt sich ebenfalls h = 0,5. Bei gleichen übrigen Parametern entstehen zu allen
          Zeiten identische S-, I- und P-Verläufe.
        </p>
        <p>
          <strong>Folgerung:</strong> Selbst alle drei Konzentrationskurven trennen in diesem
          Sonderfall Oberfläche und Transport nicht. Dafür wäre eine unabhängige Information über
          einen der beiden Faktoren nötig. Bei λ &gt; 0 gilt dieses spezielle Gegenbeispiel nicht
          unverändert.
        </p>
      </details>

      <details>
        <summary>Welche Information würde welche Unsicherheit reduzieren?</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Information</th>
                <th>Klärt vor allem</th>
                <th>Bleibende Grenze</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Substrat zusätzlich zu PEA</td>
                <td>Verbrauch gegenüber Produktbildung</td>
                <td>Verbrauch allein erklärt den Weg nicht</td>
              </tr>
              <tr>
                <td>Aufgelöste Zwischenprodukte</td>
                <td>Verzögerte Produktbildung, Pool-Aufbau</td>
                <td>Der angenommene Pool muss chemisch bestätigt werden</td>
              </tr>
              <tr>
                <td>Unabhängige Oberflächen- oder Transportdaten</td>
                <td>Mehrdeutigkeit von a₀ und m</td>
                <td>Das gewählte Widerstandsmodell bleibt zu prüfen</td>
              </tr>
              <tr>
                <td>Wiederholte Analytik mit Messfehlern</td>
                <td>Praktische Parameterunsicherheit</td>
                <td>Benötigt passende Fehler- und Beobachtungsmodelle</td>
              </tr>
              <tr>
                <td>Wärmeströme und Wärmeabfuhr</td>
                <td>Energetische Bilanz</td>
                <td>Wärmefluss ist keine direkte PEA-Analyse</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Die Reihenfolge der Datenerhebung folgt erst nach Modell- und Messplanung. Hier werden
          keine Laborbedingungen empfohlen.
        </p>
      </details>

      <p className="small">
        Methodische Einordnung:{' '}
        <a href="https://doi.org/10.1093/bioinformatics/btp358" target="_blank" rel="noreferrer">
          Raue et al. (2009): Profil-Likelihood und Identifizierbarkeit
        </a>
        . Eine Profil-Likelihood-Auswertung ist für spätere Messdaten vorgesehen; sie wird hier nicht
        vorgetäuscht.
      </p>
    </section>
  );
};
