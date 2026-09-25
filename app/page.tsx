import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100">
      {/* nav */}
      <header className="sticky top-0 z-10 border-b border-[#232333] bg-[#0a0a0f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff6b35] font-black">C</span>
            <span className="font-black tracking-tight text-lg">Clipars<span className="text-[#ff3b30]">CAM</span></span>
            <span className="ml-2 hidden sm:inline rounded-full bg-[#1a1a24] border border-[#2a2a3a] px-2.5 py-1 text-xs text-zinc-400">Omegle-style · WebRTC · Free</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/geo" className="hidden sm:inline rounded-full border border-[#2a2a3a] bg-[#14141c] px-4 py-2 text-sm font-semibold hover:bg-[#1a1a24]">🌍 Geo game</Link>
            <Link href="https://github.com/JoAdo07/cliparscam" className="hidden sm:inline rounded-full border border-[#2a2a3a] bg-[#14141c] px-4 py-2 text-sm font-semibold hover:bg-[#1a1a24]">GitHub</Link>
            <Link href="/chat" className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black hover:bg-zinc-100">Open CliparsCAM →</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ff3b30]/30 bg-[#ff3b30]/10 px-3 py-1 text-xs font-bold tracking-widest text-[#ff8a65]">LIVE RANDOM VIDEO CHAT</p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-[0.95]">
              Talk to <span className="bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] bg-clip-text text-transparent">strangers.</span><br />
              Make it random.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400 max-w-[48ch]">
              CliparsCAM is a free Omegle TV clone — instant WebRTC video, text chat, and interest matching. No signup. Powered by <b className="text-zinc-200">Supabase Realtime</b> + <b className="text-zinc-200">Vercel</b>.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/chat" className="rounded-2xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-7 py-4 font-black text-white shadow-xl shadow-red-500/20 hover:brightness-110">Start chatting →</Link>
              <Link href="/geo" className="rounded-2xl bg-white px-7 py-4 font-black text-black hover:bg-zinc-100">🌍 Play GeoGuess →</Link>
              <a href="#how" className="rounded-2xl border border-[#2a2a3a] bg-[#14141c] px-7 py-4 font-bold hover:bg-[#1a1a24]">How it works</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="rounded-full bg-[#14141c] border border-[#232333] px-3 py-1.5">✓ No account needed</span>
              <span className="rounded-full bg-[#14141c] border border-[#232333] px-3 py-1.5">✓ Peer-to-peer (no recording)</span>
              <span className="rounded-full bg-[#14141c] border border-[#232333] px-3 py-1.5">✓ Interests & Skip</span>
            </div>
          </div>

          {/* preview mock */}
          <div className="relative">
            <div className="rounded-[24px] border border-[#232333] bg-[#0f0f16] p-3 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center text-zinc-500 border border-[#232333]">You</div>
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#232333] grid place-items-center text-zinc-400 border border-[#2a2a3a] relative overflow-hidden">
                  Stranger
                  <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 h-11 rounded-xl bg-[#0a0a0f] border border-[#232333]" />
                <div className="h-11 w-24 rounded-xl bg-white grid place-items-center text-sm font-black text-black">Next ⟶</div>
              </div>
              <div className="mt-3 flex gap-2 text-[11px]">
                <span className="rounded-full bg-[#1a1a24] border border-[#232333] px-2.5 py-1">#music</span>
                <span className="rounded-full bg-[#1a1a24] border border-[#232333] px-2.5 py-1">#gaming</span>
                <span className="rounded-full bg-[#1a1a24] border border-[#232333] px-2.5 py-1">#france</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-2 hidden sm:block rounded-2xl bg-[#1a1a24] border border-[#2a2a3a] px-4 py-3 shadow-xl">
              <p className="text-xs font-bold tracking-widest text-zinc-400">LIVE NOW</p>
              <p className="text-sm font-black">Text + Video · WebRTC</p>
            </div>
          </div>
        </div>
      </section>

      {/* how */}
      <section id="how" className="mx-auto max-w-[1100px] px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "01", t: "Hit Start", d: "Allow camera & mic. Add interests to find better matches." },
            { n: "02", t: "Get matched", d: "Supabase presence finds another searching user instantly — then WebRTC connects you P2P." },
            { n: "03", t: "Chat or Next", d: "Text, video, mute, report — and Next to meet someone new in one click." },
          ].map(c => (
            <div key={c.n} className="rounded-2xl border border-[#232333] bg-[#0f0f16] p-6">
              <p className="text-xs font-black tracking-widest text-[#ff3b30]">{c.n}</p>
              <p className="mt-2 font-bold">{c.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          <b>18+ only.</b> No nudity, harassment, or illegal content. Be kind — violations = ban. WebRTC is peer-to-peer; we don’t record video.
        </div>
      </section>

      {/* geo promo */}
      <section className="mx-auto max-w-[1100px] px-4 pb-10">
        <div className="rounded-2xl border border-[#ff3b30]/30 bg-gradient-to-r from-[#ff3b30]/15 to-[#ff6b35]/10 p-6 flex flex-wrap items-center gap-4">
          <div className="text-4xl">🌍</div>
          <div className="flex-1 min-w-[220px]">
            <p className="font-black text-lg">New: CliparsGEO — GeoGuessr-style game</p>
            <p className="text-sm text-zinc-400 mt-1">Random Street View drop · 5 rounds · guess on the map · challenge strangers with a link. No API key needed.</p>
          </div>
          <Link href="/geo" className="rounded-xl bg-white px-6 py-3 font-black text-black">Play now →</Link>
        </div>
      </section>

      {/* stack */}
      <section className="mx-auto max-w-[1100px] px-4 pb-12">
        <div className="rounded-2xl border border-[#232333] bg-[#0f0f16] p-6">
          <p className="text-xs font-black tracking-widest text-zinc-400">STACK · SUPABASE · VERCEL · GITHUB</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl bg-[#0a0a0f] border border-[#232333] p-4">
              <p className="font-bold">Supabase</p>
              <p className="text-zinc-400 mt-1">Realtime presence & broadcast for matchmaking + signaling. Project: <code className="text-zinc-200">jbonyvhecqqnngqlmomh</code> (eu-west-1).</p>
            </div>
            <div className="rounded-xl bg-[#0a0a0f] border border-[#232333] p-4">
              <p className="font-bold">Vercel</p>
              <p className="text-zinc-400 mt-1">Next.js 14 on Vercel — free <code className="text-zinc-200">*.vercel.app</code> domain, auto-deploys from GitHub main.</p>
            </div>
            <div className="rounded-xl bg-[#0a0a0f] border border-[#232333] p-4">
              <p className="font-bold">GitHub</p>
              <p className="text-zinc-400 mt-1"><a className="underline" href="https://github.com/JoAdo07/cliparscam">JoAdo07/cliparscam</a> — Omarinho12345 invited as collaborator (push).</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/chat" className="rounded-xl bg-white px-6 py-3 font-black text-black">Launch app →</Link>
            <a href="https://github.com/JoAdo07/cliparscam" className="rounded-xl border border-[#2a2a3a] bg-[#14141c] px-6 py-3 font-bold">View code</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">© {new Date().getFullYear()} CliparsCAM — Talk to strangers, responsibly.</p>
      </section>
    </main>
  );
}
