/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { parseCsvData, fitDataToModel, FitResult } from '../utils/fit';
import { exportJson } from '../utils/export';
import { Play, Download, Sparkles, AlertCircle } from 'lucide-react';

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

  const handleLoadDemo = () => {
    setErrorMsg('');
    setStatusMsg('Synthetisches Demonstrationsbeispiel geladen.');
    setCsvText(
      't,S,P\n0.0,1.000,0.000\n0.5,0.730,0.228\n1.0,0.533,0.360\n1.5,0.389,0.428\n2.0,0.284,0.457\n2.5,0.207,0.461\n3.0,0.151,0.449\n3.5,0.110,0.428\n4.0,0.081,0.401\n4.5,0.059,0.372\n5.0,0.043,0.343\n5.5,0.031,0.315\n6.0,0.023,0.288'
    );
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
    };
    reader.readAsText(file);
  };

  const handleRunFit = () => {
    setErrorMsg('');
    setStatusMsg('');
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

      <details>
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
