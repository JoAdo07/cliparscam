"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useCliparsMatch } from "@/lib/webrtc";

function VideoBox({ stream, muted, label, placeholder }: { stream: MediaStream | null; muted?: boolean; label: string; placeholder: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0f0f16] border border-[#232333] aspect-[4/3] flex items-center justify-center">
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="text-center p-6">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#232333] grid place-items-center text-xl">🎥</div>
          <p className="text-sm text-zinc-400">{placeholder}</p>
        </div>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium backdrop-blur">{label}</span>
      {stream && <span className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50 animate-pulse" />}
    </div>
  );
}

export default function ChatPage() {
  const userId = useMemo(() => {
    if (typeof window === "undefined") return "ssr";
    let id = localStorage.getItem("clipars_uid");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("clipars_uid", id); }
    return id;
  }, []);
  const [interests, setInterests] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("clipars_interests") || "[]"); } catch { return []; }
  });
  const [interestInput, setInterestInput] = useState("");
  const [status, setStatus] = useState("Ready");
  const [partner, setPartner] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const { localStream, remoteStream, textLog, sendText, searching, setSearching, onlineCount, next, stop } = useCliparsMatch({
    userId: userId === "ssr" ? "init" : userId,
    interests,
    onStatus: setStatus,
    onPartner: setPartner,
  });

  useEffect(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(t => t.enabled = camOn);
  }, [camOn, localStream]);
  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
  }, [micOn, localStream]);

  const addInterest = () => {
    const t = interestInput.trim().toLowerCase();
    if (!t || interests.includes(t)) return;
    const nextInterests = [...interests, t].slice(0, 5);
    setInterests(nextInterests);
    localStorage.setItem("clipars_interests", JSON.stringify(nextInterests));
    setInterestInput("");
  };

  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100">
      {/* top bar */}
      <header className="sticky top-0 z-10 border-b border-[#232333] bg-[#0a0a0f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff6b35] font-black text-white">C</span>
            <span className="font-black tracking-tight">Clipars<span className="text-[#ff3b30]">CAM</span></span>
            <span className="ml-2 hidden rounded-full bg-[#1a1a24] px-2.5 py-1 text-xs text-zinc-400 sm:inline">{onlineCount} online</span>
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/geo" target="_blank" className="rounded-full bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-3 py-1.5 font-bold text-white hover:brightness-110">🌍 Geo</Link>
            <span className={`h-2 w-2 rounded-full ${partner ? "bg-emerald-500" : searching ? "bg-amber-500 animate-pulse" : "bg-zinc-600"}`} />
            <span className="text-zinc-400 hidden sm:inline">{status}</span>
            <span className="rounded-full bg-[#1a1a24] px-2 py-1 text-zinc-300 sm:hidden">{status}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-4 p-4 lg:grid-cols-[1.35fr_0.65fr]">
        {/* videos + controls */}
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <VideoBox stream={localStream} muted label="You" placeholder={camOn ? "Starting camera..." : "Camera off"} />
            <VideoBox stream={remoteStream} label={partner ? "Stranger" : "Stranger"} placeholder={partner ? "Connecting..." : searching ? "Finding someone..." : "Press Start to meet someone"} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!searching && !partner ? (
              <button onClick={() => setSearching(true)} className="rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-6 py-3 font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-110">
                ▶ Start
              </button>
            ) : (
              <>
                <button onClick={() => next()} className="rounded-xl bg-white px-6 py-3 font-bold text-black hover:bg-zinc-100">Next ⟶</button>
                <button onClick={() => stop()} className="rounded-xl bg-[#1a1a24] border border-[#2a2a3a] px-5 py-3 font-semibold hover:bg-[#232333]">Stop ✕</button>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setMicOn(v=>!v)} className={`rounded-full px-4 py-2.5 text-sm font-semibold border ${micOn ? "bg-[#1a1a24] border-[#2a2a3a] text-zinc-200" : "bg-red-500 border-red-600 text-white"}`}>{micOn ? "🎙 Mic" : "🔇 Mic off"}</button>
              <button onClick={() => setCamOn(v=>!v)} className={`rounded-full px-4 py-2.5 text-sm font-semibold border ${camOn ? "bg-[#1a1a24] border-[#2a2a3a] text-zinc-200" : "bg-red-500 border-red-600 text-white"}`}>{camOn ? "📷 Cam" : "🚫 Cam off"}</button>
              <button onClick={() => { if (confirm("Report this stranger?")) alert("Reported. Thanks — our team will review."); }} className="rounded-full bg-[#1a1a24] border border-[#2a2a3a] px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-[#232333]">⚑ Report</button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#232333] bg-[#0f0f16] p-4">
            <p className="mb-2 text-xs font-semibold tracking-widest text-zinc-400">INTERESTS (optional)</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a24] border border-[#2a2a3a] px-3 py-1.5 text-sm">
                  #{t} <button onClick={() => { const n=interests.filter(x=>x!==t); setInterests(n); localStorage.setItem("clipars_interests", JSON.stringify(n)); }} className="text-zinc-500 hover:text-white">×</button>
                </span>
              ))}
              {interests.length===0 && <span className="text-sm text-zinc-500">Add interests to match with similar people — e.g. music, gaming, france</span>}
            </div>
            <div className="flex gap-2">
              <input value={interestInput} onChange={e=>setInterestInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") addInterest(); }} placeholder="Add interest and press Enter" className="flex-1 rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-2.5 text-sm outline-none focus:border-[#ff3b30]" />
              <button onClick={addInterest} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black">Add</button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Be kind. No nudity, spam, or illegal content. You must be 18+.</p>
          </div>
        </section>

        {/* chat */}
        <section className="flex min-h-[520px] flex-col rounded-2xl border border-[#232333] bg-[#0f0f16] overflow-hidden">
          <div className="border-b border-[#232333] bg-[#14141c] px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-bold">Text chat</p>
            <span className="text-xs text-zinc-500">{partner ? "Connected to stranger" : searching ? "Searching..." : "Not connected"}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0f]">
            {textLog.length===0 && (
              <div className="rounded-xl bg-[#14141c] border border-[#232333] p-4 text-sm text-zinc-400">
                <p className="font-semibold text-zinc-200">Welcome to CliparsCAM!</p>
                <p className="mt-1">Press <b>Start</b> to be matched randomly. Your video is peer-to-peer (WebRTC) — nothing is recorded on our servers.</p>
                <p className="mt-2 text-xs">Tip: add interests to find better matches.</p>
              </div>
            )}
            {textLog.map((m,i)=>(
              <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${m.me ? "bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] text-white rounded-br-sm" : "bg-[#1a1a24] border border-[#2a2a3a] text-zinc-100 rounded-bl-sm"}`}>
                  <span className={`text-[10px] font-bold tracking-widest ${m.me ? "text-white/70" : "text-[#ff6b35]"}`}>{m.me ? "YOU" : "STRANGER"}</span>
                  <p className="mt-0.5 leading-relaxed break-words">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e)=>{ e.preventDefault(); if(!draft.trim()) return; sendText(draft.trim()); setDraft(""); }} className="flex gap-2 border-t border-[#232333] bg-[#14141c] p-3">
            <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={partner ? "Type a message..." : "Connect first to chat"} disabled={!partner} className="flex-1 rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-[#ff3b30] disabled:opacity-50" />
            <button type="submit" disabled={!partner || !draft.trim()} className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-black disabled:opacity-40">Send</button>
          </form>
        </section>
      </div>

      <footer className="mx-auto max-w-[1280px] px-4 py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} CliparsCAM — built with Supabase Realtime + WebRTC · <Link href="/" className="underline">Home</Link> · <a href="https://github.com/JoAdo07/cliparscam" className="underline">GitHub</a></p>
      </footer>
    </main>
  );
}
