import Constants from 'expo-constants';

import { compoundById } from '@/lib/data/compounds';
import type { QuizAnswers, CompoundInsight, StackMatch } from '@/types/quiz';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are a peptide-based looks and longevity education assistant for GlowPep. Frame insights around visible appearance, recovery, energy, focus, and long-term vitality. Keep language clear, professional, and consumer-friendly. Never give medical advice; keep everything educational. Respond only with valid JSON — no markdown fences, no extra text.`;

function getApiKey(): string {
  return (Constants.expoConfig?.extra?.openRouterApiKey as string) ?? '';
}

const REQUEST_TIMEOUT_MS = 12000;

async function callOpenRouter(userPrompt: string, maxTokens = 1024): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://glowpep.app',
        'X-Title': 'GlowPep',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v4-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    return raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isAiConfigured(): boolean {
  return Boolean(getApiKey());
}

// ─── Face critique (multi-angle photo analysis) ───

export interface FaceCritique {
  summary: string;
  observations: string[];
  recommendedCompoundIds: string[];
  habitTips: string[];
}

const VISION_MODEL = 'google/gemini-flash-1.5';

const CRITIQUE_SYSTEM_PROMPT = `You are an honest, supportive longevity and looksmaxing coach. The user uploads three photos of their face — front, left profile, right profile — and wants candid, specific feedback on what they can improve to look younger and healthier through peptide-based interventions and habit changes. Be direct but kind. Avoid clinical diagnosis. Focus on visible markers like skin texture, hydration, undereye area, jawline definition, symmetry, and overall vitality. Recommend peptides only from the provided catalog by exact id. Respond ONLY with valid JSON — no markdown fences, no extra text.`;

async function callVisionModel(
  systemPrompt: string,
  userText: string,
  imageBase64s: string[],
  maxTokens = 1024,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://glowpep.app',
        'X-Title': 'GlowPep',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              ...imageBase64s.map((b64) => ({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${b64}` },
              })),
            ],
          },
        ],
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    return raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

const CATALOG_FOR_CRITIQUE = `Catalog (use these exact ids):
- bpc-157 — recovery peptide
- ghk-cu — copper tripeptide, topical, skin firmness + glow
- matrixyl — topical collagen signal
- argireline — topical, softens expression lines
- cjc-1295 — GH releasing analog, body composition + skin elasticity
- ipamorelin — clean GH pulse, sleep + recovery
- selank — calm focus
- epitalon — longevity tetrapeptide, sleep architecture
- tb-500 — systemic recovery`;

export async function fetchFaceCritique(
  frontBase64: string,
  leftBase64: string,
  rightBase64: string,
): Promise<FaceCritique> {
  const userText = `${CATALOG_FOR_CRITIQUE}

Three photos attached: 1) front-on, 2) left profile, 3) right profile.

Give honest, specific feedback this user can act on. Focus on what visible markers (skin tone, texture, hydration, undereye, jawline, periorbital signs of aging, overall vitality) suggest about what would help them look younger.

Respond with a JSON object:
- "summary": 2 sentences, plain English, candid but kind
- "observations": array of 3-5 short bullet observations from the photos
- "recommendedCompoundIds": array of 2-3 ids from the catalog that map directly to the observations
- "habitTips": array of 2-3 short non-peptide habit tips (sleep, sun, hydration, training)`;

  const text = await callVisionModel(CRITIQUE_SYSTEM_PROMPT, userText, [
    frontBase64,
    leftBase64,
    rightBase64,
  ]);
  return JSON.parse(text) as FaceCritique;
}

// Rule-based fallback for when no API key is configured or the call fails.
export function fallbackFaceCritique(): FaceCritique {
  return {
    summary:
      'Photo analysis is offline right now. Here are evergreen, peptide-supported habits that move the needle for most people.',
    observations: [
      'Skin firmness and elasticity decline starts visibly in the late 20s — a topical signal peptide pays off long-term.',
      'Undereye hollows and texture often track sleep quality and hydration more than products.',
      'Even tone and barrier strength compound with daily SPF + a topical copper peptide.',
    ],
    recommendedCompoundIds: ['ghk-cu', 'matrixyl', 'bpc-157'],
    habitTips: [
      'Lock in 7–8 hours of sleep — recovery is when GH and skin repair peak.',
      'SPF 30+ every morning, even indoors near windows.',
      'Hydration target: ~3L/day, plus magnesium nightly.',
    ],
  };
}

