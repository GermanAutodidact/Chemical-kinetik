/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Cpu, ExternalLink, Code } from 'lucide-react';

export const AiApiSection: React.FC = () => {
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'pea_simulate_m1' | 'pea_simulate_m2' | 'pea_simulate_m3' | 'pea_arrhenius'>('pea_simulate_m1');
  const [requestArgs, setRequestArgs] = useState<string>('{\n  "q": 0.25,\n  "r": 0.15\n}');
  const [responseOutput, setResponseOutput] = useState<string>('Noch keine Anfrage ausgeführt. Klicke auf "Tool ausführen"');
  const [loading, setLoading] = useState(false);

  const mcpConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        'pea-kinetics': {
          url: `${window.location.origin}/api/mcp`,
        },
      },
    },
    null,
    2
  );

  const handleCopyMcp = () => {
    navigator.clipboard.writeText(mcpConfigSnippet);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const handleToolChange = (tool: typeof selectedTool) => {
    setSelectedTool(tool);
    if (tool === 'pea_simulate_m1') {
      setRequestArgs('{\n  "q": 0.25,\n  "r": 0.15\n}');
    } else if (tool === 'pea_simulate_m2') {
      setRequestArgs('{\n  "a0": 1.0,\n  "lambda": 0.15,\n  "m": 1.0,\n  "u": 1.0,\n  "q": 0.25,\n  "r": 0.15,\n  "observe": "product"\n}');
    } else if (tool === 'pea_simulate_m3') {
      setRequestArgs('{\n  "capacity": 1.0,\n  "flux": 1.0,\n  "eta": 0.7,\n  "K": 0.15,\n  "geometry": "foil"\n}');
    } else if (tool === 'pea_arrhenius') {
      setRequestArgs('{\n  "Ea_kJ": 55\n}');
    }
  };

  const handleRunTool = async () => {
    setLoading(true);
    try {
      const parsedArgs = JSON.parse(requestArgs);
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        }),
      });
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setResponseOutput(`Fehler bei der Ausführung: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-api" className="panel border-sky-500/20">
      <div className="section-head mb-4">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-sky-400">
            <Cpu className="w-3.5 h-3.5" />
            SCHNITTSTELLEN FÜR EXTERNE KIS &amp; AGENTEN
          </span>
          <h2>MCP-Server &amp; REST-API für KI-Zugriff</h2>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded inline-flex items-center gap-1 transition-colors"
          >
            OpenAPI Spezifikation <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="/api/mcp"
            target="_blank"
            rel="noreferrer"
            className="text-xs px-2.5 py-1 bg-sky-950/70 border border-sky-800 text-sky-200 rounded inline-flex items-center gap-1 transition-colors"
          >
            MCP Discovery <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-6">
        Externe KI-Systeme (wie Claude, Cursor, Google Gemini oder autonome Agenten) können direkt auf die 
        Berechnungsmodelle dieser Anwendung zugreifen – entweder standardisiert über das{' '}
        <strong>Model Context Protocol (MCP)</strong> oder über direkte REST-Endpunkte.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: MCP Integration Config */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-sky-400" />
              MCP-Server Konfiguration (Claude Desktop / Cursor)
            </span>
            <button
              type="button"
              onClick={handleCopyMcp}
              className="text-xs inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
            >
              {copiedMcp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMcp ? 'Kopiert!' : 'Kopieren'}
            </button>
          </div>
          <pre className="formula text-xs text-sky-200 p-3 rounded-lg overflow-x-auto bg-slate-950 border border-slate-800">
            {mcpConfigSnippet}
          </pre>

          <div className="mt-4 text-xs text-slate-400 space-y-2">
            <p>
              <strong>Verfügbare MCP-Tools:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="text-sky-300">pea_simulate_m1</code>: Analytische Kaskade &amp; Produktmaximum.</li>
              <li><code className="text-sky-300">pea_simulate_m2</code>: RK4-Simulation mit Deaktivierung &amp; SVD-Rang.</li>
              <li><code className="text-sky-300">pea_simulate_m3</code>: Metallauflösung, Geometrie &amp; Kapazitätsbilanz.</li>
              <li><code className="text-sky-300">pea_arrhenius</code>: Hypothetische Arrhenius-Ratenfaktoren (ohne thermische Stabilitätsaussage).</li>
            </ul>
          </div>
        </div>

        {/* Right: Live Interactive Tool Tester */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Live KI-Tool Tester (Browser-Simulation)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">POST /api/mcp</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {(['pea_simulate_m1', 'pea_simulate_m2', 'pea_simulate_m3', 'pea_arrhenius'] as const).map((tool) => (
              <button
                key={tool}
                type="button"
                className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                  selectedTool === tool
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
                onClick={() => handleToolChange(tool)}
              >
                {tool}
              </button>
            ))}
          </div>

          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Parameter (JSON):
          </label>
          <textarea
            rows={4}
            value={requestArgs}
            onChange={(e) => setRequestArgs(e.target.value)}
            className="w-full font-mono text-xs bg-slate-900 text-slate-200 border border-slate-800 rounded p-2 focus:outline-none focus:border-sky-500 mb-2.5"
          />

          <button
            type="button"
            onClick={handleRunTool}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-semibold rounded hover:bg-emerald-400 transition-colors mb-3"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Berechne...' : 'Tool ausführen'}
          </button>

          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Ergebnis (JSON-RPC 2.0 Response):
          </label>
          <pre className="font-mono text-[11px] text-slate-300 bg-slate-900/90 border border-slate-800 p-2.5 rounded max-h-48 overflow-y-auto">
            {responseOutput}
          </pre>
        </div>
      </div>
    </section>
  );
};
