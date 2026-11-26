import { useState } from 'react';
import {
  AlertTriangle,
  FlaskConical,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  ConfigurationEnvelope,
  ProInputs,
  ProResults,
} from '../engine/proModel.ts';

interface AiAssistantViewProps {
  configuration: ConfigurationEnvelope;
  inputs: ProInputs;
  results: ProResults;
}

interface StructuredAnalysis {
  executiveSummary: string;
  sensitivityDrivers: { driver: string; impact: string }[];
  identifiedRisks: { risk: string; severity: string; mitigation: string }[];
  nextExperiments: { gate: string; experiment: string; metricToMeasure: string }[];
  referencedDOIs: string[];
  evidenceCaveat: string;
}

interface AssistantEntry {
  id: string;
  question: string;
  analyzedAt: string;
  model: string;
  configuration: ConfigurationEnvelope;
  verifiedNet_kWe: number;
  verifiedFlux_LMH: number;
  analysis: StructuredAnalysis;
}

const QUICK_PROMPTS = [
  {
    label: 'Explain Current Results',
    prompt:
      'Explain the current deterministic PRO energy balance step-by-step, highlighting why net electrical output differs from ideal membrane hydraulic power.',
  },
  {
    label: 'Identify Technical Risks',
    prompt:
      'Identify the dominant physical, fouling, hydraulic, and energy-boundary risks for this exact configuration and propose concrete mitigations.',
  },
  {
    label: 'Suggest Next Lab Experiments',
    prompt:
      'Suggest the highest-value next validation experiments mapped to OSMOGEN Validation Gates 1–5, specifying what instruments and metrics to measure.',
  },
  {
    label: 'Audit RO–PRO & Thermal Boundaries',
    prompt:
      'Audit whether the RO–PRO SEC offset and separate solar thermal balance have hidden boundary risks or missing auxiliary loads.',
  },
];

