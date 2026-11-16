/** Vercel serverless entry point. No private data or privileged operations are exposed. */
export default function handler(_request: unknown, response: { status: (code: number) => { json: (value: unknown) => void } }) {
  const dataBackendConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  return response.status(200).json({ status: 'ok', dataBackendConfigured });
}
