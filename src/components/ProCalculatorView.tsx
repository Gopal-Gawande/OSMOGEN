import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
} from 'recharts';
import { RotateCcw, BookmarkPlus, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  generatePressureSweep,
  type ConfigurationEnvelope,
  type ProInputs,
  type ProResults,
} from '../engine/proModel.ts';

interface ProCalculatorViewProps {
  configuration: ConfigurationEnvelope;
  onChangeConfiguration: (cfg: ConfigurationEnvelope) => void;
  inputs: ProInputs;
  results: ProResults;
  onUpdateInput: <K extends keyof ProInputs>(key: K, value: ProInputs[K]) => void;
  onResetBaseline: () => void;
  onSaveScenario: (name: string, notes: string) => void;
  onJumpToEnergy: () => void;
}

interface SliderFieldProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hint?: string;
  onChange: (val: number) => void;
}

function SliderField({
  label,
  unit,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-300 truncate">
          {label}
        </label>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (!Number.isNaN(parsed)) {
                onChange(Math.min(max, Math.max(min, parsed)));
              }
            }}
            aria-label={`${label} (${unit})`}
            className="w-20 rounded border border-[#1E2D45] bg-[#080E1A] px-2 py-1 text-right font-mono text-xs text-slate-100 tabular-nums focus:border-cyan-400 focus:outline-none"
          />
          <span className="w-12 font-mono text-[11px] text-slate-400">
            {unit}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

const ENVELOPE_TABS: { id: ConfigurationEnvelope; label: string; subtitle: string }[] = [
  { id: 'standalone', label: 'Standalone PRO', subtitle: 'Research baseline' },
  { id: 'ro_pro', label: 'RO–PRO Hybrid', subtitle: 'Primary commercial hypothesis' },
  { id: 'solar_pro_desal', label: 'PRO + Solar Thermal', subtitle: 'Separate kWe & kWth' },
];