export function AiAssistantView({
  configuration,
  inputs,
  results,
}: AiAssistantViewProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<AssistantEntry[]>([]);

  const runAnalysis = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/assistant/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration,
          inputs,
          question: trimmed,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || `Server returned status ${res.status}`);
      }

      const entry: AssistantEntry = {
        id: `ai-${Date.now()}`,
        question: trimmed,
        analyzedAt: payload.analyzedAt || new Date().toISOString(),
        model: payload.model || 'gemini-4-hydrogen',
        configuration,
        verifiedNet_kWe: payload.verifiedSummary?.netElectric_kWe ?? results.netElectric_kWe,
        verifiedFlux_LMH: payload.verifiedSummary?.waterFlux_LMH ?? results.waterFlux_LMH,
        analysis: payload.analysis,
      };

      setHistory((prev) => [entry, ...prev]);
      setQuestion('');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to reach the server-side AI Engineering Assistant.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(question);
  };

  const envLabel =
    configuration === 'standalone'
      ? 'Standalone PRO'
      : configuration === 'ro_pro'
        ? 'RO–PRO Hybrid'
        : 'PRO + Solar Thermal';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#1E2D45] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Module 4 · Guarded Explanation Only · Deterministic Engine Remains Sole Source of Numeric Truth
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            AI Engineering Assistant
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Interprets your verified deterministic PRO calculation, surfaces concentration-polarization and boundary risks, cites the 6-paper evidence register, and proposes staged lab experiments.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setHistory([])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2D45] bg-[#0F1829] px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Session Notes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Read-Only Deterministic Snapshot Sent to Gemini */}
        <aside className="xl:col-span-4 rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
          <div className="border-b border-[#1E2D45] pb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Verified Calculation Context
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact deterministic state re-verified server-side before Gemini explanation.
            </p>
          </div>

          <dl className="space-y-2 font-mono text-xs tabular-nums">
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Envelope</dt>
              <dd className="text-cyan-300 font-sans font-medium">{envLabel}</dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Feed / Draw Salinity</dt>
              <dd className="text-slate-200">
                {inputs.feedSalinity_gL} / {inputs.drawSalinity_gL} g/L
              </dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Applied ΔP / Eff. Δπ</dt>
              <dd className="text-slate-200">
                {inputs.operatingPressure_bar.toFixed(1)} / {results.effectiveDeltaPi_bar.toFixed(2)} bar
              </dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Membrane Area / fCP</dt>
              <dd className="text-slate-200">
                {inputs.membraneArea_m2.toLocaleString()} m² · {inputs.effectiveOsmoticFactor.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Water Flux Jw</dt>
              <dd className="text-slate-200">{results.waterFlux_LMH.toFixed(2)} LMH</dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Gross / Auxiliary</dt>
              <dd className="text-slate-200">
                {results.grossElectric_kWe.toFixed(1)} / {results.totalAuxiliary_kWe.toFixed(1)} kWe
              </dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Net Electrical Output</dt>
              <dd
                className={`font-bold ${
                  results.netElectric_kWe >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {results.netElectric_kWe >= 0 ? '+' : ''}
                {results.netElectric_kWe.toFixed(2)} kWe
              </dd>
            </div>
            <div className="flex justify-between border-b border-[#1E2D45]/60 pb-1.5">
              <dt className="font-sans text-slate-400">Hybrid RO SEC</dt>
              <dd className="text-slate-200">{results.roHybridSEC_kWh_m3.toFixed(3)} kWh/m³</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-sans text-amber-300/90">Solar Thermal (Sep.)</dt>
              <dd className="text-amber-400">
                {results.solarUsefulHeat_kWth.toFixed(0)} kWth ({results.solarHeatCoverage_pct.toFixed(0)}%)
              </dd>
            </div>
          </dl>

          <div className="border-t border-[#1E2D45] pt-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-300">
              Active Guardrails Passed to AI ({results.warnings.length})
            </p>
            {results.warnings.length === 0 ? (
              <p className="text-xs text-slate-500">No boundary violations flagged.</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-400">
                {results.warnings.map((w) => (
                  <li key={w.id} className="truncate">
                    · {w.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Right Column: Prompt Bar & Structured Engineering Responses */}
        <div className="xl:col-span-8 space-y-5">
          {/* Prompt Input & Quick Engineering Actions */}
          <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={loading}
                  onClick={() => runAnalysis(item.prompt)}
                  className="rounded-lg border border-[#1E2D45] bg-[#142036] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
                placeholder="Ask about sensitivity bottlenecks, fouling risks, or next lab validation steps..."
                aria-label="Engineering question for AI assistant"
                className="flex-1 rounded-lg border border-[#1E2D45] bg-[#080E1A] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Analyzing...' : 'Analyze Run'}
              </button>
            </form>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200 flex items-start gap-2.5"
              >
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">
                    AI Engineering Assistant Error
                  </p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}
          </section>

          {/* Loading Skeleton */}
          {loading && (
            <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-6 space-y-4 animate-pulse">
              <div className="h-4 w-48 rounded bg-[#142036]" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-[#142036]" />
                <div className="h-3 w-5/6 rounded bg-[#142036]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="h-28 rounded-lg bg-[#142036]" />
                <div className="h-28 rounded-lg bg-[#142036]" />
              </div>
            </section>
          )}

          {/* Empty State */}
          {!loading && history.length === 0 && (
            <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-8 text-center space-y-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[#1E2D45] bg-[#142036] text-cyan-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                Ready to Review Your Deterministic Run
              </h3>
              <p className="mx-auto max-w-lg text-sm text-slate-400">
                Select one of the quick engineering audits above or ask a specific question. Responses are strictly anchored to your verified calculation payload and OSMOGEN’s six peer-reviewed references.
              </p>
            </section>
          )}

          {/* Structured Analysis Results */}
          {history.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-6 space-y-5"
            >
              <div className="flex flex-col gap-1 border-b border-[#1E2D45] pb-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <p className="text-xs text-cyan-400 font-medium">
                    Engineering Audit · {entry.model}
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold text-slate-100">
                    {entry.question}
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                  Verified: {entry.verifiedFlux_LMH.toFixed(2)} LMH ·{' '}
                  {entry.verifiedNet_kWe >= 0 ? '+' : ''}
                  {entry.verifiedNet_kWe.toFixed(1)} kWe
                </span>
              </div>

              {/* 1. Executive Explanation */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-300">
                  Deterministic Result Explanation
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {entry.analysis.executiveSummary}
                </p>
              </div>

              {/* 2. Sensitivity Drivers */}
              <div className="space-y-2.5 border-t border-[#1E2D45] pt-4">
                <h4 className="text-xs font-semibold text-slate-300">
                  Key Sensitivity Drivers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {entry.analysis.sensitivityDrivers.map((d, idx) => (
                    <div
                      key={`${entry.id}-drv-${idx}`}
                      className="rounded-lg border border-[#1E2D45] bg-[#0B1324] p-3.5"
                    >
                      <p className="text-xs font-semibold text-cyan-300">{d.driver}</p>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{d.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Identified Risks & Mitigations */}
              <div className="space-y-2.5 border-t border-[#1E2D45] pt-4">
                <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  Identified Risks & Mitigations
                </h4>
                <div className="space-y-2.5">
                  {entry.analysis.identifiedRisks.map((r, idx) => {
                    const sev = (r.severity || 'medium').toLowerCase();
                    const sevColor =
                      sev === 'high'
                        ? 'text-rose-400'
                        : sev === 'low'
                          ? 'text-emerald-400'
                          : 'text-amber-400';
                    return (
                      <div
                        key={`${entry.id}-risk-${idx}`}
                        className="border-b border-[#1E2D45]/70 pb-2.5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-100">{r.risk}</p>
                          <span className={`font-mono text-[10px] font-semibold uppercase ${sevColor}`}>
                            {sev} risk
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          Mitigation: {r.mitigation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Suggested Next Validation Experiments */}
              <div className="space-y-2.5 border-t border-[#1E2D45] pt-4">
                <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
                  Recommended Next Validation Experiments
                </h4>
                <div className="space-y-2.5">
                  {entry.analysis.nextExperiments.map((exp, idx) => (
                    <div
                      key={`${entry.id}-exp-${idx}`}
                      className="rounded-lg border border-[#1E2D45] bg-[#0B1324] p-3.5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-emerald-400">
                          {exp.gate}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          Measure: {exp.metricToMeasure}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-200 leading-relaxed">
                        {exp.experiment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Grounded References & Evidence Discipline Caveat */}
              <div className="border-t border-[#1E2D45] pt-3 space-y-1.5 text-xs">
                {entry.analysis.referencedDOIs?.length > 0 && (
                  <p className="text-slate-400 font-mono text-[11px]">
                    Register references: {entry.analysis.referencedDOIs.join(' · ')}
                  </p>
                )}
                <p className="text-slate-500 text-[11px]">
                  Evidence note: {entry.analysis.evidenceCaveat}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
