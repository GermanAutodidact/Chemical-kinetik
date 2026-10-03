/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { MetalModelParams, MetalGeometry } from '../types';
import { calculateMetalModel } from '../utils/kinetics';
import { exportJson, downloadFile } from '../utils/export';
import { Download, Sliders, Check } from 'lucide-react';

export const MetalModelSection: React.FC = () => {
  const [params, setParams] = useState<MetalModelParams>({
    capacity: 1.0,
    flux: 1.0,
    eta: 0.7,
    K: 0.15,
    geometry: 'foil',
  });

  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    tau: number;
    metal: number;
    product: number;
    substrate: number;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const result = useMemo(() => {
    return calculateMetalModel(params);
  }, [params]);

  const handleInputChange = (
    field: keyof MetalModelParams,
    value: string | number
  ) => {
    setErrorMsg('');
    if (field === 'geometry') {
      setParams((prev) => ({ ...prev, geometry: value as MetalGeometry }));
      return;
    }

    const num = parseFloat(value as string);
    if (isNaN(num)) {
      setErrorMsg('Bitte geben Sie eine gültige Zahl ein.');
      return;
    }

    if (field === 'capacity' && (num <= 0 || num > 10)) {
      setErrorMsg('Kapazität muss zwischen 0,1 und 10 liegen.');
    }
    if (field === 'flux' && (num <= 0 || num > 10)) {
      setErrorMsg('Fluss J₀ muss positiv sein.');
    }
    if (field === 'eta' && (num < 0 || num > 1)) {
      setErrorMsg('η muss zwischen 0 und 1 liegen.');
    }
    if (field === 'K' && num < 0) {
      setErrorMsg('K darf nicht negativ sein.');
    }

    setParams((prev) => ({ ...prev, [field]: num }));
  };

  const handlePreset = (preset: 'normal' | 'lack' | 'parasite' | 'solid') => {
    setErrorMsg('');
    if (preset === 'normal') {
      setParams({ capacity: 1.0, flux: 1.0, eta: 0.7, K: 0.15, geometry: 'foil' });
    } else if (preset === 'lack') {
      setParams({ capacity: 0.5, flux: 1.0, eta: 0.7, K: 0.15, geometry: 'foil' });
    } else if (preset === 'parasite') {
      setParams({ capacity: 1.2, flux: 1.2, eta: 0.35, K: 0.25, geometry: 'foil' });
    } else if (preset === 'solid') {
      setParams({ capacity: 1.0, flux: 1.0, eta: 0.7, K: 0.15, geometry: 'solid' });
    }
  };

  // SVG dimensions
  const svgWidth = 974;
  const svgHeight = 320;
  const xLeft = 52;
  const xRight = 958;
  const yTop = 24;
  const yBottom = 272;
  const plotWidth = xRight - xLeft;
  const plotHeight = yBottom - yTop;

  const tauMax = result.points[result.points.length - 1]?.tau || 1.1;

  const mapX = (tau: number) => xLeft + (tau / tauMax) * plotWidth;
  const mapY = (valPercent: number) => yBottom - (valPercent / 100) * plotHeight;

  // Paths
  const metalPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.metal).toFixed(2)}`)
    .join(' ');

  const prodPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.product).toFixed(2)}`)
    .join(' ');

  const prodAreaPath = `${result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.product).toFixed(2)}`)
    .join(' ')} L${mapX(result.points[result.points.length - 1].tau).toFixed(2)},${yBottom} L${mapX(0).toFixed(2)},${yBottom} Z`;

  const substPath = result.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${mapX(pt.tau).toFixed(2)},${mapY(pt.substrate).toFixed(2)}`)
    .join(' ');

  const tauMetalX = mapX(result.tauMetal);

  // SVG Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgWidth;

    if (svgX < xLeft || svgX > xRight) {
      setHoverData(null);
      return;
    }

    const tauRatio = (svgX - xLeft) / plotWidth;
    const curTau = tauRatio * tauMax;

    let closest = result.points[0];
    let minDiff = Infinity;
    for (const pt of result.points) {
      const diff = Math.abs(pt.tau - curTau);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    if (closest) {
      setHoverData({
        x: mapX(closest.tau),
        y: mapY(closest.product),
        tau: closest.tau,
        metal: closest.metal,
        product: closest.product,
        substrate: closest.substrate,
      });
    }
  };

  const handleExportJson = () => {
    exportJson(`M3_Szenario_${params.geometry}_tau${result.tauMetal.toFixed(2)}.json`, {
      titel: 'PEA Kinetik - Modell M3 (Hypothetische Kapazitaetsbilanz)',
      parameter: params,
      ergebnis: {
        tauMetallEnde: result.tauMetal,
        produktAnteilProzent: result.productAtTauMetal,
        substratRestProzent: result.substrateAtTauMetal,
        kapazitaetsBilanz: result.balance,
      },
      punkte: result.points,
    });
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgContent = new XMLSerializer().serializeToString(svgRef.current);
    downloadFile(`pea_m3_plot_${params.geometry}.svg`, svgContent, 'image/svg+xml;charset=utf-8');
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <section id="metall" className="panel">
      <div className="section-head mb-2">
        <div>
          <span className="eyebrow">NEU · DEINE IDEEN ALS PRÜFBARES MODELL</span>
          <h2>Metall weg. Wie viel Produkt ist entstanden?</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="secondary-btn text-xs inline-flex items-center gap-1.5"
            onClick={handleExportSvg}
            title="Diagramm als Vektordatei herunterladen"
          >
            <Download className="w-3.5 h-3.5" />
            {copiedNotification ? 'SVG heruntergeladen!' : 'Plot als SVG'}
          </button>
        </div>
      </div>

      <div className="notice">
        <strong>Hypothetische Kapazitätsbilanz M3, keine Dosierungsrechnung.</strong> Ein Metallvorrat
        wird in idealen Reduktionskapazitäten ausgedrückt. Ein Teil trägt zur Produktbildung bei, der
        Rest zum Nebenverbrauch. Keine Gramm-, Minuten- oder Temperaturprognose.
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap mb-4 text-xs font-sans">
        <span className="text-slate-400 font-medium inline-flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-sky-400" /> Szenario-Presets:
        </span>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
          onClick={() => handlePreset('normal')}
        >
          Normaler Referenzlauf
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('lack')}
        >
          Metallmangel (C₀=0,5)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('parasite')}
        >
          H₂-Parasitismus (η=0,35)
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 transition-colors"
          onClick={() => handlePreset('solid')}
        >
          Schrumpfender Körper (α=2/3)
        </button>
      </div>

      <div className="metal-inputs">
        <label>
          Kapazität C₀ / idealer Gesamtbedarf
          <input
            id="metal-capacity"
            type="number"
            min="0.1"
            max="3"
            step="0.1"
            value={params.capacity}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
          />
        </label>
        <label>
          Anfänglicher Metallverbrauch J₀ (Modellzeit⁻¹)
          <input
            id="metal-flux"
            type="number"
            min="0.1"
            max="3"
            step="0.1"
            value={params.flux}
            onChange={(e) => handleInputChange('flux', e.target.value)}
          />
        </label>
        <label>
          Maximal produktiver Anteil η (0–1)
          <input
            id="metal-eta"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={params.eta}
            onChange={(e) => handleInputChange('eta', e.target.value)}
          />
        </label>
        <label>
          Abnahme bei Substratmangel K (dimensionslos)
          <input
            id="metal-K"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={params.K}
            onChange={(e) => handleInputChange('K', e.target.value)}
          />
        </label>
        <label className="col-span-full">
          Idealisierte Geometrie
          <select
            id="metal-geometry"
            value={params.geometry}
            onChange={(e) => handleInputChange('geometry', e.target.value)}
          >
            <option value="foil">Flache Folie: konstante Fläche bis zum Verbrauch</option>
            <option value="solid">Formähnlich schrumpfender Körper: Fläche ∝ Vorrat²ᐟ³</option>
          </select>
        </label>
      </div>

      {errorMsg && (
        <p id="metal-error" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="legend">
        <span>
          <i className="s"></i>Metallrest (% des Anfangsvorrats)
        </span>
        <span>
          <i className="p"></i>Produkt (% des Ausgangssubstrats)
        </span>
        <span>
          <i className="i-intermediate"></i>Substratrest (% des Ausgangssubstrats)
        </span>
      </div>

      <svg
        ref={svgRef}
        id="metal-plot"
        role="img"
        aria-label="Metallrest und Produktbildung mit unterschiedlichen Bezugsgrößen"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
      >
        <defs>
          <linearGradient id="metalProdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#79bdff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#79bdff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & labels */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = mapY(val);
          return (
            <g key={val}>
              <line x1={xLeft} x2={xRight} y1={y} y2={y} stroke="#2a3b54" />
              <text x={xLeft - 8} y={y + 4} textAnchor="end" fill="#b3c1d5" fontSize="12">
                {val}
              </text>
            </g>
          );
        })}

        {/* X-axis tick labels */}
        <text x={xLeft} y={293} textAnchor="middle" fill="#b3c1d5" fontSize="12">
          0,00
        </text>
        <text x={xLeft + plotWidth * 0.5} y={293} textAnchor="middle" fill="#b3c1d5" fontSize="12">
          {(tauMax * 0.5).toFixed(2).replace('.', ',')}
        </text>
        <text x={xRight} y={293} textAnchor="middle" fill="#b3c1d5" fontSize="12">
          {tauMax.toFixed(2).replace('.', ',')}
        </text>

        <text x={xLeft} y={15} fill="#b3c1d5" fontSize="12">
          Anteil (%), Bezugsgrößen laut Legende
        </text>
        <text x={svgWidth / 2} y={315} textAnchor="middle" fill="#b3c1d5" fontSize="12">
          Dimensionslose Modellzeit τ
        </text>

        {/* Vertical line marking metal depletion */}
        {tauMetalX <= xRight && (
          <g>
            <line
              x1={tauMetalX}
              x2={tauMetalX}
              y1={yTop}
              y2={yBottom}
              stroke="#b3c1d5"
              strokeDasharray="3 5"
              strokeWidth="1.5"
            />
            <text
              x={tauMetalX}
              y={yTop - 6}
              textAnchor="middle"
              fill="#b3c1d5"
              fontSize="11"
              fontFamily="monospace"
            >
              τ_Metall = {result.tauMetal.toFixed(2)}
            </text>
          </g>
        )}

        {/* Area fill under Product curve */}
        <path d={prodAreaPath} fill="url(#metalProdGrad)" />

        {/* Metallrest curve */}
        <path
          d={metalPath}
          stroke="#b3c1d5"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 4"
        />

        {/* Substratrest curve */}
        <path
          d={substPath}
          stroke="#73d9c5"
          strokeWidth="2"
          fill="none"
        />

        {/* Produkt curve */}
        <path
          d={prodPath}
          stroke="#79bdff"
          strokeWidth="3"
          fill="none"
        />

        {/* Interactive hover indicator */}
        {hoverData && (
          <g>
            <line
              x1={hoverData.x}
              x2={hoverData.x}
              y1={yTop}
              y2={yBottom}
              stroke="rgba(255,255,255,0.4)"
              strokeDasharray="2 2"
            />
            <circle
              cx={hoverData.x}
              cy={mapY(hoverData.product)}
              r="5"
              fill="#79bdff"
              stroke="#0b1220"
              strokeWidth="2"
            />
            <rect
              x={Math.min(hoverData.x + 10, svgWidth - 190)}
              y={Math.max(hoverData.y - 65, 30)}
              width="175"
              height="68"
              rx="4"
              fill="#111d30"
              stroke="#2a3b54"
              strokeWidth="1"
            />
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 48, 47)}
              fill="#edf3fc"
              fontSize="11"
              fontFamily="monospace"
            >
              τ = {hoverData.tau.toFixed(2)}
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 34, 61)}
              fill="#79bdff"
              fontSize="11"
              fontFamily="monospace"
            >
              Produkt: {hoverData.product.toFixed(1)}%
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 20, 75)}
              fill="#73d9c5"
              fontSize="11"
              fontFamily="monospace"
            >
              Substrat: {hoverData.substrate.toFixed(1)}%
            </text>
            <text
              x={Math.min(hoverData.x + 18, svgWidth - 182)}
              y={Math.max(hoverData.y - 6, 89)}
              fill="#b3c1d5"
              fontSize="11"
              fontFamily="monospace"
            >
              Metallrest: {hoverData.metal.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>

      <p id="metal-result" aria-live="polite">
        Metall rechnerisch verbraucht bei τ ={' '}
        {result.tauMetal.toFixed(2).replace('.', ',')}. Dann:{' '}
        {result.productAtTauMetal.toFixed(2).replace('.', ',')} % Produkt und{' '}
        {result.substrateAtTauMetal.toFixed(2).replace('.', ',')} % Substratrest. Kein
        analytischer Nachweis für den realen Ansatz.
      </p>

      <p className="small">
        Die gestrichelte senkrechte Linie markiert den rechnerischen Metallverbrauch. Die drei Kurven
        bilden keine gemeinsame Prozentbilanz: Metall und organische Stoffe haben unterschiedliche
        Bezugsgrößen.
      </p>

      <div className="table-wrap">
        <table>
          <caption>Bilanz beim rechnerisch verbrauchten Metall (Kapazitätseinheiten)</caption>
          <thead>
            <tr>
              <th>Anfangskapazität</th>
              <th>Produktiv genutzt</th>
              <th>Nebenverbrauch</th>
              <th>Verbleibendes Metall</th>
            </tr>
          </thead>
          <tbody id="metal-balance">
            <tr>
              <td>{result.balance.c0.toFixed(4).replace('.', ',')}</td>
              <td>{result.balance.productive.toFixed(4).replace('.', ',')}</td>
              <td>{result.balance.side.toFixed(4).replace('.', ',')}</td>
              <td>{result.balance.remaining.toFixed(4).replace('.', ',')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button id="metal-export" type="button" className="primary-btn" onClick={handleExportJson}>
        M3-Szenario als JSON speichern
      </button>

      <details>
        <summary>Welche deiner Ideen wurden übernommen?</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Idee</th>
                <th>Verbesserte Verwendung</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Stöchiometrie</td>
                <td>Idealer Elektronenbedarf als Bezugsgröße; produktiver Nutzungsanteil separat.</td>
              </tr>
              <tr>
                <td>Auflösen als Endschalter</td>
                <td>Metall-Endpunkt wird angezeigt und vom Produktumsatz getrennt.</td>
              </tr>
              <tr>
                <td>Foliengeometrie</td>
                <td>
                  Gleichmäßiges Dünnerwerden einer flachen Folie und formähnliches Schrumpfen als
                  verschiedene Grenzmodelle.
                </td>
              </tr>
              <tr>
                <td>50-%-Flächenabschlag</td>
                <td>
                  Keine feste Naturkonstante. Im Modell fehlen belegte aktive Fläche und Abtragsfluss;
                  J₀ ist ausdrücklich frei gewählt.
                </td>
              </tr>
              <tr>
                <td>Rührgeschwindigkeit</td>
                <td>
                  Kein direkter Ersatz für Stofftransportdaten; keine Umrechnung von U/min in
                  Reaktionsrate.
                </td>
              </tr>
              <tr>
                <td>Siedepunkt als Begrenzung</td>
                <td>
                  Als Wärmeabfuhrmechanismus denkbar, nicht als garantierte Maximaltemperatur
                  implementiert.
                </td>
              </tr>
              <tr>
                <td>Amalgamierung</td>
                <td>
                  Keine konstante Aktivität oder Elektronennutzung unterstellt; Quecksilberzugabe wird
                  nicht aus dem Modell bestimmt.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details>
        <summary>Gleichungen und Grenzen</summary>
        <div className="formula">
          C′ = −J₀ (C/C₀)<sup>α</sup>, bis C = 0<br />
          U = C₀ − C<br />
          dP/dU = η S/(K + S)<br />
          S = 1 − P<br />
          W = U − P<br />
          C + P + W = C₀
        </div>
        <p>
          α = 0 für die idealisierte flache Folie; α = 2/3 für einen formähnlich schrumpfenden
          Körper. Bei gleicher Anfangskapazität und gleichem J₀ gilt τ<sub>Metall</sub> = C₀/[(1−α)J₀].
          Das ist ein Ergebnis der Annahmen, keine vorausgesagte reale Auflösungszeit.
        </p>
        <p>
          Für K &gt; 0 folgt S + K ln(S) = 1 − ηU. Die Lösung wird im logarithmischen Raum numerisch
          bestimmt. Für K = 0 ist P = min(1, ηU); nach Substratverbrauch wird weitere Kapazität dem
          Nebenverbrauch zugeordnet.
        </p>
        <p>
          η ist der maximal produktive Anteil und K bestimmt dessen angenommene Abnahme bei sinkendem
          Substratbestand. Beide sind ungemessen. Der Nebenverbrauch W kann nicht ohne zusätzliche Daten
          in Wasserstoff, andere Reduktionsprodukte oder weitere Prozesse aufgeteilt werden.
        </p>
        <p>
          Das Modell fasst den vollständigen produktiven Weg als einen Schritt zusammen. Es enthält keine
          Zwischenproduktakkumulation, Produktzersetzung, Oxidschicht, Fragmentierung, Wärmebilanz oder
          Speziation. M3 wird separat von M2 gezeigt: Eine mechanistische Kopplung wäre ohne zusätzliche
          Definitionen nicht gerechtfertigt.
        </p>
      </details>

      <details>
        <summary>Warum die Folie nicht wie ein kleiner Würfel schrumpfen muss</summary>
        <p>
          Für ein glattes Rechteck mit Länge l, Breite b und Dicke d gilt geometrisch A = 2lb + 2d(l+b),
          Volumen V = lbd und Masse m = ρlbd. Das beschreibt die glatte äußere Fläche, nicht
          automatisch die reaktive Fläche.
        </p>
        <p>
          Bei überwiegendem Abtrag der beiden großen Flächen kann die Dicke abnehmen, während Länge und
          Breite nahezu konstant bleiben. Die Fläche bleibt dann annähernd konstant. Faltung,
          Lochbildung, Zerfall, Blasenbedeckung und Passivierung können diesen Grenzfall verändern.
        </p>
      </details>

      <p className="small">
        Sachlicher Hintergrund zum konkurrierenden Metallverbrauch:{' '}
        <a
          href="https://www.sciencedirect.com/science/article/abs/pii/S036031991101994X"
          target="_blank"
          rel="noreferrer"
        >
          Effects of amalgam on hydrogen generation by hydrolysis of aluminum with water
        </a>
        . Daraus wurden keine Parameter für M3 übernommen.
      </p>
    </section>
  );
};
