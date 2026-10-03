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
          <caption>Gegenüberstellung chemischer Strukturmerkmale und mechanistischer Hypothesen</caption>
          <thead>
            <tr>
              <th>Eigenschaft / Kategorie</th>
              <th>trans-β-Nitrostyrol</th>
              <th>(E)-1-Phenyl-2-nitropropen (P2NP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>IUPAC-Name (Strukturmerkmal)</strong></td>
              <td>(E)-(2-Nitroethenyl)benzol</td>
              <td>(E)-(2-Nitroprop-1-en-1-yl)benzol</td>
            </tr>
            <tr>
              <td><strong>CAS-Nummer &amp; Summenformel</strong></td>
              <td>102-96-5 · C₈H₇NO₂ (149,15 g/mol)</td>
              <td>705-60-2 · C₉H₉NO₂ (163,17 g/mol)</td>
            </tr>
            <tr>
              <td><strong>C=C Doppelbindungssubstitution</strong></td>
              <td>Unsubstituiert am β-Kohlenstoff (−CH=CH−NO₂)</td>
              <td>Methylsubstituiert am C2-Atom (−CH=C(CH₃)−NO₂)</td>
            </tr>
            <tr>
              <td><strong>Zielprodukt (formale 6 e⁻ Reduktion)</strong></td>
              <td>2-Phenylethylamin (PEA, 121,18 g/mol)</td>
              <td>1-Phenylpropan-2-amin (135,21 g/mol)</td>
            </tr>
            <tr>
              <td><strong>Postulierte Zwischenstufen (Hypothese)</strong></td>
              <td>Aldoxim-Pool (Phenylacetaldoxim; nicht isoliert gemessen)</td>
              <td>Ketoxim-Pool (Phenylaceton-oxim; nicht isoliert gemessen)</td>
            </tr>
            <tr>
              <td><strong>Konformative Auswirkung der Substitution</strong></td>
              <td>Geringe sterische Hinderung; planare Konjugation mit Phenylring</td>
              <td>Sterischer Raumanspruch der Methylgruppe; Torsion der Doppelbindung</td>
            </tr>
            <tr>
              <td><strong>Postulierte Nebenwege (unbestätigte Hypothesen)</strong></td>
              <td>Mögliche Oligomerisation / Kondensation bei Erwärmung</td>
              <td>Mögliche säurekatalysierte Oxim-Hydrolyse zu Phenyl-2-propanon (P2P)</td>
            </tr>
            <tr>
              <td><strong>Gemessene kinetische Konstanten für Al/Hg</strong></td>
              <td className="text-amber-300 font-mono text-[11px]">Keine geprüften Daten verfügbar</td>
              <td className="text-amber-300 font-mono text-[11px]">Keine geprüften Daten verfügbar</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scientific Explanation of Non-transferability */}
      <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 pt-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Trennung von Strukturmerkmalen, mechanistischen Hypothesen und Messdaten
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">1. Postulierte Zwischenstufen (Aldoxim vs. Ketoxim)</strong>
            <p className="text-slate-400">
              Die Annahme intermediärer Oximstufen stammt aus homogenen Modellreaktionen (z. B. Hydrierungen oder Borhydrid-Reduktionen). 
              Für das heterogene, frei korrodierende Al/Hg-System in Essigsäure/Wasser liegen jedoch keine zeitaufgelösten 
              Konzentrationsmessungen vor. Aussagen über eine pauschal „höhere Reduktionsresistenz“ oder „kleinere Geschwindigkeitskonstanten“ 
              von Ketoximen sind unbestätigte Hypothesen und keine für dieses System nachgewiesenen Parameter.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">2. Sterische Effekte und Grenzflächenwechselwirkung</strong>
            <p className="text-slate-400">
              Die zusätzliche Methylgruppe an P2NP stellt ein eindeutiges sterisches Strukturmerkmal dar. 
              Daraus darf jedoch keine quantitative Aussage über eine „verringerte Adsorptionsenthalpie“ oder konkrete 
              Oberflächenkonstanten ($a_0, m$) abgeleitet werden: Adsorptionsenthalpien und Transporthemmungen wurden für dieses 
              Mehrphasengemisch experimentell nicht bestimmt.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">3. Hypothetische Konkurrenz- und Zersetzungswege</strong>
            <p className="text-slate-400">
              Mögliche Nebenreaktionen wie die Hydrolyse zu Phenylaceton oder Kondensationsreaktionen sind plausible mechanistische 
              Vorschläge aus der Literatur. Quantitative Verzweigungsverhältnisse ($q$ und $r$) sind jedoch weder für β-Nitrostyrol 
              noch für P2NP experimentell kalibriert. Die Modelle weisen abstrakten Gleichungen keine erfundenen substanzspezifischen Werte zu.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-slate-200 block mb-1">4. Methodisches Fazit: Rein deskriptiver Vergleich</strong>
            <p className="text-slate-400">
              Dieser Vergleich bleibt strikt deskriptiv. Kinetische Konstanten dürfen nicht zwischen verschiedenen Substraten 
              übertragen werden. Die Plattform liefert keine stoffbezogenen Synthese- oder Dosierungsanleitungen, keine 
              Reaktionsdauerberechnungen und keine Prozessoptimierung zur Amphetaminherstellung.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
