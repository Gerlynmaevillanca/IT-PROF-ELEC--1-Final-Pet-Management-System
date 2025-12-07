Notify Edge Function

This is an example Supabase Edge Function (Deno) that inserts notifications into the `notifications` table using the Supabase service role key.

Deployment steps:
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Authenticate and select your project: `supabase login` then `supabase link --project-ref <your-project-ref>`
3. Deploy the function: `supabase functions deploy notify-edge --project-ref <your-project-ref>`
4. In the Supabase dashboard, under Project Settings -> API -> Service key (or in Environment Variables for Functions), set `SUPABASE_SERVICE_ROLE_KEY` to your service role key and `SUPABASE_URL` to your project URL.
5. After deployment, get the function URL: `supabase functions list` or from the dashboard.
6. Set `VITE_NOTIFY_FUNCTION_URL` in your `.env` to the function URL (e.g., `https://<project>.functions.supabase.co/notify-edge`).

Security note: keep the service role key secret and do NOT commit it to source control. Use environment variables in Supabase Functions settings to provide the key.
