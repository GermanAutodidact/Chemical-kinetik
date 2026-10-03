/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { exportMarkdown, exportCsv } from '../utils/export';
import { BERICHT_MARKDOWN } from '../data/reports';

export const Footer: React.FC = () => {
  const handleDownloadReport = (e: React.MouseEvent) => {
    e.preventDefault();
    exportMarkdown('bericht_pea_kinetik_evidenz.md', BERICHT_MARKDOWN);
  };

  const handleDownloadMatrixCsv = (e: React.MouseEvent) => {
    e.preventDefault();
    const rows = [
      ['20 °C', '293,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
      ['50 °C', '323,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
      ['70 °C', '343,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
      ['90 °C', '363,15 K', '0 %*', 'Offen', 'Offen', 'Nicht bestimmt'],
    ];
    exportCsv('matrix.csv', ['Temperatur', 'Kelvin', 't = 0', 't1 > 0', 't2 > t1', 'Kipppunkt'], rows);
  };

  return (
    <footer>
      <strong>Bearbeitungsstand:</strong> Literatur bewertet · Modelle analytisch und numerisch
      berechnet · Modellkerne geprüft.
      <br />
      Ausstehend: systemspezifische Parameter, Validierung und reale Ausbeuteprognose.
      <br />
      <button
        type="button"
        className="textlink mr-3"
        onClick={handleDownloadReport}
      >
        Forschungsbericht
      </button>
      ·{' '}
      <button
        type="button"
        className="textlink ml-2"
        onClick={handleDownloadMatrixCsv}
      >
        Temperaturmatrix als CSV
      </button>
    </footer>
  );
};
