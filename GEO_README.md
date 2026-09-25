# 🌍 CliparsGEO — README for my friend

Welcome! CliparsGEO is the GeoGuessr-style game inside our **CliparsCAM** random video chat project.
You get dropped into a random Google Street View spot somewhere on Earth — look around for clues,
drop a pin on the world map, and score points for how close you get.

No account. No API key. Free.

---

## ▶️ How to play

1. Open the game:
   - Local: **http://localhost:3000/geo**
   - Live (after Vercel deploys): `https://<your-app>.vercel.app/geo`
2. Click **Start game**.
3. You see a **mystery Street View** on the left. Drag inside it to look around.
4. Spot clues: language on signs, license plates, which side cars drive on,
   architecture, vegetation, sun position, flags, phone codes on ads…
5. Click anywhere on the **world map** (right side) to drop your pin, then hit **Guess! →**
6. You get up to **5,000 points per round × 5 rounds = 25,000 max**.
   Closer guess = more points (exponential scoring, like real GeoGuessr).
7. Buttons that help:
   - 🔄 **New angle** — rotate the Street View camera, feels like a fresh drop
   - 💡 **Hint** — reveals a text hint for the location
   - ↗ **Full view** — open the spot in full Google Maps
8. Final screen shows your total, a grade (from "Lost tourist 😅" to "Legendary explorer 🏆"),
   and a per-round breakdown. **Play again** for new random spots.

## 🤝 Playing with a stranger (challenge mode)

This is the fun part — battle someone from video chat on the **exact same 5 spots**:

1. Finish (or start) a game, click **🔗 Copy challenge link**.
   It looks like `/geo?c=eiffel,shibuya,taj,...` — those IDs are the 5 locations.
2. Paste the link into the **text chat** on `/chat` (or send it anywhere).
3. Whoever opens it plays the identical 5 rounds. Highest total wins. Argue about it on video. 🎥

Tip: open `/geo` in a new tab while staying on the `/chat` call — the header has a
**🌍 Geo** shortcut for exactly this.

## 🗂️ Where the code lives

| What | File |
|---|---|
| Game page (all UI + logic) | `app/geo/page.tsx` |
| 48 locations + hints | `lib/geo-locations.ts` |
| Scoring, distance, challenge links, Street View URLs | `lib/geo.ts` |
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

- **Street View**: embedded via Google's `output=svembed` iframe URL — works with **no API key**.
  Built in `streetViewEmbedUrl()` in `lib/geo.ts`.
- **Guess map**: Leaflet loaded from CDN + free OpenStreetMap tiles. Your pin = red,
  true location = green, with a dashed line between them on reveal.
- **Distance**: haversine formula. **Score**: `5000 × e^(−km/1500)` per round.
- **Best score**: saved in your browser (`localStorage`), shown in the header.
- **Challenge links**: location IDs encoded in `?c=` — decoded on load, same spots for everyone.

## ❓ FAQ

- **Street View shows a black/empty frame?** Some coords have no nearby panorama.
  Hit 🔄 New angle or ↗ Full view; next round is a fresh random pick anyway.
- **Map didn't load?** The Leaflet CDN or OSM tiles are blocked on your network —
  the page shows a fallback message. Check your connection/ad-blocker.
- **Can I add new locations?** Yes! Add an entry to `LOCATIONS` in
  `lib/geo-locations.ts` (id, name, country, lat, lng near a road, hint) and push.
- **Does the game record video or track me?** No. Guesses stay in your browser;
  only your best score is stored locally.

Have fun — don't get lost. 🧭
