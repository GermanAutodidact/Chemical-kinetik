/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { BERICHT_MARKDOWN, MATRIX_CSV_CONTENT } from '../data/reports';

export function downloadFile(filename: string, content: string | Blob, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportJson(filename: string, data: unknown) {
  const content = JSON.stringify(data, null, 2);
  downloadFile(filename, content, 'application/json');
}

export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      row
        .map((val) => (typeof val === 'number' ? val.toFixed(4).replace('.', ',') : val))
        .join(';')
    ),
  ].join('\n');
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}

export function exportMarkdown(filename: string, content: string) {
  downloadFile(filename, content, 'text/markdown;charset=utf-8;');
}

export async function createAndDownloadSourceZip() {
  try {
    const res = await fetch('/pea-kinetics-source.zip');
    if (res.ok) {
      const blob = await res.blob();
      downloadFile('pea-kinetics-source.zip', blob, 'application/zip');
      return;
    }
  } catch {
    // fallback if fetch fails
    window.location.href = '/pea-kinetics-source.zip';
  }
}
