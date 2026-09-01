# CliparsCAM

Omegle-style **random video chat** platform — free, peer-to-peer, no signup.

- **Stack:** Next.js 14 (App Router) + Tailwind + **Supabase Realtime** (presence & broadcast) + **Vercel**
- **Media:** WebRTC P2P (STUN: Google), no server recording
- **Features:** random matchmaking, interest tags, text + video, Next/Skip, mute/cam toggle, report

## Links

- GitHub: `JoAdo07/cliparscam` (collaborator: `Omarinho12345`)
- Supabase: `cliparscam` — `jbonyvhecqqnngqlmomh.supabase.co` — region `eu-west-1` — org `Clipars`
- Vercel: auto-deploy from `main` → `*.vercel.app` (free domain to start)

## Local dev

```bash
npm install
cp .env.example .env.local  # already filled for this project
npm run dev  # http://localhost:3000
```

Env vars (set in Vercel too):

```
NEXT_PUBLIC_SUPABASE_URL=https://jbonyvhecqqnngqlmomh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (anon)
```

## Supabase

Realtime is used for lobby presence + WebRTC signaling (offer/answer/ice). No DB tables required for MVP, but optional schema is in `supabase/schema.sql` for reports/blocking.

Enable Realtime for the project (already on by default on new projects).

## Deploy

Push to `main` → Vercel auto-deploys. First deploy created via `hermes` linking `JoAdo07/cliparscam`.

## For Omar (collaborator)

- GitHub invite sent to `Omarinho12345` — accept at https://github.com/JoAdo07/cliparscam/invitations
- Supabase: ask Johan to add `omarottelli720@gmail.com` to organization `Clipars` (https://supabase.com/dashboard/org/zutoovunuihvlnyiencg → Settings → Team)
- Vercel: team `ago8e3j603-6382's projects` (team_bIdLmREqoZ7SKbPwRCI9YNQW) — invite `omarottelli720@gmail.com` via Vercel dashboard → Team Settings → Members

## Safety

18+ only. Report button + text moderation placeholder. Consider adding TURN server (e.g. Cloudflare Calls, Twilio) for NAT traversal beyond STUN.

