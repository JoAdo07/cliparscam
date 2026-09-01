import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  console.warn("Missing Supabase env vars");
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
