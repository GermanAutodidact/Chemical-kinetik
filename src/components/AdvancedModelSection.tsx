/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { AdvancedModelParams, AdvancedModelResult } from '../types';
import { calculateAdvancedModel } from '../utils/kinetics';
import { exportJson, downloadFile } from '../utils/export';
import { Download, Sliders, BarChart3, AlertTriangle, ShieldAlert, CheckCircle2, Thermometer, Info } from 'lucide-react';

const DEFAULT_PARAMS: AdvancedModelParams = {
  a0: 1.0,
  lambda: 0.15,
  m: 1.0,
  u: 1.0,
  q: 0.25,
  r: 0.15,
};

interface ValidationResult {
  hasFatalError: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  ratios: {
    sideRatio: number;      // q / a0
    lossRatio: number;      // r / u
    transportRatio: number; // a0 / m
  };
}

export const AdvancedModelSection: React.FC = () => {
  const [params, setParams] = useState<AdvancedModelParams>(DEFAULT_PARAMS);
  const [temperature, setTemperature] = useState<number>(20);
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

  // Comprehensive parameter and stoichiometric ratio validation
  const validation = useMemo<ValidationResult>(() => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // 1. Check a0
    if (!Number.isFinite(params.a0) || isNaN(params.a0)) {
      errors.a0 = 'a₀ muss eine endliche Zahl sein.';
    } else if (params.a0 <= 0) {
      errors.a0 = 'Oberflächenaktivität a₀ muss strikt positiv (> 0) sein.';
    } else if (params.a0 < 0.05) {
      warnings.a0 = 'a₀ < 0,05: Sehr geringe Oberflächenaktivität; Umsetzung stark verlangsamt.';
    } else if (params.a0 > 5.0) {
      warnings.a0 = 'a₀ > 5,0: Sehr hohe Aktivität; außerhalb des empfohlenen Modellbereichs.';
    }

    // 2. Check lambda
    if (!Number.isFinite(params.lambda) || isNaN(params.lambda)) {
      errors.lambda = 'λ muss eine endliche Zahl sein.';
    } else if (params.lambda < 0) {
      errors.lambda = 'Deaktivierungsrate λ darf nicht negativ sein.';
    } else if (params.lambda > 2.0) {
      warnings.lambda = 'λ > 2,0: Sehr rasche Alterung; Katalysator verliert Aktivität fast sofort.';
    }

    // 3. Check m
    if (!Number.isFinite(params.m) || isNaN(params.m)) {
      errors.m = 'm muss eine endliche Zahl sein.';
    } else if (params.m <= 0) {
      errors.m = 'Transportkapazität m muss strikt positiv (> 0) sein.';
    } else if (params.m < 0.05) {
      warnings.m = 'm < 0,05: Extrem starke Diffusions- und Transporthemmung.';
    } else if (params.m > 5.0) {
      warnings.m = 'm > 5,0: Transportkapazität übersteigt typische Flüssigphasengrenzen.';
    }

    // 4. Check u
    if (!Number.isFinite(params.u) || isNaN(params.u)) {
      errors.u = 'u muss eine endliche Zahl sein.';
    } else if (params.u <= 0) {
      errors.u = 'Zwischenprodukt-Umsatz u muss strikt positiv (> 0) sein.';
    } else if (params.u < 0.05) {
      warnings.u = 'u < 0,05: Starke Stauung des Zwischenprodukts I.';
    } else if (params.u > 5.0) {
      warnings.u = 'u > 5,0: Extrem schneller Zwischenstufenumsatz (Quasi-Stationarität).';
    }

    // 5. Check q
    if (!Number.isFinite(params.q) || isNaN(params.q)) {
      errors.q = 'q muss eine endliche Zahl sein.';
    } else if (params.q < 0) {
      errors.q = 'Nebenroute q darf nicht negativ sein.';
    } else if (params.q > 2.0) {
      warnings.q = 'q > 2,0: Hohe Nebenreaktionsrate; verbraucht Großteil des Substrats.';
    }

    // 6. Check r
    if (!Number.isFinite(params.r) || isNaN(params.r)) {
      errors.r = 'r muss eine endliche Zahl sein.';
    } else if (params.r < 0) {
      errors.r = 'Produktverlust r darf nicht negativ sein.';
    } else if (params.r > 2.0) {
      warnings.r = 'r > 2,0: Hoher Folgeverlust; Produkt P wird rasch zersetzt.';
    }

    // 7. Check Temperature
    if (!Number.isFinite(temperature) || isNaN(temperature)) {
      errors.temperature = 'Temperatur muss eine endliche Zahl sein.';
    } else if (temperature < -273.15) {
      errors.temperature = 'Temperatur darf nicht unter dem absoluten Nullpunkt (−273,15 °C / 0 K) liegen.';
    } else if (temperature < 0) {
      warnings.temperature = 'Temperatur < 0 °C: Unterhalb des Gefrierpunkts wässriger Essigsäure; flüssige Reaktionsführung unwahrscheinlich.';
    } else if (temperature > 100) {
      warnings.temperature = 'Temperatur > 100 °C: Oberhalb des Siedepunkts von Wasser/Essigsäure; offenes Reaktionsgemisch siedet ab.';
    }

    // 8. Stoichiometric & Kinetic Ratios
    const sideRatio = params.a0 > 0 ? params.q / params.a0 : 0;
    const lossRatio = params.u > 0 ? params.r / params.u : 0;
    const transportRatio = params.m > 0 ? params.a0 / params.m : 0;

    if (sideRatio > 4.0) {
      warnings.ratio_side = `Extremes Nebenreaktionsverhältnis (q/a₀ = ${sideRatio.toFixed(2)} > 4,0): Der Substrat-Nebenweg dominiert die Hauptaktivität; Produktbildung wird drastisch unterdrückt.`;
    }
    if (lossRatio > 4.0) {
      warnings.ratio_loss = `Extremer Folgeverlust (r/u = ${lossRatio.toFixed(2)} > 4,0): Produktzerfall übertrifft Zwischenstufenbildung deutlich.`;
    }
    if (transportRatio > 8.0) {
      warnings.ratio_transport = `Starke Diffusionslimitierung (a₀/m = ${transportRatio.toFixed(2)} > 8,0): Transportwiderstand begrenzt die Gesamtreaktion nahezu vollständig.`;
    }

    return {
      hasFatalError: Object.keys(errors).length > 0,
      errors,
      warnings,
      ratios: { sideRatio, lossRatio, transportRatio },
    };
  }, [params, temperature]);

  const [lastValidResult, setLastValidResult] = useState<AdvancedModelResult>(() =>
    calculateAdvancedModel(DEFAULT_PARAMS, 'product')
  );

  // Protect solver from out-of-range inputs
  const result = useMemo(() => {
    if (validation.hasFatalError) {
      return lastValidResult;
    }
    try {
      const res = calculateAdvancedModel({ ...params, temperature_C: temperature }, observe);
      setLastValidResult(res);
      return res;
    } catch (e) {
      console.warn('M2 calculation error:', e);
      return lastValidResult;
    }
  }, [params, temperature, observe, validation.hasFatalError]);

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

  const handleTemperatureChange = (valStr: string) => {
    setErrorMsg('');
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setErrorMsg('Ungültige Temperaturangabe.');
      return;
    }
    if (val < -273.15) {
      setErrorMsg('Temperatur kann nicht unter −273,15 °C (0 K) liegen.');
      return;
    }
    setTemperature(val);
  };

  const handlePreset = (preset: 'default' | 'passivation' | 'transport' | 'stagnant') => {
    setErrorMsg('');
    setTemperature(20);
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
        <summary className="font-semibold text-slate-200">
          Modellannahmen, Temperatur &amp; Plausibilitätsvalidierung
        </summary>

        {/* Input Validation & Fatal Error Banner */}
        {validation.hasFatalError && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-600/80 text-rose-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-rose-300 mb-1">
                Unphysikalische oder ungültige Parameter blockiert:
              </strong>
              <ul className="list-disc pl-4 space-y-0.5 text-rose-300/90 font-mono text-[11px]">
                {Object.entries(validation.errors).map(([key, msg]) => (
                  <li key={key}>{msg}</li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] text-rose-400 italic">
                Der M2-Löser wird mit diesen Parametern nicht ausgeführt, um numerische Singularitäten oder Abstürze zu verhindern. Die letzte valide Kurve bleibt sichtbar.
              </p>
            </div>
          </div>
        )}

        {/* Physical Plausibility & Ratio Warnings Banner */}
        {!validation.hasFatalError && Object.keys(validation.warnings).length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-950/30 border border-amber-600/60 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-amber-300 mb-1">
                Physikochemische Plausibilitätshinweise:
              </strong>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-200/90 text-[11px]">
                {Object.entries(validation.warnings).map(([key, msg]) => (
                  <li key={key}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Stoichiometric & Transport Ratios Overview */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
          <div className={`p-2 rounded border ${validation.ratios.sideRatio > 4.0 ? 'bg-amber-950/30 border-amber-600/70 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
            <span className="text-slate-400 block text-[10px]">Nebenwegs-Verhältnis (q/a₀):</span>
            <strong className="text-xs">{validation.ratios.sideRatio.toFixed(3)}</strong>
            <span className="text-[10px] text-slate-500 block">Empfohlen: ≤ 2,0</span>
          </div>
          <div className={`p-2 rounded border ${validation.ratios.lossRatio > 4.0 ? 'bg-amber-950/30 border-amber-600/70 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
            <span className="text-slate-400 block text-[10px]">Produktverlust-Verhältnis (r/u):</span>
            <strong className="text-xs">{validation.ratios.lossRatio.toFixed(3)}</strong>
            <span className="text-[10px] text-slate-500 block">Empfohlen: ≤ 2,0</span>
          </div>
          <div className={`p-2 rounded border ${validation.ratios.transportRatio > 8.0 ? 'bg-amber-950/30 border-amber-600/70 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
            <span className="text-slate-400 block text-[10px]">Oberfläche/Transport (a₀/m):</span>
            <strong className="text-xs">{validation.ratios.transportRatio.toFixed(3)}</strong>
            <span className="text-[10px] text-slate-500 block">Empfohlen: 0,1 – 5,0</span>
          </div>
        </div>

        <div id="advanced-inputs" className="mt-4">
          <label className={`relative ${validation.errors.a0 ? 'text-rose-400' : validation.warnings.a0 ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span>Oberflächenaktivität a₀</span>
              <span className="text-[10px] font-mono text-slate-500">[0,05 – 5,0]</span>
            </div>
            <input
              type="number"
              min="0.01"
              max="10"
              step="0.01"
              id="adv-a0"
              value={params.a0}
              onChange={(e) => handleInputChange('a0', e.target.value)}
              className={validation.errors.a0 ? 'border-rose-500 bg-rose-950/20' : validation.warnings.a0 ? 'border-amber-500' : ''}
            />
            {validation.errors.a0 && <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.a0}</span>}
          </label>

          <label className={`relative ${validation.errors.lambda ? 'text-rose-400' : validation.warnings.lambda ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span>Deaktivierung λ</span>
              <span className="text-[10px] font-mono text-slate-500">[0 – 2,0]</span>
            </div>
            <input
              type="number"
              min="0"
              max="5"
              step="0.01"
              id="adv-lambda"
              value={params.lambda}
              onChange={(e) => handleInputChange('lambda', e.target.value)}
              className={validation.errors.lambda ? 'border-rose-500 bg-rose-950/20' : validation.warnings.lambda ? 'border-amber-500' : ''}
            />
            {validation.errors.lambda && <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.lambda}</span>}
          </label>

          <label className={`relative ${validation.errors.m ? 'text-rose-400' : validation.warnings.m ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span>Transportkapazität m</span>
              <span className="text-[10px] font-mono text-slate-500">[0,05 – 5,0]</span>
            </div>
            <input
              type="number"
              min="0.01"
              max="10"
              step="0.01"
              id="adv-m"
              value={params.m}
              onChange={(e) => handleInputChange('m', e.target.value)}
              className={validation.errors.m ? 'border-rose-500 bg-rose-950/20' : validation.warnings.m ? 'border-amber-500' : ''}
            />
            {validation.errors.m && <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.m}</span>}
          </label>

          <label className={`relative ${validation.errors.u ? 'text-rose-400' : validation.warnings.u ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span>Zwischenprodukt-Umsatz u</span>
              <span className="text-[10px] font-mono text-slate-500">[0,05 – 5,0]</span>
            </div>
            <input
              type="number"
              min="0.01"
              max="10"
              step="0.01"
              id="adv-u"
              value={params.u}
              onChange={(e) => handleInputChange('u', e.target.value)}
              className={validation.errors.u ? 'border-rose-500 bg-rose-950/20' : validation.warnings.u ? 'border-amber-500' : ''}
            />
            {validation.errors.u && <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.u}</span>}
          </label>

          <label className={`relative ${validation.errors.q ? 'text-rose-400' : validation.warnings.q ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span>Nebenroute q</span>
              <span className="text-[10px] font-mono text-slate-500">[0 – 2,0]</span>
            </div>
            <input
              type="number"
              min="0"
              max="5"
              step="0.01"
              id="adv-q"
              value={params.q}
              onChange={(e) => handleInputChange('q', e.target.value)}
              className={validation.errors.q ? 'border-rose-500 bg-rose-950/20' : validation.warnings.q ? 'border-amber-500' : ''}
            />
            {validation.errors.q && <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.q}</span>}
          </label>

          <label className={`relative ${validation.errors.r ? 'text-rose-400' : validation.warnings.r ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span>Produktverlust r</span>
              <span className="text-[10px] font-mono text-slate-500">[0 – 2,0]</span>
            </div>
            <input
              type="number"
              min="0"
              max="5"
              step="0.01"
              id="adv-r"
              value={params.r}
              onChange={(e) => handleInputChange('r', e.target.value)}
              className={validation.errors.r ? 'border-rose-500 bg-rose-950/20' : validation.warnings.r ? 'border-amber-500' : ''}
            />
            {validation.errors.r && <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.r}</span>}
          </label>

          {/* Reaction Temperature Input with Kelvin translation & absolute zero validation */}
          <label className={`relative ${validation.errors.temperature ? 'text-rose-400' : validation.warnings.temperature ? 'text-amber-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                Reaktionstemperatur T
              </span>
              <span className="text-[10px] font-mono text-sky-300">
                {(temperature + 273.15).toFixed(1)} K
              </span>
            </div>
            <input
              type="number"
              min="-273.15"
              max="150"
              step="1"
              id="adv-temp"
              value={temperature}
              onChange={(e) => handleTemperatureChange(e.target.value)}
              className={validation.errors.temperature ? 'border-rose-500 bg-rose-950/20' : validation.warnings.temperature ? 'border-amber-500' : ''}
            />
            {validation.errors.temperature ? (
              <span className="text-[10px] text-rose-400 block mt-0.5">{validation.errors.temperature}</span>
            ) : validation.warnings.temperature ? (
              <span className="text-[10px] text-amber-300 block mt-0.5">{validation.warnings.temperature}</span>
            ) : (
              <span className="text-[10px] text-slate-500 block mt-0.5">Bereich: 0 – 100 °C (flüssiges Gemisch)</span>
            )}
          </label>
        </div>

        {errorMsg && (
          <p id="advanced-error" role="alert" className="text-xs text-rose-400 mt-2 font-mono">
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
