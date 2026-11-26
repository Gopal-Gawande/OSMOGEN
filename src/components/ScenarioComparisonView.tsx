import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BookmarkPlus,
  Copy,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  calculateProModel,
  generateSensitivitySweep,
  type ConfigurationEnvelope,
  type ProInputs,
  type ScenarioRecord,
  type SweepVariable,
} from '../engine/proModel.ts';

interface ScenarioComparisonViewProps {
  activeConfiguration: ConfigurationEnvelope;
  activeInputs: ProInputs;
  scenarios: ScenarioRecord[];
  onSaveCurrentScenario: (name: string, description: string) => void;
  onLoadScenario: (scenario: ScenarioRecord) => void;
  onDuplicateScenario: (scenario: ScenarioRecord) => void;
  onDeleteScenario: (id: string) => void;
  onResetDefaultScenarios: () => void;
  onApplySweepPoint: (variable: SweepVariable, value: number) => void;
}

const SWEEP_TABS: { id: SweepVariable; label: string; subtitle: string }[] = [
  { id: 'pressure', label: 'Operating Pressure (ΔP)', subtitle: 'Compare applied hydraulic back-pressures (bar)' },
  { id: 'area', label: 'Membrane Area (Am)', subtitle: 'Scale active membrane area (m²) against fixed auxiliaries' },
  { id: 'feedSalinity', label: 'Feed Water Salinity', subtitle: 'Vary river / brackish feed concentration (g/L)' },
  { id: 'drawSalinity', label: 'Draw Water Salinity', subtitle: 'Compare coastal seawater vs concentrated SWRO brine (g/L)' },
];

