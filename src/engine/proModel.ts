export type ConfigurationEnvelope = 'standalone' | 'ro_pro' | 'solar_pro_desal';

export type AuxiliaryMode = 'single' | 'decomposed';

export type InputProvenance =
  | 'illustrative-preset'
  | 'user-entered'
  | 'literature-derived'
  | 'vendor-supplied'
  | 'measured';

export interface ProInputs {
  // Water chemistry & stream flows
  feedSalinity_gL: number;
  drawSalinity_gL: number;
  temperature_C: number;
  vantHoffFactor: number;
  feedFlow_m3h: number;
  drawFlow_m3h: number;

  // Operating pressure & membrane parameters
  operatingPressure_bar: number;
  waterPermeability_LMH_bar: number;
  membraneArea_m2: number;
  effectiveOsmoticFactor: number; // fCP (0.1 to 1.0)

  // Energy recovery & auxiliary consumption
  turbineGeneratorEfficiency_pct: number;
  auxiliaryMode: AuxiliaryMode;
  proAuxiliaryLoad_kW: number;
  auxFeedPump_kW: number;
  auxDrawCirculation_kW: number;
  auxPretreatment_kW: number;
  auxControlsCleaning_kW: number;

  // RO–PRO hybrid interface
  roProductFlow_m3h: number;
  roBaselineSEC_kWh_m3: number;

  // Solar thermal subsystem (accounted strictly separately in kWth)
  solarCollectorArea_m2: number;
  solarIrradiance_kW_m2: number;
  solarThermalEfficiency_pct: number;
  processHeatDemand_kWth: number;
}

export interface BoundaryWarning {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  relatedParam?: keyof ProInputs;
}

export interface ProResults {
  modelVersion: 'screening-0.1';
  status: 'assumption-only';
  calculatedAt: string;

  // Osmotic thermodynamics
  feedOsmoticPressure_bar: number;
  drawOsmoticPressure_bar: number;
  bulkDeltaPi_bar: number;
  effectiveDeltaPi_bar: number;
  optimalPressureApprox_bar: number;

  // Membrane transport
  drivingPressure_bar: number;
  waterFlux_LMH: number;
  permeateFlow_m3h: number;
  fluxClippedToZero: boolean;

  // Hydraulic & electrical energy balance (kWe)
  hydraulicPower_kW: number;
  powerDensity_W_m2: number;
  grossElectric_kWe: number;
  generatorLoss_kW: number;
  totalAuxiliary_kWe: number;
  netElectric_kWe: number;
  netPowerDensity_W_m2: number;
  netBalanceStatus: 'positive' | 'breakeven' | 'negative';

  // Stream & dilution checks (first-order diagnostic)
  feedRecoveryRatio_pct: number;
  drawDilutionRatio_pct: number;

  // RO–PRO hybrid scorecard (kWe & kWh/m3)
  roBaselineDemand_kWe: number;
  roHybridDemand_kWe: number;
  roHybridSEC_kWh_m3: number;
  roSecDelta_kWh_m3: number;
  roSecChange_pct: number;

  // Solar thermal scorecard (strictly separate kWth)
  solarUsefulHeat_kWth: number;
  solarHeatCoverage_pct: number;
  solarBackupHeatNeeded_kWth: number;

  // Engineering alerts & boundary notices
  warnings: BoundaryWarning[];
}

export interface PressureSweepPoint {
  pressure_bar: number;
  flux_LMH: number;
  hydraulicPower_kW: number;
  powerDensity_W_m2: number;
  grossElectric_kWe: number;
  netElectric_kWe: number;
}

export interface SensitivityPoint {
  label: string;
  paramValue: number;
  waterFlux_LMH: number;
  grossElectric_kWe: number;
  totalAuxiliary_kWe: number;
  netElectric_kWe: number;
  roHybridSEC_kWh_m3: number;
}

