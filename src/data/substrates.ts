/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SubstrateInfo, SubstrateType } from '../types';

export const SUBSTRATES: Record<SubstrateType, SubstrateInfo> = {
  nitrostyrene: {
    id: 'nitrostyrene',
    name: 'β-Nitrostyrol',
    iupacName: '(E)-(2-Nitrovinyl)benzol',
    chemicalFormula: 'C₈H₇NO₂',
    molecularWeight: 149.15,
    productName: 'Phenylethylamin (PEA)',
    productIupac: '2-Phenylethan-1-amin',
    productFormula: 'C₈H₁₁N',
    productWeight: 121.18,
    intermediateName: 'Postulierte Zwischenstufen (Aldoxim/Hydroxylamin)',
    intermediateFormula: 'PhCH₂–CH=NOH',
    byproductNote: 'Hypothetische Nebenwege: Mögliche Kondensation zum Harz und unproduktiver Nebenverbrauch; für Al/Hg unkalibriert.',
    electronsRequired: 6,
    protonsRequired: 6,
    eyebrowText: 'β-NITROSTYROL → PHENYLETHYLAMIN',
  },
  nitropropene: {
    id: 'nitropropene',
    name: '1-Phenyl-2-nitropropen (P2NP)',
    iupacName: '(E)-(2-Nitroprop-1-en-1-yl)benzol',
    chemicalFormula: 'C₉H₉NO₂',
    molecularWeight: 163.17,
    productName: 'Phenylpropan-2-amin (Amphetamin)',
    productIupac: '1-Phenylpropan-2-amin',
    productFormula: 'C₉H₁₃N',
    productWeight: 135.21,
    intermediateName: 'Postulierte Zwischenstufen (Ketoxim/P2P)',
    intermediateFormula: 'PhCH₂–C(CH₃)=NOH',
    byproductNote: 'Hypothetische Nebenwege: Mögliche Oxim-Hydrolyse und Konkurrenzreaktionen; für Al/Hg unkalibriert.',
    electronsRequired: 6,
    protonsRequired: 6,
    eyebrowText: '1-PHENYL-2-NITROPROPEN → PHENYLPROPAN-2-AMIN',
  },
};
