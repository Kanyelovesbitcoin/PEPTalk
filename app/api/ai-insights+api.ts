import { compoundById } from '@/lib/data/compounds';
import { goalById } from '@/lib/constants/goals';
import {
  checkRateLimit,
  isRecord,
  jsonResponse,
  preflightResponse,
  readJsonBody,
  requireClientToken,
  stringArrayValue,
  stringValue,
} from '@/lib/server/apiSecurity';
import { callOpenRouter, hasOpenRouterKey } from '@/lib/server/openRouter';
import { requireProEntitlement } from '@/lib/server/revenueCat';
import type { CompoundInsight, QuizAnswers, StackMatch } from '@/types/quiz';

type AiAction = 'stack-insights' | 'compound-explanation' | 'regenerate-insights';

const MAX_BODY_BYTES = 64 * 1024;
const SYSTEM_PROMPT = `You are an educational peptide library and private tracking assistant for GlowPep. Frame insights as research literacy, cosmetic education, regulatory context, and private record-keeping around visible appearance, recovery, energy, focus, and long-term vitality interests. Never diagnose, treat, prescribe, recommend products, recommend doses, suggest sourcing, promise outcomes, or tell the user what to take. For research-use compounds, explicitly keep language educational and avoid human-use instructions. Respond only with valid JSON - no markdown fences, no extra text.`;
const ACTIONS = new Set<AiAction>(['stack-insights', 'compound-explanation', 'regenerate-insights']);
const GOAL_IDS = new Set(Object.keys(goalById));
const AGE_RANGES = new Set(['18-25', '26-35', '36-45', '46-55', '55+']);
const EXPERIENCE_LEVELS = new Set(['never', 'some', 'experienced', 'deep']);
const INJECTION_COMFORT = new Set(['fine', 'prefer-other', 'no-way']);
const BUDGETS = new Set(['under-50', '50-100', '100-200', 'unlimited']);
const CONCERNS = new Set(['dryness', 'uneven-texture', 'redness', 'fine-lines', 'dullness', 'sensitivity']);
const SUPPLEMENT_HISTORY = new Set(['none', 'basic-vitamins', 'some-actives', 'already-peptides']);
const SKIN_TEXTURE = new Set(['smooth', 'some-unevenness', 'rough', 'bumpy']);
const SKIN_SENSITIVITY = new Set(['tolerant', 'mild-reaction', 'often-irritated', 'highly-reactive']);
const RESULT_PREFERENCE = new Set(['quick-wins', 'long-term', 'recovery-specific', 'general-wellness']);
const TIERS = new Set(['primary', 'secondary', 'supporting']);

function setHas(set: ReadonlySet<string>, value: unknown): value is string {
  return typeof value === 'string' && set.has(value);
}

function validAnswers(value: unknown): value is QuizAnswers {
  if (!isRecord(value)) {
    return false;
  }

  const concerns = Array.isArray(value.concerns) ? value.concerns : [];
  const uniqueConcerns = new Set(concerns);

  return (
    setHas(GOAL_IDS, value.primaryGoal) &&
    setHas(AGE_RANGES, value.ageRange) &&
    setHas(EXPERIENCE_LEVELS, value.experienceLevel) &&
    concerns.length > 0 &&
    concerns.length <= CONCERNS.size &&
    uniqueConcerns.size === concerns.length &&
    concerns.every((concern) => setHas(CONCERNS, concern)) &&
    setHas(INJECTION_COMFORT, value.injectionComfort) &&
    setHas(BUDGETS, value.budget) &&
    setHas(SUPPLEMENT_HISTORY, value.supplementHistory) &&
    setHas(SKIN_TEXTURE, value.skinTexture) &&
    setHas(SKIN_SENSITIVITY, value.skinSensitivity) &&
    setHas(RESULT_PREFERENCE, value.resultPreference)
  );
}

function validMatches(value: unknown): value is StackMatch[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) {
    return false;
  }

  const seenCompoundIds = new Set<string>();
  return value.every((item) => {
    if (
      !isRecord(item) ||
      typeof item.compoundId !== 'string' ||
      item.compoundId.length > 80 ||
      seenCompoundIds.has(item.compoundId) ||
      !setHas(TIERS, item.tier) ||
      typeof item.reasoning !== 'string' ||
      item.reasoning.length > 700 ||
      !compoundById[item.compoundId]
    ) {
      return false;
    }

    seenCompoundIds.add(item.compoundId);
    return true;
  });
}

function buildProfileBlock(answers: QuizAnswers): string {
  return `User quiz profile:
- Primary goal: ${answers.primaryGoal}
- Age range: ${answers.ageRange}
- Experience level: ${answers.experienceLevel}
- Concerns: ${answers.concerns.join(', ')}
- Injection comfort: ${answers.injectionComfort}
- Research-list breadth: ${answers.budget}
- Supplement history: ${answers.supplementHistory}
- Baseline texture: ${answers.skinTexture}
- Baseline sensitivity: ${answers.skinSensitivity}
- Result preference: ${answers.resultPreference}`;
}

function buildCompoundBlock(matches: StackMatch[]): string {
  return matches
    .map((match, index) => {
      const compound = compoundById[match.compoundId];
      if (!compound) return '';
      return `${index + 1}. ${compound.name} (${compound.type}, ${compound.difficulty}) - ${compound.summary}`;
    })
    .filter(Boolean)
    .join('\n');
}

function sanitizeInsight(value: unknown): CompoundInsight | null {
  if (!isRecord(value)) {
    return null;
  }

  const compoundId = stringValue(value.compoundId, 80);
  if (!compoundId || !compoundById[compoundId]) {
    return null;
  }

  return {
    benefits: stringArrayValue(value.benefits, 3, 140),
    compoundId,
    personalReasoning: stringValue(value.personalReasoning, 700) ?? '',
    synergyNote: stringValue(value.synergyNote, 240) ?? '',
  };
}