export interface ScenarioRecord {
  id: string;
  name: string;
  description: string;
  configuration: ConfigurationEnvelope;
  provenance: InputProvenance;
  inputs: ProInputs;
  createdAt: string;
}

const NACL_MOLAR_MASS_G_MOL = 58.44;
const GAS_CONSTANT_L_BAR_MOL_K = 0.08314;
// Unit conversion: 1 LMH * 1 bar = (1e-3 m3 / (m2 * 3600 s)) * 1e5 Pa = 0.0277777778 W/m2
const LMH_BAR_TO_W_M2 = 1 / 36; // 0.027777777777777776

/**
 * First-order van't Hoff osmotic pressure (bar) for an NaCl-equivalent solution.
 * pi (bar) = i * C (mol/L) * R * T (K), where C = salinity (g/L) / 58.44
 */
export function calculateOsmoticPressureBar(
  salinity_gL: number,
  temperature_C: number,
  vantHoffFactor: number
): number {
  const safeSalinity = Math.max(0, salinity_gL);
  const molarConc = safeSalinity / NACL_MOLAR_MASS_G_MOL;
  const tempK = temperature_C + 273.15;
  return vantHoffFactor * molarConc * GAS_CONSTANT_L_BAR_MOL_K * tempK;
}

export function getTotalAuxiliaryLoad(inputs: ProInputs): number {
  if (inputs.auxiliaryMode === 'decomposed') {
    return (
      Math.max(0, inputs.auxFeedPump_kW) +
      Math.max(0, inputs.auxDrawCirculation_kW) +
      Math.max(0, inputs.auxPretreatment_kW) +
      Math.max(0, inputs.auxControlsCleaning_kW)
    );
  }
  return Math.max(0, inputs.proAuxiliaryLoad_kW);
}

/**
 * Deterministic first-order PRO screening calculation engine (screening-0.1).
 * Strictly follows Section 5 of the OSMOGEN Technical Design Brief.
 */
