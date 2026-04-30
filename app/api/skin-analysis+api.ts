const LEGAL_RECOMMENDATIONS = ['ghk-cu', 'matrixyl', 'argireline'];

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 70;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sanitizePayload(value: any) {
  const recommendedCompoundIds = Array.isArray(value?.recommendedCompoundIds)
    ? value.recommendedCompoundIds.filter((id: string) => LEGAL_RECOMMENDATIONS.includes(id)).slice(0, 3)
    : LEGAL_RECOMMENDATIONS;

  return {
    angleInsights: {
      front: typeof value?.angleInsights?.front === 'string'
        ? value.angleInsights.front.slice(0, 260)
        : 'Front angle reviewed for tone, texture, under-eye brightness, and overall facial balance.',
      left: typeof value?.angleInsights?.left === 'string'
        ? value.angleInsights.left.slice(0, 260)
        : 'Left profile reviewed for cheek, jawline, under-eye, and side-light texture cues.',
      right: typeof value?.angleInsights?.right === 'string'
        ? value.angleInsights.right.slice(0, 260)
        : 'Right profile reviewed for cheek, jawline, under-eye, and side-light texture cues.',
    },
    collagen: clampScore(value?.collagen),
    texture: clampScore(value?.texture),
    luminosity: clampScore(value?.luminosity),
    feedbackSummary: typeof value?.feedbackSummary === 'string'
      ? value.feedbackSummary.slice(0, 500)
      : 'Your three-angle scan is ready. Focus on smoother skin, brighter tone, and maintaining youthful bounce.',
    improvements: Array.isArray(value?.improvements)
      ? value.improvements.map(String).slice(0, 4)
      : [],
    recommendedCompoundIds,
    source: 'ai',
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Missing OPENROUTER_API_KEY' }, 502);
  }

  const body = await request.json().catch(() => null);
  if (!body?.front || !body?.left || !body?.right) {
    return jsonResponse({ error: 'front, left, and right images are required' }, 400);
  }

  const mimeType = body.mimeType || 'image/jpeg';
  const model = process.env.OPENROUTER_VISION_MODEL || 'openai/gpt-4o-mini';

  const prompt = `You are GlowPep's cosmetic face-scan analyst. Analyze all 3 images together: front face, left profile, right profile.

Give honest but constructive looksmaxxing-style feedback for a user who uses legal cosmetic peptides to look younger. Do not diagnose disease, do not claim medical certainty, and do not recommend prescription/injectable/research-use compounds. You may recommend only these legal cosmetic peptide IDs: ghk-cu, matrixyl, argireline.

Return strict JSON only with:
{
  "collagen": number 0-100,
  "texture": number 0-100,
  "luminosity": number 0-100,
  "feedbackSummary": string, // direct but not cruel, 1-2 sentences
  "angleInsights": {
    "front": string, // one specific visible insight from the front image
    "left": string, // one specific visible insight from the left profile
    "right": string // one specific visible insight from the right profile
  },
  "improvements": string[], // 3-4 concrete cosmetic actions
  "recommendedCompoundIds": string[] // only legal IDs from the allowed list
}

Score meaning for user-facing labels:
- collagen = Youthful Bounce: how tight, fresh, and youthful skin reads at a glance.
- texture = Smooth Canvas: visible roughness, pores, bumps, unevenness.
- luminosity = Glow Factor: bright, awake, camera-ready appearance.
`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'text', text: 'Front face:' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${body.front}` } },
            { type: 'text', text: 'Left profile:' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${body.left}` } },
            { type: 'text', text: 'Right profile:' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${body.right}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.35,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://glowpep.app',
      'X-Title': 'GlowPep',
    },
    method: 'POST',
  });

  if (!response.ok) {
    return jsonResponse({ error: 'Vision model request failed' }, 502);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    return jsonResponse(sanitizePayload(parsed));
  } catch {
    return jsonResponse({ error: 'Vision model returned invalid JSON' }, 502);
  }
}