function sanitizeInsights(value: unknown): CompoundInsight[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(sanitizeInsight).filter(Boolean).slice(0, 8) as CompoundInsight[];
}

function parseJsonContent(text: string) {
  return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
}

async function stackInsights(answers: QuizAnswers, matches: StackMatch[]) {
  const prompt = `${buildProfileBlock(answers)}

Matched compounds (in priority order):
${buildCompoundBlock(matches)}

For each compound, respond with a JSON array. Each element must have:
- "compoundId": the compound identifier (lowercase with hyphens, e.g. "bpc-157")
- "personalReasoning": a personalized 2-3 sentence educational explanation of why this is relevant to learn about or track
- "benefits": an array of 2-3 educational themes relevant to THEIR answers
- "synergyNote": one sentence on how this item relates to the others in their saved items

Respond ONLY with the JSON array.`;

  const text = await callOpenRouter([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);
  return sanitizeInsights(parseJsonContent(text));
}

async function compoundExplanation(answers: QuizAnswers, compoundId: string, matches: StackMatch[]) {
  const compound = compoundById[compoundId];
  if (!compound) {
    return null;
  }

  const otherNames = matches
    .filter((match) => match.compoundId !== compoundId)
    .map((match) => compoundById[match.compoundId]?.name)
    .filter(Boolean)
    .join(', ');

  const prompt = `${buildProfileBlock(answers)}

The user wants educational context about: ${compound.name} (${compound.nickname})
What it is: ${compound.whatIsIt}
Other references in their saved items: ${otherNames || 'none'}

Respond with a JSON object:
- "compoundId": "${compoundId}"
- "explanation": 4-5 sentence educational deep-dive in plain language about why this compound is relevant to THIS user's tracking context
- "practicalTips": array of 2-3 tracking or research-literacy tips, with no product, sourcing, dosing, or administration instructions
- "watchOutFor": array of 1-2 things to be cautious about

Respond ONLY with the JSON object.`;

  const text = await callOpenRouter([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { maxTokens: 768 });

  const parsed = parseJsonContent(text);
  if (!isRecord(parsed)) {
    return null;
  }

  return {
    compoundId,
    explanation: stringValue(parsed.explanation, 1200) ?? '',
    practicalTips: stringArrayValue(parsed.practicalTips, 3, 180),
    watchOutFor: stringArrayValue(parsed.watchOutFor, 2, 220),
  };
}

async function regeneratedInsights(
  answers: QuizAnswers,
  matches: StackMatch[],
  previousInsights: CompoundInsight[],
) {
  const prevSummary = previousInsights
    .slice(0, 8)
    .map((insight) => `${insight.compoundId}: "${insight.personalReasoning.slice(0, 80)}..."`)
    .join('\n');

  const prompt = `${buildProfileBlock(answers)}

Matched compounds:
${buildCompoundBlock(matches)}

The user already saw these explanations and wants FRESH reasoning with a different angle:
${prevSummary}

Generate NEW, DIFFERENT explanations. Same JSON format:
- "compoundId", "personalReasoning", "benefits" (array of 2-3), "synergyNote"
Focus on different educational themes or perspectives than before.

Respond ONLY with the JSON array.`;

  const text = await callOpenRouter([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);
  return sanitizeInsights(parseJsonContent(text));
}

export async function GET(request: Request) {
  return jsonResponse({ configured: hasOpenRouterKey() }, 200, undefined, request);
}

export async function POST(request: Request) {
  const reply = (body: unknown, status = 200, headers?: HeadersInit) => jsonResponse(body, status, headers, request);
  const unauthorized = requireClientToken(request);
  if (unauthorized) {
    return unauthorized;
  }
  const locked = await requireProEntitlement(request);
  if (locked) {
    return locked;
  }

  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'ai-insights',
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimit) {
    return rateLimit;
  }

  if (!hasOpenRouterKey()) {
    return reply({ error: 'AI is not configured.' }, 503);
  }

  const { body, error } = await readJsonBody<Record<string, unknown>>(request, MAX_BODY_BYTES);
  if (error) {
    return error;
  }
  if (!body) {
    return reply({ error: 'Invalid AI request.' }, 400);
  }

  const action = setHas(ACTIONS, body.action) ? body.action as AiAction : undefined;
  const answers = body.answers;
  const matches = body.matches;

  if (!action || !validAnswers(answers) || !validMatches(matches)) {
    return reply({ error: 'Invalid AI request.' }, 400);
  }

  try {
    if (action === 'stack-insights') {
      return reply({ insights: await stackInsights(answers, matches) });
    }

    if (action === 'compound-explanation') {
      const compoundId = stringValue(body.compoundId, 80);
      if (!compoundId) {
        return reply({ error: 'compoundId is required.' }, 400);
      }

      const explanation = await compoundExplanation(answers, compoundId, matches);
      if (!explanation) {
        return reply({ error: 'Unknown compound.' }, 400);
      }

      return reply({ explanation });
    }

    if (action === 'regenerate-insights') {
      const previousInsights = Array.isArray(body.previousInsights)
        ? sanitizeInsights(body.previousInsights)
        : [];
      return reply({ insights: await regeneratedInsights(answers, matches, previousInsights) });
    }

    return reply({ error: 'Unsupported AI action.' }, 400);
  } catch (error) {
    console.warn('[api/ai-insights] request failed');
    return reply({ error: 'AI request failed.' }, 502);
  }
}

export async function OPTIONS(request: Request) {
  return preflightResponse(request);
}
