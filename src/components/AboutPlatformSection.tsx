/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  GitPullRequest, 
  Code2, 
  HelpCircle,
  FileCode,
  Layers
} from 'lucide-react';

export const AboutPlatformSection: React.FC = () => {
  return (
    <section 
      id="ueberblick" 
      className="panel border-slate-700/80 bg-slate-950/70"
      data-ai-role="system-documentation"
      data-ai-purpose="Transparent chemical kinetics simulation & evidence analysis for beta-nitrostyrene and 1-phenyl-2-nitropropene reduction with aluminum amalgam"
    >
      {/* AI_AGENT_METADATA_START
        Platform Name: PEA & Amphetamine Kinetics Evidence Platform
        Substrates Supported:
          1. beta-Nitrostyrene -> 2-Phenylethanamine (PEA) [MW: 149.15 -> 121.18 g/mol]
          2. 1-Phenyl-2-nitropropene (P2NP) -> 1-Phenylpropan-2-amine (Amphetamine) [MW: 163.17 -> 135.21 g/mol]
        Models Implemented:
          - M3: Metal capacity balance & depletion endpoint (foil alpha=0 vs shrinking body alpha=2/3)
          - M1: Analytical cascade S -> P -> D & S -> B, peak calculation, side rate takeover
          - M2: Extended RK4 with surface deactivation lambda, transport m, intermediate pool, Tornado RMS sensitivities, SVD rank
          - Arrhenius: Relative rate factor calculation (20, 50, 70, 90 °C; no thermal runaway claims)
          - MCP Server: JSON-RPC 2.0 endpoint at /api/mcp with tools pea_simulate_m1, pea_simulate_m2, pea_simulate_m3, pea_arrhenius
          - OpenAPI: Specification at /api/openapi.json
        License & Expansion: Open Source - code may be extended, calibrated with empirical data, or integrated into AI pipelines.
      AI_AGENT_METADATA_END */}

      <div className="section-head mb-3">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-sky-400">
            <HelpCircle className="w-3.5 h-3.5" />
            SYSTEMDOKUMENTATION &amp; ARCHITEKTUR
          </span>
          <h2>Wofür diese Plattform da ist &amp; wie sie erweitert werden kann</h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-900 text-slate-300 border border-slate-800 rounded">
          Open Science · KI-Ready
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        Diese Plattform ist ein <strong>transparentes wissenschaftliches Referenzwerkzeug</strong> zur
        Untersuchung der heterogenen Reduktion von <strong>β-Nitrostyrol</strong> und{' '}
        <strong>1-Phenyl-2-nitropropen (P2NP)</strong> mit Aluminiumamalgam. Sie ersetzt spekulative
        Rezepturaussagen durch prüfbare mathematische Modellstufen (M1, M2, M3), Identifizierbarkeitsanalysen
        und offene Schnittstellen für Forscher und KI-Systeme.
      </p>

      {/* Accordion for System Features */}
      <details className="mt-4">
        <summary className="text-xs font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400 inline" />
          Detaillierte Funktionsübersicht &amp; Modellspezifikation anzeigen
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 font-sans">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-slate-100 block mb-1">Beschreibender Stoffvergleich</strong>
            Beschreibender Vergleich der beiden Moleküle. Die Auswahl verändert keine Modellparameter und liefert keine Anleitung zur Reduktion.
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-slate-100 block mb-1">Modell M3 · Kapazitätsbilanz</strong>
            Berechnet τ_Metall, differenziert Folien- vs. 3D-Körper-Geometrie und trennt produktive Elektronen von unproduktivem Nebenverbrauch W (nicht belegt als reiner H₂-Verlust).
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-slate-100 block mb-1">Modell M1 · Kinetische Kaskade</strong>
            Analytische geschlossene Lösung, Berechnung des Ausbeutemaximums und Ermittlung der Ratenkreuzung von Bildungs- und Verlustraten.
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-slate-100 block mb-1">Modell M2 · Mehrschrittkinetik (RK4) &amp; SVD</strong>
            Numerische Integration, Tornado-Sensitivitätsdiagramm und Singulärwertzerlegung zur Identifizierbarkeitsanalyse.
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-slate-100 block mb-1">Arrhenius-Ratenfaktorrechner</strong>
            Berechnet theoretische Ratenbeschleunigung k(T)/k(20 °C) bei 20, 50, 70 und 90 °C für hypothetische Aktivierungsenergien; keine unbegründeten thermischen Stabilitäts- oder Durchgehaussagen.
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <strong className="text-slate-100 block mb-1">Modell-Overlay &amp; Exporte</strong>
            Direktes Übereinanderlegen von M1 und M2; Exporte als JSON, CSV, druckfertige SVG-Grafiken und vollständiges ZIP-Paket.
          </div>
        </div>
      </details>

      {/* Testing Guide Section */}
      <div className="mt-4 p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 text-slate-200">
        <div className="flex items-center gap-2 font-semibold text-xs text-sky-300 mb-2">
          <Code2 className="w-4 h-4" />
          <span>Testing Guide: Ausführung der Vitest-Suite &amp; Interpretation der M1-Validierung</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          Die automatisierte Testsuite in <code>src/tests/kinetics.test.ts</code> validiert den analytischen M1-Löser gegen
          mathematische Erhaltungssätze, Randwertbedingungen und substanzspezifische Szenarien für β-Nitrostyrol und P2NP.
        </p>

        <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 border border-slate-800 mb-3 overflow-x-auto">
          <div className="text-slate-500"># 1. Vitest Unit-Tests (M1-Löser, Massenbilanz, Nichtnegativität)</div>
          <div className="text-sky-400">npm run test:unit</div>
          <div className="text-slate-500 mt-2"># 2. Gesamte Verifikationssuite (Vitest + Node-Solver + Python)</div>
          <div className="text-emerald-400">npm test</div>
        </div>

        <div className="text-xs text-slate-300 space-y-2">
          <strong className="text-slate-100 block">Interpretation der Validierungsprüfungen:</strong>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li>
              <strong className="text-slate-200">Stoffbilanzerhaltung ($S + P + B + D = 100\,\%$):</strong> An allen 241 Zeitschritten
              beträgt die Abweichung maximal $10^{-8}$. Ein Scheitern weist auf Leckagen in den Produktpools hin.
            </li>
            <li>
              <strong className="text-slate-200">Nichtnegativität ($S, P, B, D \ge 0$):</strong> Stellt sicher, dass keine Konzentration
              unter $-10^{-12}$ sinkt. Schützt vor unphysikalischem Überschwingen.
            </li>
            <li>
              <strong className="text-slate-200">Entartete Wurzel $K = r$:</strong> Verifiziert, dass bei identischer Verbrauchs- und
              Abbaurate kein Division-durch-Null-Fehler auftritt, sondern der stetige Grenzwert $\tau \exp(-K\tau)$ greift.
            </li>
            <li>
              <strong className="text-slate-200">Auslöschungsresistenz ($|K - r| = 10^{-9}$):</strong> Überprüft, dass die Formulierung via
              <code>Math.expm1</code> katastrophale numerische Stellenauslöschung verhindert.
            </li>
            <li>
              <strong className="text-slate-200">Substratszenarien:</strong> Verifiziert Stabilität über die unterschiedlichen Kinetikregimes
              von frei gewählten hypothetischen Modellparametern. Diese Tests validieren keine chemischen Reaktionswege.
            </li>
          </ul>
        </div>
      </div>

      {/* Collaboration and Extension Info */}
      <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-200">
        <div className="flex items-center gap-2 font-semibold text-xs text-emerald-300 mb-1.5">
          <GitPullRequest className="w-4 h-4" />
          <span>Open Source: Den Code erweitern, ausbauen und optimieren</span>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed mb-3">
          Jeder – Wissenschaftler, Softwareentwickler und autonome KI-Agenten – kann diesen Code forken, 
          um reale experimentelle Messreihen (HPLC/NMR) ergänzen, verfeinerte DFT-Grenzflächenpotenziale einbauen 
          oder alternative Reaktorkonzepte simulieren.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a
            href="#mitmachen"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 font-semibold rounded-md hover:bg-emerald-400 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            Entwicklungspaket (Python &amp; TS) herunterladen
          </a>
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-md border border-slate-800 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            OpenAPI Spezifikation
          </a>
        </div>
      </div>
    </section>
  );
};
