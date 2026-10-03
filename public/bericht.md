# β-Nitrostyrol → PEA: Forschungs- und Modellierungsbericht

Stand: 2. Oktober 2026. Angefragtes System: Aluminiumamalgam, Essigsäure, Wasser. Ziel: prozentuale Ausbeute des reinen primären Amins bei konstant 20, 50, 70 und 90 °C über die Zeit sowie Dominanzwechsel gegenüber Nebenreaktionen.

## Ergebnis und Bearbeitungsgrenze

Die Literaturrecherche, Quellenbewertung und analytische Lösung zweier hypothetischer Reaktionsmodelle wurden durchgeführt. Die Rechenansicht zeigt deren Konsequenzen interaktiv. Es wurden keine Laborversuche, DFT-Rechnungen, AIMD-Läufe, ML-Trainings oder Anpassungen an reale Messdaten ausgeführt.

Ein validierter Parametersatz für genau das angefragte System wurde in den zugänglichen geprüften Quellen nicht gefunden. Eine reale numerische Temperatur-Zeit-Ausbeutematrix und ein exakter Kipppunkt bleiben deshalb unbestimmt. Diese Grenze ist keine Behauptung, dass passende Literatur überhaupt nicht existiert.

## Phase 1: Recherche und Evidenz

Gesucht wurde öffentlich nach Kombinationen von „beta-nitrostyrene“, „nitrostyrene“, „aluminium/aluminum amalgam“, „acetic acid“, „kinetics“, „activation“ und „thermal decomposition“. Ergänzend wurden aktuelle Arbeiten zu reaktiven Grenzflächenmethoden, die angegebenen Literaturstellen und GitHub-Projekte geprüft. Kein Zugang zu einer vollständigen Reaxys-, SciFinder- oder Scopus-Auswertung; einzelne Verlagsseiten waren nicht abrufbar. Bei HAML wurde das Verlags-PDF, bei TRECI der Autorenrepositoriumseintrag und der Preprint herangezogen.

### 1. Chemische Primärliteratur

D’Andrea und Jademyr (2025) behandeln die Reduktion von β-Nitrostyrolen, einschließlich des unsubstituierten Substrats, mit NaBH4/CuCl2. Die Arbeit berichtet zeitabhängige Nebenproduktbildung und diskutiert Reaktionsmöglichkeiten über Oxime, Aldehyde und Hydroxylamine. Die Autoren kennzeichnen Teile der mechanistischen Zuordnung als vorgeschlagen; größere Massen im Massenspektrum allein ergeben keinen eindeutig bewiesenen Polymerisationsmechanismus.

**Übertragbarkeit:** geeignet, mögliche Spezies und konkurrierende Wege für eine spätere Prüfung zu sammeln. Ungeeignet, um Ausbeuten, Reaktionszeiten oder Aktivierungsenergien auf Al/Hg in Essigsäure/Wasser zu übertragen. Insbesondere keine Ableitung eines universellen thermischen Zersetzungspunkts.

