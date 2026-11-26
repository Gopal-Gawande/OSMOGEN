import { useState } from 'react';
import {
  BookOpen,
  Download,
  Play,
  Printer,
  Upload,
  X,
} from 'lucide-react';
import {
  EVIDENCE_PAPERS,
  JUDGE_DEMO_STEPS,
  MODEL_LIMITATIONS,
  TECHNICAL_RISKS,
  VALIDATION_GATES,
  type JudgeDemoStep,
} from '../engine/evidenceData.ts';
import type {
  ConfigurationEnvelope,
  ProInputs,
  ProResults,
} from '../engine/proModel.ts';

interface JudgeDemoDrawerProps {
  open: boolean;
  onClose: () => void;
  activeDemoStep: number | null;
  onRunDemoStep: (step: JudgeDemoStep) => void;
  configuration: ConfigurationEnvelope;
  inputs: ProInputs;
  results: ProResults;
  onImportJsonRun: (rawText: string) => void;
}

type DrawerTab = 'demo' | 'evidence' | 'export';

export function JudgeDemoDrawer({
  open,
  onClose,
  activeDemoStep,
  onRunDemoStep,
  configuration,
  inputs,
  results,
  onImportJsonRun,
}: JudgeDemoDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('demo');
  const [searchTerm, setSearchTerm] = useState('');

  if (!open) return null;

  const filteredPapers = EVIDENCE_PAPERS.filter((paper) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      paper.title.toLowerCase().includes(q) ||
      paper.journal.toLowerCase().includes(q) ||
      paper.doi.toLowerCase().includes(q) ||
      paper.claimSupported.toLowerCase().includes(q)
    );
  });

  const handleDownloadJson = () => {
    const exportPayload = {
      project: 'OSMOGEN Intelligence — PRO Feasibility Lab',
      founder: 'Gopal Gawande',
      stage: 'Concept and research',
      modelVersion: results.modelVersion,
      status: results.status,
      exportedAt: new Date().toISOString(),
      configuration,
      inputs,
      results,
      evidenceRegisterCount: EVIDENCE_PAPERS.length,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osmogen-run-${configuration}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportJsonRun(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="BUILD 2036 Judge Demo, Evidence Register, and Report Export"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-[#1E2D45] bg-[#0B1324] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#1E2D45] px-6 py-4">
          <div>
            <p className="text-[11px] font-medium text-cyan-400">
              BUILD 2036 Climate & Clean Energy Submission
            </p>
            <h2 className="text-lg font-bold text-slate-100">
              Judge Demo, Evidence & Report Export
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-lg border border-[#1E2D45] p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-[#1E2D45] px-6 py-2.5 bg-[#080E1A]">
          {(
            [
              ['demo', '2-Min Demo Script (7 Steps)'],
              ['evidence', 'Evidence Register & Gates'],
              ['export', 'Export Report (PDF / JSON)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                tab === id
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'demo' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#1E2D45] bg-[#0F1829] p-4 text-xs text-slate-300 leading-relaxed">
                Click any step below to load the exact parameter preset and jump directly to the matching module for your 2-minute live pitch walkthrough. Remember evidence discipline: label all outputs <span className="font-mono text-cyan-300">modelled / illustrative</span> and keep <span className="font-mono text-amber-300">kWth</span> separate from <span className="font-mono text-emerald-300">kWe</span>.
              </div>

              <ol className="space-y-3">
                {JUDGE_DEMO_STEPS.map((item) => {
                  const isCurrent = activeDemoStep === item.step;
                  return (
                    <li
                      key={item.step}
                      className={`rounded-xl border p-4 transition-colors ${
                        isCurrent
                          ? 'border-cyan-500/60 bg-[#142036]'
                          : 'border-[#1E2D45] bg-[#0F1829]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] text-cyan-400">
                            Step {item.step} · {item.durationSec}
                          </p>
                          <h3 className="mt-0.5 text-sm font-semibold text-slate-100">
                            {item.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRunDemoStep(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Play className="h-3 w-3" />
                          Run Step
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                        {item.talkTrack}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {tab === 'evidence' && (
            <div className="space-y-6">
              {/* 6-Paper Research Register */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                    Curated Research Register ({EVIDENCE_PAPERS.length} References)
                  </h3>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter DOI or topic..."
                    className="w-44 rounded-lg border border-[#1E2D45] bg-[#080E1A] px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2.5">
                  {filteredPapers.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-[#1E2D45] bg-[#0F1829] p-3.5 space-y-1.5"
                    >
                      <p className="font-mono text-[11px] text-cyan-400">
                        {p.year} · {p.journal} · DOI: {p.doi}
                      </p>
                      <p className="text-xs font-semibold text-slate-100">{p.title}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Claim: {p.claimSupported}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Limitation: {p.statedLimitation}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5 Validation Gates */}
              <section className="space-y-3 border-t border-[#1E2D45] pt-5">
                <h3 className="text-sm font-semibold text-slate-100">
                  Staged Validation Gates (1–5)
                </h3>
                <div className="space-y-2.5">
                  {VALIDATION_GATES.map((g) => (
                    <div
                      key={g.gate}
                      className="rounded-lg border border-[#1E2D45] bg-[#0F1829] p-3.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-100">
                          Gate {g.gate}. {g.stage}
                        </p>
                        <span
                          className={`font-mono text-[10px] font-semibold ${
                            g.currentStatus === 'In Progress'
                              ? 'text-cyan-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {g.currentStatus} · {g.timing}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{g.objective}</p>
                      <p className="mt-1 text-[11px] text-slate-300">
                        Exit criteria: {g.exitCriteria}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 10 Model Limitations */}
              <section className="space-y-2.5 border-t border-[#1E2D45] pt-5">
                <h3 className="text-sm font-semibold text-slate-100">
                  Explicit First-Order Model Omissions (v0.1)
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 leading-relaxed">
                  {MODEL_LIMITATIONS.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ol>
              </section>

              {/* Technical Risks */}
              <section className="space-y-2.5 border-t border-[#1E2D45] pt-5">
                <h3 className="text-sm font-semibold text-slate-100">
                  Technical Risk Register
                </h3>
                <div className="space-y-2">
                  {TECHNICAL_RISKS.map((r) => (
                    <div
                      key={r.risk}
                      className="border-b border-[#1E2D45]/70 pb-2 text-xs last:border-b-0"
                    >
                      <p className="font-semibold text-slate-200">{r.risk}</p>
                      <p className="text-slate-400 mt-0.5">
                        Consequence: {r.consequence} · Mitigation: {r.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'export' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Printable Engineering Summary Report (PDF)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Opens your browser print dialog with a dedicated high-contrast light-ink engineering summary containing your active inputs, deterministic electrical (`kWe`) and separate thermal (`kWth`) outputs, boundary alerts, and concept-stage status statement.
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF Summary
                </button>
              </div>

              <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Reproducible Versioned JSON Run (Section 7 Schema)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export or reload raw assumptions, model version (`screening-0.1`), timestamp, and deterministic results for auditability and version control.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download JSON Snapshot
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1E2D45] bg-[#142036] px-4 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 transition-colors">
                    <Upload className="h-4 w-4" />
                    Import JSON Snapshot
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-[#1E2D45] bg-[#080E1A] p-4">
                <p className="text-[11px] font-mono text-slate-400 mb-2">
                  Active Run Preview (modelVersion: {results.modelVersion} · status: {results.status})
                </p>
                <pre className="max-h-60 overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed">
                  {JSON.stringify(
                    {
                      configuration,
                      inputs,
                      keyOutputs: {
                        bulkDeltaPi_bar: Number(results.bulkDeltaPi_bar.toFixed(2)),
                        effectiveDeltaPi_bar: Number(results.effectiveDeltaPi_bar.toFixed(2)),
                        waterFlux_LMH: Number(results.waterFlux_LMH.toFixed(2)),
                        hydraulicPower_kW: Number(results.hydraulicPower_kW.toFixed(2)),
                        grossElectric_kWe: Number(results.grossElectric_kWe.toFixed(2)),
                        totalAuxiliary_kWe: Number(results.totalAuxiliary_kWe.toFixed(2)),
                        netElectric_kWe: Number(results.netElectric_kWe.toFixed(2)),
                        roHybridSEC_kWh_m3: Number(results.roHybridSEC_kWh_m3.toFixed(3)),
                        solarUsefulHeat_kWth: Number(results.solarUsefulHeat_kWth.toFixed(1)),
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