export function calculateProModel(
  inputs: ProInputs,
  configuration: ConfigurationEnvelope = 'standalone'
): ProResults {
  const feedPi = calculateOsmoticPressureBar(
    inputs.feedSalinity_gL,
    inputs.temperature_C,
    inputs.vantHoffFactor
  );
  const drawPi = calculateOsmoticPressureBar(
    inputs.drawSalinity_gL,
    inputs.temperature_C,
    inputs.vantHoffFactor
  );

  const bulkDeltaPi = drawPi - feedPi;
  const effectiveDeltaPi = Math.max(0, bulkDeltaPi) * inputs.effectiveOsmoticFactor;
  const optimalPressureApprox = effectiveDeltaPi / 2;

  const rawDrivingPressure = effectiveDeltaPi - inputs.operatingPressure_bar;
  const fluxClippedToZero = rawDrivingPressure <= 0 || bulkDeltaPi <= 0;
  const drivingPressure = Math.max(0, rawDrivingPressure);

  const waterFlux_LMH = fluxClippedToZero
    ? 0
    : inputs.waterPermeability_LMH_bar * drivingPressure;

  const permeateFlow_m3h = (waterFlux_LMH * inputs.membraneArea_m2) / 1000;

  // Phyd (kW) = 0.0277778 * Jw * deltaP * Am / 1000
  const hydraulicPower_kW =
    (LMH_BAR_TO_W_M2 * waterFlux_LMH * inputs.operatingPressure_bar * inputs.membraneArea_m2) /
    1000;

  const powerDensity_W_m2 =
    inputs.membraneArea_m2 > 0 ? (hydraulicPower_kW * 1000) / inputs.membraneArea_m2 : 0;

  const etaTG = Math.min(100, Math.max(0, inputs.turbineGeneratorEfficiency_pct)) / 100;
  const grossElectric_kWe = hydraulicPower_kW * etaTG;
  const generatorLoss_kW = Math.max(0, hydraulicPower_kW - grossElectric_kWe);

  const totalAuxiliary_kWe = getTotalAuxiliaryLoad(inputs);
  const netElectric_kWe = grossElectric_kWe - totalAuxiliary_kWe;
  const netPowerDensity_W_m2 =
    inputs.membraneArea_m2 > 0 ? (netElectric_kWe * 1000) / inputs.membraneArea_m2 : 0;

  const netBalanceStatus: 'positive' | 'breakeven' | 'negative' =
    netElectric_kWe > 0.25
      ? 'positive'
      : netElectric_kWe < -0.25
        ? 'negative'
        : 'breakeven';

  // Mass-balance ratio checks (first-order warning indicators)
  const feedRecoveryRatio_pct =
    inputs.feedFlow_m3h > 0 ? (permeateFlow_m3h / inputs.feedFlow_m3h) * 100 : 0;
  const drawDilutionRatio_pct =
    inputs.drawFlow_m3h > 0 ? (permeateFlow_m3h / inputs.drawFlow_m3h) * 100 : 0;

  // Section 5.6: RO–PRO Scorecard (product flow Qp held constant)
  const roBaselineDemand_kWe = inputs.roProductFlow_m3h * inputs.roBaselineSEC_kWh_m3;
  const roHybridDemand_kWe = roBaselineDemand_kWe - netElectric_kWe;
  const roHybridSEC_kWh_m3 =
    inputs.roProductFlow_m3h > 0 ? roHybridDemand_kWe / inputs.roProductFlow_m3h : 0;
  const roSecDelta_kWh_m3 = roHybridSEC_kWh_m3 - inputs.roBaselineSEC_kWh_m3;
  const roSecChange_pct =
    inputs.roBaselineSEC_kWh_m3 > 0
      ? (roSecDelta_kWh_m3 / inputs.roBaselineSEC_kWh_m3) * 100
      : 0;

  // Section 5.7: Solar Thermal Scorecard (strictly separate kWth)
  const solarUsefulHeat_kWth =
    inputs.solarCollectorArea_m2 *
    inputs.solarIrradiance_kW_m2 *
    (inputs.solarThermalEfficiency_pct / 100);
  const solarHeatCoverage_pct =
    inputs.processHeatDemand_kWth > 0
      ? Math.min(solarUsefulHeat_kWth / inputs.processHeatDemand_kWth, 1) * 100
      : 0;
  const solarBackupHeatNeeded_kWth = Math.max(
    0,
    inputs.processHeatDemand_kWth - solarUsefulHeat_kWth
  );

  // Dynamic Engineering Warnings & Boundary Checks
  const warnings: BoundaryWarning[] = [];

  if (bulkDeltaPi <= 0) {
    warnings.push({
      id: 'inverted-salinity',
      severity: 'critical',
      title: 'No positive osmotic gradient',
      detail: `Draw salinity (${inputs.drawSalinity_gL.toFixed(1)} g/L) must exceed feed salinity (${inputs.feedSalinity_gL.toFixed(1)} g/L) to establish a forward osmotic driving force.`,
      relatedParam: 'drawSalinity_gL',
    });
  } else if (inputs.operatingPressure_bar >= effectiveDeltaPi) {
    warnings.push({
      id: 'pressure-exceeds-gradient',
      severity: 'critical',
      title: 'Applied pressure exceeds effective osmotic driving pressure',
      detail: `ΔP (${inputs.operatingPressure_bar.toFixed(1)} bar) ≥ effective Δπ (${effectiveDeltaPi.toFixed(2)} bar). Forward water flux clips to 0 LMH; reverse osmosis flow would occur in a real module.`,
      relatedParam: 'operatingPressure_bar',
    });
  }

  if (netElectric_kWe < 0) {
    warnings.push({
      id: 'negative-net-output',
      severity: 'critical',
      title: 'Net electrical output is negative',
      detail: `Auxiliary load (${totalAuxiliary_kWe.toFixed(1)} kWe) exceeds gross generator output (${grossElectric_kWe.toFixed(1)} kWe) by ${Math.abs(netElectric_kWe).toFixed(1)} kWe. System consumes more electricity than it recovers.`,
      relatedParam: 'proAuxiliaryLoad_kW',
    });
  }

  if (feedRecoveryRatio_pct > 50 && !fluxClippedToZero) {
    warnings.push({
      id: 'high-feed-depletion',
      severity: 'warning',
      title: 'Permeate exceeds 50% of entered feed flow',
      detail: `Estimated permeate (${permeateFlow_m3h.toFixed(1)} m³/h) is ${feedRecoveryRatio_pct.toFixed(0)}% of feed stream (${inputs.feedFlow_m3h.toFixed(0)} m³/h). Axial feed concentration and fouling risk will severely reduce real average flux.`,
      relatedParam: 'feedFlow_m3h',
    });
  }

  if (drawDilutionRatio_pct > 35 && !fluxClippedToZero) {
    warnings.push({
      id: 'high-draw-dilution',
      severity: 'warning',
      title: 'Significant draw-stream axial dilution indicated',
      detail: `Permeate addition represents ${drawDilutionRatio_pct.toFixed(0)}% of inlet draw flow (${inputs.drawFlow_m3h.toFixed(0)} m³/h). This lumped screening model omits axial dilution along the module.`,
      relatedParam: 'drawFlow_m3h',
    });
  }

  if (inputs.effectiveOsmoticFactor > 0.8) {
    warnings.push({
      id: 'optimistic-fcp',
      severity: 'warning',
      title: 'Optimistic concentration-polarization factor (fCP)',
      detail: `fCP = ${inputs.effectiveOsmoticFactor.toFixed(2)} assumes low ICP/ECP losses. Real hollow-fiber or spiral-wound PRO modules require coupon testing to validate effective Δπ.`,
      relatedParam: 'effectiveOsmoticFactor',
    });
  }

  if (inputs.auxiliaryMode === 'single') {
    warnings.push({
      id: 'single-auxiliary-placeholder',
      severity: 'info',
      title: 'Lumped single-input auxiliary load active',
      detail:
        'Single auxiliary kW is a screening placeholder. Switch to Decomposed Auxiliary Loads or complete a full pump-loop hydraulic balance before design decisions.',
      relatedParam: 'proAuxiliaryLoad_kW',
    });
  }

  if (configuration === 'solar_pro_desal') {
    warnings.push({
      id: 'separate-thermal-accounting',
      severity: 'info',
      title: 'Thermal kWth accounted strictly separately from electric kWe',
      detail: `Useful solar heat (${solarUsefulHeat_kWth.toFixed(1)} kWth) is never added to electrical output (${netElectric_kWe.toFixed(1)} kWe). Instantaneous balance omits hourly irradiance and storage losses.`,
      relatedParam: 'solarCollectorArea_m2',
    });
  }

  if (configuration === 'ro_pro' && netElectric_kWe < 0) {
    warnings.push({
      id: 'ro-sec-penalty',
      severity: 'warning',
      title: 'Hybrid RO–PRO increases net plant SEC under current assumptions',
      detail: `Because net PRO output is negative (${netElectric_kWe.toFixed(1)} kWe), hybrid RO SEC rises from ${inputs.roBaselineSEC_kWh_m3.toFixed(2)} to ${roHybridSEC_kWh_m3.toFixed(2)} kWh/m³.`,
      relatedParam: 'roBaselineSEC_kWh_m3',
    });
  }

  return {
    modelVersion: 'screening-0.1',
    status: 'assumption-only',
    calculatedAt: new Date().toISOString(),
    feedOsmoticPressure_bar: feedPi,
    drawOsmoticPressure_bar: drawPi,
    bulkDeltaPi_bar: bulkDeltaPi,
    effectiveDeltaPi_bar: effectiveDeltaPi,
    optimalPressureApprox_bar: optimalPressureApprox,
    drivingPressure_bar: drivingPressure,
    waterFlux_LMH,
    permeateFlow_m3h,
    fluxClippedToZero,
    hydraulicPower_kW,
    powerDensity_W_m2,
    grossElectric_kWe,
    generatorLoss_kW,
    totalAuxiliary_kWe,
    netElectric_kWe,
    netPowerDensity_W_m2,
    netBalanceStatus,
    feedRecoveryRatio_pct,
    drawDilutionRatio_pct,
    roBaselineDemand_kWe,
    roHybridDemand_kWe,
    roHybridSEC_kWh_m3,
    roSecDelta_kWh_m3,
    roSecChange_pct,
    solarUsefulHeat_kWth,
    solarHeatCoverage_pct,
    solarBackupHeatNeeded_kWth,
    warnings,
  };
}

