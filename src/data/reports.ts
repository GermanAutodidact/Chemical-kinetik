/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const BERICHT_MARKDOWN = `# PEA · Kinetik & Evidenz
## β-Nitrostyrol → Phenylethylamin (Aluminiumamalgam, Essigsäure, Wasser)
**Stand:** 03.10.2026
**Status:** Reale Prognose: nicht kalibriert

---

### 1. Zusammenfassung des Forschungsstandes
In den zugänglichen, geprüften Fachquellen (Stand 2025/2026) wurde kein passender, experimentell validierter kinetischer Parametersatz für das heterogene Reduktionssystem β-Nitrostyrol mit Aluminiumamalgam in Essigsäure/Wasser identifiziert.
Die vorliegende Webanwendung stellt daher transparente Modellgrenzen und drei komplementäre Modellierungsstufen (M1, M2, M3) bereit, um Hypothesen prüfbar zu machen, ohne nicht vorhandene Genauigkeit vorzutäuschen.

### 2. Die drei Modellansätze

#### M1 · Kinetischer Modellvergleich (Analytische Lösung)
- **Reaktionsnetzwerk:** $S \\to P \\to D$ und $S \\to B$
- **Ratenverhältnisse:** $q = k_2/k_1$ (Nebenroute), $r = k_3/k_1$ (Produktverlust)
- **Hauptbefund:** Ein Maximum der Produktmenge existiert nur bei $r > 0$. Bei $r = 0$ strebt die Produktmenge monoton gegen ein Plateau von $1/(1+q)$.
- **Kipppunkt:** $t_{\\max} = \\ln((1+q)/r) / (1 + q - r)$.

#### M2 · Erweitertes Hypothesenmodell (Sensitivität & Identifizierbarkeit)
- **Erweiterung:** Zwischenprodukt-Pool $I$, Oberflächenaktivität $a(\\tau) = a_0 \\exp(-\\lambda \\tau)$, harmonischer Transportwiderstand $h = a m / (a + m)$.
- **Numerische Identifizierbarkeit:** Selbst bei vollen Zeitreihen führt die starke Korrelation zwischen Oberflächen- und Transportparametern ($a_0$ und $m$ bzw. $m$ und $u$) zu einer praktischen Ununterscheidbarkeit, wenn keine unabhängigen physikalischen Messungen vorliegen.

#### M3 · Hypothetische Kapazitätsbilanz (Metallauflösung)
- **Geometrien:** Flache Folie (konstante Fläche bis zum Verbrauch, $\\alpha = 0$) vs. formähnlich schrumpfender Körper ($\\alpha = 2/3$).
- **Endschalter:** Der Verbrauch des Metalls stoppt die weitere Reduktionskapazität; das verbleibende Substrat kann ohne weiteres Metall nicht weiter umgesetzt werden.

### 3. Notwendige Schritte für eine belastbare Realprognose
1. Konzentrationszeitreihen für Substrat, Zwischenstufen und isoliertes PEA.
2. Bestimmung der effektiven aktiven Metalloberfläche im Verlauf.
3. DFT- oder ML-Potenziale zur Bestimmung freier Aktivierungsbarrieren.
4. Gekoppelte Wärmebilanz zur Beurteilung thermischer Stabilität.

---
*Erstellt mit PEA · Kinetik & Evidenz*
`;

export const MATRIX_CSV_CONTENT = `Temperatur;Kelvin;t=0;t1>0;t2>t1;Kipppunkt;Bemerkung
20 °C;293,15 K;0 %*;Offen;Offen;Nicht bestimmt;Anfangsbedingung, kein Messwert
50 °C;323,15 K;0 %*;Offen;Offen;Nicht bestimmt;Kinetische Parameter fehlen
70 °C;343,15 K;0 %*;Offen;Offen;Nicht bestimmt;Kinetische Parameter fehlen
90 °C;363,15 K;0 %*;Offen;Offen;Nicht bestimmt;Siedegrenze / Zersetzungsrisiko
`;
