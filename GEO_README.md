# 🌍 CliparsGEO — README for my friend

Welcome! CliparsGEO is the GeoGuessr-style game inside our **CliparsCAM** random video chat project.
Full-screen Street View, a guess map that expands when you hover it, 5 rounds, exponential scoring —
the real rules. Rebuilt from the world's best open-source clone (see Credits).

No account. No API key. Free.

---

## ▶️ How to play

1. Open the game:
   - Local: **http://localhost:3000/geo**
   - Live (after Vercel deploys): `https://<your-app>.vercel.app/geo`
2. Pick a mode: **🗺️ Classic**, **🔥 Country streak**, or **⚔️ Party vs stranger**.
3. Classic: you're dropped on a **random road anywhere in the world** — Street View
   fills the whole screen. Move around, zoom, read the landscape: language on signs,
   license plates, which side cars drive on, architecture, vegetation, sun position.
4. Hover the **small map bottom-right** — it expands. Click to drop your pin, hit **GUESS**.
5. You get up to **5,000 points per round × 5 rounds = 25,000 max**.
   Scoring is exponential (same formula as real GeoGuessr), so close pins pay hugely.
6. Helpers (top bar):
   - 💡 **Hint** — reveals the country but **halves your points** for the round
   - ⏭ **Skip** — panorama dead? Swap for a fresh random road, no penalty
   - 🔄 — rotate the Street View camera for a new angle
7. Streak mode: every guess must land in the **right country**. One miss = game over.
8. Final screen shows your total, a grade (from "Lost tourist 😅" to "Legendary explorer 🏆"),
   and a per-round breakdown. **Play again** for new random roads.

## 🤝 Playing with a stranger (party mode)

This is the fun part — battle someone from video chat on the **exact same 5 roads**
with a **live leaderboard**:

1. Click **⚔️ Party vs stranger** → you get a 4-letter **party code** + share link.
2. Paste the link into the **text chat** on `/chat` (or just read out the code —
   they can join with the code alone, spots sync automatically).
3. Everyone plays the same 5 roads at their own pace. Scores update live on the
   left board. Highest total wins. Argue about it on video. 🎥

Solo alternative: after any classic game, **🔗 Challenge link** copies a
`/geo?c=...` URL with the same 5 roads — async battle, compare totals after.

Tip: open `/geo` in a new tab while staying on the `/chat` call — the header has a
**🌍 Geo** shortcut for exactly this.

## 🗂️ Where the code lives

| What | File |
|---|---|
| Game page (all UI + modes) | `app/geo/page.tsx` |
| 200+ verified roadside spots, 78 countries | `lib/geo-spots.ts` |
| Scoring, weighted random, seeds, Street View URLs | `lib/geo.ts` |
| Links to the game | `app/page.tsx` (homepage), `app/chat/page.tsx` (chat header) |
| Video chat matchmaking (untouched) | `lib/webrtc.ts`, `app/chat/page.tsx` |

## 🛠️ Run it locally

```bash
cd cliparscam
npm install
cp .env.example .env.local   # Supabase keys for video chat (game works without them)
npm run dev                  # http://localhost:3000/geo
```

Build check: `npm run build` — should show routes `/`, `/chat`, `/geo`.

## 🚀 Deploy

Push to `main` → Vercel auto-deploys (same as the main app, no extra config).
No environment variables needed for the game itself.

## 🧠 How it works (tech, 30 seconds)

- **Random roads**: like worldguessr we pick a weighted-random country (big countries
  come up more, western Europe ×2), then drop on a random VERIFIED roadside spot —
  200+ in `lib/geo-spots.ts`. No dead rounds, no API key needed. To add spots: append
  to a country, never reorder (indexes live inside shared links).
- **Street View**: embedded via Google's `output=svembed` iframe URL — works with **no API key**.
- **Guess map**: Leaflet loaded from CDN + free OpenStreetMap tiles. Small by default,
  expands on hover — just like the original. Your pin = red, true spot = green.
- **Distance**: haversine. **Score**: `5000 × e^(−10·km/14916.862)` — the exact
  GeoGuessr formula; hint halves it; <30 m = 5000.
- **Streak validation**: keyless reverse-geocode (BigDataCloud free API) checks your
  pin's country; dataset country is authoritative for the answer.
- **Party**: same Supabase Realtime broadcast+presence pattern as our video chat
  (`clipars:party:CODE` channel) — live leaderboard, no database needed.
- **Best scores**: saved in your browser (`localStorage`).

## 🙏 Credits

Game rules, scoring formula, country-weighted random design, and the hint-halves-points
idea are adapted from **[worldguessr](https://github.com/codergautam/worldguessr)**
by Gautam — the top open-source GeoGuessr clone (534★, Next.js + Leaflet + free
Street View embed). Used here for our free noncommercial project per its
PolyForm Noncommercial license, with thanks. Reimplemented in TypeScript for our
codebase — no code copied verbatim.

## ❓ FAQ

- **Street View shows a black/empty frame?** Hit ⏭ Skip for a fresh random road (free,
  no penalty) or 🔄 for a new camera angle.
- **Map didn't load?** The Leaflet CDN or OSM tiles are blocked on your network —
  the page shows a fallback message. Check your connection/ad-blocker.
- **Can I add new locations?** Yes! Append `[lat, lng]` spots to a country in
  `lib/geo-spots.ts` (pick real roads with Street View coverage). Never reorder —
  indexes are encoded in shared links.
- **Does the game record video or track me?** No. Guesses stay in your browser;
  only your best score is stored locally.

Have fun — don't get lost. 🧭
