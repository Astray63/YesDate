import { MODEL, systemPrompt } from '../config/ai';

const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
if (!OPENROUTER_KEY) {
  console.warn('OpenRouter API key not found in env (EXPO_PUBLIC_OPENROUTER_API_KEY). OpenRouter calls will fail.');
}

export async function generateDateIdeasWithAI(events: any[], userContext: any) {
  if (!OPENROUTER_KEY) throw new Error('Missing OpenRouter API key');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify({ events, userContext }) },
  ];

  const body = {
    model: MODEL,
    messages,
    max_tokens: 800,
    temperature: 0.2,
  } as any;

  const res = await fetch('https://api.openrouter.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${text}`);
  }

  const payload = await res.json() as any;
  // Try multiple common shapes for the model response
  let text: string | undefined;
  if (payload?.choices && Array.isArray(payload.choices) && payload.choices[0]) {
    text = payload.choices[0]?.message?.content || payload.choices[0]?.text;
  } else if (payload?.output && Array.isArray(payload.output)) {
    text = payload.output.map((o: any) => o?.content || o?.text).join('\n');
  } else if (typeof payload?.text === 'string') {
    text = payload.text;
  }

  if (!text) throw new Error('OpenRouter returned empty response');

  // AI should return JSON only (as required by systemPrompt)
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err: unknown) {
    // If AI returned non-JSON, try to extract JSON blob as fallback
    const s = String(text || '');
    const match = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e) { /* fall through */ }
    }
    throw new Error('AI returned invalid JSON');
  }
}