/**
 * Generates an operating pressure sweep curve from 0 bar up to 1.25 * effectiveDeltaPi
 * to visualize peak power density (~effDeltaPi / 2) and zero-flux collapse.
 */
export function generatePressureSweep(inputs: ProInputs, steps = 28): PressureSweepPoint[] {
  const base = calculateProModel(inputs, 'standalone');
  const maxP = Math.max(20, Math.ceil(Math.max(base.effectiveDeltaPi_bar * 1.25, inputs.operatingPressure_bar * 1.15)));
  const points: PressureSweepPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const p = Number(((maxP * i) / steps).toFixed(2));
    const res = calculateProModel({ ...inputs, operatingPressure_bar: p }, 'standalone');
    points.push({
      pressure_bar: p,
      flux_LMH: Number(res.waterFlux_LMH.toFixed(2)),
      hydraulicPower_kW: Number(res.hydraulicPower_kW.toFixed(2)),
      powerDensity_W_m2: Number(res.powerDensity_W_m2.toFixed(2)),
      grossElectric_kWe: Number(res.grossElectric_kWe.toFixed(2)),
      netElectric_kWe: Number(res.netElectric_kWe.toFixed(2)),
    });
  }
  return points;
}

export type SweepVariable = 'pressure' | 'area' | 'feedSalinity' | 'drawSalinity';

