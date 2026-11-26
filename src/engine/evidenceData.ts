import type { ConfigurationEnvelope, ProInputs, ScenarioRecord } from './proModel.ts';

export const COASTAL_BASELINE_INPUTS: ProInputs = {
  feedSalinity_gL: 1.0,
  drawSalinity_gL: 35.0,
  temperature_C: 25,
  vantHoffFactor: 2.0,
  feedFlow_m3h: 450,
  drawFlow_m3h: 650,
  operatingPressure_bar: 10.0,
  waterPermeability_LMH_bar: 1.0,
  membraneArea_m2: 10000,
  effectiveOsmoticFactor: 0.65,
  turbineGeneratorEfficiency_pct: 85,
  auxiliaryMode: 'single',
  proAuxiliaryLoad_kW: 15,
  auxFeedPump_kW: 4.5,
  auxDrawCirculation_kW: 5.5,
  auxPretreatment_kW: 3.5,
  auxControlsCleaning_kW: 1.5,
  roProductFlow_m3h: 250,
  roBaselineSEC_kWh_m3: 3.2,
  solarCollectorArea_m2: 1200,
  solarIrradiance_kW_m2: 0.8,
  solarThermalEfficiency_pct: 55,
  processHeatDemand_kWth: 750,
};

export const DEFAULT_SCENARIOS: ScenarioRecord[] = [
  {
    id: 'preset-coastal-standalone',
    name: 'Coastal Baseline (Standalone PRO)',
    description:
      'Illustrative river/estuary feed (1 g/L) paired with coastal seawater draw (35 g/L) under moderate fCP derating. Research baseline.',
    configuration: 'standalone',
    provenance: 'illustrative-preset',
    inputs: { ...COASTAL_BASELINE_INPUTS },
    createdAt: '2026-11-26T00:00:00.000Z',
  },
  {
    id: 'preset-ro-pro-brine',
    name: 'SWRO Brine Hybrid (RO–PRO)',
    description:
      'Primary commercial hypothesis: concentrated SWRO reject brine (65 g/L) paired with treated low-salinity wastewater feed (1.5 g/L) to offset RO SEC.',
    configuration: 'ro_pro',
    provenance: 'illustrative-preset',
    inputs: {
      ...COASTAL_BASELINE_INPUTS,
      feedSalinity_gL: 1.5,
      drawSalinity_gL: 65.0,
      temperature_C: 28,
      feedFlow_m3h: 600,
      drawFlow_m3h: 700,
      operatingPressure_bar: 17.0,
      waterPermeability_LMH_bar: 1.2,
      membraneArea_m2: 12000,
      effectiveOsmoticFactor: 0.62,
      turbineGeneratorEfficiency_pct: 85,
      auxiliaryMode: 'decomposed',
      proAuxiliaryLoad_kW: 26,
      auxFeedPump_kW: 7.0,
      auxDrawCirculation_kW: 9.0,
      auxPretreatment_kW: 7.5,
      auxControlsCleaning_kW: 2.5,
      roProductFlow_m3h: 300,
      roBaselineSEC_kWh_m3: 3.1,
    },
    createdAt: '2026-11-26T00:00:00.000Z',
  },
  {
    id: 'preset-solar-pro-desal',
    name: 'PRO + Solar Thermal Desalination',
    description:
      'Longer-term integrated envelope: PRO electrical contribution (kWe) paired with solar-thermal collector loop (kWth, accounted separately).',
    configuration: 'solar_pro_desal',
    provenance: 'illustrative-preset',
    inputs: {
      ...COASTAL_BASELINE_INPUTS,
      feedSalinity_gL: 1.2,
      drawSalinity_gL: 58.0,
      temperature_C: 30,
      operatingPressure_bar: 15.0,
      waterPermeability_LMH_bar: 1.1,
      membraneArea_m2: 10000,
      effectiveOsmoticFactor: 0.6,
      proAuxiliaryLoad_kW: 22,
      solarCollectorArea_m2: 1800,
      solarIrradiance_kW_m2: 0.85,
      solarThermalEfficiency_pct: 58,
      processHeatDemand_kWth: 1100,
    },
    createdAt: '2026-11-26T00:00:00.000Z',
  },
  {
    id: 'preset-low-gradient-stress',
    name: 'Brackish Low-Gradient Stress Test',
    description:
      'Illustrates negative net electrical balance when brackish feed (4 g/L) and modest seawater draw (32 g/L) face realistic auxiliary loads.',
    configuration: 'standalone',
    provenance: 'illustrative-preset',
    inputs: {
      ...COASTAL_BASELINE_INPUTS,
      feedSalinity_gL: 4.0,
      drawSalinity_gL: 32.0,
      temperature_C: 24,
      operatingPressure_bar: 8.0,
      waterPermeability_LMH_bar: 0.85,
      membraneArea_m2: 8000,
      effectiveOsmoticFactor: 0.55,
      proAuxiliaryLoad_kW: 18,
    },
    createdAt: '2026-11-26T00:00:00.000Z',
  },
];

