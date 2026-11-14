// Reads the Supabase settings from .env.local and fails with a helpful message
// instead of a confusing network error when they're missing.
export function getSupabaseEnv() {
  // Written out literally (not process.env[name]) so Next.js can embed them in browser code.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase isn't configured. Copy .env.example to .env.local, fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart `npm run dev`.",
    );
  }
  return { url, key };
}