export function ProCalculatorView({
  configuration,
  onChangeConfiguration,
  inputs,
  results,
  onUpdateInput,
  onResetBaseline,
  onSaveScenario,
  onJumpToEnergy,
}: ProCalculatorViewProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioNotes, setScenarioNotes] = useState('');

  const sweepData = useMemo(() => generatePressureSweep(inputs, 28), [inputs]);

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = scenarioName.trim();
    if (!trimmed) return;
    onSaveScenario(trimmed, scenarioNotes.trim());
    setScenarioName('');
    setScenarioNotes('');
    setSaveOpen(false);
  };

  const statusTone =
    results.netBalanceStatus === 'positive'
      ? 'text-emerald-400'
      : results.netBalanceStatus === 'negative'
        ? 'text-rose-400'
        : 'text-amber-400';

  const statusLabel =
    results.netBalanceStatus === 'positive'
      ? '▲ Net Positive'
      : results.netBalanceStatus === 'negative'
        ? '▼ Net Negative'
        : '■ Break-Even';

  return (
    <div className="space-y-6">
      {/* Workspace Header & Configuration Envelope Selector */}
      <div className="flex flex-col gap-4 border-b border-[#1E2D45] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Module 1 · First-Order Screening Model v0.1 · Modelled / Illustrative (Assumption-Only)
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            PRO Feasibility Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Configure feed and draw salinity, volumetric flows, applied hydraulic back-pressure, and membrane transport parameters to inspect osmotic driving force and forward water flux.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#1E2D45] bg-[#0F1829] p-1">
            {ENVELOPE_TABS.map((tab) => {
              const active = configuration === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeConfiguration(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onResetBaseline}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2D45] bg-[#0F1829] px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Baseline
          </button>
          <button
            type="button"
            onClick={() => setSaveOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Save Scenario
          </button>
        </div>
      </div>

      {/* Inline Save Scenario Panel */}
      {saveOpen && (
        <form
          onSubmit={handleSaveSubmit}
          className="rounded-xl border border-cyan-500/40 bg-[#0F1829] p-4 flex flex-col gap-3 md:flex-row md:items-end"
        >
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Scenario Name
            </label>
            <input
              type="text"
              required
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., High-Brine 16 bar SWRO Hybrid"
              className="w-full rounded-lg border border-[#1E2D45] bg-[#080E1A] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Assumption Notes (Optional)
            </label>
            <input
              type="text"
              value={scenarioNotes}
              onChange={(e) => setScenarioNotes(e.target.value)}
              placeholder="e.g., User-entered sensitivity check with decomposed auxiliaries"
              className="w-full rounded-lg border border-[#1E2D45] bg-[#080E1A] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSaveOpen(false)}
              className="rounded-lg border border-[#1E2D45] px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Save to Workspace
            </button>
          </div>
        </form>
      )}

      {/* Asymmetric Split Console: Left Parameters (420px) + Right Telemetry & Curves */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Left Control Column */}
        <div className="xl:col-span-5 space-y-5">
          {/* Group 1: Salinity & Stream Flows */}
          <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#1E2D45] pb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                1. Water Chemistry & Stream Flows
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                NaCl-equiv. van’t Hoff
              </span>
            </div>

            <div className="space-y-4">
              <SliderField
                label="Low-Salinity Feed Concentration"
                unit="g/L"
                value={inputs.feedSalinity_gL}
                min={0}
                max={25}
                step={0.1}
                onChange={(v) => onUpdateInput('feedSalinity_gL', v)}
              />
              <SliderField
                label="High-Salinity Draw Concentration"
                unit="g/L"
                value={inputs.drawSalinity_gL}
                min={5}
                max={120}
                step={0.5}
                hint="Typical coastal seawater ~35 g/L; SWRO reject brine ~60–70 g/L."
                onChange={(v) => onUpdateInput('drawSalinity_gL', v)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <SliderField
                  label="Feed Flow Rate"
                  unit="m³/h"
                  value={inputs.feedFlow_m3h}
                  min={20}
                  max={3000}
                  step={10}
                  onChange={(v) => onUpdateInput('feedFlow_m3h', v)}
                />
                <SliderField
                  label="Draw Flow Rate"
                  unit="m³/h"
                  value={inputs.drawFlow_m3h}
                  min={20}
                  max={3000}
                  step={10}
                  onChange={(v) => onUpdateInput('drawFlow_m3h', v)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <SliderField
                  label="Water Temperature"
                  unit="°C"
                  value={inputs.temperature_C}
                  min={10}
                  max={45}
                  step={0.5}
                  onChange={(v) => onUpdateInput('temperature_C', v)}
                />
                <SliderField
                  label="van’t Hoff Factor (i)"
                  unit="dim."
                  value={inputs.vantHoffFactor}
                  min={1.5}
                  max={2.2}
                  step={0.05}
                  onChange={(v) => onUpdateInput('vantHoffFactor', v)}
                />
              </div>
            </div>
          </section>

          {/* Group 2: Operating Pressure & Membrane Parameters */}
          <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#1E2D45] pb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                2. Applied Pressure & Membrane Parameters
              </h2>
              <button
                type="button"
                onClick={() =>
                  onUpdateInput(
                    'operatingPressure_bar',
                    Number(Math.max(0.5, results.optimalPressureApprox_bar).toFixed(1))
                  )
                }
                className="font-mono text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Set ΔP ≈ Δπ_eff/2 ({results.optimalPressureApprox_bar.toFixed(1)} bar)
              </button>
            </div>

            <div className="space-y-4">
              <SliderField
                label="Applied Hydraulic Pressure (ΔP)"
                unit="bar"
                value={inputs.operatingPressure_bar}
                min={0}
                max={45}
                step={0.5}
                hint={`Effective Δπ is ${results.effectiveDeltaPi_bar.toFixed(2)} bar. Flux clips to 0 LMH when ΔP ≥ Δπ_eff.`}
                onChange={(v) => onUpdateInput('operatingPressure_bar', v)}
              />
              <SliderField
                label="Water Permeability (Aw)"
                unit="LMH/bar"
                value={inputs.waterPermeability_LMH_bar}
                min={0.2}
                max={4.0}
                step={0.05}
                onChange={(v) => onUpdateInput('waterPermeability_LMH_bar', v)}
              />
              <SliderField
                label="Active Membrane Area (Am)"
                unit="m²"
                value={inputs.membraneArea_m2}
                min={500}
                max={50000}
                step={500}
                onChange={(v) => onUpdateInput('membraneArea_m2', v)}
              />
              <SliderField
                label="Effective Osmotic Factor (fCP)"
                unit="ratio"
                value={inputs.effectiveOsmoticFactor}
                min={0.2}
                max={1.0}
                step={0.01}
                hint="Screening derating factor representing combined ICP/ECP losses."
                onChange={(v) => onUpdateInput('effectiveOsmoticFactor', v)}
              />
            </div>
          </section>

          {/* Group 3: Energy Recovery, Auxiliaries & Envelope Subsystems */}
          <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                3. Recovery Efficiency & Auxiliaries
              </h2>
              <div className="flex items-center rounded-md border border-[#1E2D45] bg-[#080E1A] p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => onUpdateInput('auxiliaryMode', 'single')}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    inputs.auxiliaryMode === 'single'
                      ? 'bg-[#142036] text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Single kW
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateInput('auxiliaryMode', 'decomposed')}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    inputs.auxiliaryMode === 'decomposed'
                      ? 'bg-[#142036] text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Decomposed
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SliderField
                label="Turbine-Generator Efficiency (ηTG)"
                unit="%"
                value={inputs.turbineGeneratorEfficiency_pct}
                min={40}
                max={95}
                step={1}
                onChange={(v) => onUpdateInput('turbineGeneratorEfficiency_pct', v)}
              />

              {inputs.auxiliaryMode === 'single' ? (
                <SliderField
                  label="Total PRO Auxiliary Load (Paux)"
                  unit="kWe"
                  value={inputs.proAuxiliaryLoad_kW}
                  min={0}
                  max={250}
                  step={1}
                  hint="Placeholder covering pumping, circulation, pretreatment & cleaning."
                  onChange={(v) => onUpdateInput('proAuxiliaryLoad_kW', v)}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <SliderField
                    label="Feed Intake Pump"
                    unit="kWe"
                    value={inputs.auxFeedPump_kW}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(v) => onUpdateInput('auxFeedPump_kW', v)}
                  />
                  <SliderField
                    label="Draw Circulation"
                    unit="kWe"
                    value={inputs.auxDrawCirculation_kW}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(v) => onUpdateInput('auxDrawCirculation_kW', v)}
                  />
                  <SliderField
                    label="Pretreatment"
                    unit="kWe"
                    value={inputs.auxPretreatment_kW}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(v) => onUpdateInput('auxPretreatment_kW', v)}
                  />
                  <SliderField
                    label="Controls & CIP"
                    unit="kWe"
                    value={inputs.auxControlsCleaning_kW}
                    min={0}
                    max={50}
                    step={0.5}
                    onChange={(v) => onUpdateInput('auxControlsCleaning_kW', v)}
                  />
                </div>
              )}

              {configuration === 'ro_pro' && (
                <div className="space-y-4 border-t border-[#1E2D45] pt-4">
                  <p className="text-xs font-semibold text-cyan-300">
                    RO–PRO Hybrid Interface (Constant Product Spec)
                  </p>
                  <SliderField
                    label="Baseline RO Product Flow (Qp)"
                    unit="m³/h"
                    value={inputs.roProductFlow_m3h}
                    min={20}
                    max={2000}
                    step={10}
                    onChange={(v) => onUpdateInput('roProductFlow_m3h', v)}
                  />
                  <SliderField
                    label="Baseline RO Specific Energy (SEC)"
                    unit="kWh/m³"
                    value={inputs.roBaselineSEC_kWh_m3}
                    min={1.5}
                    max={6.5}
                    step={0.1}
                    onChange={(v) => onUpdateInput('roBaselineSEC_kWh_m3', v)}
                  />
                </div>
              )}

              {configuration === 'solar_pro_desal' && (
                <div className="space-y-4 border-t border-[#1E2D45] pt-4">
                  <p className="text-xs font-semibold text-amber-400">
                    Solar Thermal Subsystem (Accounted Strictly in kWth)
                  </p>
                  <SliderField
                    label="Collector Aperture Area"
                    unit="m²"
                    value={inputs.solarCollectorArea_m2}
                    min={0}
                    max={10000}
                    step={100}
                    onChange={(v) => onUpdateInput('solarCollectorArea_m2', v)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SliderField
                      label="Solar Irradiance"
                      unit="kW/m²"
                      value={inputs.solarIrradiance_kW_m2}
                      min={0.1}
                      max={1.1}
                      step={0.05}
                      onChange={(v) => onUpdateInput('solarIrradiance_kW_m2', v)}
                    />
                    <SliderField
                      label="Thermal Efficiency"
                      unit="%"
                      value={inputs.solarThermalEfficiency_pct}
                      min={15}
                      max={80}
                      step={1}
                      onChange={(v) => onUpdateInput('solarThermalEfficiency_pct', v)}
                    />
                  </div>
                  <SliderField
                    label="Process Thermal Heat Demand"
                    unit="kWth"
                    value={inputs.processHeatDemand_kWth}
                    min={50}
                    max={5000}
                    step={50}
                    onChange={(v) => onUpdateInput('processHeatDemand_kWth', v)}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Telemetry Stage */}
        <div className="xl:col-span-7 space-y-6">
          {/* Primary Deterministic KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
              <p className="text-xs text-slate-400">Bulk Osmotic Δπ</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {results.bulkDeltaPi_bar.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-slate-400">bar</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                Draw {results.drawOsmoticPressure_bar.toFixed(1)} − Feed {results.feedOsmoticPressure_bar.toFixed(1)}
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
              <p className="text-xs text-slate-400">Effective Δπ_eff</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-cyan-400 tabular-nums">
                  {results.effectiveDeltaPi_bar.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-slate-400">bar</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                fCP = {inputs.effectiveOsmoticFactor.toFixed(2)} · Driving {results.drivingPressure_bar.toFixed(2)} bar
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
              <p className="text-xs text-slate-400">Forward Water Flux (Jw)</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    results.fluxClippedToZero ? 'text-rose-400' : 'text-slate-100'
                  }`}
                >
                  {results.waterFlux_LMH.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-slate-400">LMH</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                {results.fluxClippedToZero
                  ? 'Clipped to 0 (ΔP ≥ Δπ_eff)'
                  : `Permeate ${results.permeateFlow_m3h.toFixed(1)} m³/h`}
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
              <p className="text-xs text-slate-400">Membrane Hydraulic (Phyd)</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {results.hydraulicPower_kW.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-slate-400">kW</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                Density {results.powerDensity_W_m2.toFixed(2)} W/m² (membrane)
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
              <p className="text-xs text-slate-400">Gross Electric / Auxiliary</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {results.grossElectric_kWe.toFixed(1)}
                </span>
                <span className="font-mono text-xs text-slate-400">kWe</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-slate-400 tabular-nums">
                Aux load: −{results.totalAuxiliary_kWe.toFixed(1)} kWe
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
              <p className="text-xs text-slate-400">Net Electric Output (Pnet)</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`font-mono text-2xl font-bold tabular-nums ${statusTone}`}>
                  {results.netElectric_kWe >= 0 ? '+' : ''}
                  {results.netElectric_kWe.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-slate-400">kWe</span>
              </div>
              <p className={`mt-1.5 text-[11px] font-medium ${statusTone}`}>
                {statusLabel}
              </p>
            </div>
          </div>

          {/* Operating Pressure Sweep Chart (Focal Anchor) */}
          <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2D45] pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Operating Pressure Sweep — Flux & Net Electrical Power
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Peak hydraulic power occurs near ΔP ≈ Δπ_eff / 2 ({results.optimalPressureApprox_bar.toFixed(1)} bar); forward flux collapses to 0 LMH at ΔP ≥ {results.effectiveDeltaPi_bar.toFixed(1)} bar.
                </p>
              </div>
              <button
                type="button"
                onClick={onJumpToEnergy}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 whitespace-nowrap shrink-0"
              >
                Inspect Full Energy Balance
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sweepData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="netPowerFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E2D45" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="pressure_bar"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Applied Hydraulic Pressure ΔP (bar)',
                      position: 'insideBottom',
                      offset: -4,
                      fill: '#94A3B8',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="power"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Power (kWe)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#94A3B8',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="flux"
                    orientation="right"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Water Flux Jw (LMH)',
                      angle: 90,
                      position: 'insideRight',
                      fill: '#06B6D4',
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
                      color: '#F1F5F9',
                    }}
                    labelFormatter={(v) => `Applied ΔP: ${v} bar`}
                  />
                  <ReferenceLine
                    yAxisId="power"
                    y={0}
                    stroke="#475569"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    x={Number(inputs.operatingPressure_bar.toFixed(2))}
                    yAxisId="power"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    label={{
                      value: `Operating ΔP (${inputs.operatingPressure_bar} bar)`,
                      position: 'top',
                      fill: '#F59E0B',
                      fontSize: 10,
                    }}
                  />
                  <Area
                    yAxisId="power"
                    type="monotone"
                    dataKey="netElectric_kWe"
                    name="Net Electric (kWe)"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#netPowerFill)"
                  />
                  <Line
                    yAxisId="power"
                    type="monotone"
                    dataKey="grossElectric_kWe"
                    name="Gross Electric (kWe)"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    yAxisId="flux"
                    type="monotone"
                    dataKey="flux_LMH"
                    name="Forward Flux Jw (LMH)"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#1E2D45] pt-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4 bg-cyan-400" /> Forward Flux Jw (LMH)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4 bg-emerald-400" /> Net Electric Pnet (kWe)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4 border-t border-dashed border-slate-400" /> Gross Generator (kWe)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-0.5 bg-amber-400" /> Current Operating Point
              </span>
            </div>
          </section>

          {/* Deterministic Equations & Active Boundary Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">
                First-Order Screening Equations (v0.1)
              </h3>
              <dl className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between gap-2 border-b border-[#1E2D45]/70 pb-2">
                  <dt className="text-slate-400">π = i·(S/58.44)·R·T</dt>
                  <dd className="text-slate-200 tabular-nums">
                    Δπ = {results.bulkDeltaPi_bar.toFixed(2)} bar
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#1E2D45]/70 pb-2">
                  <dt className="text-slate-400">Δπ_eff = fCP · Δπ</dt>
                  <dd className="text-cyan-300 tabular-nums">
                    {results.effectiveDeltaPi_bar.toFixed(2)} bar
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#1E2D45]/70 pb-2">
                  <dt className="text-slate-400">Jw = max(0, Aw·(Δπ_eff−ΔP))</dt>
                  <dd className="text-slate-200 tabular-nums">
                    {results.waterFlux_LMH.toFixed(2)} LMH
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#1E2D45]/70 pb-2">
                  <dt className="text-slate-400">Phyd = 0.02778·Jw·ΔP·Am/1000</dt>
                  <dd className="text-slate-200 tabular-nums">
                    {results.hydraulicPower_kW.toFixed(2)} kW
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Pnet = Phyd·ηTG − Paux</dt>
                  <dd className={`font-semibold tabular-nums ${statusTone}`}>
                    {results.netElectric_kWe >= 0 ? '+' : ''}
                    {results.netElectric_kWe.toFixed(2)} kWe
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">
                  Boundary & Physics Warnings
                </h3>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {results.warnings.length} active
                </span>
              </div>

              {results.warnings.length === 0 ? (
                <p className="text-xs text-emerald-400">
                  ● Operating point is inside first-order forward-flux screening bounds. Lab coupon calibration is still required before design decisions.
                </p>
              ) : (
                <ul className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                  {results.warnings.map((w) => {
                    const color =
                      w.severity === 'critical'
                        ? 'text-rose-400'
                        : w.severity === 'warning'
                          ? 'text-amber-400'
                          : 'text-cyan-400';
                    return (
                      <li
                        key={w.id}
                        className="border-b border-[#1E2D45]/70 pb-2.5 last:border-b-0 last:pb-0"
                      >
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{w.title}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {w.detail}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