export interface EvidencePaper {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi: string;
  claimSupported: string;
  statedLimitation: string;
}

export const EVIDENCE_PAPERS: EvidencePaper[] = [
  {
    id: 'ref-1',
    authors: 'Liang, Y.Y. et al.',
    year: 2026,
    title: 'Pressure retarded osmosis revisited: Why high power density does not guarantee net energy production?',
    journal: 'Chemical Engineering Research and Design',
    doi: '10.1016/j.cherd.2026.05.018',
    claimSupported:
      'Membrane-level power density (W/m²) can strongly overstate plant-level net power once ICP/ECP, dilution, pressure drop, and auxiliaries are accounted for.',
    statedLimitation:
      'System boundaries vary across published studies; full-scale metered plant datasets remain scarce.',
  },
  {
    id: 'ref-2',
    authors: 'Renewable Energy Study',
    year: 2026,
    title: 'Optimization of energy extraction from salinity gradient using full-scale pressure retarded osmosis systems with hollow fiber membrane modules',
    journal: 'Renewable Energy',
    doi: '10.1016/j.renene.2025.124344',
    claimSupported:
      'System optimization must explicitly incorporate pump efficiency and energy-recovery devices (ERDs) alongside membrane module hydraulics.',
    statedLimitation:
      'Modelled optimization study; authors explicitly note experimental comparison is still required.',
  },
  {
    id: 'ref-3',
    authors: 'Water Research Study',
    year: 2025,
    title: 'Design and optimization of hybrid seawater reverse osmosis–solar-driven desalination–pressure retarded osmosis system for energy efficient desalination maximizing economic potential',
    journal: 'Water Research',
    doi: '10.1016/j.watres.2024.123066',
    claimSupported:
      'Provides design rationale for evaluating integrated SWRO + solar desalination + PRO pathways under shared water-energy infrastructure.',
    statedLimitation:
      'Economic potential depends heavily on site-specific electricity tariffs, brine availability, and capital cost assumptions.',
  },
  {
    id: 'ref-4',
    authors: 'Materials Review',
    year: 2025,
    title: 'Integration of Membrane-Based Pretreatment Methods with Pressure-Retarded Osmosis for Performance Enhancement: A Review',
    journal: 'Materials',
    doi: '10.3390/ma18051020',
    claimSupported:
      'Feed and draw water pretreatment directly governs fouling trajectory, cleaning frequency, and sustained membrane flux.',
    statedLimitation:
      'Pretreatment reduces fouling but introduces incremental auxiliary electrical load and CAPEX that must stay inside the net energy boundary.',
  },
  {
    id: 'ref-5',
    authors: 'Desalination Review',
    year: 2023,
    title: 'Review of analytical and numerical modeling for pressure retarded osmosis membrane systems',
    journal: 'Desalination',
    doi: '10.1016/j.desal.2023.116655',
    claimSupported:
      'Documents progression from lumped van’t Hoff screening models to coupled ICP/ECP, reverse salt flux, and axially discretized numerical models.',
    statedLimitation:
      'Analytical screening approximations lose accuracy at elevated ionic strengths and high recovery ratios.',
  },
  {
    id: 'ref-6',
    authors: 'Foundational PRO Study',
    year: 2014,
    title: 'Theoretical and Experimental Investigations of the Potential of Osmotic Energy for Power Production',
    journal: 'Membranes',
    doi: 'Foundational flux & power equations (Membranes, 2014)',
    claimSupported:
      'Establishes foundational forward water flux Jw = Aw(Δπ_eff − ΔP) and hydraulic power density W = Jw · ΔP relationships.',
    statedLimitation:
      'Coupon-scale experimental results cannot be linearly extrapolated to full-scale multi-element trains without pressure-drop and dilution modeling.',
  },
];

