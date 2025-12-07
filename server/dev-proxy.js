import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.DEV_PROXY_PORT || 8787;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic CORS for dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Proxy all requests to Supabase (useful for local dev to bypass browser CORS)
app.all('/*', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return res.status(500).json({ error: 'VITE_SUPABASE_URL not set in .env' });
    }

    const targetUrl = `${supabaseUrl}${req.originalUrl}`;

    const headers = {
      apikey: process.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
    };

    // Copy content-type if present
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

    const fetchOptions = {
      method: req.method,
      headers,
      // Only forward body for methods that usually have a body
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : JSON.stringify(req.body),
    };

    const upstream = await fetch(targetUrl, fetchOptions);
    const text = await upstream.text();

    // forward status and headers (but don't leak upstream CORS headers)
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control-')) return;
      res.setHeader(key, value);
    });

    // ensure JSON content-type if response looks like JSON
    const contentType = upstream.headers.get('content-type');
    if (contentType && !res.getHeader('content-type')) {
      res.setHeader('content-type', contentType);
    }

    // send body
    res.send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message || 'Proxy error' });
  }
});

app.listen(PORT, () => {
  console.log(`Dev proxy running on http://localhost:${PORT} - forwarding to ${process.env.VITE_SUPABASE_URL}`);
});
