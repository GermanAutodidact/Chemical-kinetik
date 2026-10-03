/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  parseCsvData,
  fitDataToModel,
  calculateProfileLikelihood,
  exportToPEtab,
  FitResult,
  ProfileLikelihoodResult,
} from '../utils/fit';
import { exportJson, downloadFile } from '../utils/export';
import { Play, Download, Sparkles, AlertCircle, Activity, FileSpreadsheet } from 'lucide-react';

export const DataFitSection: React.FC = () => {
  const [model, setModel] = useState<'M1' | 'M0'>('M1');
  const [timeUnit, setTimeUnit] = useState<'model' | 's' | 'min'>('model');
  const [dataType, setDataType] = useState<'unknown' | 'measured' | 'literature' | 'synthetic'>('synthetic');
  const [source, setSource] = useState('Synthetisches Demonstrationsbeispiel');
  const [csvText, setCsvText] = useState(
    't,S,P\n0.0,1.000,0.000\n0.5,0.730,0.228\n1.0,0.533,0.360\n1.5,0.389,0.428\n2.0,0.284,0.457\n2.5,0.207,0.461\n3.0,0.151,0.449\n3.5,0.110,0.428\n4.0,0.081,0.401\n4.5,0.059,0.372\n5.0,0.043,0.343\n5.5,0.031,0.315\n6.0,0.023,0.288'
  );
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Likelihood state (pyPESTO / Raue et al. 2009 inspired)
  const [selectedParam, setSelectedParam] = useState<number>(0);
  const [profileResult, setProfileResult] = useState<ProfileLikelihoodResult | null>(null);
  const [isProfiling, setIsProfiling] = useState(false);

  const handleLoadDemo = () => {
    setErrorMsg('');
    setStatusMsg('Synthetisches Demonstrationsbeispiel geladen.');
    setCsvText(
      't,S,P\n0.0,1.000,0.000\n0.5,0.730,0.228\n1.0,0.533,0.360\n1.5,0.389,0.428\n2.0,0.284,0.457\n2.5,0.207,0.461\n3.0,0.151,0.449\n3.5,0.110,0.428\n4.0,0.081,0.401\n4.5,0.059,0.372\n5.0,0.043,0.343\n5.5,0.031,0.315\n6.0,0.023,0.288'
    );
    setProfileResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      setStatusMsg(`Datei "${file.name}" geladen.`);
      setErrorMsg('');
      setProfileResult(null);
    };
    reader.readAsText(file);
  };

  const handleRunFit = () => {
    setErrorMsg('');
    setStatusMsg('');
    setProfileResult(null);
    try {
      const rows = parseCsvData(csvText);
      const res = fitDataToModel(rows, model);
      setFitResult(res);
      setStatusMsg(
        `Optimierung erfolgreich abgeschlossen (${res.trainingCount} Trainingspunkte, ${res.holdoutCount} Prüfpunkte zurückgehalten).`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setFitResult(null);
    }
  };

  const handleComputeProfile = () => {
    if (!fitResult) return;
    setIsProfiling(true);
    try {
      const rows = parseCsvData(csvText);
      const prof = calculateProfileLikelihood(rows, selectedParam, fitResult.rates, model, 21);
      setProfileResult(prof);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProfiling(false);
    }
  };

  const handleExportPEtab = () => {
    try {
      const rows = parseCsvData(csvText);
      const petab = exportToPEtab(rows, fitResult);
      downloadFile(
        `petab_measurements_${model}.tsv`,
        petab.measurementsTsv,
        'text/tab-separated-values;charset=utf-8;'
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExportResult = () => {
    if (!fitResult) return;
    exportJson(`kinetik_fit_${model}_${timeUnit}.json`, {
      titel: 'PEA Kinetik - Datenanpassung',
      modell: fitResult.model,
      zeitEinheit: timeUnit,
      deklarierteDatenart: dataType,
      deklarierteHerkunft: source,
      anpassung: {
        geschätzteRaten: fitResult.rates,
        rateLabels: fitResult.model === 'M0' ? ['k1', 'k2'] : ['k1', 'k2', 'k3'],
        trainRMSE: fitResult.trainRMSE,
        holdoutRMSE: fitResult.holdoutRMSE,
        randloesung: fitResult.bound,
        aehnlicheLoesungsspannen: fitResult.nearRates,
        hinweis: 'Spannen ähnlicher Lösungen sind keine statistischen Konfidenzintervalle.',
      },
      vorhersagen: fitResult.predictions,
    });
  };

  return (
    <section id="daten" className="panel border-slate-700/80 bg-slate-900/60">
      <div className="section-head mb-3">
        <div>
          <span className="eyebrow">DATENVERGLEICH · LOKAL IM BROWSER</span>
          <h2>Passt ein Modell zu deinen Daten?</h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded">
          Client-Side Optimization
        </span>
      </div>

      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
        CSV mit <code>t,S,P</code>: Zeit, Substratanteil und Produktanteil zwischen 0 und 1. S darf leer bleiben.
        8–200 aufsteigende Zeitpunkte, Dezimalpunkt. Anfangsannahme: S(0)=1 und P(0)=0. 
        <strong> Dateien verbleiben lokal in deinem Browser und werden nicht an Server übertragen.</strong>
      </p>

      {/* Input Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
        <div>
          <label className="block text-slate-400 mb-1">Modell</label>
          <select
            id="fit-model"
            value={model}
            onChange={(e) => setModel(e.target.value as 'M1' | 'M0')}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
          >
            <option value="M1">M1: Parallelwege + Produktverlust (k₁, k₂, k₃)</option>
            <option value="M0">M0: Parallelwege ohne Produktverlust (k₃=0)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Zeitangaben</label>
          <select
            id="fit-unit"
            value={timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as 'model' | 's' | 'min')}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
          >
            <option value="model">Dimensionslose Modellzeit τ</option>
            <option value="s">Sekunden (s)</option>
            <option value="min">Minuten (min)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Datenart laut Einreicher</label>
          <select
            id="fit-kind"
            value={dataType}
            onChange={(e) => setDataType(e.target.value as typeof dataType)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
          >
            <option value="synthetic">Synthetisch / Demonstration</option>
            <option value="measured">Eigene Messdaten (nicht unabhängig geprüft)</option>
            <option value="literature">Literaturdaten (Quelle angeben)</option>
            <option value="unknown">Nicht verifiziert</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Herkunft / Quelle</label>
          <input
            id="fit-source"
            type="text"
            value={source}
            maxLength={500}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Messreihe oder Publikationsquelle"
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-slate-400 mb-1 font-mono">
          CSV-Datei hochladen (optional)
        </label>
        <input
          id="fit-file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
          className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-1 font-mono">
          CSV-Daten (Kopfzeile t,S,P)
        </label>
        <textarea
          id="fit-data"
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="t,S,P"
          className="w-full font-mono text-xs bg-slate-950 text-slate-200 border border-slate-800 rounded p-2 focus:outline-none focus:border-sky-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          id="fit-demo"
          type="button"
          onClick={handleLoadDemo}
          className="secondary-btn text-xs inline-flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" /> Synthetisches Beispiel laden
        </button>
        <button
          id="fit-run"
          type="button"
          onClick={handleRunFit}
          className="primary-btn text-xs inline-flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Modell anpassen
        </button>
        <button
          id="fit-export"
          type="button"
          onClick={handleExportResult}
          disabled={!fitResult}
          className="secondary-btn text-xs inline-flex items-center gap-1.5 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> Ergebnis speichern (JSON)
        </button>
        <button
          id="fit-petab"
          type="button"
          onClick={handleExportPEtab}
          className="secondary-btn text-xs inline-flex items-center gap-1.5"
          title="Exportiert TSV-Dateien nach dem offenen Standard PEtab (kein vollständiges validiertes PEtab-Projekt)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" /> PEtab-Tabellenentwurf exportieren (TSV)
        </button>
      </div>

      {statusMsg && (
        <p id="fit-status" className="text-xs text-emerald-400 font-mono mb-2" role="status">
          ✓ {statusMsg}
        </p>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-400 font-mono mb-2" role="alert">
          ✕ Fehler: {errorMsg}
        </p>
      )}

      {/* Fitting Results Overview */}
      {fitResult && (
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono mb-4 space-y-2">
          <div className="font-semibold text-slate-100 flex items-center justify-between">
            <span>Angepasste Raten ({timeUnit === 'model' ? 'τ⁻¹' : `${timeUnit}⁻¹`}):</span>
            <span className="text-[11px] text-slate-400">
              Train-RMSE: <strong className="text-sky-300">{fitResult.trainRMSE.toFixed(5)}</strong> · Prüf-RMSE:{' '}
              <strong className="text-emerald-300">{fitResult.holdoutRMSE.toFixed(5)}</strong>
            </span>
          </div>
          <div className="text-sky-300">
            {fitResult.model === 'M1' ? (
              <>
                k₁ = {fitResult.rates[0].toFixed(5)} · k₂ = {fitResult.rates[1].toFixed(5)} · k₃ ={' '}
                {fitResult.rates[2]?.toFixed(5)} (q = {(fitResult.rates[1] / fitResult.rates[0]).toFixed(3)}, r ={' '}
                {(fitResult.rates[2] / fitResult.rates[0]).toFixed(3)})
              </>
            ) : (
              <>
                k₁ = {fitResult.rates[0].toFixed(5)} · k₂ = {fitResult.rates[1].toFixed(5)} (q ={' '}
                {(fitResult.rates[1] / fitResult.rates[0]).toFixed(3)}, k₃ = 0)
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1">
            Spannen ähnlich guter Lösungen (Verlust ≤ 1,02 × Minimum):{' '}
            {fitResult.nearRates
              .map((r, i) => `k${i + 1} ∈ [${r[0].toFixed(4)}, ${r[1].toFixed(4)}]`)
              .join(' · ')}
            . <strong className="text-amber-300">Diese Spannen sind keine statistischen Konfidenzintervalle.</strong>
          </p>
        </div>
      )}

      {/* Residual Table */}
      {fitResult && (
        <div className="table-wrap mb-4">
          <table>
            <thead>
              <tr>
                <th>Zeit ({timeUnit})</th>
                <th>P eingegeben</th>
                <th>P Modell</th>
                <th>Abweichung ΔP</th>
                <th>Verwendung</th>
              </tr>
            </thead>
            <tbody id="fit-rows">
              {fitResult.predictions.map((p, idx) => {
                const diff = p.predicted.P - p.P;
                return (
                  <tr key={idx} className={p.holdout ? 'bg-slate-900/60' : ''}>
                    <td>{p.t.toFixed(2)}</td>
                    <td>{p.P.toFixed(3)}</td>
                    <td>{p.predicted.P.toFixed(3)}</td>
                    <td className={Math.abs(diff) > 0.05 ? 'text-amber-400' : 'text-slate-300'}>
                      {diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}
                    </td>
                    <td>
                      {p.holdout ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">Prüfpunkt (Holdout)</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Training</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile Likelihood Inspector (pyPESTO / Raue et al. 2009 inspired) */}
      {fitResult && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-100 m-0">
                Verlustprofil-Inspektor (heuristisch)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Konzept adaptiert von pyPESTO / Raue et al. (2009)
            </span>
          </div>

          <p className="text-slate-300 mb-3 leading-relaxed">
            Zeigt einen normierten Verlustprofil-Score bei Fixierung eines Parameters und erneuter Anpassung der übrigen Raten. Die Linie 3,84 dient nur als heuristische Referenz. Ohne geprüftes Messfehlermodell und geeignete statistische Voraussetzungen entstehen weder ein 95%-Konfidenzintervall noch ein Nachweis praktischer Identifizierbarkeit.
          </p>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <label className="text-slate-400 font-mono">Zu untersuchender Parameter:</label>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
            >
              <option value={0}>k₁ (Bildungsrate Produkt)</option>
              <option value={1}>k₂ (Substrat-Nebenverlust)</option>
              {fitResult.model === 'M1' && <option value={2}>k₃ (Produkt-Folgeverlust)</option>}
            </select>

            <button
              type="button"
              onClick={handleComputeProfile}
              disabled={isProfiling}
              className="primary-btn text-xs inline-flex items-center gap-1.5"
            >
              {isProfiling ? 'Berechne Profil...' : 'Profil-Likelihood berechnen'}
            </button>
          </div>

          {profileResult && (
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">
                  Profil für {profileResult.paramName} (Bestwert: {profileResult.bestVal.toFixed(4)})
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                    profileResult.identifiable
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  }`}
                >
                  {profileResult.identifiable
                    ? '✓ Referenz beidseitig überschritten (beidseitig beschränkt)'
                    : 'Referenz nicht beidseitig überschritten'}
                </span>
              </div>

              {/* SVG Profile Chart */}
              <div className="w-full h-36 bg-slate-950 rounded border border-slate-800 relative mb-2 p-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                  {/* Threshold line 3.84 */}
                  {(() => {
                    const maxChi = Math.max(10, ...profileResult.points.map((p) => p.deltaChi2));
                    const yThresh = 90 - (3.84 / maxChi) * 80;
                    const minX = profileResult.points[0].val;
                    const maxX = profileResult.points[profileResult.points.length - 1].val;

                    const pts = profileResult.points
                      .map((p, idx) => {
                        const x = 20 + ((p.val - minX) / (maxX - minX || 1)) * 360;
                        const y = 90 - (Math.min(maxChi, p.deltaChi2) / maxChi) * 80;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');

                    return (
                      <>
                        <line
                          x1="20"
                          y1={yThresh}
                          x2="380"
                          y2={yThresh}
                          stroke="#f59e0b"
                          strokeDasharray="4 2"
                          strokeWidth="1"
                        />
                        <text x="385" y={yThresh + 3} fill="#f59e0b" fontSize="8" fontFamily="monospace">
                          Referenz 3.84
                        </text>
                        <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={pts} />
                        {profileResult.points.map((p, i) => {
                          const x = 20 + ((p.val - minX) / (maxX - minX || 1)) * 360;
                          const y = 90 - (Math.min(maxChi, p.deltaChi2) / maxChi) * 80;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r={p.val === profileResult.bestVal ? 4 : 2}
                              fill={p.val === profileResult.bestVal ? '#10b981' : '#38bdf8'}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Untere Grenze: {profileResult.points[0].val.toFixed(4)}</span>
                <span className="text-emerald-400">Optimum: {profileResult.bestVal.toFixed(4)}</span>
                <span>Obere Grenze: {profileResult.points[profileResult.points.length - 1].val.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <details className="mt-4">
        <summary>Methode und Grenzen der Datenanpassung</summary>
        <p>
          Ungewichtete kleinste Quadrate, sechs Startpunkte und beschränkte Koordinatensuche im logarithmischen
          Ratenraum. Die ersten rund 80 % der Zeilen werden angepasst; spätere Zeilen bleiben für eine
          unabhängige Prüfung zurückgehalten. Keine Garantie des globalen Optimums. Raten-Suchgrenzen:
          exp(−12)/t<sub>max</sub> bis exp(8)/t<sub>max</sub>. Bei M0 ist k₃ fest 0.
        </p>
        <p>
          „Ähnliche Lösungen“ bedeutet Verlust ≤ 1,02 × bester Verlust + 10⁻⁸. Die zugehörigen Spannen sind
          keine Unsicherheitsintervalle. Messfehler, Wiederholungen, eine passende Fehlerverteilung und
          Profil-Likelihood wären für belastbare Parametersicherheit nötig. Eine passende Kurve beweist
          weder den Mechanismus noch eine Übertragbarkeit auf Al/Hg.
        </p>
      </details>
    </section>
  );
};