/**
 * Generates comparative scenarios across operating pressures, membrane areas,
 * or feed/draw salinity conditions for Module 3 (Scenario Comparison).
 */
export function generateSensitivitySweep(
  inputs: ProInputs,
  configuration: ConfigurationEnvelope,
  variable: SweepVariable
): SensitivityPoint[] {
  const base = calculateProModel(inputs, configuration);

  let values: number[] = [];
  let unit = '';

  switch (variable) {
    case 'pressure': {
      const refMax = Math.max(16, Math.round(base.effectiveDeltaPi_bar * 1.15));
      values = [0.2, 0.35, 0.5, 0.65, 0.85, 1.05].map((f) => Number((refMax * f).toFixed(1)));
      unit = 'bar';
      break;
    }
    case 'area': {
      values = [2500, 5000, 10000, 15000, 20000, 30000];
      unit = 'm²';
      break;
    }
    case 'feedSalinity': {
      values = [0.2, 0.5, 1.0, 2.5, 5.0, 10.0];
      unit = 'g/L';
      break;
    }
    case 'drawSalinity': {
      values = [25, 35, 45, 55, 65, 75];
      unit = 'g/L';
      break;
    }
  }

  return values.map((val) => {
    const modified: ProInputs = { ...inputs };
    if (variable === 'pressure') modified.operatingPressure_bar = val;
    if (variable === 'area') modified.membraneArea_m2 = val;
    if (variable === 'feedSalinity') modified.feedSalinity_gL = val;
    if (variable === 'drawSalinity') modified.drawSalinity_gL = val;

    const r = calculateProModel(modified, configuration);
    return {
      label: variable === 'area' ? `${(val / 1000).toFixed(1)}k ${unit}` : `${val} ${unit}`,
      paramValue: val,
      waterFlux_LMH: Number(r.waterFlux_LMH.toFixed(2)),
      grossElectric_kWe: Number(r.grossElectric_kWe.toFixed(2)),
      totalAuxiliary_kWe: Number(r.totalAuxiliary_kWe.toFixed(2)),
      netElectric_kWe: Number(r.netElectric_kWe.toFixed(2)),
      roHybridSEC_kWh_m3: Number(r.roHybridSEC_kWh_m3.toFixed(3)),
    };
  });
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: ProInputs;
}

