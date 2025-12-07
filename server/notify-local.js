// Local helper server to insert notifications using service role key
// Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars, then run:
//   node server/notify-local.js

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

app.post('/notify', async (req, res) => {
  try {
    const { petId, petName, adopterId, adopterName } = req.body;
    if (!petId || !adopterId) return res.status(400).json({ error: 'petId and adopterId required' });

    const payload = [
      {
        user_id: adopterId,
        type: 'application_received',
        title: 'Application Received',
        message: `${adopterName} submitted an application for ${petName}`,
        related_data: { petId, petName },
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

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).send(text);
    }

    const data = await resp.json();
    res.json({ success: true, created: data });
  } catch (err) {
    console.error('Local notify error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.NOTIFY_LOCAL_PORT || 8888;
app.listen(PORT, () => console.log(`Local notify server running on http://localhost:${PORT}`));
