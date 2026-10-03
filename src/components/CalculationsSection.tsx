/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const CalculationsSection: React.FC = () => {
  return (
    <section id="rechnung" className="panel">
      <span className="eyebrow">PHASE 2 · BERECHNETE ZUSAMMENHÄNGE</span>
      <h2>Die Rechnung hinter dem Modell</h2>

      <details open>
        <summary>1 · Stoffbilanz und Ausbeute</summary>
        <p>
          Y = 100 n(P)/n(S)₀. Im normierten Modell gilt S + P + B + D = 1. B und D zählen
          Substratäquivalente, auch wenn reale Nebenprodukte mehrere Substratmoleküle enthalten.
        </p>
        <p className="formula">
          Y<sub>isoliert</sub> = Y<sub>chemisch</sub> · f<sub>Rückgewinnung</sub>
        </p>
        <p>
          PEA schließt in der analytischen Bilanz seine protonierte Form ein. Die isolierte freie Base
          und ein isoliertes Salz müssen auf derselben molaren Bezugsbasis verglichen werden.
        </p>
      </details>

      <details>
        <summary>2 · Geschlossene Lösung mit optionalem Produktverlust</summary>
        <p>
          Annahmen: gut durchmischtes System, konstantes Volumen und konstante effektive Raten erster
          Ordnung. Keine nachgewiesene Beschreibung des realen heterogenen Ansatzes.
        </p>
        <div className="formula">
          dS/dt = −(k₁ + k₂)S<br />
          dP/dt = k₁S − k₃P<br />
          dB/dt = k₂S<br />
          dD/dt = k₃P
        </div>
        <p>
          Mit K = k₁ + k₂, S(0) = 1 und P(0) = B(0) = D(0) = 0:
        </p>
        <div className="formula">
          S = exp(−Kt)<br />
          P = k₁ [exp(−k₃t) − exp(−Kt)] / (K − k₃)<br />
          B = (k₂/K)[1 − exp(−Kt)]<br />
          D = 1 − S − P − B
        </div>
        <p>
          Für K = k₃ ist der stetige Grenzfall P = k₁t exp(−Kt). Für k₃ = 0 ergibt sich das
          Parallelmodell aus dem Gespräch.
        </p>
      </details>

      <details>
        <summary>3 · Drei verschiedene „Kipppunkte“</summary>
        <p>
          <strong>Maximale Produktmenge:</strong> k₁S = k₃P. Bei k₃ &gt; 0 gilt t<sub>max</sub> =
          ln(K/k₃)/(K − k₃), beziehungsweise 1/K für K = k₃. Ohne Produktverlust gibt es kein endliches
          Maximum.
        </p>
        <p>
          <strong>Dominanz aller Nebenraten:</strong> k₂S + k₃P = k₁S. Die Ansicht berechnet diese
          Kreuzung separat. Die Rate einer rein thermischen Zersetzung darf erst nach Identifikation
          des entsprechenden Reaktionswegs so bezeichnet werden.
        </p>
        <p>
          <strong>Thermische Instabilität:</strong> benötigt zusätzlich Wärmeerzeugung, Wärmeabfuhr
          und Wärmekapazität. Ein streng isothermes Modell kann keinen Temperaturdurchgang
          berechnen.
        </p>
        <p className="formula">
          C<sub>eff</sub> dT/dt = Σ(−ΔHⱼ) rⱼV − UA(T − T<sub>Umgebung</sub>)
        </p>
        <p>
          Das ist eine vereinfachte Energiebilanz ohne weitere Zu- und Abflüsse. Im realen System
          wären auch nicht produktbildende Metallreaktionen zu berücksichtigen.
        </p>
      </details>

      <details>
        <summary>4 · Temperatur und Unsicherheit</summary>
        <p className="formula">
          kᵢ(T) = Aᵢ exp[−Eₐ,ᵢ/(RT)]
        </p>
        <p>
          Der Arrhenius-Ansatz ist zu prüfen. Bei wechselndem Mechanismus oder Transportlimitierung sind
          konstante effektive Parameter möglicherweise ungeeignet. Im erweiterten Modell fehlen bereits
          sechs kinetische Parameter sowie die Validierung seiner Struktur.
        </p>
        <p>
          Rechenbeispiel zur Sensitivität: Eine um 5 kJ/mol unterschätzte Aktivierungsbarriere erhöht
          eine daraus abgeleitete Rate bei unverändertem Vorfaktor um folgende Faktoren. Dies sind
          mathematische Faktoren, keine ermittelten Fehlerbalken.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Temperatur</th>
                <th>Ratenfaktor exp(5000/RT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>20 °C</td>
                <td>7,779</td>
              </tr>
              <tr>
                <td>50 °C</td>
                <td>6,430</td>
              </tr>
              <tr>
                <td>70 °C</td>
                <td>5,769</td>
              </tr>
              <tr>
                <td>90 °C</td>
                <td>5,238</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details>
        <summary>5 · Was eine belastbare Prognose noch benötigt</summary>
        <ol>
          <li>Zusammensetzung, Substrat-Isomerie, Metalloberfläche und deren Entwicklung festlegen.</li>
          <li>Substrat, PEA und unterscheidbare Nebenprodukte als Zeitreihen erfassen; Wiederfindung und Stoffbilanz bestimmen.</li>
          <li>Reaktionspfade mit elektronischen Referenzrechnungen und reaktivem Sampling prüfen; freie Energiebarrieren samt Unsicherheit ableiten.</li>
          <li>Oberflächen- und Stofftransportmodell mit der Mikrokinetik koppeln; Autokatalyse als separate Hypothese testen.</li>
          <li>Parameter gemeinsam über Temperaturen anpassen, Identifizierbarkeit und zurückgehaltene Daten prüfen.</li>
          <li>Erst dann die vier realen Zeitkurven und Unsicherheitsbereiche berechnen. Thermische Stabilität zusätzlich kalorimetrisch und über Wärmeabfuhr beurteilen.</li>
        </ol>
        <p>
          Diese Schritte beschreiben die verbleibende Forschungsarbeit. Es wurden keine Laborversuche,
          DFT-Rechnungen oder ML-Trainings ausgeführt.
        </p>
      </details>
    </section>
  );
};
