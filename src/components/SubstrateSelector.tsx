/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SubstrateType } from '../types';
import { SUBSTRATES } from '../data/substrates';
import { Atom, ArrowRight } from 'lucide-react';

interface SubstrateSelectorProps {
  currentSubstrate: SubstrateType;
  onChangeSubstrate: (sub: SubstrateType) => void;
}

export const SubstrateSelector: React.FC<SubstrateSelectorProps> = ({
  currentSubstrate,
  onChangeSubstrate,
}) => {
  return (
    <div className="p-3 bg-slate-900/90 rounded-xl border border-sky-500/30 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Atom className="w-4 h-4 text-sky-400" />
          <span>Stoffvergleich wählen:</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              currentSubstrate === 'nitrostyrene'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => onChangeSubstrate('nitrostyrene')}
          >
            β-Nitrostyrol (C₈H₇NO₂)
          </button>
          <button
            type="button"
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              currentSubstrate === 'nitropropene'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => onChangeSubstrate('nitropropene')}
          >
            1-Phenyl-2-nitropropen (C₉H₉NO₂)
          </button>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300 font-semibold">{SUBSTRATES[currentSubstrate].name}</span>
          <span className="text-slate-500">({SUBSTRATES[currentSubstrate].molecularWeight} g/mol)</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-400 inline mx-0.5" />
          <span className="text-sky-300 font-semibold">{SUBSTRATES[currentSubstrate].productName}</span>
          <span className="text-slate-500">({SUBSTRATES[currentSubstrate].productWeight} g/mol)</span>
        </div>
        <div className="text-[11px] text-amber-300/90 font-sans">
          Strukturvergleich · kein gemessener Reaktionsweg
        </div>
      </div>
    </div>
  );
};
