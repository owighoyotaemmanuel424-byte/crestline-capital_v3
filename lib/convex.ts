import { ConvexHttpClient } from "convex/browser";

export function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export const demoFunctions = {
  seed: "demo:seed",
  dashboard: "banking:dashboard",
  transfer: "banking:transfer",
  toggleCard: "banking:toggleCard",
} as const;
