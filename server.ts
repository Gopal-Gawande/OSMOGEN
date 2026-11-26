import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  calculateProModel,
  validateProInputs,
  type ConfigurationEnvelope,
  type ProInputs,
} from './src/engine/proModel.ts';
import {
  EVIDENCE_PAPERS,
  MODEL_LIMITATIONS,
  TECHNICAL_RISKS,
  VALIDATION_GATES,
} from './src/engine/evidenceData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ENVELOPES = new Set<ConfigurationEnvelope>([
  'standalone',
  'ro_pro',
  'solar_pro_desal',
]);

function parseEnvelope(val: unknown): ConfigurationEnvelope {
  if (typeof val === 'string' && ALLOWED_ENVELOPES.has(val as ConfigurationEnvelope)) {
    return val as ConfigurationEnvelope;
  }
  return 'standalone';
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '512kb' }));

  // 1. Deterministic PRO calculation endpoint (Section 7 API contract)
  app.post('/api/v1/calculations/pro', (req, res) => {
    const body = req.body ?? {};
    const envelope = parseEnvelope(body.configuration);
    const validation = validateProInputs(body.inputs);

    if (!validation.valid || !validation.sanitized) {
      return res.status(400).json({
        error: 'Invalid PRO input parameters.',
        details: validation.errors,
      });
    }

    const results = calculateProModel(validation.sanitized, envelope);
    return res.json({
      configuration: envelope,
      inputs: validation.sanitized,
      results,
    });
  });

  // 2. Multi-scenario comparison endpoint (Section 7 API contract)
  app.post('/api/v1/scenarios/compare', (req, res) => {
    const rawScenarios = req.body?.scenarios;
    if (!Array.isArray(rawScenarios) || rawScenarios.length === 0 || rawScenarios.length > 10) {
      return res.status(400).json({
        error: 'Provide between 1 and 10 scenarios to compare.',
      });
    }

    const evaluated = [];
    for (let idx = 0; idx < rawScenarios.length; idx++) {
      const item = rawScenarios[idx];
      const validation = validateProInputs(item?.inputs);
      if (!validation.valid || !validation.sanitized) {
        return res.status(400).json({
          error: `Scenario #${idx + 1} has invalid parameters.`,
          details: validation.errors,
        });
      }
      const envelope = parseEnvelope(item?.configuration);
      const name =
        typeof item?.name === 'string' && item.name.trim().length > 0
          ? item.name.trim().slice(0, 120)
          : `Scenario ${idx + 1}`;
      evaluated.push({
        name,
        configuration: envelope,
        inputs: validation.sanitized,
        results: calculateProModel(validation.sanitized, envelope),
      });
    }

    return res.json({
      modelVersion: 'screening-0.1',
      status: 'assumption-only',
      comparedAt: new Date().toISOString(),
      scenarios: evaluated,
    });
  });

  // 3. Curated evidence, limitations, risks, and validation gates endpoint
  app.get('/api/v1/evidence', (_req, res) => {
    return res.json({
      modelVersion: 'screening-0.1',
      papers: EVIDENCE_PAPERS,
      limitations: MODEL_LIMITATIONS,
      validationGates: VALIDATION_GATES,
      risks: TECHNICAL_RISKS,
    });
  });

  // 4. Guarded AI Engineering Assistant (explains deterministic results only; never recomputes truth)
  app.post('/api/v1/assistant/explain', async (req, res) => {
    const body = req.body ?? {};
    const envelope = parseEnvelope(body.configuration);
    const validation = validateProInputs(body.inputs);

    if (!validation.valid || !validation.sanitized) {
      return res.status(400).json({
        error: 'Cannot analyze invalid PRO input parameters.',
        details: validation.errors,
      });
    }

    const rawQuestion = typeof body.question === 'string' ? body.question.trim() : '';
    const userQuestion =
      rawQuestion.length > 0
        ? rawQuestion.slice(0, 1200)
        : 'Explain the current deterministic PRO energy balance, identify dominant physical and system-boundary risks, and recommend the next staged validation experiments.';

    // Recompute server-side deterministically so the prompt payload is 100% verified
    const inputs: ProInputs = validation.sanitized;
    const deterministicResults = calculateProModel(inputs, envelope);

    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please check GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const evidenceContext = EVIDENCE_PAPERS.map(
      (p) => `- [${p.doi}] (${p.year}, ${p.journal}): ${p.title} — ${p.claimSupported}`
    ).join('\n');

    const systemInstruction = `You are the OSMOGEN Intelligence AI Engineering Assistant for a concept-stage Pressure Retarded Osmosis (PRO) feasibility platform.

NON-NEGOTIABLE ENGINEERING & EVIDENCE DISCIPLINE:
1. All numeric truth comes strictly from the deterministic calculation JSON provided below. NEVER recompute, alter, extrapolate, or fabricate numeric outputs, membrane specifications, site measurements, or pilot performance.
2. Always use concept-stage language ("the screening model estimates", "under these illustrative assumptions", "this hypothesis requires validation"). NEVER claim commercial viability, measured electricity generation, or physical pilot results.
3. Keep electrical power (kWe / kWh) strictly separate from solar thermal heat (kWth / kWhth). Never sum kWth into kWe.
4. Cite ONLY DOIs from the approved 6-paper research register when relevant. Never invent DOIs or papers.
5. Map recommended experiments explicitly to OSMOGEN's 5 Validation Gates (Gate 1: unit-tested screening model, Gate 2: higher-fidelity literature calibration, Gate 3: laboratory membrane-coupon testing, Gate 4: module/skid hydraulic & electrical metering, Gate 5: site-specific techno-economic & environmental assessment).
6. Keep prose concise, technical, direct, and grounded in chemical/process engineering.`;

    const promptPayload = `ACTIVE CONFIGURATION ENVELOPE: ${envelope}

VERIFIED DETERMINISTIC INPUTS (assumption-only):
${JSON.stringify(inputs, null, 2)}

VERIFIED DETERMINISTIC OUTPUTS (modelVersion: screening-0.1):
${JSON.stringify(deterministicResults, null, 2)}

APPROVED RESEARCH REGISTER:
${evidenceContext}

ENGINEER QUESTION:
${userQuestion}

Respond strictly matching the JSON schema. Every number you mention must exactly match the verified deterministic JSON above.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description:
                  '2-4 sentence technical explanation of the current deterministic result and direct answer to the engineer question.',
              },
              sensitivityDrivers: {
                type: Type.ARRAY,
                description: '3-4 key physical or boundary parameters driving the current result.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    driver: { type: Type.STRING },
                    impact: { type: Type.STRING },
                  },
                  required: ['driver', 'impact'],
                },
              },
              identifiedRisks: {
                type: Type.ARRAY,
                description: '3-4 concrete physical, hydraulic, fouling, or accounting risks.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING },
                    severity: {
                      type: Type.STRING,
                      description: 'Must be one of: high, medium, low',
                    },
                    mitigation: { type: Type.STRING },
                  },
                  required: ['risk', 'severity', 'mitigation'],
                },
              },
              nextExperiments: {
                type: Type.ARRAY,
                description: '3 concrete next validation steps mapped to Validation Gates 1-5.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    gate: { type: Type.STRING },
                    experiment: { type: Type.STRING },
                    metricToMeasure: { type: Type.STRING },
                  },
                  required: ['gate', 'experiment', 'metricToMeasure'],
                },
              },
              referencedDOIs: {
                type: Type.ARRAY,
                description: 'Subset of approved DOIs from the research register relevant to this analysis.',
                items: { type: Type.STRING },
              },
              evidenceCaveat: {
                type: Type.STRING,
                description: '1-sentence reminder of screening-0.1 limitations and non-measured status.',
              },
            },
            required: [
              'executiveSummary',
              'sensitivityDrivers',
              'identifiedRisks',
              'nextExperiments',
              'referencedDOIs',
              'evidenceCaveat',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({
          error: 'Gemini returned an empty response. Please retry your engineering query.',
        });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        return res.status(502).json({
          error: 'Could not parse structured engineering response from Gemini. Please retry.',
        });
      }

      return res.json({
        model: 'gemini-4-hydrogen',
        analyzedAt: new Date().toISOString(),
        configuration: envelope,
        verifiedSummary: {
          bulkDeltaPi_bar: deterministicResults.bulkDeltaPi_bar,
          effectiveDeltaPi_bar: deterministicResults.effectiveDeltaPi_bar,
          waterFlux_LMH: deterministicResults.waterFlux_LMH,
          grossElectric_kWe: deterministicResults.grossElectric_kWe,
          totalAuxiliary_kWe: deterministicResults.totalAuxiliary_kWe,
          netElectric_kWe: deterministicResults.netElectric_kWe,
          roHybridSEC_kWh_m3: deterministicResults.roHybridSEC_kWh_m3,
          solarUsefulHeat_kWth: deterministicResults.solarUsefulHeat_kWth,
        },
        analysis: parsed,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown upstream Gemini error';
      const status =
        message.includes('403') || message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')
          ? 403
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 502;
      return res.status(status).json({
        error:
          status === 403
            ? 'Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.'
            : status === 429
              ? 'Gemini API rate limit reached. Wait briefly and retry, or check your quota in Settings > Secrets.'
              : `Gemini engineering analysis failed: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OSMOGEN Intelligence server listening on http://localhost:${PORT}`);
  });
}

startServer();
