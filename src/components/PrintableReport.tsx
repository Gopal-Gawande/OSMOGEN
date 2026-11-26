import { EVIDENCE_PAPERS } from '../engine/evidenceData.ts';
import type {
  ConfigurationEnvelope,
  ProInputs,
  ProResults,
} from '../engine/proModel.ts';

interface PrintableReportProps {
  configuration: ConfigurationEnvelope;
  inputs: ProInputs;
  results: ProResults;
}

export function PrintableReport({
  configuration,
  inputs,
  results,
}: PrintableReportProps) {
  const envelopeName =
    configuration === 'standalone'
      ? 'Standalone PRO (Research Baseline)'
      : configuration === 'ro_pro'
        ? 'RO–PRO Hybrid (Primary Commercial Hypothesis)'
        : 'PRO + Solar Thermal + Desalination';

  return (
    <div className="hidden print-only p-8 bg-white text-slate-900 space-y-6">
      <div className="border-b-2 border-slate-900 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            OSMOGEN Intelligence — PRO Feasibility Screening Summary
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Founder: Gopal Gawande · BUILD 2036 Climate & Clean Energy · Model Version: {results.modelVersion}
          </p>
        </div>
        <div className="text-right text-xs font-mono text-slate-600">
          <p>Status: {results.status}</p>
          <p>{new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="border border-slate-300 p-3 text-xs bg-slate-50">
        <strong>Concept-Stage Evidence Statement:</strong> All outputs below are first-order modelled / illustrative screening estimates. No physical PRO prototype, pilot, customer contract, site permission, or measured performance is claimed. Electric (kWe) and thermal (kWth) energy are accounted strictly separately.
      </div>

      <div className="grid grid-cols-2 gap-6 text-xs">
        <div>
          <h2 className="font-bold text-sm border-b border-slate-300 pb-1 mb-2">
            Input Assumptions ({envelopeName})
          </h2>
          <table className="w-full font-mono">
            <tbody className="divide-y divide-slate-200">
              <tr><td className="py-1 font-sans">Feed / Draw Salinity</td><td className="py-1 text-right">{inputs.feedSalinity_gL} / {inputs.drawSalinity_gL} g/L</td></tr>
              <tr><td className="py-1 font-sans">Feed / Draw Flow</td><td className="py-1 text-right">{inputs.feedFlow_m3h} / {inputs.drawFlow_m3h} m³/h</td></tr>
              <tr><td className="py-1 font-sans">Temperature · van’t Hoff i</td><td className="py-1 text-right">{inputs.temperature_C} °C · {inputs.vantHoffFactor}</td></tr>
              <tr><td className="py-1 font-sans">Applied Pressure ΔP</td><td className="py-1 text-right">{inputs.operatingPressure_bar} bar</td></tr>
              <tr><td className="py-1 font-sans">Permeability Aw · Area Am</td><td className="py-1 text-right">{inputs.waterPermeability_LMH_bar} LMH/bar · {inputs.membraneArea_m2.toLocaleString()} m²</td></tr>
              <tr><td className="py-1 font-sans">Effective Factor fCP · ηTG</td><td className="py-1 text-right">{inputs.effectiveOsmoticFactor} · {inputs.turbineGeneratorEfficiency_pct}%</td></tr>
              <tr><td className="py-1 font-sans">Auxiliary Load Mode</td><td className="py-1 text-right">{inputs.auxiliaryMode} ({results.totalAuxiliary_kWe.toFixed(1)} kWe)</td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="font-bold text-sm border-b border-slate-300 pb-1 mb-2">
            Deterministic Screening Outputs
          </h2>
          <table className="w-full font-mono">
            <tbody className="divide-y divide-slate-200">
              <tr><td className="py-1 font-sans">Bulk Osmotic Δπ</td><td className="py-1 text-right">{results.bulkDeltaPi_bar.toFixed(2)} bar</td></tr>
              <tr><td className="py-1 font-sans">Effective Driving Δπ_eff</td><td className="py-1 text-right">{results.effectiveDeltaPi_bar.toFixed(2)} bar</td></tr>
              <tr><td className="py-1 font-sans">Forward Water Flux Jw</td><td className="py-1 text-right">{results.waterFlux_LMH.toFixed(2)} LMH ({results.permeateFlow_m3h.toFixed(1)} m³/h)</td></tr>
              <tr><td className="py-1 font-sans">Membrane Hydraulic Phyd</td><td className="py-1 text-right">{results.hydraulicPower_kW.toFixed(2)} kW ({results.powerDensity_W_m2.toFixed(2)} W/m²)</td></tr>
              <tr><td className="py-1 font-sans">Gross Electric Output</td><td className="py-1 text-right">{results.grossElectric_kWe.toFixed(2)} kWe</td></tr>
              <tr><td className="py-1 font-sans font-bold">Net Electric Output (Pnet)</td><td className="py-1 text-right font-bold">{results.netElectric_kWe.toFixed(2)} kWe</td></tr>
              <tr><td className="py-1 font-sans">RO Baseline → Hybrid SEC</td><td className="py-1 text-right">{inputs.roBaselineSEC_kWh_m3.toFixed(2)} → {results.roHybridSEC_kWh_m3.toFixed(2)} kWh/m³</td></tr>
              <tr><td className="py-1 font-sans">Separate Solar Thermal</td><td className="py-1 text-right">{results.solarUsefulHeat_kWth.toFixed(1)} kWth ({results.solarHeatCoverage_pct.toFixed(0)}% duty)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {results.warnings.length > 0 && (
        <div className="text-xs">
          <h2 className="font-bold text-sm border-b border-slate-300 pb-1 mb-2">
            Active Boundary & Physics Warnings
          </h2>
          <ul className="list-disc list-inside space-y-1">
            {results.warnings.map((w) => (
              <li key={w.id}>
                <strong>{w.title}:</strong> {w.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[10px] text-slate-600 border-t border-slate-300 pt-3">
        <p className="font-semibold mb-1">Research Register References:</p>
        <p>{EVIDENCE_PAPERS.map((p) => `${p.authors} (${p.year}) ${p.doi}`).join(' | ')}</p>
      </div>
    </div>
  );
}
