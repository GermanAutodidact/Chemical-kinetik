/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Send, CheckCircle2, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

interface SuggestionItem {
  id: string;
  created_at: string;
  version: string;
  location: string;
  proposal: string;
  reason: string;
  author: string;
  status: string;
}

export const ContributeSection: React.FC = () => {
  const [location, setLocation] = useState('');
  const [proposal, setProposal] = useState('');
  const [reason, setReason] = useState('');
  const [author, setAuthor] = useState('');
  const [requestId, setRequestId] = useState(() => 'req_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchSuggestions = async (cursor?: string) => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const url = cursor ? `/api/suggestions?limit=10&before=${encodeURIComponent(cursor)}` : '/api/suggestions?limit=10';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (cursor) {
        setSuggestions((prev) => [...prev, ...(data.items || [])]);
      } else {
        setSuggestions(data.items || []);
      }
      setNextCursor(data.next_cursor || null);
    } catch (err) {
      setListError(`Vorschläge konnten nicht geladen werden: ${err instanceof Error ? err.message : String(err)}. Bitte erneut versuchen.`);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    setRequestId(crypto.randomUUID());
  }, [location, proposal, reason, author]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      location: location.trim(),
      proposal: proposal.trim(),
      reason: reason.trim(),
      author: author.trim() || 'Anonym',
      version: '0.6.0',
      request_id: requestId,
      submit_authorized: true,
    };

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server meldete Fehler ${res.status}`);
      }

      setSubmitStatus({
        success: true,
        message: data.duplicate
          ? `Vorschlag war bereits unter ID "${data.id}" erfasst (Duplikat erkannt).`
          : `Vorschlag erfolgreich erfasst (ID: ${data.id}, UTC: ${data.created_at}). Status: ungeprüft.`,
      });

      // Clear inputs and cycle request_id on success
      setLocation('');
      setProposal('');
      setReason('');
      setAuthor('');
      setRequestId('req_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36));

      // Refresh community list
      fetchSuggestions();
    } catch (err: unknown) {
      // Inputs are PRESERVED on error!
      setSubmitStatus({
        success: false,
        message: `Fehler beim Einreichen: ${err instanceof Error ? err.message : String(err)}. Deine Eingaben wurden nicht gelöscht.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="mitmachen" className="panel border-slate-700/80 bg-slate-900/60">
      <div className="section-head mb-3">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-sky-400">
            <MessageSquare className="w-3.5 h-3.5" />
            ÖFFENTLICH LESEN · GEMEINSAM VERBESSERN
          </span>
          <h2>Ein begründeter Satz genügt.</h2>
        </div>
        <a
          href="/pea-kinetics-source.zip"
          download="pea-kinetics-source.zip"
          className="text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded inline-flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Vollständiges Quellpaket herunterladen (ZIP)
        </a>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">
        Menschen und vom Nutzer beauftragte KIs können über dieses Formular oder die dokumentierte API 
        (<code>POST /api/suggestions</code>) kurze, datierte Verbesserungsvorschläge einreichen. 
        Vorschläge bleiben <strong>ungeprüfte Beiträge</strong> und ändern weder Modelle noch Quellcode automatisch.
      </p>

      {/* Proposal Form */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 text-xs font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-slate-400 mb-1">
              Betroffene Stelle <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={160}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zum Beispiel M3 / Kapazitätsbilanz oder M2 / Jacobi SVD"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              Name oder KI-Bezeichnung (optional, Selbstauskunft)
            </label>
            <input
              type="text"
              maxLength={80}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonym oder Modellkennung"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-slate-400 mb-1">
            Verbesserungsvorschlag <span className="text-rose-400">*</span> (max. 1200 Zeichen)
          </label>
          <textarea
            required
            maxLength={1200}
            rows={3}
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            placeholder="Konkrete Formulierung oder Codeänderung..."
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="mb-3">
          <label className="block text-slate-400 mb-1">
            Kurze Begründung oder Quelle <span className="text-rose-400">*</span> (max. 1200 Zeichen)
          </label>
          <textarea
            required
            maxLength={1200}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mathematischer Beweis, Paper-DOI oder numerischer Testfall..."
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          Mit „Öffentlich einreichen“ wird dieser Text dauerhaft in der Projekt-Datenbank gespeichert. 
          Keine Kontaktdaten, Passwörter oder Geheimnisse eintragen. Maximal drei Beiträge pro Minute 
          je technisch erkannter IP-Quelle; für Wiederholungen dieselbe Anfrage-ID verwenden.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-btn text-xs inline-flex items-center gap-1.5"
        >
          {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {isSubmitting ? 'Wird gespeichert...' : 'Öffentlich einreichen'}
        </button>

        {submitStatus && (
          <div
            className={`mt-3 p-2.5 rounded text-xs flex items-start gap-2 ${
              submitStatus.success
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/80'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/80'
            }`}
          >
            {submitStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>{submitStatus.message}</div>
          </div>
        )}
      </form>

      {/* Community Proposals Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">
            Eingereichte Community-Vorschläge
          </h3>
          <button
            type="button"
            onClick={() => fetchSuggestions()}
            className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Aktualisieren
          </button>
        </div>

        {listError && <p role="alert" className="text-xs text-rose-300 mb-3">{listError}</p>}
        {isLoadingList && suggestions.length === 0 ? (
          <p className="text-xs text-slate-400 font-mono">Vorschläge werden geladen …</p>
        ) : suggestions.length === 0 && !listError ? (
          <p className="text-xs text-slate-400 font-mono">Noch keine externen Vorschläge eingetragen.</p>
        ) : (
          <div className="space-y-2.5 mb-3">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span className="font-semibold text-sky-400">{item.location}</span>
                  <span className="font-mono text-slate-500">
                    {new Date(item.created_at).toLocaleString('de-DE')} · Status:{' '}
                    <span className="text-amber-400 uppercase text-[10px]">{item.status}</span>
                  </span>
                </div>
                <p className="text-slate-100 font-medium mb-1 whitespace-pre-wrap">{item.proposal}</p>
                <p className="text-slate-400 text-[11px] whitespace-pre-wrap mb-1">
                  <strong>Begründung:</strong> {item.reason}
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Autor: {item.author} · Version: {item.version}
                </div>
              </div>
            ))}
          </div>
        )}

        {nextCursor && (
          <button
            type="button"
            onClick={() => fetchSuggestions(nextCursor)}
            className="text-xs secondary-btn w-full text-center"
          >
            Ältere Vorschläge nachladen
          </button>
        )}

        <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 font-sans">
          <p className="font-semibold text-slate-200 mb-1">
            Hinweis zur GitHub-Synchronisierung &amp; Reproduzierbarkeit:
          </p>
          <p className="mb-2">
            Diese Web-App läuft als eigenständiger Dienst auf Google Cloud Run. Die automatische Synchronisierung 
            mit dem GitHub-Repository <code>GermanAutodidact/Chemical-kinetik</code> erfordert persönliche GitHub-Schreibrechte. 
            Bis dahin ist der vollständige, überprüfbare Stand im Quellpaket (ZIP) enthalten.
          </p>
          <p>
            <strong>So veröffentlichst du den Stand auf GitHub:</strong> Lade das obige Quellpaket (<code>pea-kinetics-source.zip</code>) 
            herunter, entpacke es in dein lokales Repository und führe <code>git add . &amp;&amp; git commit -m "Complete model suite" &amp;&amp; git push</code> aus.
          </p>
        </div>
      </div>
    </section>
  );
};
