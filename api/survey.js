import { createClient } from '@supabase/supabase-js';

const allowedOrigins = [
  'https://intelli-proms-survey.vercel.app',
].filter(Boolean);

const requiredFields = [
  'subspeciality',
  'grade',
  'primarysetting',
  'annualarthroplastyvolume',
  'departmentannualdataaccess',
  'promsusefulness',
  'departmentcompletionrate',
  'collectionworthwhile',
  'routinefollowup',
  'recallbasedonproms',
  'minimumusefulcompletionrate',
  'increasedusefactors',
  'promsusecontext',
  'promstriggerreview',
  'primaryroleproms',
  'continuedpromsuse'
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const origin = req.headers.origin;

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not permitted.' });
  }

  const body = req.body;

  if (!body || body.surveyVersion !== 'v2' || !body.responses) {
    return res.status(400).json({ error: 'Invalid survey submission.' });
  }

  for (const field of requiredFields) {
    const value = body.responses[field];

    if (Array.isArray(value) && value.length === 0) {
      return res.status(400).json({
        error: `Missing required response: ${field}`
      });
    }

    if (!Array.isArray(value) && !value) {
      return res.status(400).json({
        error: `Missing required response: ${field}`
      });
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const { error } = await supabase
    .from('survey_responses')
    .insert({
      survey_version: 'v2',
      responses: body.responses
    });

  if (error) {
    console.error('Survey insertion error:', error);

    return res.status(500).json({
      error: 'Unable to record the response.'
    });
  }

  return res.status(201).json({ ok: true });
}
