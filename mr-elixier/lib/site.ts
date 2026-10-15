/**
 * Öffentliche Adresse des Shops: NEXT_PUBLIC_SITE_URL, sonst automatisch die
 * Vercel-Adresse der jeweiligen Bereitstellung, lokal localhost.
 */
export function siteUrl(): string {
  const env = process.env;
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_BRANCH_URL) return `https://${env.VERCEL_BRANCH_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}