Quelle: [D’Andrea & Jademyr, Beilstein J. Org. Chem. 21, 39–46 (2025), DOI 10.3762/bjoc.21.4](https://www.beilstein-journals.org/bjoc/articles/21/4).

### 2. Aktuelle Grenzflächenmethoden

**TRECI (Veröffentlichung 2026, Preprint 2025):** datenarmes Transferlernen für ML-Molekulardynamik bei konstantem Potential, demonstriert an Cu(111)/Wasser. Das liefert eine methodische Option für solventenaufgelöste Grenzflächenmodelle, aber kein fertiges Modell des hier benötigten chemischen Raums. Für frei korrodierendes Al/Hg müsste die elektrische Randbedingung gesondert geklärt werden; ein vorgegebenes konstantes Potential ist nicht automatisch passend.

[Bianchi et al., eScience, DOI 10.1016/j.esci.2026.100642, Autorenrepositorium](https://iris.polito.it/handle/11583/3015703) · [Preprint arXiv:2511.19338](https://arxiv.org/abs/2511.19338).

**HAML (2025):** koppelt Ab-initio-Molekulardynamik und maschinell gelernte Potentiale für Reaktionen an Lithium-/Elektrolyt-Grenzflächen. Das Verfahren kann die Erforschung reaktiver Konfigurationen beschleunigen; die publizierte Demonstration liefert keine Al/Hg-Parameter.

[Machine-learning-accelerated mechanistic exploration of interface modification in lithium metal anode, DOI 10.1038/s41524-025-01747-7](https://www.nature.com/articles/s41524-025-01747-7.pdf).

**DEAL (2024):** Active Learning und Enhanced Sampling bauen reaktive ML-Potentiale auf, demonstriert für Ammoniakzersetzung an Fe/Co-Katalysatoren. Relevant ist das gezielte Erfassen reaktiver Konfigurationen und freier Energieprofile. Ein systemeigenes Referenzdatenset bleibt erforderlich.

[Perego & Bonati, npj Computational Materials 10, 291, DOI 10.1038/s41524-024-01481-6](https://www.nature.com/articles/s41524-024-01481-6).

**Methodenauswahl:** Für eine zukünftige prädiktive Rechnung ist eine Kombination aus systemeigenen elektronischen Referenzrechnungen, reaktivem Active Learning, freier Energieanalyse, Mikrokinetik und Transportmodell plausibel. Die Auswahl ist eine begründete Forschungsstrategie, kein Nachweis ihrer bereits erreichten Genauigkeit. Die folgenden geschlossenen Gleichungen sind analytische Vergleichsmodelle; sie sind keine ausgeführten TRECI-/HAML-Simulationen.

### 3. Makroskopische Kinetik und Software

Die ICTAC-Empfehlungen beschreiben die Anpassung und Unterscheidung mehrstufiger kinetischer Modelle anhand thermischer Daten. Für PEA-Ausbeuten müssten chemische Konzentrationsdaten hinzukommen: Ein Gesamtwärmesignal trennt die organische Zielreaktion nicht automatisch von weiteren exothermen Vorgängen.

[Vyazovkin et al., ICTAC recommendations for analysis of multi-step kinetics (2020), DOI 10.1016/j.tca.2020.178597](https://doi.org/10.1016/j.tca.2020.178597).

Über GitHub geprüft wurden [CatMAP](https://github.com/SUNCAT-Center/catmap) (README, Mikrokinetik und stationäre Bedeckungen) und [micki](https://github.com/ehermes/micki) (Repository-Metadaten, ASE-basiertes Mikrokinetikprojekt). Das sind mögliche Werkzeuge, keine Lieferanten fehlender empirischer Konstanten. Keines wurde installiert oder ausgeführt. Für die analytische Demonstration ist keine solche Abhängigkeit erforderlich.

### 4. Reaktionsnetzwerk: Status jedes Bausteins

| Baustein | Evidenzstatus für das konkrete Al/Hg-System |
|---|---|
| β-Nitrostyrol als Substrat, PEA als Ziel | Vom Nutzer festgelegte Stoffidentität; E/Z-Zusammensetzung nicht festgelegt |
| Oxim-/Hydroxylamin-/Aldehydwege | Kandidaten aus verwandter Primärliteratur; hier nicht validiert |
| Direkte Nebenproduktbildung | Zu prüfende Sammelroute; keine übertragbaren Geschwindigkeitsdaten |
| Abnahme bereits gebildeten PEA | Hypothese für einen Modellvergleich, kein belegter Abbau bei einer der vier Temperaturen |
| Autokatalyse durch PEA | Nicht belegt; Beschleunigung allein wäre kein eindeutiger Nachweis |
| Polymerisation / intermolekulare Kondensation | Separate Hypothesen; nicht pauschal mit thermischer Zersetzung gleichzusetzen |

Treffer zu o-, m- oder p-Nitrostyrol wurden nicht als identische Stoffe behandelt: Dort kann NO2 am aromatischen Ring sitzen. Enzymatische und Platin-katalysierte Reaktionen sowie ring- oder seitenkettensubstituierte Analoga wurden nicht zur numerischen Parametrisierung verwendet. Historische Übersichten und Foren waren höchstens Suchhinweise.

## Phase 2: Tatsächlich ausgeführte Modellrechnung

### Definition und Voraussetzungen

Y_chemisch = 100 n(PEA)/n(Substrat)_0. Protonierte PEA-Spezies zählen zum analytischen PEA-Pool. Isolierte Ausbeute = chemische Ausbeute × Rückgewinnungsfaktor. Eine Salzmasse muss auf molare PEA-Äquivalente umgerechnet werden.

Normierte Mengen: S(0)=1, P(0)=B(0)=D(0)=0. B und D zählen Substratäquivalente. Vergleichsannahmen: konstantes Volumen, isotherme und gut durchmischte Bedingungen, konstante effektive Raten erster Ordnung.

### Modell M0: Zwei parallele Wege

S → P mit k1; S → B mit k2. K=k1+k2.

- S(t)=exp(−Kt)
- P(t)=(k1/K)[1−exp(−Kt)]
- Y(t)=100 P(t)
- Verhältnis Nebenrate/Bildungsrate = k2/k1, zeitlich konstant.

**Ergebnis:** M0 hat keinen zeitlichen Dominanzwechsel und kein endliches Produktmaximum. Die Produktmenge steigt monoton auf einen Grenzwert. Eine größere Geschwindigkeit muss keine höhere Selektivität bedeuten.

### Modell M1: Zusätzlicher hypothetischer Produktverlust

Ergänzung: P → D mit k3.

- dS/dt=−KS
- dP/dt=k1S−k3P
- dB/dt=k2S
- dD/dt=k3P
- P(t)=k1[exp(−k3t)−exp(−Kt)]/(K−k3)
- B(t)=(k2/K)[1−exp(−Kt)]
- D(t)=1−S(t)−P(t)−B(t)

Bei K=k3 gilt P(t)=k1 t exp(−Kt). Dieser Grenzfall wird numerisch separat behandelt.

Für k1>0, k3>0 ist das Maximum bei t_max=ln(K/k3)/(K−k3), beziehungsweise 1/K für K=k3. Es erfüllt k1S=k3P.

Die Dominanz sämtlicher Nebenraten ist anders definiert: k2S+k3P > k1S. Für q=k2/k1, r=k3/k1, τ=k1t gilt bei q<1 und r>0:

τ_cross = ln[1+(1+q−r)(1−q)/r]/(1+q−r).

Für 1+q=r lautet der Grenzfall τ_cross=(1−q)/r. Bei q>1 sind die Nebenraten schon anfangs größer; bei q=1 herrscht anfangs Gleichheit. Für r=0 und q<1 gibt es keine endliche Kreuzung.

Diese Ratenkriterien sind keine Aussage über thermische Instabilität. Dafür wäre eine Energiebilanz mit Reaktionsenthalpien, Wärmekapazität, Wärmeabfuhr und zusätzlichen Reaktionen notwendig. Eine mögliche Bilanzform ohne Zu-/Abflüsse lautet C_eff dT/dt=Σ(−ΔH_j)r_jV−UA(T−T_Umgebung). Unter einer ideal erzwungenen konstanten Temperatur berechnet man keinen Temperaturanstieg.

### Temperaturabhängigkeit und Identifizierbarkeit

Arrhenius-Kandidat: k_i(T)=A_i exp[−E_a,i/(RT)]. Die vier Temperaturen lauten 293,15 / 323,15 / 343,15 / 363,15 K. M0 benötigt vier kinetische Arrhenius-Parameter; M1 sechs. Das setzt die Gültigkeit der jeweiligen Modellstruktur voraus. Ein einzelner Endausbeutewert identifiziert diese Parameter nicht.

Ohne bestimmte Raten ist auch die Zeitskala nicht bestimmt: Multipliziert man alle k_i mit einem beliebigen positiven Faktor, bleiben die Ratenverhältnisse gleich, während sich die gesamte Zeitachse verschiebt. Unterschiedliche k2/k1 erzeugen außerdem beliebige unterschiedliche Grenzausbeuten. Darum lässt sich keine eindeutige reale Matrix rekonstruieren.

Zusätzlich gilt für eine Barrierenunterschätzung von 5 kJ/mol bei gleichem Vorfaktor: Ratenüberschätzung um exp(5000/RT). Berechnet wurden 7,779 bei 20 °C; 6,430 bei 50 °C; 5,769 bei 70 °C; 5,238 bei 90 °C. Das illustriert die Sensitivität, ist aber kein empirischer Unsicherheitsbereich des Systems.

Die Regler der Site verwenden frei gewählte q und r; diese haben keinerlei Kalibrierung auf Al/Hg. Die Darstellung ist dimensionslos. Eine Zuordnung zu Minuten oder Temperatur ist absichtlich nicht vorgesehen.

## Phase 3: Matrix und Schlussfolgerung

| Temperatur | Y(0), sofern kein PEA vorgelegt | Y(t>0) | Reale Ratenkreuzung |
|---|---:|---|---|
| 20 °C | 0 % | Nicht identifiziert | Nicht identifiziert |
| 50 °C | 0 % | Nicht identifiziert | Nicht identifiziert |
| 70 °C | 0 % | Nicht identifiziert | Nicht identifiziert |
| 90 °C | 0 % | Nicht identifiziert | Nicht identifiziert |

Die 0-%-Werte sind Anfangsbedingungen, keine gemessenen Ausbeuten. Ohne weitere Annahmen ist für positive Zeiten nur die triviale 0–100-%-Stoffbilanzgrenze begründbar; kein engeres Vorhersageintervall. Ein exakter numerischer thermischer Kipppunkt wurde nicht ermittelt.

## Was für den Übergang zur realen Vorhersage fehlt

1. Systemdefinition: Zusammensetzung, Isomerie, Oberflächenzustand und Entwicklung des Metalls, Volumen und Transportbedingungen.
2. Konzentrationszeitreihen für Substrat und PEA sowie aufgelöste Nebenprodukte, Wiederfindung und Stoffbilanz.
3. Systempassende reaktive Referenzdaten, freie Energiebarrieren und Unsicherheiten; Prüfung elektrischer Randbedingungen.
4. Gemeinsame Anpassung über Temperaturen mit Identifizierbarkeitsanalyse und Prüfung an zurückgehaltenen Daten. Autokatalyse nur bei eigenständiger Evidenz ergänzen.
5. Kalorimetrie und Wärmeabfuhrdaten für Aussagen zur thermischen Instabilität; isolierte Ausbeute separat validieren.

Diese Informationen können durch passende Primärdaten oder neue Forschung gewonnen werden. Weitere algebraische Zerlegung allein ersetzt sie nicht.

## Technische Prüfung

Der Modellkern wird mit `node tests.mjs` auf Stoffbilanz, Nichtnegativität, Übereinstimmung mit der Differentialgleichung, Ratenkreuzung, Produktmaximum und Grenzfälle geprüft. Die Prüfung bestätigt die Implementation der angenommenen Gleichungen, nicht deren chemische Gültigkeit. Ein unterstützter Browserkontext zur WebMCP-Prüfung war nicht verfügbar.


## Erweiterung v0.2: Sensitivität und lokale Unterscheidbarkeit

Das zusätzliche Modell M2 enthält einen unbestimmten Zwischenprodukt-Pool, exponentiell abnehmende Oberflächenaktivität und eine hypothetische harmonische Verknüpfung mit einer Transportkapazität. Seine sechs Parameter bleiben dimensionslos und unkalibriert. Gleichungen und Grenzen sind im Quellpaket unter docs/MODELS.md dokumentiert.

Numerisch ausgeführt wurden RK4-Integration, lokale logarithmische Sensitivitäten, ein diagnostischer numerischer Rang und ein Einzelfaktor-Szenarienband. Es wurde keine Profil-Likelihood berechnet. Die Einordnung von Identifizierbarkeit folgt unter anderem Raue et al. (2009), https://doi.org/10.1093/bioinformatics/btp358. Lokale Sensitivitäten allein beweisen keine globale oder praktische Identifizierbarkeit.

Im voreingestellten hypothetischen Szenario beträgt der numerische Rang bei sechs P-Beobachtungen 5/6, bei zusätzlichen S- und I-Beobachtungen 6/6, jeweils mit relativer Singularwertschwelle 10^-5. Diese Ergebnisse sind vom Szenario und der Schwelle abhängig. Die Berechnung der damaligen Version v0.2 über JᵀJ war für sehr kleine Singularwerte numerisch empfindlich; eine direkte SVD ist als Verbesserung dokumentiert.

Bei konstanter Aktivität (lambda=0) ergeben a0=1,m=1 und a0=2,m=2/3 exakt denselben effektiven Faktor h=0,5. Das beweist eine Mehrdeutigkeit dieses Sonderfalls auch bei perfekten S-, I- und P-Daten.

Die Tests überprüfen eine analytisch lösbare Reaktionskette, Nichtnegativität, Stoffbilanz, Schrittweitenhalbierung, diese exakte Mehrdeutigkeit und einfache bekannte Eigenwerte. Browser-Interaktion und WebMCP wurden nicht in einem unterstützten Browser geprüft. Die Tests bestätigen keine chemische Gültigkeit.

## Gemeinschaftliche Prüfung

Das vorbereitete Quellpaket enthält README, AGENTS.md, AI_REVIEW.md, Architektur- und Modelldokumentation sowie Issue- und Pull-Request-Vorlagen. Bereits ein einzelner begründeter Korrektursatz ist als Beitrag vorgesehen. Ein öffentliches GitHub-Repository muss getrennt angelegt und anhand seiner URL bestätigt werden. Die Website und ihr Quellpaket behaupten keine bereits bestehende öffentliche GitHub-Veröffentlichung.


## Erweiterung v0.3 am 3. Oktober 2026: Metall ist kein Produkt-Endschalter

M3 übernimmt die Idee einer begrenzten Reduktionskapazität, trennt diese jedoch von produktiver Nutzung. Die Geometrie wird als konstante Fläche einer idealisiert dünner werdenden Folie oder als formähnlich schrumpfender Körper behandelt. Es werden keine realen Aluminiummassen, Quecksilbermengen oder Prozesszeiten berechnet.

Das Modell führt getrennte Bilanzen: C+P+W=C0 für Reduktionskapazität und S+P=1 für Substratäquivalente. Nichtproduktiver Kapazitätsverbrauch W wird nicht allein Wasserstoff zugeordnet. Zur wissenschaftlichen Motivation: Die experimentelle Arbeit „Effects of amalgam on hydrogen generation by hydrolysis of aluminum with water“ untersucht konkurrierenden Metallverbrauch durch Wasser: https://www.sciencedirect.com/science/article/abs/pii/S036031991101994X . Es wurden keine Parameter aus dieser Quelle übernommen.

Die vollständigen M3-Gleichungen, Anfangsbedingungen und numerischen Verfahren stehen im Quellpaket unter docs/MODELS.md. Das Auflösen des Metalls wird ausdrücklich getrennt von vollständigem Substratumsatz angezeigt. Folienfläche ist keine automatisch aktive Fläche; eine Drehzahl und ein pauschaler Flächenabschlag bestimmen keinen Abtragsfluss. Der Arrhenius-Parameter gehört zu einem Reaktionsweg beziehungsweise einer beobachteten Kinetik, nicht pauschal zu einem Molekül: https://goldbook.iupac.org/terms/view/A00102 . Ein Siedepunkt wird nicht als garantierte Sicherheitsgrenze benutzt; Reaktionsgefahren benötigen zusätzliche Untersuchung: https://www.hse.gov.uk/comah/sragtech/techmeasreaction.htm .

Das neue Modell ist separat vom Zwischenproduktmodell M2. Das Zusammenführen beider Modelle wäre erst mit einer definierten Elektronenbilanz für jeden Zwischen- und Nebenweg sinnvoll. Thermische und chemische Validierung bleiben offen. Die M3-Tests prüfen die implementierten Gleichungen und Stoffbilanzen.


## Erweiterung v0.4: öffentlicher Review und robustere Numerik

Die aktuelle Version verwendet adaptive RK4-Schrittverdopplung, eine direkte Jacobi-SVD und verfeinerte erkannte Ereignisse. Frühere Abschnitte zur festen Schrittweite oder JᵀJ-Berechnung beschreiben ältere Versionen; die aktuelle Spezifikation ist docs/MODELS.md.

Neu sind lokale CSV-Anpassung an M0/M1 mit mehreren Startpunkten und zurückgehaltenen Daten, ein maschinenlesbares Herkunftsregister sowie öffentliche datierte Vorschläge. Die Eingabedaten werden vom Nutzer bezeichnet, nicht unabhängig verifiziert. Angepasste Raten sind keine chemisch validierten Konstanten. Ein synthetischer M1-Test wurde zurückgerechnet; dieser prüft das Rechenverfahren, nicht ein Laborsystem.

Vorschläge werden getrennt in D1 gespeichert, mit UTC-Zeit und Status vorgeschlagen. Die öffentliche API darf nur nach Auftrag des jeweiligen Nutzers zum Einreichen genutzt werden. Inhalte sind unbestätigte Beiträge und ändern keinen Modellcode. Die Dokumentation und die Modellquellen sind zusätzlich als vollständiger Text verfügbar. Grenzen anderer KI-Dienste können nicht aufgehoben werden.

## Erweiterung v0.5: vollständiges Quellpaket und MCP
Der Download enthält jetzt Oberfläche, Server, Datenbankschema, Dokumentation, JavaScript-Tests und korrigierte Python-Vergleichsmodelle. /mcp unterstützt echte Initialisierung, Werkzeugliste und Modellaufrufe. Modellwerte bleiben hypothetisch und dimensionslos.
