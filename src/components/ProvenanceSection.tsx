/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Database } from 'lucide-react';

export const ProvenanceSection: React.FC = () => {
  return (
    <section id="herkunft" className="panel border-slate-700/80 bg-slate-900/60">
      <div className="section-head mb-3">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-sky-400">
            <Database className="w-3.5 h-3.5" />
            HERKUNFT DER ZAHLEN &amp; METHODISCHE EINORDNUNG
          </span>
          <h2>Annahme, Ableitung oder Messung?</h2>
        </div>
        <a
          href="/provenance.json"
          target="_blank"
          rel="noreferrer"
          className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-800 text-sky-300 rounded inline-flex items-center gap-1 hover:bg-slate-900 transition-colors"
        >
          Herkunftsregister (JSON) <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="table-wrap mb-4 font-sans text-xs">
        <table>
          <caption>Klassifikation aller Modellgrößen und Parameter</caption>
          <thead>
            <tr>
              <th>Größe / Parameter</th>
              <th>Status</th>
              <th>Gültigkeit &amp; Herkunft</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>M1: q, r</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">Angenommen</span></td>
              <td>Frei gewählte dimensionslose Ratenverhältnisse (k₂/k₁ und k₃/k₁). Keine realen Labordaten.</td>
            </tr>
            <tr>
              <td><strong>M2: a₀, λ, m, u, q, r</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">Angenommen</span></td>
              <td>Illustrative Hypothesenparameter. Keine experimentell gemessenen Al/Hg-Grenzflächenwerte.</td>
            </tr>
            <tr>
              <td><strong>M3: C₀, J₀, η, K</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">Angenommen</span></td>
              <td>Hypothetische Kapazitätsbilanz. Stellt keine Stöchiometrie- oder Dosierungsempfehlung dar.</td>
            </tr>
            <tr>
              <td><strong>Geometrieexponenten α = 0 und 2/3</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[11px]">Mathematisch abgeleitet</span></td>
              <td>Gilt streng nur innerhalb der gewählten idealisierten Grenzgeometrien (flache Folie vs. formähnlicher 3D-Körper).</td>
            </tr>
            <tr>
              <td><strong>Temperaturpunkte (20, 50, 70, 90 °C)</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">Aufgabenvorgabe</span></td>
              <td>Keine gemessenen Reaktionsverläufe; alle Zeitkurven bleiben sachgerecht als „Offen“ deklariert.</td>
            </tr>
            <tr>
              <td><strong>Kurven, Maxima, Ratenkreuzungen</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">Berechnet</span></td>
              <td>Mathematische Konsequenzen des jeweils gewählten Modells und der eingestellten Parameter.</td>
            </tr>
            <tr>
              <td><strong>Eingelesene CSV-Daten</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px]">Vom Nutzer deklariert</span></td>
              <td>Herkunft und Datenart werden beim Export mitgeführt; nicht unabhängig laboranalytisch verifiziert.</td>
            </tr>
            <tr>
              <td><strong>Angepasste Raten (k₁, k₂, k₃)</strong></td>
              <td><span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[11px]">Numerisch geschätzt</span></td>
              <td>Hängen direkt von Modellwahl, Zeiteinheiten und Datenqualität ab. Keine Allgemeingültigkeit.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
        <strong className="text-slate-100 block mb-1">Welche zusätzliche Information würde welche Unsicherheit auflösen?</strong>
        <p className="text-slate-400">
          Substratzeitreihen trennen organischen Substratverbrauch von der Zielproduktbildung; Zwischenproduktdaten
          (spektroskopische Detektion von Oximen und Hydroxylaminen) prüfen eine verzögerte Bildung.
          Unabhängige Grenzflächen- und Stofftransportmessungen können die im Modell analytisch nachgewiesene
          Mehrdeutigkeit ($a_0$ vs. $m$) auflösen. Dies ist eine methodische Einordnung, keine Handlungsanleitung.
        </p>
      </div>
    </section>
  );
};
