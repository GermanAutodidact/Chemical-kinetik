/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SubstrateType } from '../types';
import { SUBSTRATES } from '../data/substrates';

interface ChemicalReactionViewerProps {
  substrate?: SubstrateType;
}

export const ChemicalReactionViewer: React.FC<ChemicalReactionViewerProps> = ({
  substrate = 'nitrostyrene',
}) => {
  const [activeStep, setActiveStep] = useState<'all' | 'substrate' | 'oxime' | 'product' | 'byproduct'>('all');
  const info = SUBSTRATES[substrate];
  const isP2NP = substrate === 'nitropropene';

  return (
    <section className="panel border-slate-700/60">
      <div className="section-head mb-4">
        <div>
          <span className="eyebrow">REAKTIONSNETZWERK &amp; ELEKTRONENBILANZ</span>
          <h2>
            Chemische Reaktionspfade: {info.name} → {info.productName}
          </h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              activeStep === 'all'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
            onClick={() => setActiveStep('all')}
          >
            Gesamtnetzwerk
          </button>
          <button
            type="button"
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              activeStep === 'oxime'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
            onClick={() => setActiveStep('oxime')}
          >
            Zwischenstufen
          </button>
          <button
            type="button"
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              activeStep === 'byproduct'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
            onClick={() => setActiveStep('byproduct')}
          >
            Konkurrenzreaktionen
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-6 leading-relaxed">
        Gesamtstöchiometrie der Zielreduktion:{' '}
        <strong className="text-slate-100 font-mono text-xs">
          1 Mol {info.name} + 6 e⁻ + 6 H⁺ → 1 Mol {info.productName} + 2 H₂O
        </strong>
        . Aluminium stellt pro Mol Metall formal 3 Elektronen bereit (theoretisch 2 Al pro Substratmolekül).
      </p>

      {/* Chemical Structure Cards with 2D SVG Diagrams */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 font-mono text-xs">
        {/* Step 1: Substrate */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            activeStep === 'all' || activeStep === 'substrate'
              ? 'bg-slate-900/90 border-slate-700 shadow-md'
              : 'opacity-40 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 uppercase text-[10px] tracking-wider mb-2">
            <span>Substrat (S)</span>
            <span className="text-slate-500">{info.molecularWeight} g/mol</span>
          </div>
          <div className="text-sm font-bold text-slate-100 mb-2">{info.name}</div>

          {/* SVG Molecular Formula */}
          <div className="bg-slate-950 p-3 rounded-lg flex items-center justify-center my-2 border border-slate-800/80">
            {isP2NP ? (
              <svg width="220" height="75" viewBox="0 0 220 75" aria-label="Strukturformel 1-Phenyl-2-nitropropen">
                {/* Benzene Ring */}
                <polygon points="35,18 52,28 52,48 35,58 18,48 18,28" fill="none" stroke="#79bdff" strokeWidth="2" />
                <circle cx="35" cy="38" r="10" fill="none" stroke="#79bdff" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Alkene chain */}
                <line x1="52" y1="38" x2="82" y2="38" stroke="#edf3fc" strokeWidth="2" />
                <line x1="82" y1="38" x2="108" y2="24" stroke="#edf3fc" strokeWidth="2" />
                <line x1="84" y1="34" x2="106" y2="21" stroke="#edf3fc" strokeWidth="1.5" />
                {/* Methyl branch on C2 */}
                <line x1="108" y1="24" x2="108" y2="52" stroke="#edf3fc" strokeWidth="2" />
                <text x="100" y="66" fill="#73d9c5" fontSize="11" fontWeight="bold">CH₃</text>
                {/* Nitro group */}
                <line x1="108" y1="24" x2="136" y2="12" stroke="#edf3fc" strokeWidth="2" />
                <text x="142" y="16" fill="#ffc478" fontSize="12" fontWeight="bold">NO₂</text>
              </svg>
            ) : (
              <svg width="200" height="70" viewBox="0 0 200 70" aria-label="Strukturformel beta-Nitrostyrol">
                {/* Benzene Ring */}
                <polygon points="35,15 52,25 52,45 35,55 18,45 18,25" fill="none" stroke="#79bdff" strokeWidth="2" />
                <circle cx="35" cy="35" r="10" fill="none" stroke="#79bdff" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Alkene chain */}
                <line x1="52" y1="35" x2="82" y2="35" stroke="#edf3fc" strokeWidth="2" />
                <line x1="82" y1="35" x2="105" y2="22" stroke="#edf3fc" strokeWidth="2" />
                <line x1="84" y1="31" x2="103" y2="19" stroke="#edf3fc" strokeWidth="1.5" />
                {/* Nitro group */}
                <line x1="105" y1="22" x2="135" y2="35" stroke="#edf3fc" strokeWidth="2" />
                <text x="140" y="39" fill="#ffc478" fontSize="12" fontWeight="bold">NO₂</text>
              </svg>
            )}
          </div>

          <div className="text-slate-400 font-sans text-xs mt-2">
            {isP2NP
              ? 'Konjugiertes Nitroalken mit Methylgruppe. Die Methylverzweigung schirmt die Doppelbindung sterisch ab.'
              : 'Konjugiertes aromatisches Nitroalken. Reagiert über Elektronentransfer an der Al/Hg-Grenzfläche.'}
          </div>
        </div>

        {/* Step 2: Intermediate Pool */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            activeStep === 'all' || activeStep === 'oxime'
              ? 'bg-slate-900/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
              : 'opacity-40 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 uppercase text-[10px] tracking-wider mb-2">
            <span>Zwischenpool (I)</span>
            <span className="text-emerald-500 font-mono">2e⁻ bis 4e⁻</span>
          </div>
          <div className="text-sm font-bold text-emerald-300 mb-2">
            {isP2NP ? 'Phenylaceton-oxim' : 'Phenylacetaldoxim'}
          </div>

          {/* SVG Molecular Formula */}
          <div className="bg-slate-950 p-3 rounded-lg flex items-center justify-center my-2 border border-slate-800/80">
            {isP2NP ? (
              <svg width="220" height="75" viewBox="0 0 220 75" aria-label="Strukturformel Phenylaceton-oxim">
                {/* Benzene Ring */}
                <polygon points="30,18 47,28 47,48 30,58 13,48 13,28" fill="none" stroke="#73d9c5" strokeWidth="2" />
                <circle cx="30" cy="38" r="10" fill="none" stroke="#73d9c5" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Alkyl and Ketoxime */}
                <line x1="47" y1="38" x2="72" y2="38" stroke="#edf3fc" strokeWidth="2" />
                <line x1="72" y1="38" x2="98" y2="25" stroke="#edf3fc" strokeWidth="2" />
                {/* Methyl branch on oxime carbon */}
                <line x1="98" y1="25" x2="98" y2="52" stroke="#edf3fc" strokeWidth="2" />
                <text x="90" y="66" fill="#73d9c5" fontSize="11" fontWeight="bold">CH₃</text>
                {/* Oxime bond */}
                <line x1="98" y1="25" x2="124" y2="15" stroke="#edf3fc" strokeWidth="2" />
                <line x1="99" y1="21" x2="123" y2="12" stroke="#edf3fc" strokeWidth="1.5" />
                <text x="130" y="19" fill="#73d9c5" fontSize="12" fontWeight="bold">N–OH</text>
              </svg>
            ) : (
              <svg width="200" height="70" viewBox="0 0 200 70" aria-label="Strukturformel Phenylacetaldoxim">
                {/* Benzene Ring */}
                <polygon points="30,15 47,25 47,45 30,55 13,45 13,25" fill="none" stroke="#73d9c5" strokeWidth="2" />
                <circle cx="30" cy="35" r="10" fill="none" stroke="#73d9c5" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Alkyl and Oxime */}
                <line x1="47" y1="35" x2="72" y2="35" stroke="#edf3fc" strokeWidth="2" />
                <line x1="72" y1="35" x2="95" y2="24" stroke="#edf3fc" strokeWidth="2" />
                <line x1="95" y1="24" x2="118" y2="35" stroke="#edf3fc" strokeWidth="2" />
                <line x1="96" y1="20" x2="117" y2="30" stroke="#edf3fc" strokeWidth="1.5" />
                <text x="122" y="39" fill="#73d9c5" fontSize="12" fontWeight="bold">N–OH</text>
              </svg>
            )}
          </div>

          <div className="text-slate-400 font-sans text-xs mt-2">
            {isP2NP
              ? 'Ketoxim-Zwischenstufe. Deutlich stabiler als das Aldoxim; erfordert stärkere Reduktionsbedingungen zum Amin.'
              : 'Kaskadenzwischenstufe. Wenn die Metalloberfläche passiviert, akkumulieren diese Stufen.'}
          </div>
        </div>

        {/* Step 3: Product */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            activeStep === 'all' || activeStep === 'product'
              ? 'bg-slate-900/90 border-sky-500/50 shadow-md ring-1 ring-sky-500/20'
              : 'opacity-40 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-sky-400 uppercase text-[10px] tracking-wider mb-2">
            <span>Endprodukt (P)</span>
            <span className="text-sky-500 font-mono">{info.productWeight} g/mol</span>
          </div>
          <div className="text-sm font-bold text-sky-200 mb-2">{info.productName}</div>

          {/* SVG Molecular Formula */}
          <div className="bg-slate-950 p-3 rounded-lg flex items-center justify-center my-2 border border-slate-800/80">
            {isP2NP ? (
              <svg width="220" height="75" viewBox="0 0 220 75" aria-label="Strukturformel Phenylpropan-2-amin">
                {/* Benzene Ring */}
                <polygon points="30,18 47,28 47,48 30,58 13,48 13,28" fill="none" stroke="#79bdff" strokeWidth="2" />
                <circle cx="30" cy="38" r="10" fill="none" stroke="#79bdff" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Propyl chain */}
                <line x1="47" y1="38" x2="75" y2="38" stroke="#edf3fc" strokeWidth="2" />
                <line x1="75" y1="38" x2="102" y2="24" stroke="#edf3fc" strokeWidth="2" />
                {/* Methyl on C2 */}
                <line x1="102" y1="24" x2="102" y2="52" stroke="#edf3fc" strokeWidth="2" />
                <text x="94" y="66" fill="#79bdff" fontSize="11" fontWeight="bold">CH₃</text>
                {/* Amino group */}
                <line x1="102" y1="24" x2="130" y2="14" stroke="#edf3fc" strokeWidth="2" />
                <text x="134" y="18" fill="#79bdff" fontSize="12" fontWeight="bold">NH₂</text>
              </svg>
            ) : (
              <svg width="200" height="70" viewBox="0 0 200 70" aria-label="Strukturformel Phenylethylamin">
                {/* Benzene Ring */}
                <polygon points="30,15 47,25 47,45 30,55 13,45 13,25" fill="none" stroke="#79bdff" strokeWidth="2" />
                <circle cx="30" cy="35" r="10" fill="none" stroke="#79bdff" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Ethylene chain */}
                <line x1="47" y1="35" x2="75" y2="35" stroke="#edf3fc" strokeWidth="2" />
                <line x1="75" y1="35" x2="105" y2="22" stroke="#edf3fc" strokeWidth="2" />
                <line x1="105" y1="22" x2="132" y2="35" stroke="#edf3fc" strokeWidth="2" />
                <text x="136" y="39" fill="#79bdff" fontSize="12" fontWeight="bold">NH₂</text>
              </svg>
            )}
          </div>

          <div className="text-slate-400 font-sans text-xs mt-2">
            Primäres Amin mit {isP2NP ? 'Chiralitätszentrum am C2-Atom' : 'unverzweigter Kette'}. Im
            Essigsäuremedium liegt es protoniert als Acetat-Salz vor.
          </div>
        </div>
      </div>

      {/* Competing side pathways */}
      <div
        className={`p-4 rounded-xl border text-xs font-sans transition-all ${
          activeStep === 'byproduct'
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/20'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold text-amber-300 mb-2">
          <span>Konkurrierende Verlust- und Zersetzungswege</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 text-xs">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">Wasserstoffentwicklung (W)</strong>
            <span className="font-mono text-sky-300 text-[11px]">2 H⁺ + 2 e⁻ → H₂ ↑</span>
            <p className="mt-1 text-slate-400">
              Parasitärer Metallabtrag durch Hydrolyse mit Wasser/Essigsäure ohne organischen Substratumsatz.
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">
              {isP2NP ? 'Oxim-Hydrolyse zu Phenylaceton (P2P)' : 'Substrat-Polymerisation (B)'}
            </strong>
            <span className="font-mono text-amber-300 text-[11px]">
              {isP2NP ? 'Oxim + H₂O → Phenyl-2-propanon' : 'n S → Polymere / Harze'}
            </span>
            <p className="mt-1 text-slate-400">
              {isP2NP
                ? 'Im wässrig-sauren Milieu kann das Ketoxim hydrolysieren und Ketonnebenprodukte bilden.'
                : 'Aktivierte Nitroalkene neigen bei schlechter Durchmischung oder Überhitzung zu irreversibler Verharzung.'}
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">Produktzersetzung &amp; Dimere (D)</strong>
            <span className="font-mono text-rose-300 text-[11px]">P + Zwischenstufen → Sekundäre Amine</span>
            <p className="mt-1 text-slate-400">
              Kondensation des gebildeten Amins mit intermediären Aldehyd-/Ketonspezies zu symmetrischen Nebenprodukten.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