const INPUT_BOUNDS: Record<
  Exclude<keyof ProInputs, 'auxiliaryMode'>,
  { min: number; max: number; label: string }
> = {
  feedSalinity_gL: { min: 0, max: 150, label: 'Feed salinity (g/L)' },
  drawSalinity_gL: { min: 0, max: 350, label: 'Draw salinity (g/L)' },
  temperature_C: { min: 5, max: 65, label: 'Temperature (°C)' },
  vantHoffFactor: { min: 1.0, max: 2.5, label: "van't Hoff factor" },
  feedFlow_m3h: { min: 1, max: 50000, label: 'Feed flow (m³/h)' },
  drawFlow_m3h: { min: 1, max: 50000, label: 'Draw flow (m³/h)' },
  operatingPressure_bar: { min: 0, max: 80, label: 'Operating pressure (bar)' },
  waterPermeability_LMH_bar: { min: 0.05, max: 10, label: 'Water permeability Aw (LMH/bar)' },
  membraneArea_m2: { min: 10, max: 250000, label: 'Membrane area (m²)' },
  effectiveOsmoticFactor: { min: 0.1, max: 1.0, label: 'Effective osmotic factor fCP' },
  turbineGeneratorEfficiency_pct: { min: 10, max: 98, label: 'Turbine-generator efficiency (%)' },
  proAuxiliaryLoad_kW: { min: 0, max: 5000, label: 'PRO auxiliary load (kW)' },
  auxFeedPump_kW: { min: 0, max: 2000, label: 'Feed pump auxiliary (kW)' },
  auxDrawCirculation_kW: { min: 0, max: 2000, label: 'Draw circulation auxiliary (kW)' },
  auxPretreatment_kW: { min: 0, max: 2000, label: 'Pretreatment auxiliary (kW)' },
  auxControlsCleaning_kW: { min: 0, max: 1000, label: 'Controls & cleaning auxiliary (kW)' },
  roProductFlow_m3h: { min: 1, max: 50000, label: 'RO product flow (m³/h)' },
  roBaselineSEC_kWh_m3: { min: 0.5, max: 12, label: 'RO baseline SEC (kWh/m³)' },
  solarCollectorArea_m2: { min: 0, max: 100000, label: 'Solar collector aperture (m²)' },
  solarIrradiance_kW_m2: { min: 0, max: 1.3, label: 'Solar irradiance (kW/m²)' },
  solarThermalEfficiency_pct: { min: 5, max: 90, label: 'Solar thermal efficiency (%)' },
  processHeatDemand_kWth: { min: 1, max: 50000, label: 'Process heat demand (kWth)' },
};

export function validateProInputs(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Request payload must be a JSON object.'] };
  }
  const obj = raw as Record<string, unknown>;
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  const auxMode = obj.auxiliaryMode === 'decomposed' ? 'decomposed' : 'single';
  sanitized.auxiliaryMode = auxMode;

  for (const [key, bounds] of Object.entries(INPUT_BOUNDS)) {
    const val = Number(obj[key]);
    if (!Number.isFinite(val)) {
      errors.push(`${bounds.label} must be a finite number.`);
    } else if (val < bounds.min || val > bounds.max) {
      errors.push(`${bounds.label} must be between ${bounds.min} and ${bounds.max}.`);
    } else {
      sanitized[key] = val;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    sanitized: sanitized as unknown as ProInputs,
  };
}
