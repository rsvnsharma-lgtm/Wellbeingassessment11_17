/**
 * Mhitr Wellbeing Check-in
 * Vercel Serverless Proxy — /api/generate-report.js
 *
 * Keeps the Anthropic API key server-side.
 * Set ANTHROPIC_API_KEY in Vercel > Project > Settings > Environment Variables.
 *
 * Rate limit : 1 request per IP per 10 minutes (in-memory, resets on cold start)
 * Input guard : name sanitised, age validated, scores validated
 * Output guard: response must be 50–600 words; falls back to static text if not
 */

const RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const ipTimestamps = new Map();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sanitiseName(raw) {
  return String(raw || '')
    .replace(/[^a-zA-Z\s'-]/g, '')
    .trim()
    .slice(0, 30) || 'Student';
}

function validateAge(raw) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 11 && n <= 17 ? n : null;
}

function validateScores(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const SCALES = ['emotional', 'conduct', 'hyperactivity', 'peer', 'prosocial'];
  for (const scale of SCALES) {
    if (!(scale in raw)) return null;
    const v = parseInt(raw[scale], 10);
    if (!Number.isFinite(v) || v < 0 || v > 10) return null;
  }
  return raw;
}

function validateBands(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const SCALES = ['emotional', 'conduct', 'hyperactivity', 'peer', 'prosocial'];
  const VALID = ['close', 'some', 'high'];
  for (const scale of SCALES) {
    if (!VALID.includes(raw[scale])) return null;
  }
  return raw;
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function containsCrisisKeywords(text) {
  const keywords = ['suicide', 'kill myself', 'end my life', 'self-harm', 'hurt myself'];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function staticFallback(name) {
  return `Hi ${name}, thank you for completing this check-in today. Your results show a picture of both strengths and areas where a little extra support could make a real difference. Remember that everyone has areas they are still growing in — that is completely normal. Please don't hesitate to talk to a trusted adult or school counsellor if anything is on your mind. You've got this.`;
}

function buildPrompt(name, age, gender, scores, bands) {
  const scoreStr = Object.entries(scores)
    .map(([k, v]) => {
      const labels = {
        emotional: 'Emotional symptoms',
        conduct: 'Conduct and behaviour',
        hyperactivity: 'Hyperactivity and focus',
        peer: 'Peer relationships',
        prosocial: 'Prosocial behaviour'
      };
      const bandStr = bands[k] === 'close' ? 'Close to normal'
        : bands[k] === 'some' ? 'Some risk' : 'High risk';
      return `${labels[k]}: ${v}/10 (${bandStr})`;
    })
    .join('; ');

  const best = Object.entries(bands).find(([, b]) => b === 'close')?.[0] || 'prosocial';
  const worst = Object.entries(bands).find(([, b]) => b === 'high')?.[0]
    || Object.entries(bands).find(([, b]) => b === 'some')?.[0] || 'emotional';

  const scaleLabels = {
    emotional: 'Emotional symptoms', conduct: 'Conduct and behaviour',
    hyperactivity: 'Hyperactivity and focus', peer: 'Peer relationships',
    prosocial: 'Prosocial behaviour'
  };

  return {
    system: `You are a warm, experienced school counsellor writing for Mhitr — a wellbeing self-care companion for young people. Your audience is a ${age}-year-old. You write with warmth, empathy and age-appropriate language. You NEVER use clinical jargon. You NEVER make diagnostic statements. You NEVER mention self-harm, suicide or crisis resources unprompted. You NEVER reproduce the student's name more than twice. Your output must be plain prose — no bullet points, no headers, no markdown, no emoji. Total length: 120 to 180 words exactly.`,
    user: `Write a personalised wellbeing summary for ${name}, aged ${age}, who identifies as ${gender}. SDQ-aligned scale scores: ${scoreStr}. Strongest area: ${scaleLabels[best]}. Area needing most support: ${scaleLabels[worst]}. Write exactly 3 short paragraphs: (1) warmly celebrate their strongest area with genuine specificity, (2) gently acknowledge the area needing support without alarming language and offer one practical suggestion, (3) a brief hopeful and encouraging close. Plain prose only. 120 to 180 words total.`
  };
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {

  // CORS — allow your GitHub Pages domain and localhost
  const allowedOrigins = [
    'https://adolescentwellbeingassessment.vercel.app',
    'https://rsvnsharma-lgtm.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Rate limiting ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const last = ipTimestamps.get(ip) || 0;
  const now = Date.now();
  if (now - last < RATE_LIMIT_MS) {
    const waitMins = Math.ceil((RATE_LIMIT_MS - (now - last)) / 60000);
    return res.status(429).json({
      error: `Please wait ${waitMins} minute${waitMins > 1 ? 's' : ''} before generating another report.`
    });
  }
  ipTimestamps.set(ip, now);

  // ── Input validation ──
  const { name: rawName, age: rawAge, gender: rawGender, scores: rawScores, bands: rawBands } = req.body || {};

  const name = sanitiseName(rawName);
  const age = validateAge(rawAge);
  const gender = ['boy', 'girl', 'non-binary person', 'person'].includes(rawGender) ? rawGender : 'person';
  const scores = validateScores(rawScores);
  const bands = validateBands(rawBands);

  if (!age) return res.status(400).json({ error: 'Invalid age. Must be 11–17.' });
  if (!scores) return res.status(400).json({ error: 'Invalid scores.' });
  if (!bands) return res.status(400).json({ error: 'Invalid bands.' });

  // ── Build prompt ──
  const { system, user } = buildPrompt(name, age, gender, scores, bands);

  // ── Call Anthropic ──
  let aiText = '';
  try {
    const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });

    if (!apiResp.ok) {
      const err = await apiResp.json().catch(() => ({}));
      console.error('Anthropic API error:', err);
      return res.status(200).json({ text: staticFallback(name), fallback: true });
    }

    const data = await apiResp.json();
    aiText = data?.content?.[0]?.text || '';
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(200).json({ text: staticFallback(name), fallback: true });
  }

  // ── Output validation ──
  const wc = wordCount(aiText);
  if (wc < 50 || wc > 600) {
    return res.status(200).json({ text: staticFallback(name), fallback: true });
  }

  if (containsCrisisKeywords(aiText)) {
    return res.status(200).json({ text: staticFallback(name), fallback: true });
  }

  return res.status(200).json({ text: aiText, fallback: false });
}
