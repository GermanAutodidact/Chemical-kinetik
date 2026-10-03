/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, BookOpen, Layers } from 'lucide-react';

export const SubstrateComparisonSection: React.FC = () => {
  return (
    <section id="stoffvergleich" className="panel border-slate-700/80 bg-slate-900/60">
      <div className="section-head mb-4">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-sky-400">
            <BookOpen className="w-3.5 h-3.5" />
            CHEMISCHER STOFFVERGLEICH &amp; STRUKTURWIRKUNG
          </span>
          <h2>Vergleich: β-Nitrostyrol vs. 1-Phenyl-2-nitropropen (P2NP)</h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded">
          Deskriptive Chemie
        </span>
      </div>

      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs mb-5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Wichtige methodische Trennung:</strong> Dieser Abschnitt dient ausschließlich dem 
          qualitativen chemischen Struktur- und Reaktivitätsvergleich. Die in dieser Webanwendung 
          dargestellten mathematischen Modelle (M1, M2, M3) sind <em>dimensionslose, abstrakte Modellkaskaden</em> 
          und stellen <strong>keine chemische Kalibrierung, Dosierungsrechnung, Reaktionsdauer- oder Ausbeuteprognose</strong> dar. 
          Es werden ausdrücklich keine stoffbezogenen Syntheseanleitungen, Dosierungen oder Prozessoptimierungen bereitgestellt.
        </div>
      </div>

      {/* Comparison Table */}
      <div className="table-wrap mb-5">
        <table>
          <caption>Gegenüberstellung chemischer und molekularer Kennzahlen</caption>
          <thead>
            <tr>
              <th>Eigenschaft</th>
              <th>trans-β-Nitrostyrol</th>
              <th>(E)-1-Phenyl-2-nitropropen (P2NP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>IUPAC-Name</strong></td>
              <td>(E)-(2-Nitroethenyl)benzol</td>
              <td>(E)-(2-Nitroprop-1-en-1-yl)benzol</td>
            </tr>
            <tr>
              <td><strong>CAS-Nummer</strong></td>
              <td>102-96-5</td>
              <td>705-60-2</td>
            </tr>
            <tr>
              <td><strong>Summenformel &amp; Molmasse</strong></td>
              <td>C₈H₇NO₂ (149,15 g/mol)</td>
              <td>C₉H₉NO₂ (163,17 g/mol)</td>
            </tr>
            <tr>
              <td><strong>Doppelbindungssubstitution</strong></td>
              <td>Unsubstituiert am β-Kohlenstoff (−CH=CH−NO₂)</td>
              <td>Methylsubstituiert am C2-Atom (−CH=C(CH₃)−NO₂)</td>
            </tr>
            <tr>
              <td><strong>Primäres Reduktionsprodukt</strong></td>
              <td>2-Phenylethylamin (PEA, 121,18 g/mol)</td>
              <td>1-Phenylpropan-2-amin (135,21 g/mol)</td>
            </tr>
            <tr>
              <td><strong>Intermediäre Zwischenstufe</strong></td>
              <td>Phenylacetaldoxim (Aldoxim)</td>
              <td>1-Phenylpropan-2-on-oxim (Ketoxim)</td>
            </tr>
            <tr>
              <td><strong>Sterische &amp; elektronische Effekte</strong></td>
              <td>Geringe sterische Abschirmung; weitgehend planare Konjugation mit dem Phenylring</td>
              <td>Verdrillung des konjugierten π-Systems durch sterischen Raumanspruch der Methylgruppe; +I-Effekt</td>
            </tr>
            <tr>
              <td><strong>Charakteristischer Nebenweg</strong></td>
              <td>Substratverharzung / Oligomerisation bei Überhitzung</td>
              <td>Säurekatalysierte Hydrolyse des Ketoxims zu Phenyl-2-propanon (P2P)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scientific Explanation of Non-transferability */}
      <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 pt-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Warum kinetische Parameter nicht zwischen beiden Substraten übertragbar sind
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">1. Unterschiedliche Zwischenstufen-Kinetik (Aldoxim vs. Ketoxim)</strong>
            <p className="text-slate-400">
              Bei der Reduktion von β-Nitrostyrol entsteht intermediär ein <em>Aldoxim</em> (Phenylacetaldoxim). 
              Bei 1-Phenyl-2-nitropropen entsteht durch die Methylgruppe ein <em>Ketoxim</em> (Phenylaceton-oxim). 
              Ketoxime weisen eine signifikant höhere thermodynamische und kinetische Reduktionsresistenz auf als Aldoxime. 
              Die Geschwindigkeitskonstante des zweiten Reduktionsschritts (vom Oxim zum Amin) ist daher bei Ketoximen deutlich kleiner, 
              was zu einem ausgeprägten Zwischenstufenstau führen kann.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">2. Sterische Abschirmung und Adsorption</strong>
            <p className="text-slate-400">
              Die heterogene Reduktion an amalgamierten Metalloberflächen erfordert die Adsorption des Nitroalkens an aktiven Zentren. 
              Die zusätzliche Methylgruppe an P2NP behindert die flache planare Annäherung sterisch und verringert die Adsorptionsenthalpie. 
              Effektive Transport- und Oberflächenkonstanten ($a_0, m$) verändern sich grundlegend.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">3. Abweichende Hydrolyse- und Zersetzungswege</strong>
            <p className="text-slate-400">
              In saurem wässrigem Essigsäuremedium hydrolysiert das Phenylaceton-Ketoxim bei unzureichendem Elektronennachschub leicht 
              zum Keton (Phenyl-2-propanon). Beim unsubstituierten Aldoxim führt ein analoger Abbau primär zu Phenylacetaldehyd, 
              der rasch zu Polymeren kondensiert. Die Verzweigungsverhältnisse $q$ und $r$ sind somit strukturell inkompatibel.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">4. Fazit zur Übertragbarkeit</strong>
            <p className="text-slate-400">
              Jedes reaktionskinetische Modell muss für das jeweilige Substrat und das konkrete Mehrphasensystem separat 
              durch experimentelle Messreihen (spektroskopische Konzentrations-Zeit-Profile) kalibriert werden. 
              Eine Übernahme numerischer Ratenkonstanten oder Aktivierungsenergien zwischen beiden Systemen ist physikochemisch unbegründet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
