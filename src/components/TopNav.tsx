import type { CoreModuleId } from '../engine/evidenceData.ts';

interface TopNavProps {
  activeModule: CoreModuleId;
  onSelectModule: (id: CoreModuleId) => void;
  onOpenJudgeDemo: () => void;
}

const NAV_ITEMS: { id: CoreModuleId; label: string }[] = [
  { id: 'calculator', label: 'PRO Calculator' },
  { id: 'energy', label: 'Energy Balance' },
  { id: 'scenarios', label: 'Scenario Comparison' },
  { id: 'assistant', label: 'AI Assistant' },
  { id: 'sites', label: 'Site Feasibility' },
];

export function TopNav({
  activeModule,
  onSelectModule,
  onOpenJudgeDemo,
}: TopNavProps) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#1E2D45] bg-[#080E1A]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectModule('calculator')}
          className="font-display text-lg font-bold tracking-tight text-slate-100 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
        >
          OSMOGEN
        </button>

        {/* Zone 2: Exact 5 Core Module Links (single-line typography) */}
        <nav
          aria-label="Core application modules"
          className="flex items-center gap-1 sm:gap-6 overflow-x-auto no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                className={`relative py-5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm px-2 sm:px-0.5 ${
                  active
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenJudgeDemo}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080E1A]"
          >
            Judge Demo
          </button>
        </div>
      </div>
    </header>
  );
}
