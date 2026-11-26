import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, SlidersHorizontal, Sparkles } from 'lucide-react';
import type {
  ConfigurationEnvelope,
  ProInputs,
  ProResults,
} from '../engine/proModel.ts';

interface EnergyBalanceViewProps {
  configuration: ConfigurationEnvelope;
  onChangeConfiguration: (cfg: ConfigurationEnvelope) => void;
  inputs: ProInputs;
  results: ProResults;
  onJumpToCalculator: () => void;
  onJumpToAssistant: () => void;
}

export function EnergyBalanceView({
  configuration,
  onChangeConfiguration,
  inputs,
  results,
  onJumpToCalculator,
  onJumpToAssistant,
}: EnergyBalanceViewProps) {
  const auxSlices =
    inputs.auxiliaryMode === 'decomposed'
      ? [
          { name: 'Feed Pump', value: Number(inputs.auxFeedPump_kW.toFixed(2)), color: '#06B6D4' },
          { name: 'Draw Circulation', value: Number(inputs.auxDrawCirculation_kW.toFixed(2)), color: '#3B82F6' },
          { name: 'Pretreatment', value: Number(inputs.auxPretreatment_kW.toFixed(2)), color: '#F59E0B' },
          { name: 'Controls & CIP', value: Number(inputs.auxControlsCleaning_kW.toFixed(2)), color: '#8B5CF6' },
          { name: 'Generator Loss', value: Number(results.generatorLoss_kW.toFixed(2)), color: '#64748B' },
        ].filter((s) => s.value > 0)
      : [
          { name: 'Lumped Auxiliaries', value: Number(results.totalAuxiliary_kWe.toFixed(2)), color: '#F59E0B' },
          { name: 'Generator Loss', value: Number(results.generatorLoss_kW.toFixed(2)), color: '#64748B' },
          {
            name: 'Net Recovered',
            value: Number(Math.max(0, results.netElectric_kWe).toFixed(2)),
            color: '#10B981',
          },
        ].filter((s) => s.value > 0);

  const roCompareData = [
    {
      name: 'RO Baseline',
      sec: Number(inputs.roBaselineSEC_kWh_m3.toFixed(3)),
      demand_kWe: Number(results.roBaselineDemand_kWe.toFixed(1)),
      fill: '#64748B',
    },
    {
      name: 'Hybrid RO–PRO',
      sec: Number(Math.max(0, results.roHybridSEC_kWh_m3).toFixed(3)),
      demand_kWe: Number(Math.max(0, results.roHybridDemand_kWe).toFixed(1)),
      fill: results.netElectric_kWe >= 0 ? '#10B981' : '#F43F5E',
    },
  ];

  const netStatusColor =
    results.netBalanceStatus === 'positive'
      ? 'text-emerald-400'
      : results.netBalanceStatus === 'negative'
        ? 'text-rose-400'
        : 'text-amber-400';

  const netStatusText =
    results.netBalanceStatus === 'positive'
      ? '▲ Net Positive Output'
      : results.netBalanceStatus === 'negative'
        ? '▼ Net Negative Deficit'
        : '■ Near Break-Even';

  const envelopeTitle =
    configuration === 'standalone'
      ? 'Standalone PRO'
      : configuration === 'ro_pro'
        ? 'RO–PRO Hybrid'
        : 'PRO + Solar Thermal + Desalination';

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 border-b border-[#1E2D45] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Module 2 · {envelopeTitle} · Electric kWe & Thermal kWth Strictly Separated
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Energy Balance Engine
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            System-level EMS telemetry decomposing membrane hydraulic work, turbine-generator conversion, auxiliary electrical loads, RO SEC impact, and separate solar thermal coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#1E2D45] bg-[#0F1829] p-1">
            {(
              [
                ['standalone', 'Standalone'],
                ['ro_pro', 'RO–PRO'],
                ['solar_pro_desal', 'Solar + PRO'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onChangeConfiguration(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  configuration === id
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onJumpToCalculator}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2D45] bg-[#0F1829] px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Tune Inputs
          </button>
          <button
            type="button"
            onClick={onJumpToAssistant}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explain with AI
          </button>
        </div>
      </div>

      {/* Top EMS KPI Strip (6 Metrics matching industrial EMS dashboard hierarchy) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
          <p className="text-[11px] font-medium text-slate-400">Gross Hydraulic</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
              {results.hydraulicPower_kW.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-slate-400">kW</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
            {results.powerDensity_W_m2.toFixed(2)} W/m²
          </p>
        </div>

        <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
          <p className="text-[11px] font-medium text-slate-400">Gross Electric</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-cyan-400 tabular-nums">
              {results.grossElectric_kWe.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-slate-400">kWe</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
            ηTG {inputs.turbineGeneratorEfficiency_pct}% (−{results.generatorLoss_kW.toFixed(1)} kW)
          </p>
        </div>

        <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
          <p className="text-[11px] font-medium text-slate-400">Auxiliary Load</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-amber-400 tabular-nums">
              {results.totalAuxiliary_kWe.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-slate-400">kWe</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-500">
            {inputs.auxiliaryMode === 'decomposed' ? '4-load breakdown' : 'Single placeholder'}
          </p>
        </div>

        <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
          <p className="text-[11px] font-medium text-slate-400">Net Electric Output</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className={`font-mono text-2xl font-bold tabular-nums ${netStatusColor}`}>
              {results.netElectric_kWe >= 0 ? '+' : ''}
              {results.netElectric_kWe.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-slate-400">kWe</span>
          </div>
          <p className={`mt-1 text-[11px] font-medium ${netStatusColor}`}>
            {netStatusText}
          </p>
        </div>

        <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
          <p className="text-[11px] font-medium text-slate-400">Hybrid RO SEC</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
              {results.roHybridSEC_kWh_m3.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-slate-400">kWh/m³</span>
          </div>
          <p
            className={`mt-1 font-mono text-[11px] tabular-nums ${
              results.roSecDelta_kWh_m3 <= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {results.roSecDelta_kWh_m3 >= 0 ? '+' : ''}
            {results.roSecDelta_kWh_m3.toFixed(2)} vs {inputs.roBaselineSEC_kWh_m3.toFixed(2)} base
          </p>
        </div>

        <div className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-4">
          <p className="text-[11px] font-medium text-amber-300">Solar Heat (Separate)</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-amber-400 tabular-nums">
              {results.solarUsefulHeat_kWth.toFixed(0)}
            </span>
            <span className="font-mono text-xs text-amber-300/80">kWth</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-400 tabular-nums">
            {results.solarHeatCoverage_pct.toFixed(0)}% of {inputs.processHeatDemand_kWth} kWth duty
          </p>
        </div>
      </div>

      {/* Main EMS Row: SVG Energy Flow Diagram (7 cols) + Load/Loss Breakdown Donut (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Process & Energy Flow Diagram */}
        <section className="xl:col-span-7 rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between">
          <div className="flex items-baseline justify-between border-b border-[#1E2D45] pb-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Hydraulic & Electrical Energy Flow Diagram
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                System boundary trace from osmotic intake streams to net electrical contribution (illustrative screening balance).
              </p>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              {inputs.membraneArea_m2.toLocaleString()} m² Am
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 740 285"
              className="w-full min-w-[600px] h-auto"
              role="img"
              aria-label="PRO hydraulic and electrical energy flow diagram"
            >
              <defs>
                <marker id="arrowCyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#06B6D4" />
                </marker>
                <marker id="arrowEmerald" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#10B981" />
                </marker>
                <marker id="arrowAmber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#F59E0B" />
                </marker>
                <marker id="arrowRose" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#F43F5E" />
                </marker>
              </defs>

              {/* Connecting flow lines */}
              <path d="M165 62 L242 108" stroke="#06B6D4" strokeWidth="2" fill="none" markerEnd="url(#arrowCyan)" />
              <path d="M165 202 L242 152" stroke="#3B82F6" strokeWidth="2" fill="none" markerEnd="url(#arrowCyan)" />
              <path d="M398 130 L465 130" stroke="#06B6D4" strokeWidth="2.5" fill="none" markerEnd="url(#arrowCyan)" />

              {/* Turbine to Net Output */}
              <path
                d="M585 112 L620 68"
                stroke={results.netElectric_kWe >= 0 ? '#10B981' : '#F43F5E'}
                strokeWidth="2.5"
                fill="none"
                markerEnd={results.netElectric_kWe >= 0 ? 'url(#arrowEmerald)' : 'url(#arrowRose)'}
              />
              {/* Auxiliaries deduction */}
              <path d="M585 148 L620 194" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowAmber)" />

              {/* Node 1: Feed Stream */}
              <rect x="12" y="24" width="152" height="76" rx="8" fill="#0B1324" stroke="#1E2D45" />
              <text x="24" y="46" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">LOW-SALINITY FEED</text>
              <text x="24" y="68" fill="#F1F5F9" fontSize="15" fontWeight="700" fontFamily="JetBrains Mono">
                {inputs.feedSalinity_gL.toFixed(1)} g/L
              </text>
              <text x="24" y="86" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
                {inputs.feedFlow_m3h} m³/h · π {results.feedOsmoticPressure_bar.toFixed(1)} bar
              </text>

              {/* Node 2: Draw Stream */}
              <rect x="12" y="164" width="152" height="76" rx="8" fill="#0B1324" stroke="#1E2D45" />
              <text x="24" y="186" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">
                {configuration === 'ro_pro' ? 'SWRO BRINE DRAW' : 'HIGH-SALINITY DRAW'}
              </text>
              <text x="24" y="208" fill="#38BDF8" fontSize="15" fontWeight="700" fontFamily="JetBrains Mono">
                {inputs.drawSalinity_gL.toFixed(1)} g/L
              </text>
              <text x="24" y="226" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
                {inputs.drawFlow_m3h} m³/h · π {results.drawOsmoticPressure_bar.toFixed(1)} bar
              </text>

              {/* Node 3: PRO Membrane Train */}
              <rect x="246" y="72" width="152" height="116" rx="10" fill="#142036" stroke="#06B6D4" strokeWidth="1.5" />
              <text x="260" y="96" fill="#22D3EE" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans">
                PRO Membrane Train
              </text>
              <text x="260" y="118" fill="#F1F5F9" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">
                Jw {results.waterFlux_LMH.toFixed(2)} LMH
              </text>
              <text x="260" y="138" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                Δπ_eff: {results.effectiveDeltaPi_bar.toFixed(1)} bar
              </text>
              <text x="260" y="155" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                Applied ΔP: {inputs.operatingPressure_bar.toFixed(1)} bar
              </text>
              <text x="260" y="172" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                Permeate: {results.permeateFlow_m3h.toFixed(1)} m³/h
              </text>

              {/* Node 4: Hydraulic Recovery & Turbine-Generator */}
              <rect x="469" y="82" width="116" height="96" rx="8" fill="#0B1324" stroke="#1E2D45" />
              <text x="480" y="104" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">TURBINE-GEN</text>
              <text x="480" y="126" fill="#F1F5F9" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">
                {results.grossElectric_kWe.toFixed(1)} kWe
              </text>
              <text x="480" y="145" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
                Phyd {results.hydraulicPower_kW.toFixed(1)} kW
              </text>
              <text x="480" y="162" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
                ηTG {inputs.turbineGeneratorEfficiency_pct}%
              </text>

              {/* Node 5: Net Electric Balance */}
              <rect
                x="622"
                y="24"
                width="108"
                height="76"
                rx="8"
                fill="#0B1324"
                stroke={results.netElectric_kWe >= 0 ? '#10B981' : '#F43F5E'}
              />
              <text x="632" y="46" fill="#94A3B8" fontSize="10" fontFamily="DM Sans">NET ELECTRIC</text>
              <text
                x="632"
                y="68"
                fill={results.netElectric_kWe >= 0 ? '#10B981' : '#F43F5E'}
                fontSize="15"
                fontWeight="700"
                fontFamily="JetBrains Mono"
              >
                {results.netElectric_kWe >= 0 ? '+' : ''}
                {results.netElectric_kWe.toFixed(1)}
              </text>
              <text x="632" y="86" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                kWe net
              </text>

              {/* Node 6: Auxiliary Load Sink */}
              <rect x="622" y="164" width="108" height="76" rx="8" fill="#0B1324" stroke="#F59E0B" />
              <text x="632" y="186" fill="#FBBF24" fontSize="10" fontFamily="DM Sans">AUXILIARIES</text>
              <text x="632" y="208" fill="#F59E0B" fontSize="15" fontWeight="700" fontFamily="JetBrains Mono">
                −{results.totalAuxiliary_kWe.toFixed(1)}
              </text>
              <text x="632" y="226" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                kWe demand
              </text>

              {/* Separate Solar Thermal Banner inside SVG footer if solar_pro_desal */}
              <line x1="12" y1="258" x2="730" y2="258" stroke="#1E2D45" strokeDasharray="3 3" />
              <text x="14" y="276" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                MASS CHECK: Feed Recovery {results.feedRecoveryRatio_pct.toFixed(1)}% · Draw Dilution {results.drawDilutionRatio_pct.toFixed(1)}%
              </text>
              <text x="455" y="276" fill="#F59E0B" fontSize="10" fontFamily="JetBrains Mono">
                SEPARATE THERMAL: {results.solarUsefulHeat_kWth.toFixed(0)} kWth ({results.solarHeatCoverage_pct.toFixed(0)}% duty)
              </text>
            </svg>
          </div>
        </section>

        {/* Load & Loss Breakdown Donut */}
        <section className="xl:col-span-5 rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between">
          <div className="flex items-baseline justify-between border-b border-[#1E2D45] pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {inputs.auxiliaryMode === 'decomposed'
                  ? 'Auxiliary & Loss Breakdown'
                  : 'Hydraulic Power Disposition'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {inputs.auxiliaryMode === 'decomposed'
                  ? 'Decomposed pumping, pretreatment, CIP, and generator conversion losses.'
                  : 'Split between net electrical output, auxiliary consumption, and conversion loss.'}
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {results.totalAuxiliary_kWe.toFixed(1)} kWe aux
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={auxSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="#0F1829"
                    strokeWidth={2}
                  >
                    {auxSlices.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1324',
                      border: '1px solid #1E2D45',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono',
                      color: '#F1F5F9',
                    }}
                    formatter={(val: unknown) => [`${Number(val).toFixed(2)} kW`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="space-y-2.5 text-xs">
              {auxSlices.map((slice) => (
                <li key={slice.name} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-slate-300 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    {slice.name}
                  </span>
                  <span className="font-mono text-slate-100 tabular-nums shrink-0">
                    {slice.value.toFixed(1)} kW
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#1E2D45] pt-3 text-xs text-slate-400">
            Boundary Rule: Gross PRO power is never credited as free energy; auxiliary pumping, pretreatment, and conversion losses are always deducted.
          </div>
        </section>
      </div>

      {/* Bottom Row: RO–PRO SEC Scorecard + Separate Solar Thermal Scorecard + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RO–PRO Scorecard */}
        <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between space-y-4">
          <div className="border-b border-[#1E2D45] pb-3">
            <p className="text-[11px] font-medium text-cyan-400">
              Envelope B · Electric Accounting (kWe & kWh/m³)
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-slate-100">
              RO–PRO Hybrid SEC Scorecard
            </h3>
          </div>

          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roCompareData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
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
                  formatter={(val: unknown) => [`${Number(val).toFixed(3)} kWh/m³`, 'Specific Energy']}
                />
                <Bar dataKey="sec" radius={[4, 4, 0, 0]} maxBarSize={52}>
                  {roCompareData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <dl className="space-y-1.5 text-xs font-mono border-t border-[#1E2D45] pt-3">
            <div className="flex justify-between">
              <dt className="text-slate-400">Product Flow Qp (held constant)</dt>
              <dd className="text-slate-200 tabular-nums">{inputs.roProductFlow_m3h} m³/h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Baseline RO Demand</dt>
              <dd className="text-slate-200 tabular-nums">{results.roBaselineDemand_kWe.toFixed(1)} kWe</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Hybrid RO Demand</dt>
              <dd className="text-slate-200 tabular-nums">{results.roHybridDemand_kWe.toFixed(1)} kWe</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">SEC Delta</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  results.roSecDelta_kWh_m3 <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {results.roSecDelta_kWh_m3 >= 0 ? '+' : ''}
                {results.roSecDelta_kWh_m3.toFixed(3)} kWh/m³ ({results.roSecChange_pct.toFixed(1)}%)
              </dd>
            </div>
          </dl>
        </section>

        {/* Separate Solar Thermal Scorecard */}
        <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between space-y-4">
          <div className="border-b border-[#1E2D45] pb-3">
            <p className="text-[11px] font-medium text-amber-400">
              Envelope C · Thermal Accounting (kWth Only — Never Added to kWe)
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-slate-100">
              Solar Thermal Balance
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="text-slate-300">Instantaneous Thermal Duty Coverage</span>
                <span className="font-mono font-semibold text-amber-400 tabular-nums">
                  {results.solarHeatCoverage_pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#080E1A] overflow-hidden border border-[#1E2D45]">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.min(100, results.solarHeatCoverage_pct)}%` }}
                />
              </div>
            </div>

            <dl className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-[#1E2D45]/70 pb-1.5">
                <dt className="text-slate-400">Collector Aperture</dt>
                <dd className="text-slate-200 tabular-nums">{inputs.solarCollectorArea_m2.toLocaleString()} m²</dd>
              </div>
              <div className="flex justify-between border-b border-[#1E2D45]/70 pb-1.5">
                <dt className="text-slate-400">Solar Irradiance × η_th</dt>
                <dd className="text-slate-200 tabular-nums">
                  {inputs.solarIrradiance_kW_m2.toFixed(2)} kW/m² × {inputs.solarThermalEfficiency_pct}%
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#1E2D45]/70 pb-1.5">
                <dt className="text-slate-400">Useful Solar Heat</dt>
                <dd className="text-amber-400 font-semibold tabular-nums">
                  {results.solarUsefulHeat_kWth.toFixed(1)} kWth
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#1E2D45]/70 pb-1.5">
                <dt className="text-slate-400">Process Heat Demand</dt>
                <dd className="text-slate-200 tabular-nums">
                  {inputs.processHeatDemand_kWth.toFixed(1)} kWth
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Backup / Storage Heat Needed</dt>
                <dd className="text-slate-300 tabular-nums">
                  {results.solarBackupHeatNeeded_kWth.toFixed(1)} kWth
                </dd>
              </div>
            </dl>
          </div>

          <p className="text-[11px] text-slate-500 border-t border-[#1E2D45] pt-3">
            No solar-to-electric conversion is assumed. Site studies require hourly DNI/GHI profiles and thermal storage loss models.
          </p>
        </section>

        {/* Engineering Boundary Alerts */}
        <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Real-Time Verification Guardrails
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-slate-100">
                Active Boundary Alerts
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {results.warnings.length} items
            </span>
          </div>

          <ul className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-1">
            {results.warnings.length === 0 ? (
              <li className="text-xs text-emerald-400 leading-relaxed">
                ● Nominal first-order screening envelope. No immediate hydraulic clipping or net-negative electricity violation under entered assumptions.
              </li>
            ) : (
              results.warnings.map((alert) => {
                const severityLabel =
                  alert.severity === 'critical'
                    ? 'CRITICAL'
                    : alert.severity === 'warning'
                      ? 'CAUTION'
                      : 'BOUNDARY';
                const colorClass =
                  alert.severity === 'critical'
                    ? 'text-rose-400'
                    : alert.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-cyan-400';
                return (
                  <li
                    key={alert.id}
                    className="border-b border-[#1E2D45]/70 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${colorClass}`}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {alert.title}
                      </span>
                      <span className={`font-mono text-[10px] shrink-0 ${colorClass}`}>
                        {severityLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {alert.detail}
                    </p>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-[#1E2D45] pt-3 text-[11px] text-slate-500">
            Status: Modelled / Illustrative · No physical plant or pilot data claimed.
          </div>
        </section>
      </div>
    </div>
  );
}
