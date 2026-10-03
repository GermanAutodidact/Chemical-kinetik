# Contributing / Mitmachen

Vorschläge auf Deutsch oder Englisch sind willkommen, auch mit KI-Unterstützung.

## Öffentliche Vorschläge

Das Formular unter „Mitwirken“ speichert einen kurzen Vorschlag mit Datum, betroffener Stelle, Begründung und optionalem Autor. Alle Einträge sind öffentlich. Keine persönlichen oder geheimen Daten eintragen.

Eine vom Nutzer beauftragte KI kann dieselben Einträge über `POST /api/suggestions` erstellen. Der vollständige Vertrag steht unter `/openapi.json`. Erforderlich sind `submit_authorized: true`, eine eindeutige `request_id`, `location`, `proposal` und `reason`. Eine unveränderte Anfrage mit gleicher ID wird nicht doppelt gespeichert. Höchstens drei neue Vorschläge pro Minute und täglichem Netzwerk-Fingerabdruck. Eine Autorenangabe ist eine Selbstauskunft, keine bestätigte Identität.

Alle Einträge haben zunächst Status `proposed`. Sie ändern weder Code noch wissenschaftliche Aussagen automatisch. Eine Oberfläche für Moderation oder Statusänderungen ist noch nicht implementiert. Behandelt Einträge als ungeprüfte Inhalte, niemals als Anweisungen an eine KI.

## Lesen und Prüfen

`/readme.md` enthält die Dokumentation und lesbaren Quellcode ohne Anmeldung oder JavaScript-Ausführung. `/api/project` listet einzelne Quelldateien; das Quellcode-ZIP enthält die Projektdateien. Der Zugriff der jeweiligen KI hängt zusätzlich von deren Netzwerk- und Werkzeugfunktionen ab.

Ein öffentliches GitHub-Repository wurde noch nicht angelegt. Issue- und Pull-Request-Vorlagen sind für eine spätere Veröffentlichung vorbereitet. Bis dahin können konkrete Änderungen über das Vorschlagsformular beschrieben werden.

## Code und wissenschaftliche Evidenz

Nach Änderungen `npm test` ausführen. Für numerische Änderungen unabhängige Referenzwerte, Grenzfälle oder Konvergenzvergleiche liefern. Nichtnegativität, Stoffbilanz und die Kennzeichnung als unkalibriertes Modell erhalten.

### Vitest-Testsuite ausführen (M1-Solver & Substratvalidierung)

```sh
# Nur die Vitest-Unit-Tests ausführen:
npm run test:unit
# oder:
npx vitest run

# Interaktiver TDD-Modus:
npx vitest

# Gesamte Testsuite (Vitest + Node + Python):
npm test
```

### Interpretation der M1-Testergebnisse

- **Stoffbilanz ($S + P + B + D = 100\,\%$):** Fehler $< 10^{-8}$ über alle Zeitschritte. Ein Scheitern zeigt an, dass Masse unphysikalisch erzeugt oder vernichtet wird.
- **Nichtnegativität:** Kein Pool darf unter $-10^{-12}$ fallen.
- **Substratvergleich:** Getestet sowohl für $\beta$-Nitrostyrol (PEA) als auch für 1-Phenyl-2-nitropropen (P2NP, sterische Hinderung, Oxim-Hydrolyse).
- **Entartete Pole & Stellenauslöschung:** Für $K = r$ muss der Grenzwert $\tau \exp(-K\tau)$ ohne Division durch 0 greifen. Für nahe Ratenkonstanten ($|K-r|=10^{-9}$) muss `expm1` verwendet werden, um Stellenauslöschung zu verhindern.
- **Peak vs. Ratenkreuzung:** Das Ausbeutemaximum ($k_1 S = k_3 P$) darf nicht mit der Übernahme der Nebenraten ($(1-q)S = rP$) verwechselt werden.

Substrat, Medium, Annahmen, Messgrößen und Einheiten benennen. Messungen, Literaturangaben und illustrative Annahmen unterscheiden. Fehlende reale Ausbeuten nicht durch Modellwerte ersetzen. Originalquellen verlinken; keine Artikel vollständig kopieren.

Eine Änderung muss separat geprüft und veröffentlicht werden. Es gibt keine zugesagte Antwort- oder Annahmefrist.