export const MODEL_LIMITATIONS: string[] = [
  'Non-ideal osmotic activity coefficients and multicomponent ion chemistry (NaCl-equivalent van’t Hoff only).',
  'Spatial internal concentration polarization (ICP), external concentration polarization (ECP), and reverse salt flux (Js).',
  'Axial dilution of draw solution, axial concentration of feed stream, and coupled element-by-element mass balances.',
  'Module feed/draw channel pressure drops and spacer geometry losses.',
  'Stream flow-split optimization, finite stream availability, and pressure exchanger (PX) mixing/leakage hydraulics.',
  'Real pump curves, NPSH margins, turbine efficiency maps, and part-load turndown behavior.',
  'Membrane fouling, inorganic scaling, biofouling kinetics, chemical cleaning cycles, and membrane replacement lifetime.',
  'Start-up/shutdown transients, tidal or seasonal salinity swings, and plant availability/uptime.',
  'Site-specific brine discharge dispersion, ecological limits, water rights, and coastal permitting constraints.',
  'CAPEX, OPEX, financing, membrane replacement cost, and levelized cost of energy/water (LCOE / LCOW).',
];

export interface ValidationGate {
  gate: number;
  stage: string;
  timing: string;
  objective: string;
  exitCriteria: string;
  currentStatus: 'In Progress' | 'Planned';
}

export const VALIDATION_GATES: ValidationGate[] = [
  {
    gate: 1,
    stage: 'Unit-Tested Deterministic Screening Model',
    timing: 'Months 1–3 (Current)',
    objective: 'Independently verify first-order PRO equations, boundary checks, and transparent assumption tracking.',
    exitCriteria: 'Deterministic equations reproduced with unit checks, explicit warnings, and traceable parameter provenance.',
    currentStatus: 'In Progress',
  },
  {
    gate: 2,
    stage: 'Higher-Fidelity Calibration Against Literature',
    timing: 'Weeks 2–4',
    objective: 'Add chemistry-aware osmotic activity, ICP/ECP, reverse salt flux, axial discretization, and component efficiency maps.',
    exitCriteria: 'Reproduce at least one published peer-reviewed PRO experimental dataset within stated error tolerance.',
    currentStatus: 'Planned',
  },
  {
    gate: 3,
    stage: 'Controlled Laboratory Membrane-Coupon Testing',
    timing: 'Months 2–6',
    objective: 'Measure water flux, reverse salt flux, and fouling recovery across controlled salinity, pressure, and temperature matrices.',
    exitCriteria: 'Reproducible coupon flux/salt-leakage dataset with calibrated instrumentation and hazard review.',
    currentStatus: 'Planned',
  },
  {
    gate: 4,
    stage: 'Module / Skid Hydraulic & Electrical Metering',
    timing: 'Months 5–9',
    objective: 'Test full module pressure drop, pressure exchanger recovery, and metered pump/ancillary electrical demand.',
    exitCriteria: 'Transparent net-energy balance measured across complete skid boundary under safe operating envelope.',
    currentStatus: 'Planned',
  },
  {
    gate: 5,
    stage: 'Site-Specific Techno-Economic & Environmental Assessment',
    timing: 'Months 6–14',
    objective: 'Select one Indian host facility with verified water chemistry, regulatory pathway, HAZID, and lifecycle cost case.',
    exitCriteria: 'Positive or value-creating net-energy & economic case verified before any pilot procurement.',
    currentStatus: 'Planned',
  },
];

export interface TechnicalRiskItem {
  risk: string;
  consequence: string;
  mitigation: string;
}

