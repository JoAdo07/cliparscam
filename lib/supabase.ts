import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Missing Supabase env vars — using placeholder (build-safe, realtime disabled until env is set)");
}

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type PresenceState = {
  userId: string;
  searching: boolean;
  interests: string[];
  onlineAt: string;
};
