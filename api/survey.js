import { createClient } from '@supabase/supabase-js';

const allowedOrigins = [
  'https://intelli-proms-survey.vercel.app',
].filter(Boolean);

const requiredFields = [
  'sub_speciality',
  'grade',
  'primary_setting',
  'annual_arthroplasty_volume',
  'department_annual_data_access',
  'collection_timepoints',
  'proms_usefulness',
  'department_completion_rate',
  'collection_worthwhile',
  'low_preop_score_alters_management',
  'routine_follow_up',
  'recall_based_on_proms',
  'minimum_useful_completion_rate',
  'increased_use_factors',
  'proms_use_context',
  'concerning_patterns',
  'support_prom_based_discharge',
  'proms_trigger_review',
  'waiting_list_prioritisation'
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

  if (!body || body.survey_version !== 'v2' || !body.responses) {
    return res.status(400).json({ error: 'Invalid survey submission.' });
  }

  for (const field of requiredFields) {
    const value = body.responses[field];

    if (Array.isArray(value) && value.length === 0) {
      return res.status(400).json({ error: `Missing required response: ${field}` });
    }

    if (!Array.isArray(value) && !value) {
      return res.status(400).json({ error: `Missing required response: ${field}` });
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
    console.error('Survey insertion error:', error.message);
    return res.status(500).json({ error: 'Unable to record the response.' });
  }

  return res.status(201).json({ ok: true });
}