export const TECHNICAL_RISKS: TechnicalRiskItem[] = [
  {
    risk: 'ICP / ECP and reverse salt flux',
    consequence: 'Effective driving pressure and flux fall well below ideal bulk van’t Hoff predictions.',
    mitigation: 'Adopt coupled transport model and validate on real PRO membrane coupons.',
  },
  {
    risk: 'Fouling and inorganic scaling',
    consequence: 'Rapid flux decline, higher cleaning chemical burden, and reduced uptime.',
    mitigation: 'Water chemistry characterization (SDI, turbidity, organics), pretreatment trials, and cleaning protocols.',
  },
  {
    risk: 'Hydraulic channel pressure losses',
    consequence: 'Erodes recoverable shaft work and lowers net electrical output.',
    mitigation: 'Optimize spacer/module geometry, add differential pressure taps, and model loop hydraulics.',
  },
  {
    risk: 'Underestimated auxiliary energy',
    consequence: 'Produces false-positive net energy claims at concept stage.',
    mitigation: 'Decompose and meter every pump, pretreatment, cleaning, and control load inside the plant boundary.',
  },
  {
    risk: 'RO–PRO stream mismatch',
    consequence: 'Suboptimal hybrid performance or disruption to SWRO recovery and product quality.',
    mitigation: 'Site mass-balance and temporal flow-matching study holding RO product specification constant.',
  },
  {
    risk: 'Solar thermal intermittency',
    consequence: 'Unmet thermal desalination duty during cloud cover or night operation.',
    mitigation: 'Hourly irradiance profiles, thermal storage sizing, hybrid backup heat, and separate LCOH accounting.',
  },
  {
    risk: 'Brine and outfall discharge impacts',
    consequence: 'Environmental compliance delays or permitting rejection.',
    mitigation: 'Early discharge water-quality modeling, environmental impact review, and CRZ/SPCB permit assessment.',
  },
  {
    risk: 'Scale-up & membrane durability',
    consequence: 'Excessive CAPEX and membrane replacement cost under cyclic pressure.',
    mitigation: 'Staged coupon → module → bounded skid testing with explicit Go/No-Go gates.',
  },
];

export interface SiteCriterion {
  id: string;
  name: string;
  shortName: string;
  description: string;
  defaultWeight: number;
}

export const SITE_CRITERIA: SiteCriterion[] = [
  {
    id: 'stream_match',
    name: 'Stream Availability & Temporal Match',
    shortName: 'Stream Match',
    description: 'Continuous availability and matched flow volumes of both low-salinity feed and high-salinity draw streams.',
    defaultWeight: 18,
  },
  {
    id: 'salinity_gradient',
    name: 'Salinity / Composition Gradient & Temp',
    shortName: 'Salinity Δ',
    description: 'Actual osmotic pressure difference, ionic composition, and ambient water temperature.',
    defaultWeight: 16,
  },
  {
    id: 'ro_proximity',
    name: 'Proximity to RO / Industrial Water Plant',
    shortName: 'RO Proximity',
    description: 'Co-location with an existing SWRO desalination or industrial water facility for shared intake/brine access.',
    defaultWeight: 15,
  },
  {
    id: 'pretreatment_burden',
    name: 'Low Pretreatment & Fouling Burden',
    shortName: 'Water Quality',
    description: 'Lower suspended solids, organics, turbidity, biofouling, and scaling burden (higher score = cleaner stream).',
    defaultWeight: 12,
  },
  {
    id: 'grid_value',
    name: 'Grid Connection & Energy Value',
    shortName: 'Energy Value',
    description: 'Industrial tariff offset value and ease of integrating recovered electricity into host plant loads.',
    defaultWeight: 10,
  },
  {
    id: 'intake_outfall',
    name: 'Intake / Outfall & Ecological Feasibility',
    shortName: 'Outfall Path',
    description: 'Feasible intake/outfall routing and acceptable blended brine discharge impact.',
    defaultWeight: 9,
  },
  {
    id: 'land_corrosion',
    name: 'Land, Access, Corrosion & Supply Chain',
    shortName: 'Site Infra',
    description: 'Available footprint, industrial access, corrosion management, and local O&M support.',
    defaultWeight: 7,
  },
  {
    id: 'permitting',
    name: 'Water Rights & Regulatory Permitting',
    shortName: 'Permitting',
    description: 'Clarity of coastal, discharge, and water-abstraction permissions and community alignment.',
    defaultWeight: 7,
  },
  {
    id: 'solar_thermal',
    name: 'Solar Thermal Suitability (Optional Envelope)',
    shortName: 'Solar Duty',
    description: 'Direct solar irradiance, available collector area, and compatibility with thermal desalination duty.',
    defaultWeight: 6,
  },
];

