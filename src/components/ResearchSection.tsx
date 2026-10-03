/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const ResearchSection: React.FC = () => {
  return (
    <section id="forschung">
      <span className="eyebrow">PHASE 1 · RESEARCH FIRST</span>
      <h2>Was die Quellen tragen – und was offen bleibt</h2>
      <p>
        Gezielte öffentliche Recherche nach Substrat, Reduktionssystem, Kinetik und aktuellen
        Grenzflächenmethoden. Keine vollständige Scopus-, Reaxys- oder SciFinder-Abfrage. Ein
        fehlender Treffer beweist keine Literaturabwesenheit.
      </p>

      <div className="source-grid">
        <article className="panel">
          <span className="source-year">2025 · ORIGINALARBEIT</span>
          <h3>Reaktionswege und Nebenprodukte</h3>
          <p>
            D’Andrea &amp; Jademyr untersuchen β-Nitrostyrole einschließlich des unsubstituierten
            Substrats mit NaBH₄/CuCl₂. Sie berichten zeitabhängige Nebenproduktbildung und
            diskutieren Oxim-, Aldehyd- und Hydroxylaminwege.
          </p>
          <p className="limit">
            Für uns: mechanistische Kandidaten. Andere Reagenzien und Medien; keine
            Al/Hg-Geschwindigkeitskonstanten. Vorgeschlagene Strukturen bleiben Vorschläge.
          </p>
          <a
            href="https://www.beilstein-journals.org/bjoc/articles/21/4"
            target="_blank"
            rel="noreferrer"
          >
            Originalarbeit · DOI 10.3762/bjoc.21.4
          </a>
        </article>

        <article className="panel">
          <span className="source-year">2026 · TRECI</span>
          <h3>Geladene Metall-Wasser-Grenzflächen</h3>
          <p>
            Transferlernen für Molekulardynamik bei konstantem Potential. Die Demonstration betrifft
            Cu(111)/Wasser. Der zugehörige Preprint erschien im November 2025.
          </p>
          <p className="limit">
            Für uns: mögliche Methode zur Grenzflächenbeschreibung. Keine trainierte Beschreibung
            des Al/Hg/Essigsäure/Nitroalken-Systems; ein korrodierendes Metall ist nicht automatisch
            eine Elektrode mit fest vorgegebenem Potential.
          </p>
          <a
            href="https://iris.polito.it/handle/11583/3015703"
            target="_blank"
            rel="noreferrer"
          >
            Autorenrepositorium · Veröffentlichung 2026
          </a>
        </article>

        <article className="panel">
          <span className="source-year">2025 · HAML</span>
          <h3>Reaktive Grenzflächen effizient erkunden</h3>
          <p>
            Hybride Ab-initio-Molekulardynamik und maschinell gelernte Potentiale beschleunigen die
            Untersuchung von Lithium-/Elektrolyt-Grenzflächen.
          </p>
          <p className="limit">
            Für uns: methodischer Ansatz für eine eigene Parametrisierung. Lithium-Ergebnisse sind
            keine Ausbeuteprognose für Aluminiumamalgam.
          </p>
          <a
            href="https://www.nature.com/articles/s41524-025-01747-7.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Originalarbeit · HAML
          </a>
        </article>

        <article className="panel">
          <span className="source-year">2024 · DEAL</span>
          <h3>Reaktionspfade gezielt abtasten</h3>
          <p>
            Perego &amp; Bonati verbinden Active Learning und Enhanced Sampling für reaktive
            ML-Potentiale. Demonstriert wird Ammoniakzersetzung an Eisen-Cobalt-Katalysatoren.
          </p>
          <p className="limit">
            Für uns: passende Strategie, um Übergangszustände und freie Energieprofile zu ermitteln.
            Erfordert eigene elektronische Referenzrechnungen und Validierung.
          </p>
          <a
            href="https://www.nature.com/articles/s41524-024-01481-6"
            target="_blank"
            rel="noreferrer"
          >
            Originalarbeit · DEAL
          </a>
        </article>

        <article className="panel">
          <span className="source-year">2020 · ICTAC</span>
          <h3>Mehrschrittkinetik aus Messdaten</h3>
          <p>
            Die Empfehlungen behandeln Modellanpassung, verteilte Reaktivität, isokonversionale
            Analyse und Entfaltung überlagerter thermischer Signale.
          </p>
          <p className="limit">
            Für uns: methodischer Rahmen zur Prüfung konkurrierender Modelle. Wärmestrom allein
            identifiziert keine PEA-Ausbeute; chemische Analytik muss hinzukommen.
          </p>
          <a
            href="https://doi.org/10.1016/j.tca.2020.178597"
            target="_blank"
            rel="noreferrer"
          >
            ICTAC · Mehrschrittkinetik
          </a>
        </article>

        <article className="panel">
          <span className="source-year">GITHUB · QUELLCODE GEPRÜFT</span>
          <h3>Rechenwerkzeuge statt Ersatzdaten</h3>
          <p>
            <a href="https://github.com/SUNCAT-Center/catmap" target="_blank" rel="noreferrer">
              CatMAP
            </a>{' '}
            bietet mikrokine­tische Modellierung und stationäre Oberflächenbedeckungen.{' '}
            <a href="https://github.com/ehermes/micki" target="_blank" rel="noreferrer">
              micki
            </a>{' '}
            ist ein ASE-basiertes Mikrokinetikprojekt.
          </p>
          <p className="limit">
            CatMAPs README und mickis Repository-Metadaten wurden geprüft. Keines wurde hier
            installiert oder als Al/Hg-Modell ausgeführt. Diese Ansicht verwendet eine eigene
            analytische Lösung.
          </p>
        </article>
      </div>

      <details className="panel">
        <summary>Welche Treffer wurden ausgeschlossen?</summary>
        <p>
          Arbeiten über o-, m- oder p-Nitrostyrol können die Nitrogruppe am aromatischen Ring
          behandeln. Solche Strukturen sind nicht β-Nitrostyrol mit NO₂ an der Seitenkette. Auch
          enzymatische oder Platin-katalysierte Kinetiken sowie substituierte Analoga liefern keine
          direkt übertragbaren Konstanten für das angefragte System.
        </p>
        <p>
          Historische Übersichten und Foren dienten allenfalls als Suchhinweise; daraus wurden keine
          empirischen Parameter übernommen. Für Polymerisation, Kondensation, Autokatalyse und
          PEA-Abbau unter den konkret angefragten Bedingungen wurde kein validierter Parametersatz
          identifiziert.
        </p>
      </details>
    </section>
  );
};
