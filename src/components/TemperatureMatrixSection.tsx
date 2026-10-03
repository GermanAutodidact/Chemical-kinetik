/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { exportMarkdown, exportCsv } from '../utils/export';
import { BERICHT_MARKDOWN } from '../data/reports';
import { Flame, AlertTriangle, Thermometer } from 'lucide-react';

export const TemperatureMatrixSection: React.FC = () => {
  const [hypoEa, setHypoEa] = useState<number>(55); // kJ/mol

  const handleDownloadReport = (e: React.MouseEvent) => {
    e.preventDefault();
    exportMarkdown('bericht_pea_kinetik_evidenz.md', BERICHT_MARKDOWN);
  };

  const handleDownloadMatrixCsv = (e: React.MouseEvent) => {
    e.preventDefault();
    const rows = [
      ['20 °C', '293,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
      ['50 °C', '323,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
      ['70 °C', '343,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
      ['90 °C', '363,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
    ];
    exportCsv('matrix.csv', ['Temperatur', 'Kelvin', 't = 0', 't1 > 0', 't2 > t1', 'Kipppunkt'], rows);
  };

  // Arrhenius calculations
  // k(T) / k(T_ref) = exp(-Ea/R * (1/T - 1/T_ref))
  const R = 8.314462618;
  const T_ref = 273.15 + 20; // 293.15 K
  const Ea_J = hypoEa * 1000;

  const temps = [
    { label: '20 °C', kelvin: 293.15 },
    { label: '50 °C', kelvin: 323.15 },
    { label: '70 °C', kelvin: 343.15 },
    { label: '90 °C', kelvin: 363.15 },
  ];

  const calcRateFactor = (T: number) => {
    return Math.exp((-Ea_J / R) * (1 / T - 1 / T_ref));
  };

  return (
    <section id="matrix" className="panel">
      <div className="section-head">
        <div>
          <span className="eyebrow">ERGEBNIS FÜR DAS ANGEFRAGTE SYSTEM</span>
          <h2>Vier Temperaturen. Noch keine belastbare Zeitkurve.</h2>
        </div>
        <button
          type="button"
          className="textlink text-sky-400 hover:text-sky-300"
          onClick={handleDownloadReport}
          title="Vollständigen Forschungsbericht im Markdown-Format herunterladen"
        >
          Bericht speichern
        </button>
      </div>

      <p>
        In den zugänglichen, geprüften Quellen wurde kein passender kinetischer Parametersatz gefunden.
        „Offen“ bezeichnet fehlende Daten, keine Ausbeute von 0 %.
      </p>

      <div className="table-wrap">
        <table>
          <caption>
            Analytische PEA-Ausbeute, Start ohne PEA. Positive Zeiten bleiben symbolisch, weil keine
            Zeitskala bestimmt ist.
          </caption>
          <thead>
            <tr>
              <th scope="col">Temperatur</th>
              <th scope="col">Kelvin</th>
              <th scope="col">t = 0</th>
              <th scope="col">t₁ &gt; 0</th>
              <th scope="col">t₂ &gt; t₁</th>
              <th scope="col">Kipppunkt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">20 °C</th>
              <td>293,15 K</td>
              <td>0 %*</td>
              <td>Offen</td>
              <td>Offen</td>
              <td>Nicht bestimmt</td>
            </tr>
            <tr>
              <th scope="row">50 °C</th>
              <td>323,15 K</td>
              <td>0 %*</td>
              <td>Offen</td>
              <td>Offen</td>
              <td>Nicht bestimmt</td>
            </tr>
            <tr>
              <th scope="row">70 °C</th>
              <td>343,15 K</td>
              <td>0 %*</td>
              <td>Offen</td>
              <td>Offen</td>
              <td>Nicht bestimmt</td>
            </tr>
            <tr>
              <th scope="row">90 °C</th>
              <td>363,15 K</td>
              <td>0 %*</td>
              <td>Offen</td>
              <td>Offen</td>
              <td>Nicht bestimmt</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="small">
        *Anfangsbedingung, kein Messergebnis. Für t &gt; 0 ist ohne zusätzliche Information nur die
        triviale Stoffbilanzgrenze 0–100 % verfügbar; sie ist kein Konfidenzintervall. Isolierte
        Ausbeute benötigt zusätzlich den Rückgewinnungsfaktor.
      </p>

      {/* Upgraded Arrhenius Hypothesis Simulator */}
      <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100 m-0">
              Hypothesen-Rechner: Arrhenius-Ratenbeschleunigung &amp; Thermisches Risiko
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-300">
            k(T) / k(20°C) = exp[−(E_a/R)(1/T − 1/293.15)]
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-3">
          Wähle eine hypothetische Aktivierungsenergie Eₐ, um zu sehen, wie drastisch die
          Reaktionsgeschwindigkeit mit der Temperatur ansteigt und ab wann ein thermisches Durchgehen
          (Thermal Runaway) droht:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-400 block mb-1 font-mono">
              Hypothetische Aktivierungsenergie Eₐ: <span className="text-amber-300 font-bold">{hypoEa} kJ/mol</span>
            </label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={hypoEa}
              onChange={(e) => setHypoEa(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded hover:bg-slate-800"
              onClick={() => setHypoEa(40)}
            >
              Niedrig (40 kJ/mol)
            </button>
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 text-amber-300 rounded hover:bg-slate-800"
              onClick={() => setHypoEa(55)}
            >
              Typisch (55 kJ/mol)
            </button>
            <button
              type="button"
              className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 text-rose-300 rounded hover:bg-slate-800"
              onClick={() => setHypoEa(75)}
            >
              Hoch (75 kJ/mol)
            </button>
          </div>
        </div>

        {/* Temperature Factor Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          {temps.map((item) => {
            const factor = calcRateFactor(item.kelvin);
            const isHigh = factor > 20;
            const isMedium = factor > 6 && factor <= 20;

            return (
              <div
                key={item.label}
                className={`p-3 rounded-lg border ${
                  isHigh
                    ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                    : isMedium
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200'
                }`}
              >
                <div className="text-xs text-slate-400">{item.label}</div>
                <div className="text-lg font-bold my-1">
                  {factor.toFixed(1).replace('.', ',')} ×
                </div>
                <div className="text-[10px] uppercase tracking-wider font-sans">
                  {isHigh ? (
                    <span className="flex items-center justify-center gap-1 text-rose-400 font-semibold">
                      <Flame className="w-3 h-3" /> Durchgeh-Gefahr
                    </span>
                  ) : isMedium ? (
                    <span className="flex items-center justify-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3" /> Starke Kühlung nötig
                    </span>
                  ) : (
                    <span className="text-slate-400">Kontrollierbar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 flex gap-3 flex-wrap">
        <button
          type="button"
          className="secondary-btn text-xs"
          onClick={handleDownloadMatrixCsv}
        >
          Temperaturmatrix als CSV herunterladen
        </button>
      </div>
    </section>
  );
};