export interface SiteCandidate {
  id: string;
  name: string;
  region: string;
  archetype: 'Coastal Estuary' | 'Desalination Hybrid' | 'Industrial Coastal';
  statusLabel: string;
  notes: string;
  illustrativeChemistry: {
    feedSalinity_gL: number;
    drawSalinity_gL: number;
    temperature_C: number;
    suggestedEnvelope: ConfigurationEnvelope;
  };
  scores: Record<string, number>; // 1 to 5
}

export const DEFAULT_SITES: SiteCandidate[] = [
  {
    id: 'site-dahej',
    name: 'Dahej / Dahej Estuary (Candidate Study Area)',
    region: 'Gujarat, India',
    archetype: 'Industrial Coastal',
    statusLabel: 'Unranked Candidate · Hypothetical Screening',
    notes:
      'Founder-identified candidate study area with major industrial water corridors and coastal salinity gradients. Requires site-specific suspended solids (estuarine silt), seasonal tidal chemistry, and host-facility brine verification before ranking.',
    illustrativeChemistry: {
      feedSalinity_gL: 1.5,
      drawSalinity_gL: 48.0,
      temperature_C: 29,
      suggestedEnvelope: 'ro_pro',
    },
    scores: {
      stream_match: 3,
      salinity_gradient: 4,
      ro_proximity: 4,
      pretreatment_burden: 2,
      grid_value: 4,
      intake_outfall: 3,
      land_corrosion: 4,
      permitting: 3,
      solar_thermal: 4,
    },
  },
  {
    id: 'site-vizag',
    name: 'Visakhapatnam / Vizag (Candidate Study Area)',
    region: 'Andhra Pradesh, India',
    archetype: 'Coastal Estuary',
    statusLabel: 'Unranked Candidate · Hypothetical Screening',
    notes:
      'Founder-identified eastern coastal industrial corridor with marine water access and industrial effluent streams. Retained strictly as an unranked hypothesis pending measured water chemistry, intake routing, and regulatory assessment.',
    illustrativeChemistry: {
      feedSalinity_gL: 1.0,
      drawSalinity_gL: 35.0,
      temperature_C: 28,
      suggestedEnvelope: 'standalone',
    },
    scores: {
      stream_match: 3,
      salinity_gradient: 3,
      ro_proximity: 3,
      pretreatment_burden: 3,
      grid_value: 4,
      intake_outfall: 3,
      land_corrosion: 4,
      permitting: 3,
      solar_thermal: 4,
    },
  },
  {
    id: 'site-hypothetical-swro',
    name: 'Hypothetical Co-Located SWRO Desalination Host',
    region: 'Generic Indian Coastal SWRO Reference',
    archetype: 'Desalination Hybrid',
    statusLabel: 'Hypothetical Archetype · Assumption-Only',
    notes:
      'Illustrative benchmark representing an existing SWRO plant supplying high-salinity reject brine (~65 g/L) co-located with treated municipal/industrial secondary effluent (~1.2 g/L). Tests primary commercial RO–PRO hypothesis.',
    illustrativeChemistry: {
      feedSalinity_gL: 1.2,
      drawSalinity_gL: 65.0,
      temperature_C: 28,
      suggestedEnvelope: 'ro_pro',
    },
    scores: {
      stream_match: 4,
      salinity_gradient: 5,
      ro_proximity: 5,
      pretreatment_burden: 4,
      grid_value: 4,
      intake_outfall: 4,
      land_corrosion: 3,
      permitting: 3,
      solar_thermal: 3,
    },
  },
];

export type CoreModuleId =
  | 'calculator'
  | 'energy'
  | 'scenarios'
  | 'assistant'
  | 'sites';

