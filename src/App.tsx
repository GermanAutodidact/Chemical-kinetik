/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SubstrateType } from './types';
import { SUBSTRATES } from './data/substrates';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SubstrateSelector } from './components/SubstrateSelector';
import { ChemicalReactionViewer } from './components/ChemicalReactionViewer';
import { SubstrateComparisonSection } from './components/SubstrateComparisonSection';
import { ModelOverlayComparator } from './components/ModelOverlayComparator';
import { MetalModelSection } from './components/MetalModelSection';
import { SimpleModelSection } from './components/SimpleModelSection';
import { AdvancedModelSection } from './components/AdvancedModelSection';
import { TemperatureMatrixSection } from './components/TemperatureMatrixSection';
import { DataFitSection } from './components/DataFitSection';
import { ProvenanceSection } from './components/ProvenanceSection';
import { AiApiSection } from './components/AiApiSection';
import { ResearchSection } from './components/ResearchSection';
import { CalculationsSection } from './components/CalculationsSection';
import { AboutPlatformSection } from './components/AboutPlatformSection';
import { ContributeSection } from './components/ContributeSection';

export default function App() {
  const [substrate, setSubstrate] = useState<SubstrateType>('nitrostyrene');
  const info = SUBSTRATES[substrate];

  return (
    <>
      <Header />
      <main>
        {/* Intro */}
        <div className="intro">
          <div>
            <span className="eyebrow">KINETIK · MODELLVERGLEICH · EVIDENZ</span>
            <h1>Was lässt sich wirklich berechnen?</h1>
            <p>
              Abstrakte Modelle, Datenvergleich und beschreibender Stoffvergleich. Keine stoffbezogene Reaktionsprognose.
            </p>
          </div>
          <span
            className="status"
            title="Die in der Literatur verfügbaren Daten enthalten keinen experimentell validierten kinetischen Parametersatz für dieses spezifische heterogene System."
          >
            Reale Prognose: nicht kalibriert
          </span>
        </div>

        {/* 1. Substrate Selector: Immediately interactive at top */}
        <SubstrateSelector
          currentSubstrate={substrate}
          onChangeSubstrate={setSubstrate}
        />

        {/* 2. Chemical Pathways with 2D Vector Structures */}
        <div id="reaktionspfade">
          <p>Die Stoffauswahl betrifft ausschließlich den beschreibenden Vergleich. Die Modelle darunter verwenden unabhängige hypothetische Parameter.</p>
        </div>

        {/* Navigation */}
        <nav className="main-nav" aria-label="Abschnitte">
          <a href="#reaktionspfade">Chemische Pfade</a>
          <a href="#stoffvergleich">Stoffvergleich</a>
          <a href="#metall">Metall &amp; Produkt (M3)</a>
          <a href="#modell">Kinetikvergleich (M1)</a>
          <a href="#analyse">Neue Analyse (M2)</a>
          <a href="#daten">Datenvergleich</a>
          <a href="#herkunft">Herkunft &amp; Status</a>
          <a href="#matrix">Temperaturmatrix</a>
          <a href="#ai-api">KI &amp; MCP-Server</a>
          <a href="#mitmachen">Quellcode &amp; Feedback</a>
        </nav>

        {/* 3. Section 11: Chemischer Stoffvergleich (β-Nitrostyrol vs. 1-Phenyl-2-nitropropen) */}
        <SubstrateComparisonSection />

        {/* 4. Model Overlay Comparator: M1 vs M2 */}
        <ModelOverlayComparator />

        {/* 5. Section 5: Metall & Produkt (M3) */}
        <MetalModelSection />

        {/* 6. Section 3: Kinetischer Modellvergleich (M1) */}
        <SimpleModelSection />

        {/* 7. Section 4: Neue Analyse / Sensitivität (M2 mit Tornado-Chart & Jacobi SVD) */}
        <AdvancedModelSection />

        {/* 8. Section 7: Lokaler Datenvergleich & Fitting (M0/M1 Bounded Search) */}
        <DataFitSection />

        {/* 9. Section 2: Wissenschaftliche Herkunft der Zahlen (Provenance Table) */}
        <ProvenanceSection />

        {/* 10. Section 2: Temperaturmatrix & Arrhenius-Simulator */}
        <TemperatureMatrixSection />

        {/* 11. Section 8 & 9: KI-Zugriff, MCP-Server & REST API */}
        <AiApiSection />

        {/* 12. Section: Forschungsstand */}
        <ResearchSection />

        {/* 13. Section: Rechenweg */}
        <CalculationsSection />

        {/* 14. Section 1: Systemarchitektur & Open Source */}
        <AboutPlatformSection />

        {/* 15. Section 10: Öffentliche Verbesserungsvorschläge (SQLite) & Quellcode-Download */}
        <ContributeSection />

        <Footer />
      </main>
    </>
  );
}