function buildProfileBlock(answers: QuizAnswers): string {
  return `User quiz profile:
- Primary goal: ${answers.primaryGoal}
- Age range: ${answers.ageRange}
- Experience level: ${answers.experienceLevel}
- Concerns: ${answers.concerns.join(', ')}
- Injection comfort: ${answers.injectionComfort}
- Budget: ${answers.budget}
- Supplement history: ${answers.supplementHistory}
- Baseline texture: ${answers.skinTexture}
- Baseline sensitivity: ${answers.skinSensitivity}
- Result preference: ${answers.resultPreference}`;
}

function buildCompoundBlock(matches: StackMatch[]): string {
  return matches
    .map((match, i) => {
      const compound = compoundById[match.compoundId];
      if (!compound) return '';
      return `${i + 1}. ${compound.name} (${compound.type}, ${compound.difficulty}) — ${compound.summary}`;
    })
    .filter(Boolean)
    .join('\n');
}

// ─── Stack insights (existing feature) ───

export async function fetchAiInsights(
  answers: QuizAnswers,
  matches: StackMatch[],
): Promise<CompoundInsight[]> {
  const prompt = `${buildProfileBlock(answers)}

Matched compounds (in priority order):
${buildCompoundBlock(matches)}

For each compound, respond with a JSON array. Each element must have:
- "compoundId": the compound identifier (lowercase with hyphens, e.g. "bpc-157")
- "personalReasoning": a personalized 2-3 sentence explanation of why this fits their profile
- "benefits": an array of 2-3 specific benefits relevant to THEIR answers
- "synergyNote": one sentence on how this compound works with the others in the stack

Respond ONLY with the JSON array.`;

  const text = await callOpenRouter(prompt);
  return JSON.parse(text) as CompoundInsight[];
}

// ─── Explain a single compound in depth ───

export interface CompoundExplanation {
  compoundId: string;
  explanation: string;
  practicalTips: string[];
  watchOutFor: string[];
}

export async function fetchCompoundExplanation(
  answers: QuizAnswers,
  compoundId: string,
  matches: StackMatch[],
): Promise<CompoundExplanation> {
  const compound = compoundById[compoundId];
  if (!compound) throw new Error(`Unknown compound: ${compoundId}`);

  const otherNames = matches
    .filter((m) => m.compoundId !== compoundId)
    .map((m) => compoundById[m.compoundId]?.name)
    .filter(Boolean)
    .join(', ');

  const prompt = `${buildProfileBlock(answers)}

The user wants to understand more about: ${compound.name} (${compound.nickname})
What it is: ${compound.whatIsIt}
Other compounds in their stack: ${otherNames || 'none'}

Respond with a JSON object:
- "compoundId": "${compoundId}"
- "explanation": 4-5 sentence deep-dive in plain language about why this compound suits THIS user
- "practicalTips": array of 2-3 practical tips for someone starting this compound
- "watchOutFor": array of 1-2 things to be cautious about

Respond ONLY with the JSON object.`;

  const text = await callOpenRouter(prompt, 768);
  return JSON.parse(text) as CompoundExplanation;
}

// ─── Regenerate with a fresh angle ───

export async function regenerateInsights(
  answers: QuizAnswers,
  matches: StackMatch[],
  previousInsights: CompoundInsight[],
): Promise<CompoundInsight[]> {
  const prevSummary = previousInsights
    .map((i) => `${i.compoundId}: "${i.personalReasoning.slice(0, 80)}..."`)
    .join('\n');

  const prompt = `${buildProfileBlock(answers)}

Matched compounds:
${buildCompoundBlock(matches)}

The user already saw these explanations and wants FRESH reasoning with a different angle:
${prevSummary}

Generate NEW, DIFFERENT explanations. Same JSON format:
- "compoundId", "personalReasoning", "benefits" (array of 2-3), "synergyNote"
Focus on different benefits or perspectives than before.

Respond ONLY with the JSON array.`;

  const text = await callOpenRouter(prompt);
  return JSON.parse(text) as CompoundInsight[];
}