export interface JudgeDemoStep {
  step: number;
  title: string;
  durationSec: string;
  talkTrack: string;
  targetModule: CoreModuleId;
  targetEnvelope: ConfigurationEnvelope;
  inputOverrides: Partial<ProInputs>;
}

export const JUDGE_DEMO_STEPS: JudgeDemoStep[] = [
  {
    step: 1,
    title: 'Open Coastal Baseline Preset',
    durationSec: '0:00 – 0:15',
    talkTrack:
      'State clearly that inputs are illustrative assumptions (1 g/L feed, 35 g/L seawater draw, 25 °C), not measured site or vendor data.',
    targetModule: 'calculator',
    targetEnvelope: 'standalone',
    inputOverrides: { ...COASTAL_BASELINE_INPUTS },
  },
  {
    step: 2,
    title: 'Inspect Bulk Δπ vs Effective Δπ & Flux',
    durationSec: '0:15 – 0:35',
    talkTrack:
      'Point to Bulk Δπ (~28.8 bar), Effective Δπ (~18.7 bar at fCP = 0.65), and resulting water flux. Explain that fCP is a screening derating placeholder for ICP/ECP losses.',
    targetModule: 'calculator',
    targetEnvelope: 'standalone',
    inputOverrides: { ...COASTAL_BASELINE_INPUTS },
  },
  {
    step: 3,
    title: 'Standalone PRO Net Energy Boundary',
    durationSec: '0:35 – 0:55',
    talkTrack:
      'Switch to Energy Balance Engine. Trace Gross Hydraulic → Generator Electric → Auxiliary Load, explaining why plant-level net output can become small or negative even when membrane power density looks positive.',
    targetModule: 'energy',
    targetEnvelope: 'standalone',
    inputOverrides: {
      ...COASTAL_BASELINE_INPUTS,
      auxiliaryMode: 'decomposed',
      auxFeedPump_kW: 6.5,
      auxDrawCirculation_kW: 7.5,
      auxPretreatment_kW: 5.5,
      auxControlsCleaning_kW: 2.5,
    },
  },
  {
    step: 4,
    title: 'RO–PRO Hybrid Commercial Hypothesis',
    durationSec: '0:55 – 1:15',
    talkTrack:
      'Load high-salinity SWRO brine (65 g/L) at 17 bar. Show how net PRO electric recovery offsets assumed baseline RO SEC while keeping product water flow constant.',
    targetModule: 'energy',
    targetEnvelope: 'ro_pro',
    inputOverrides: {
      ...DEFAULT_SCENARIOS[1].inputs,
    },
  },
  {
    step: 5,
    title: 'Solar Thermal + PRO (Separate kWth)',
    durationSec: '1:15 – 1:35',
    talkTrack:
      'Show useful solar heat (kWth) and thermal duty coverage strictly separated from electrical kWe—zero solar-to-electric mixing.',
    targetModule: 'energy',
    targetEnvelope: 'solar_pro_desal',
    inputOverrides: {
      ...DEFAULT_SCENARIOS[2].inputs,
    },
  },
  {
    step: 6,
    title: 'Over-Pressure Zero-Flux Collapse Test',
    durationSec: '1:35 – 1:50',
    talkTrack:
      'Raise applied hydraulic pressure ΔP to 22 bar (above effective Δπ = 18.7 bar) and watch forward flux clip to 0 LMH while auxiliary loads drive net power negative. Illustrates why operating point matters.',
    targetModule: 'calculator',
    targetEnvelope: 'standalone',
    inputOverrides: {
      ...COASTAL_BASELINE_INPUTS,
      operatingPressure_bar: 22.0,
    },
  },
  {
    step: 7,
    title: 'AI Engineering Audit & Next Validation Gate',
    durationSec: '1:50 – 2:00',
    talkTrack:
      'Close in the guarded AI Assistant: show how Gemini reviews deterministic outputs without fabricating numbers and recommends Gate 2–3 calibration and laboratory coupon validation.',
    targetModule: 'assistant',
    targetEnvelope: 'ro_pro',
    inputOverrides: {
      ...DEFAULT_SCENARIOS[1].inputs,
    },
  },
];
