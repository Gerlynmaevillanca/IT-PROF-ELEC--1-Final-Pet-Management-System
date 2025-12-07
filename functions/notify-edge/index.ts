// Supabase Edge Function (Deno) to create notifications using service_role key
// Deploy with `supabase functions deploy notify-edge` from supabase-cli

import { serve } from 'std/server';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { petId, petName, adopterId, adopterName } = body;
    if (!petId || !adopterId) {
      return new Response(JSON.stringify({ error: 'petId and adopterId required' }), { status: 400 });
    }

    const payload = [
      {
        user_id: adopterId,
        type: 'application_received',
        title: 'Application Received',
        message: `${adopterName} submitted an application for ${petName}`,
        related_data: { petId, petName },
        read: false,
      },
    ];

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return new Response(text, { status: resp.status });
    }

    return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