export function ScenarioComparisonView({
  activeConfiguration,
  activeInputs,
  scenarios,
  onSaveCurrentScenario,
  onLoadScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onResetDefaultScenarios,
  onApplySweepPoint,
}: ScenarioComparisonViewProps) {
  const [sweepVar, setSweepVar] = useState<SweepVariable>('pressure');
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    scenarios.slice(0, 4).map((s) => s.id)
  );
  const [quickName, setQuickName] = useState('');

  const evaluatedScenarios = useMemo(
    () =>
      scenarios.map((sc) => ({
        scenario: sc,
        results: calculateProModel(sc.inputs, sc.configuration),
      })),
    [scenarios]
  );

  const sweepData = useMemo(
    () => generateSensitivitySweep(activeInputs, activeConfiguration, sweepVar),
    [activeInputs, activeConfiguration, sweepVar]
  );

  // Keep selectedIds valid when scenarios change
  const effectiveSelected = useMemo(() => {
    const existing = new Set(scenarios.map((s) => s.id));
    const filtered = selectedIds.filter((id) => existing.has(id));
    if (filtered.length > 0) return filtered;
    return scenarios.slice(0, 4).map((s) => s.id);
  }, [scenarios, selectedIds]);

  const comparedRows = useMemo(
    () =>
      evaluatedScenarios.filter((item) =>
        effectiveSelected.includes(item.scenario.id)
      ),
    [evaluatedScenarios, effectiveSelected]
  );

  const comparisonChartData = useMemo(
    () =>
      comparedRows.map(({ scenario, results }) => ({
        name:
          scenario.name.length > 22
            ? `${scenario.name.slice(0, 21)}…`
            : scenario.name,
        fullName: scenario.name,
        grossElectric: Number(results.grossElectric_kWe.toFixed(2)),
        auxiliaryLoad: Number(results.totalAuxiliary_kWe.toFixed(2)),
        netElectric: Number(results.netElectric_kWe.toFixed(2)),
      })),
    [comparedRows]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleQuickSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const label = quickName.trim() || `Custom Run (${activeInputs.drawSalinity_gL} g/L @ ${activeInputs.operatingPressure_bar} bar)`;
    onSaveCurrentScenario(
      label,
      `User snapshot: ${activeInputs.feedSalinity_gL}→${activeInputs.drawSalinity_gL} g/L, Am ${activeInputs.membraneArea_m2.toLocaleString()} m², ΔP ${activeInputs.operatingPressure_bar} bar.`
    );
    setQuickName('');
  };

  const activeSweepMeta = SWEEP_TABS.find((t) => t.id === sweepVar) ?? SWEEP_TABS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#1E2D45] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Module 3 · Saved Local Workspace Runs & Multi-Parameter Sensitivity · Assumption-Only
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Scenario Comparison
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Compare operating pressures, membrane areas, and feed/draw water conditions side-by-side under consistent system boundaries.
          </p>
        </div>

        <form onSubmit={handleQuickSnapshot} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Name active run to snapshot..."
            aria-label="New scenario name"
            className="w-56 rounded-lg border border-[#1E2D45] bg-[#0F1829] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Snapshot Active Run
          </button>
        </form>
      </div>

      {/* Section A: Interactive Sensitivity Matrix (Pressure, Area, Feed Water, Draw Water) */}
      <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#1E2D45] pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Parameter Sweep Comparison — {activeSweepMeta.label}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeSweepMeta.subtitle} while holding all other active calculator inputs constant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#1E2D45] bg-[#080E1A] p-1">
            {SWEEP_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSweepVar(tab.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  sweepVar === tab.id
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Sweep Bar Chart */}
          <div className="xl:col-span-6 h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sweepData} margin={{ top: 10, right: 12, left: -8, bottom: 4 }}>
                <CartesianGrid stroke="#1E2D45" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  label={{
                    value: 'kWe',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94A3B8',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1324',
                    border: '1px solid #1E2D45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="grossElectric_kWe" name="Gross Electric (kWe)" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="totalAuxiliary_kWe" name="Auxiliary Load (kWe)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="netElectric_kWe" name="Net Output (kWe)" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sweep Data Table */}
          <div className="xl:col-span-6 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2D45] text-slate-400">
                  <th className="py-2 pr-3 font-medium">Test Point</th>
                  <th className="py-2 px-2 text-right font-medium">Flux (LMH)</th>
                  <th className="py-2 px-2 text-right font-medium">Gross (kWe)</th>
                  <th className="py-2 px-2 text-right font-medium">Net (kWe)</th>
                  <th className="py-2 px-2 text-right font-medium">Hybrid SEC</th>
                  <th className="py-2 pl-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D45]/70 font-mono tabular-nums">
                {sweepData.map((row) => (
                  <tr key={row.label} className="hover:bg-[#142036]/60 transition-colors">
                    <td className="py-2.5 pr-3 text-slate-200 font-medium">{row.label}</td>
                    <td className="py-2.5 px-2 text-right text-cyan-300">{row.waterFlux_LMH.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-right text-slate-300">{row.grossElectric_kWe.toFixed(1)}</td>
                    <td
                      className={`py-2.5 px-2 text-right font-semibold ${
                        row.netElectric_kWe >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {row.netElectric_kWe >= 0 ? '+' : ''}
                      {row.netElectric_kWe.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {row.roHybridSEC_kWh_m3.toFixed(2)}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => onApplySweepPoint(sweepVar, row.paramValue)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                      >
                        Apply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section B: Side-by-Side Saved Scenarios Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Saved Scenarios List (5 cols) */}
        <section className="xl:col-span-5 rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Saved Scenarios ({scenarios.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select up to 4 scenarios to compare side-by-side. Persisted locally in browser storage.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetDefaultScenarios}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 whitespace-nowrap shrink-0"
              title="Restore default illustrative presets"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Defaults
            </button>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {evaluatedScenarios.map(({ scenario, results }) => {
              const checked = effectiveSelected.includes(scenario.id);
              const envLabel =
                scenario.configuration === 'standalone'
                  ? 'Standalone PRO'
                  : scenario.configuration === 'ro_pro'
                    ? 'RO–PRO Hybrid'
                    : 'Solar + PRO';
              return (
                <div
                  key={scenario.id}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    checked
                      ? 'border-cyan-500/50 bg-[#142036]'
                      : 'border-[#1E2D45] bg-[#0B1324]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(scenario.id)}
                        className="mt-1 accent-cyan-400"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {scenario.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {envLabel} · {scenario.provenance}
                        </p>
                      </div>
                    </label>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                        results.netElectric_kWe >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {results.netElectric_kWe >= 0 ? '+' : ''}
                      {results.netElectric_kWe.toFixed(1)} kWe
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {scenario.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-[#1E2D45]/70 pt-2.5 text-[11px]">
                    <span className="font-mono text-slate-400 tabular-nums">
                      {scenario.inputs.feedSalinity_gL}→{scenario.inputs.drawSalinity_gL} g/L · ΔP {scenario.inputs.operatingPressure_bar} bar · {(scenario.inputs.membraneArea_m2 / 1000).toFixed(0)}k m²
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onLoadScenario(scenario)}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        <Play className="h-3 w-3" />
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateScenario(scenario)}
                        className="text-slate-400 hover:text-slate-200"
                        aria-label={`Duplicate ${scenario.name}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {scenarios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteScenario(scenario.id)}
                          className="text-slate-500 hover:text-rose-400"
                          aria-label={`Delete ${scenario.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Side-by-Side Comparison Chart & Matrix (7 cols) */}
        <section className="xl:col-span-7 rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-5">
          <div className="border-b border-[#1E2D45] pb-3">
            <h2 className="text-base font-semibold text-slate-100">
              Side-by-Side Scenario Comparison Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing {comparedRows.length} selected scenarios across electric power balance, membrane flux, RO SEC offset, and separate thermal duty.
            </p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 10, right: 12, left: -8, bottom: 4 }}
              >
                <CartesianGrid stroke="#1E2D45" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1324',
                    border: '1px solid #1E2D45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="grossElectric" name="Gross Electric (kWe)" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="auxiliaryLoad" name="Auxiliary (kWe)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="netElectric" name="Net Output (kWe)" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto border-t border-[#1E2D45] pt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2D45] text-slate-400">
                  <th className="py-2 pr-3 font-medium">Metric</th>
                  {comparedRows.map(({ scenario }) => (
                    <th key={scenario.id} className="py-2 px-2 text-right font-semibold text-slate-200">
                      {scenario.name.length > 18 ? `${scenario.name.slice(0, 17)}…` : scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D45]/70 font-mono tabular-nums">
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-400">Salinity Feed / Draw (g/L)</td>
                  {comparedRows.map(({ scenario }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-slate-200">
                      {scenario.inputs.feedSalinity_gL} / {scenario.inputs.drawSalinity_gL}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-400">Operating ΔP (bar) · Area (m²)</td>
                  {comparedRows.map(({ scenario }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-slate-200">
                      {scenario.inputs.operatingPressure_bar} · {scenario.inputs.membraneArea_m2.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-400">Effective Δπ_eff (bar)</td>
                  {comparedRows.map(({ scenario, results }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-cyan-300">
                      {results.effectiveDeltaPi_bar.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-400">Water Flux Jw (LMH)</td>
                  {comparedRows.map(({ scenario, results }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-slate-200">
                      {results.waterFlux_LMH.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-400">Gross / Auxiliary (kWe)</td>
                  {comparedRows.map(({ scenario, results }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-slate-300">
                      {results.grossElectric_kWe.toFixed(1)} / {results.totalAuxiliary_kWe.toFixed(1)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans font-semibold text-slate-200">Net Electric Output (kWe)</td>
                  {comparedRows.map(({ scenario, results }) => (
                    <td
                      key={scenario.id}
                      className={`py-2 px-2 text-right font-bold ${
                        results.netElectric_kWe >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {results.netElectric_kWe >= 0 ? '+' : ''}
                      {results.netElectric_kWe.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-400">Hybrid RO SEC (kWh/m³)</td>
                  {comparedRows.map(({ scenario, results }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-slate-200">
                      {results.roHybridSEC_kWh_m3.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-amber-300/90">Solar Heat (kWth, separate)</td>
                  {comparedRows.map(({ scenario, results }) => (
                    <td key={scenario.id} className="py-2 px-2 text-right text-amber-400">
                      {results.solarUsefulHeat_kWth.toFixed(0)} ({results.solarHeatCoverage_pct.toFixed(0)}%)
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
