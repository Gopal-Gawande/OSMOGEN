import { useEffect, useMemo, useState } from 'react';
import {
  calculateProModel,
  validateProInputs,
  type ConfigurationEnvelope,
  type ProInputs,
  type ScenarioRecord,
  type SweepVariable,
} from './engine/proModel.ts';
import {
  COASTAL_BASELINE_INPUTS,
  DEFAULT_SCENARIOS,
  DEFAULT_SITES,
  type CoreModuleId,
  type JudgeDemoStep,
  type SiteCandidate,
} from './engine/evidenceData.ts';
import { TopNav } from './components/TopNav.tsx';
import { ProCalculatorView } from './components/ProCalculatorView.tsx';
import { EnergyBalanceView } from './components/EnergyBalanceView.tsx';
import { ScenarioComparisonView } from './components/ScenarioComparisonView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { SiteFeasibilityView } from './components/SiteFeasibilityView.tsx';
import { JudgeDemoDrawer } from './components/JudgeDemoDrawer.tsx';
import { PrintableReport } from './components/PrintableReport.tsx';

const SCENARIOS_STORAGE_KEY = 'osmogen_scenarios_v1';
const SITES_STORAGE_KEY = 'osmogen_sites_v1';

function loadStoredScenarios(): ScenarioRecord[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (!raw) return DEFAULT_SCENARIOS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SCENARIOS;
  } catch {
    return DEFAULT_SCENARIOS;
  }
}

function loadStoredSites(): SiteCandidate[] {
  try {
    const raw = localStorage.getItem(SITES_STORAGE_KEY);
    if (!raw) return DEFAULT_SITES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SITES;
  } catch {
    return DEFAULT_SITES;
  }
}

