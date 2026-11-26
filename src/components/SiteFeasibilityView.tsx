import { useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ArrowUpRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  SITE_CRITERIA,
  type SiteCandidate,
} from '../engine/evidenceData.ts';
import type { ConfigurationEnvelope } from '../engine/proModel.ts';

interface SiteFeasibilityViewProps {
  sites: SiteCandidate[];
  onUpdateSiteScore: (siteId: string, criterionId: string, score: number) => void;
  onAddCustomSite: (site: SiteCandidate) => void;
  onDeleteSite: (siteId: string) => void;
  onResetSites: () => void;
  onApplySiteChemistry: (site: SiteCandidate) => void;
}

const RADAR_COLORS = ['#06B6D4', '#10B981', '#F59E0B'];

export function SiteFeasibilityView({
  sites,
  onUpdateSiteScore,
  onAddCustomSite,
  onDeleteSite,
  onResetSites,
  onApplySiteChemistry,
}: SiteFeasibilityViewProps) {
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(SITE_CRITERIA.map((c) => [c.id, c.defaultWeight]))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newArchetype, setNewArchetype] = useState<SiteCandidate['archetype']>('Desalination Hybrid');
  const [newFeedSalinity, setNewFeedSalinity] = useState(1.2);
  const [newDrawSalinity, setNewDrawSalinity] = useState(60);
  const [newTemp, setNewTemp] = useState(28);
  const [newEnvelope, setNewEnvelope] = useState<ConfigurationEnvelope>('ro_pro');

  const totalWeight = useMemo(
    () => Object.values(weights).reduce((acc, w) => acc + w, 0),
    [weights]
  );

  const siteWeightedScores = useMemo(() => {
    return sites.map((site) => {
      if (totalWeight <= 0) return { site, weightedPct: 0 };
      const sum = SITE_CRITERIA.reduce((acc, c) => {
        const s = site.scores[c.id] ?? 3;
        const w = weights[c.id] ?? 0;
        return acc + (s / 5) * w;
      }, 0);
      return {
        site,
        weightedPct: (sum / totalWeight) * 100,
      };
    });
  }, [sites, weights, totalWeight]);

  const radarSites = sites.slice(0, 3);

  const radarData = useMemo(() => {
    return SITE_CRITERIA.map((criterion) => {
      const point: Record<string, string | number> = {
        criterion: criterion.shortName,
      };
      radarSites.forEach((site, idx) => {
        point[`site_${idx}`] = site.scores[criterion.id] ?? 3;
      });
      return point;
    });
  }, [radarSites]);

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const defaultScores = Object.fromEntries(SITE_CRITERIA.map((c) => [c.id, 3]));
    const custom: SiteCandidate = {
      id: `site-custom-${Date.now()}`,
      name: newName.trim(),
      region: newRegion.trim() || 'Hypothetical Region',
      archetype: newArchetype,
      statusLabel: 'User Hypothetical Scenario · Unvalidated',
      notes: 'User-created hypothetical coastal or desalination screening scenario.',
      illustrativeChemistry: {
        feedSalinity_gL: newFeedSalinity,
        drawSalinity_gL: newDrawSalinity,
        temperature_C: newTemp,
        suggestedEnvelope: newEnvelope,
      },
      scores: defaultScores,
    };
    onAddCustomSite(custom);
    setNewName('');
    setNewRegion('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#1E2D45] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Module 5 · India-First Screening Framework · Unranked Candidate Study Areas Only
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Site Feasibility Screening
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Compare hypothetical coastal estuary and co-located SWRO desalination scenarios across 9 engineering, environmental, and infrastructure criteria. Do not select a site because it is coastal alone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetSites}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2D45] bg-[#0F1829] px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Candidates
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Hypothetical Site
          </button>
        </div>
      </div>

      {/* Add Custom Site Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateSite}
          className="rounded-xl border border-cyan-500/40 bg-[#0F1829] p-5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
        >
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-300">Scenario / Site Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Chennai SWRO Brine Integration"
              className="w-full rounded-lg border border-[#1E2D45] bg-[#080E1A] px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Region</label>
            <input
              type="text"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="Tamil Nadu, India"
              className="w-full rounded-lg border border-[#1E2D45] bg-[#080E1A] px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Archetype</label>
            <select
              value={newArchetype}
              onChange={(e) => setNewArchetype(e.target.value as SiteCandidate['archetype'])}
              className="w-full rounded-lg border border-[#1E2D45] bg-[#080E1A] px-2.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              <option value="Desalination Hybrid">Desalination Hybrid</option>
              <option value="Coastal Estuary">Coastal Estuary</option>
              <option value="Industrial Coastal">Industrial Coastal</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Feed / Draw (g/L)</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                step={0.1}
                min={0}
                max={20}
                value={newFeedSalinity}
                onChange={(e) => setNewFeedSalinity(parseFloat(e.target.value) || 0)}
                className="w-1/2 rounded-lg border border-[#1E2D45] bg-[#080E1A] px-2 py-2 text-xs font-mono text-slate-100"
              />
              <input
                type="number"
                step={1}
                min={10}
                max={120}
                value={newDrawSalinity}
                onChange={(e) => setNewDrawSalinity(parseFloat(e.target.value) || 35)}
                className="w-1/2 rounded-lg border border-[#1E2D45] bg-[#080E1A] px-2 py-2 text-xs font-mono text-slate-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-[#1E2D45] px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Create
            </button>
          </div>
          <div className="md:col-span-6 flex flex-wrap gap-4 text-xs text-slate-400 pt-1 border-t border-[#1E2D45]/70">
            <label className="inline-flex items-center gap-2">
              Water Temp (°C):
              <input
                type="number"
                min={10}
                max={40}
                value={newTemp}
                onChange={(e) => setNewTemp(parseFloat(e.target.value) || 25)}
                className="w-16 rounded border border-[#1E2D45] bg-[#080E1A] px-2 py-1 font-mono text-slate-100"
              />
            </label>
            <label className="inline-flex items-center gap-2">
              Suggested Envelope:
              <select
                value={newEnvelope}
                onChange={(e) => setNewEnvelope(e.target.value as ConfigurationEnvelope)}
                className="rounded border border-[#1E2D45] bg-[#080E1A] px-2 py-1 text-slate-100"
              >
                <option value="standalone">Standalone PRO</option>
                <option value="ro_pro">RO–PRO Hybrid</option>
                <option value="solar_pro_desal">PRO + Solar Thermal</option>
              </select>
            </label>
          </div>
        </form>
      )}

      {/* Top Row: Candidate Summary Cards + 9-Axis Radar Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Candidate Cards */}
        <div className="xl:col-span-7 grid grid-cols-1 gap-4">
          {siteWeightedScores.map(({ site, weightedPct }, idx) => (
            <article
              key={site.id}
              className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-400">
                    {site.region} · {site.archetype} · {site.statusLabel}
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold text-slate-100">
                    {site.name}
                  </h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Weighted Screening Index</p>
                    <p
                      className="font-mono text-xl font-bold tabular-nums"
                      style={{ color: RADAR_COLORS[idx % RADAR_COLORS.length] }}
                    >
                      {weightedPct.toFixed(1)}
                      <span className="text-xs font-normal text-slate-400"> / 100</span>
                    </p>
                  </div>
                  {sites.length > 1 && site.id.startsWith('site-custom-') && (
                    <button
                      type="button"
                      onClick={() => onDeleteSite(site.id)}
                      className="text-slate-500 hover:text-rose-400"
                      aria-label={`Remove ${site.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{site.notes}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E2D45] pt-3 text-xs">
                <span className="font-mono text-slate-300 tabular-nums">
                  Illustrative Streams: Feed {site.illustrativeChemistry.feedSalinity_gL} g/L → Draw{' '}
                  {site.illustrativeChemistry.drawSalinity_gL} g/L · {site.illustrativeChemistry.temperature_C} °C
                </span>
                <button
                  type="button"
                  onClick={() => onApplySiteChemistry(site)}
                  className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap shrink-0"
                >
                  Load Chemistry into PRO Calculator
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Multi-Site Radar Chart */}
        <section className="xl:col-span-5 rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 flex flex-col justify-between">
          <div className="border-b border-[#1E2D45] pb-3">
            <h2 className="text-base font-semibold text-slate-100">
              9-Criterion Multi-Site Screening Profile
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assumption-based 1–5 screening scores across Section 8 criteria. Neither Dahej nor Vizag is a selected or validated site.
            </p>
          </div>

          <div className="h-[340px] w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#1E2D45" />
                <PolarAngleAxis
                  dataKey="criterion"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                />
                {radarSites.map((site, idx) => (
                  <Radar
                    key={site.id}
                    name={site.name.split('(')[0].trim()}
                    dataKey={`site_${idx}`}
                    stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1324',
                    border: '1px solid #1E2D45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-[#1E2D45] pt-3 text-[11px] text-slate-400 leading-relaxed">
            Go / No-Go Discipline: Do not advance on membrane power density alone. Host selection requires verified water sampling, continuous stream match, discharge compliance, and a credible host-site economic case.
          </div>
        </section>
      </div>

      {/* Interactive 9-Criterion Weight & Scoring Matrix */}
      <section className="rounded-xl border border-[#1E2D45] bg-[#0F1829] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-[#1E2D45] pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Interactive Criterion Weights & Scenario Scoring Matrix (1–5)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust criterion weights or individual candidate ratings as field water-chemistry and regulatory data become available.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            Total Weight Sum: {totalWeight}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E2D45] text-slate-400">
                <th className="py-2.5 pr-4 font-medium min-w-[240px]">Screening Criterion</th>
                <th className="py-2.5 px-3 text-right font-medium w-28">Weight</th>
                {sites.map((site) => (
                  <th key={site.id} className="py-2.5 px-3 text-right font-semibold text-slate-200 min-w-[130px]">
                    {site.name.split('(')[0].trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]/70">
              {SITE_CRITERIA.map((c) => (
                <tr key={c.id} className="hover:bg-[#142036]/50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-200">{c.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={weights[c.id] ?? c.defaultWeight}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [c.id]: Math.max(0, Math.min(40, parseInt(e.target.value, 10) || 0)),
                        }))
                      }
                      aria-label={`Weight for ${c.name}`}
                      className="w-16 rounded border border-[#1E2D45] bg-[#080E1A] px-2 py-1 text-right font-mono text-xs text-cyan-300 tabular-nums focus:border-cyan-400 focus:outline-none"
                    />
                  </td>
                  {sites.map((site) => {
                    const current = site.scores[c.id] ?? 3;
                    return (
                      <td key={`${site.id}-${c.id}`} className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1 rounded border border-[#1E2D45] bg-[#080E1A] p-0.5">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => onUpdateSiteScore(site.id, c.id, rating)}
                              className={`h-6 w-6 rounded font-mono text-[11px] font-medium transition-colors ${
                                current === rating
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-slate-100'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
