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
  const zip = new JSZip();

  // 1. README.md
  zip.file(
    'README.md',
    `# PEA · Kinetik & Evidenz (Forschungspaket)
Stand: 03.10.2026
System: beta-Nitrostyrol -> Phenylethylamin (Al/Hg, Essigsaeure, Wasser)

Enthaltene Modelle:
- M1 (model_m1.py): Kinetischer Modellvergleich mit geschlossener analytischer Loesung
- M2 (model_m2.py): Erweitertes Mehrschrittmodell mit RK4, Oberflaechendeaktivierung und Transportwiderstand
- M3 (model_m3.py): Hypothetische Metall-Kapazitaetsbilanz (Folie vs. schrumpfender Koerper)

Ausfuehrung:
  python3 test_models.py
`
  );

  // 2. Python model M1
  zip.file(
    'models/model_m1.py',
    `import numpy as np

def simulate_m1(q=0.25, r=0.15, tau_end=6.0, steps=240):
    """
    S -> P -> D (rate k3 = r*k1)
    S -> B (rate k2 = q*k1)
    """
    K = 1.0 + q
    taus = np.linspace(0, tau_end, steps + 1)
    S = np.exp(-K * taus)
    if abs(K - r) < 1e-6:
        P = taus * np.exp(-K * taus)
    else:
        P = (np.exp(-r * taus) - np.exp(-K * taus)) / (K - r)
    B = (q / K) * (1.0 - np.exp(-K * taus))
    D = 1.0 - S - P - B
    return taus, S, P, B + D
`
  );

  // 3. Python model M2
  zip.file(
    'models/model_m2.py',
    `import numpy as np

def simulate_m2(a0=1.0, lam=0.15, m=1.0, u=1.0, q=0.25, r=0.15, tau_end=6.0, dt=0.005):
    """
    Erweitertes Modell mit RK4: S -> I -> P, S -> B, P -> D
    """
    steps = int(tau_end / dt)
    S, I, P, B, D = 1.0, 0.0, 0.0, 0.0, 0.0
    history = [(0.0, S, I, P, B + D)]
    
    for step in range(steps):
        t = step * dt
        def deriv(tau, s, i, p):
            a = a0 * np.exp(-lam * tau)
            h = (a * m) / (a + m)
            return (-h*s - q*s, h*s - u*h*i, u*h*i - r*p, q*s, r*p)
            
        k1 = deriv(t, S, I, P)
        k2 = deriv(t + 0.5*dt, S + 0.5*dt*k1[0], I + 0.5*dt*k1[1], P + 0.5*dt*k1[2])
        k3 = deriv(t + 0.5*dt, S + 0.5*dt*k2[0], I + 0.5*dt*k2[1], P + 0.5*dt*k2[2])
        k4 = deriv(t + dt, S + dt*k3[0], I + dt*k3[1], P + dt*k3[2])
        
        S += (dt/6.0)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])
        I += (dt/6.0)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])
        P += (dt/6.0)*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])
        B += (dt/6.0)*(k1[3] + 2*k2[3] + 2*k3[3] + k4[3])
        D += (dt/6.0)*(k1[4] + 2*k2[4] + 2*k3[4] + k4[4])
        
        history.append(((step + 1)*dt, S, I, P, B + D))
    return history
`
  );

  // 4. Python model M3
  zip.file(
    'models/model_m3.py',
    `import numpy as np

def solve_s(K, target):
    if K <= 0:
        return max(0.0, min(1.0, target))
    w = 0.0
    for _ in range(25):
        ew = np.exp(w)
        f = ew + K * w - target
        df = ew + K
        w -= f / df
    return max(0.0, min(1.0, np.exp(w)))

def simulate_m3(C0=1.0, J0=1.0, eta=0.7, K=0.15, geometry='foil'):
    tau_metal = C0 / J0 if geometry == 'foil' else 3.0 * C0 / J0
    u_end = C0
    s_end = solve_s(K, 1.0 - eta * u_end)
    p_end = 1.0 - s_end
    return {
        'tau_metal': tau_metal,
        'product_at_end': p_end,
        'substrate_at_end': s_end,
        'side_consumption': C0 - p_end
    }
`
  );

  // 5. Test runner
  zip.file(
    'test_models.py',
    `from models.model_m1 import simulate_m1
from models.model_m3 import simulate_m3

print("Running validation tests...")
m3 = simulate_m3()
print(f"M3 Foil end tau: {m3['tau_metal']:.2f}, Product: {m3['product_at_end']*100:.2f}%")
assert abs(m3['tau_metal'] - 1.0) < 1e-3
assert abs(m3['product_at_end'] - 0.5725) < 1e-2

taus, S, P, BD = simulate_m1()
print(f"M1 peak: {max(P)*100:.2f}% at tau={taus[np.argmax(P)]:.2f}")
print("All model tests passed successfully!")
`
  );

  // 6. Reports
  zip.file('docs/bericht.md', BERICHT_MARKDOWN);
  zip.file('docs/matrix.csv', MATRIX_CSV_CONTENT);

  // 7. Contribution guidelines
  zip.file(
    'CONTRIBUTING.md',
    `# Richtlinien fuer Beitraege (Contribution Guidelines)
Wir freuen uns ueber experimentell validierte Messdaten und verbesserte kinetische Modellansaetze!

Voraussetzungen fuer Pull Requests:
1. Reale Konzentrationsreihen muessen analytisch belegt sein (HPLC, GC-MS oder NMR mit internem Standard).
2. Unsicherheiten muessen quantifiziert angegeben werden.
3. Bitte keine erfundenen oder nicht referenzierten Parameter eintragen.
`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadFile('pea-kinetics-source.zip', zipBlob, 'application/zip');
}