export default function App() {
  const [activeModule, setActiveModule] = useState<CoreModuleId>('calculator');
  const [configuration, setConfiguration] = useState<ConfigurationEnvelope>('standalone');
  const [inputs, setInputs] = useState<ProInputs>({ ...COASTAL_BASELINE_INPUTS });
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>(loadStoredScenarios);
  const [sites, setSites] = useState<SiteCandidate[]>(loadStoredSites);
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [activeDemoStep, setActiveDemoStep] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const results = useMemo(
    () => calculateProModel(inputs, configuration),
    [inputs, configuration]
  );

  useEffect(() => {
    try {
      localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [scenarios]);

  useEffect(() => {
    try {
      localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [sites]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const handleUpdateInput = <K extends keyof ProInputs>(key: K, value: ProInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetBaseline = () => {
    setConfiguration('standalone');
    setInputs({ ...COASTAL_BASELINE_INPUTS });
    setActiveDemoStep(null);
    showToast('Reset to Coastal Baseline illustrative preset.');
  };

  const handleSaveScenario = (name: string, description: string) => {
    const newRecord: ScenarioRecord = {
      id: `user-${Date.now()}`,
      name,
      description:
        description ||
        `User scenario (${inputs.feedSalinity_gL}→${inputs.drawSalinity_gL} g/L, ΔP ${inputs.operatingPressure_bar} bar).`,
      configuration,
      provenance: 'user-entered',
      inputs: { ...inputs },
      createdAt: new Date().toISOString(),
    };
    setScenarios((prev) => [newRecord, ...prev]);
    showToast(`Saved scenario "${name}" to local workspace.`);
  };

  const handleLoadScenario = (scenario: ScenarioRecord) => {
    setConfiguration(scenario.configuration);
    setInputs({ ...scenario.inputs });
    setActiveModule('calculator');
    showToast(`Loaded "${scenario.name}" into PRO Calculator.`);
  };

  const handleDuplicateScenario = (scenario: ScenarioRecord) => {
    const copy: ScenarioRecord = {
      ...scenario,
      id: `dup-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      provenance: 'user-entered',
      inputs: { ...scenario.inputs },
      createdAt: new Date().toISOString(),
    };
    setScenarios((prev) => [copy, ...prev]);
    showToast(`Duplicated "${scenario.name}".`);
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    showToast('Removed scenario from local workspace.');
  };

  const handleResetDefaultScenarios = () => {
    setScenarios(DEFAULT_SCENARIOS);
    showToast('Restored default illustrative scenarios.');
  };

  const handleApplySweepPoint = (variable: SweepVariable, value: number) => {
    setInputs((prev) => {
      const next = { ...prev };
      if (variable === 'pressure') next.operatingPressure_bar = value;
      if (variable === 'area') next.membraneArea_m2 = value;
      if (variable === 'feedSalinity') next.feedSalinity_gL = value;
      if (variable === 'drawSalinity') next.drawSalinity_gL = value;
      return next;
    });
    setActiveModule('calculator');
    showToast(`Applied ${variable} = ${value} to active PRO Calculator.`);
  };

  const handleUpdateSiteScore = (siteId: string, criterionId: string, score: number) => {
    setSites((prev) =>
      prev.map((site) =>
        site.id === siteId
          ? { ...site, scores: { ...site.scores, [criterionId]: score } }
          : site
      )
    );
  };

  const handleAddCustomSite = (site: SiteCandidate) => {
    setSites((prev) => [...prev, site]);
    showToast(`Added hypothetical site "${site.name}".`);
  };

  const handleDeleteSite = (siteId: string) => {
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    showToast('Removed custom site candidate.');
  };

  const handleResetSites = () => {
    setSites(DEFAULT_SITES);
    showToast('Restored default India-first site candidates.');
  };

  const handleApplySiteChemistry = (site: SiteCandidate) => {
    setConfiguration(site.illustrativeChemistry.suggestedEnvelope);
    setInputs((prev) => ({
      ...prev,
      feedSalinity_gL: site.illustrativeChemistry.feedSalinity_gL,
      drawSalinity_gL: site.illustrativeChemistry.drawSalinity_gL,
      temperature_C: site.illustrativeChemistry.temperature_C,
    }));
    setActiveModule('calculator');
    showToast(`Loaded illustrative chemistry from "${site.name.split('(')[0].trim()}".`);
  };

  const handleRunDemoStep = (step: JudgeDemoStep) => {
    setActiveDemoStep(step.step);
    setConfiguration(step.targetEnvelope);
    setInputs((prev) => ({ ...prev, ...step.inputOverrides }));
    setActiveModule(step.targetModule);
    setDemoDrawerOpen(false);
    showToast(`Judge Demo Step ${step.step}: ${step.title}`);
  };

  const handleImportJsonRun = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      const validation = validateProInputs(parsed?.inputs ?? parsed);
      if (!validation.valid || !validation.sanitized) {
        showToast(`Import failed: ${validation.errors[0] || 'Invalid input schema.'}`);
        return;
      }
      if (
        parsed?.configuration === 'standalone' ||
        parsed?.configuration === 'ro_pro' ||
        parsed?.configuration === 'solar_pro_desal'
      ) {
        setConfiguration(parsed.configuration);
      }
      setInputs(validation.sanitized);
      setDemoDrawerOpen(false);
      setActiveModule('calculator');
      showToast('Imported validated JSON run snapshot.');
    } catch {
      showToast('Import failed: file is not valid JSON.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100 flex flex-col">
      <TopNav
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenJudgeDemo={() => setDemoDrawerOpen(true)}
      />

      <main className="no-print mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {activeModule === 'calculator' && (
          <ProCalculatorView
            configuration={configuration}
            onChangeConfiguration={setConfiguration}
            inputs={inputs}
            results={results}
            onUpdateInput={handleUpdateInput}
            onResetBaseline={handleResetBaseline}
            onSaveScenario={handleSaveScenario}
            onJumpToEnergy={() => setActiveModule('energy')}
          />
        )}

        {activeModule === 'energy' && (
          <EnergyBalanceView
            configuration={configuration}
            onChangeConfiguration={setConfiguration}
            inputs={inputs}
            results={results}
            onJumpToCalculator={() => setActiveModule('calculator')}
            onJumpToAssistant={() => setActiveModule('assistant')}
          />
        )}

        {activeModule === 'scenarios' && (
          <ScenarioComparisonView
            activeConfiguration={configuration}
            activeInputs={inputs}
            scenarios={scenarios}
            onSaveCurrentScenario={handleSaveScenario}
            onLoadScenario={handleLoadScenario}
            onDuplicateScenario={handleDuplicateScenario}
            onDeleteScenario={handleDeleteScenario}
            onResetDefaultScenarios={handleResetDefaultScenarios}
            onApplySweepPoint={handleApplySweepPoint}
          />
        )}

        {activeModule === 'assistant' && (
          <AiAssistantView
            configuration={configuration}
            inputs={inputs}
            results={results}
          />
        )}

        {activeModule === 'sites' && (
          <SiteFeasibilityView
            sites={sites}
            onUpdateSiteScore={handleUpdateSiteScore}
            onAddCustomSite={handleAddCustomSite}
            onDeleteSite={handleDeleteSite}
            onResetSites={handleResetSites}
            onApplySiteChemistry={handleApplySiteChemistry}
          />
        )}
      </main>

      <footer className="no-print border-t border-[#1E2D45] bg-[#080E1A] py-4">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 text-xs text-slate-500">
          <p>
            OSMOGEN Intelligence · PRO Feasibility Lab · Concept & research stage — modelled / illustrative screening tool only.
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            screening-0.1 · Electric kWe & Thermal kWth strictly separated
          </p>
        </div>
      </footer>

      <JudgeDemoDrawer
        open={demoDrawerOpen}
        onClose={() => setDemoDrawerOpen(false)}
        activeDemoStep={activeDemoStep}
        onRunDemoStep={handleRunDemoStep}
        configuration={configuration}
        inputs={inputs}
        results={results}
        onImportJsonRun={handleImportJsonRun}
      />

      <PrintableReport
        configuration={configuration}
        inputs={inputs}
        results={results}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 rounded-lg border border-cyan-500/40 bg-[#0F1829] px-4 py-2.5 text-xs font-medium text-cyan-200 shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
