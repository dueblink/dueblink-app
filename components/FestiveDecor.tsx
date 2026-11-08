'use client';

import React from 'react';

// ============================================================
// FESTIVE DECOR — light, festive touches in the landing page hero,
// shown only during a festival (turned on by HomeClient).
// - Drawn with code (SVG/CSS), no images, so the page stays fast.
// - Never covers text or buttons (sits behind the hero content).
// - Fewer pieces on phones, and no movement for people who turn off
//   motion on their device.
// ============================================================

type FestivalType =
  | 'independence'
  | 'republic'
  | 'eid-fitr'
  | 'eid-adha'
  | 'diwali'
  | 'holi'
  | 'christmas';

// Fixed positions (no random numbers, so server and browser match).
const BULBS = Array.from({ length: 17 }, (_, i) => i / 16); // 0 … 1 along the string
const BULB_COLORS = ['#F59E0B', '#FB923C', '#FCD34D', '#F97316'];
const SPARKS = [
  { l: 6, t: 30, d: 0 }, { l: 18, t: 62, d: 1.2 }, { l: 30, t: 18, d: 0.6 }, { l: 44, t: 74, d: 1.8 },
  { l: 58, t: 26, d: 0.3 }, { l: 70, t: 66, d: 1.5 }, { l: 82, t: 22, d: 0.9 }, { l: 94, t: 58, d: 2.1 },
  { l: 12, t: 84, d: 1.1 }, { l: 88, t: 86, d: 0.4 },
];
const FLAKES = Array.from({ length: 22 }, (_, i) => ({
  l: (i * 47) % 100,
  size: 4 + (i % 3) * 2,
  dur: 9 + (i % 5) * 2,
  delay: -((i * 1.7) % 12),
}));

// Wire of the light string: two gentle swags across the top.
// y(t) = 6 + 120·t·(1−t) for each swag (matches the SVG curve).
function bulbY(position: number) {
  const t = (position * 2) % 1 || (position === 1 ? 1 : 0);
  return 6 + 120 * t * (1 - t);
}

function Diya({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="44" height="42" viewBox="0 0 34 32" aria-hidden="true">
      <g className="fd-flame" style={{ transformOrigin: '17px 20px' }}>
        <path d="M17 3C13.8 7 14.2 9.7 16.1 11.5C17.5 10.3 18.5 8.8 18 6.5C21.2 9.7 21.7 13.3 19.3 15.4C17.2 17.2 13.5 15.8 13.5 12.8C10.9 16.1 12.2 20 17 20C21.7 20 23 16.2 20.7 12.9C23.2 9.5 20.7 5.2 17 3Z" fill="#F59E0B" />
        <path d="M17 9C15.6 11 15.6 13 17 14.3C18.4 13.2 18.6 11.4 17 9Z" fill="#FFF7ED" />
      </g>
      <path d="M7 20C9.5 25.2 13.1 28 17 28C20.9 28 24.5 25.2 27 20C21.2 22.1 12.8 22.1 7 20Z" fill="#D97706" />
      <path d="M10 22.1C13.8 23.1 20.2 23.1 24 22.1" fill="none" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Lantern() {
  return (
    <svg width="30" height="52" viewBox="0 0 30 52" aria-hidden="true">
      <path d="M15 0V10" stroke="#94A3B8" strokeWidth="1" />
      <path d="M9 10H21L19 14H11Z" fill="#245B92" />
      <path d="M10 14H20C22 20 22 32 20 38H10C8 32 8 20 10 14Z" fill="#FDE68A" opacity="0.9" />
      <path d="M10 14H20C22 20 22 32 20 38H10C8 32 8 20 10 14Z" fill="none" stroke="#245B92" strokeWidth="1.4" />
      <path d="M15 14V38M12 14C11 22 11 30 12 38M18 14C19 22 19 30 18 38" stroke="#245B92" strokeWidth="0.8" opacity="0.7" />
      <path d="M9 38H21L19 42H11Z" fill="#245B92" />
      <path d="M15 42V48" stroke="#20B8BE" strokeWidth="1.2" />
      <circle cx="15" cy="49.5" r="1.8" fill="#20B8BE" />
    </svg>
  );
}

export default function FestiveDecor({ type }: { type: FestivalType | string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden" suppressHydrationWarning={true}>
      <style>{`
        @keyframes fd-twinkle { 0%,100% { opacity: .55; transform: scale(.9) } 50% { opacity: 1; transform: scale(1.1) } }
        @keyframes fd-flicker { 0%,100% { transform: scale(1) rotate(-2deg) } 50% { transform: scale(1.06,1.1) rotate(2deg) } }
        @keyframes fd-float { 0%,100% { transform: translate(0,0) } 50% { transform: translate(0,-14px) } }
        @keyframes fd-swing { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
        @keyframes fd-fall { 0% { transform: translateY(-20px) } 100% { transform: translateY(110vh) } }
        @keyframes fd-sway { 0%,100% { margin-left: 0 } 50% { margin-left: 14px } }
        .fd-bulb { animation: fd-twinkle 2.4s ease-in-out infinite }
        .fd-flame { animation: fd-flicker 1.6s ease-in-out infinite }
        .fd-float { animation: fd-float 7s ease-in-out infinite }
        .fd-swing { animation: fd-swing 4s ease-in-out infinite; transform-origin: top center }
        .fd-spark { animation: fd-twinkle 3s ease-in-out infinite }
        .fd-flake { animation: fd-fall linear infinite, fd-sway 4s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .fd-bulb, .fd-flame, .fd-float, .fd-swing, .fd-spark, .fd-flake { animation: none !important }
        }
      `}</style>

      {/* 🪔 DIWALI — a string of lights across the top, warm glow, diyas */}
      {type === 'diwali' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[72px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 72" preserveAspectRatio="none">
              <path d="M0 6 Q250 66 500 6 Q750 66 1000 6" fill="none" stroke="#CBD5E1" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </svg>
            {BULBS.map((p, i) => (
              <span
                key={i}
                className={`fd-bulb absolute rounded-full ${i % 2 ? 'hidden sm:block' : ''}`}
                style={{
                  left: `calc(${p * 100}% - 4px)`,
                  top: `${bulbY(p) - 1}px`,
                  width: 8,
                  height: 10,
                  background: BULB_COLORS[i % BULB_COLORS.length],
                  boxShadow: `0 0 10px 3px ${BULB_COLORS[i % BULB_COLORS.length]}66`,
                  animationDelay: `${(i % 4) * 0.5}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute -left-24 bottom-0 w-72 h-72 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -right-24 bottom-10 w-72 h-72 rounded-full bg-orange-300/20 blur-3xl" />
          <Diya className="hidden md:block absolute left-[6%] bottom-10 fd-float" />
          <Diya className="hidden md:block absolute right-[6%] bottom-16 fd-float" />
        </>
      )}

      {/* 🎨 HOLI — soft colour splashes in the corners, little powder dots */}
      {type === 'holi' && (
        <>
          <div className="fd-float absolute -left-20 -top-16 w-72 h-72 rounded-full bg-pink-400/20 blur-3xl" />
          <div className="fd-float absolute -right-16 top-10 w-64 h-64 rounded-full bg-purple-400/20 blur-3xl" style={{ animationDelay: '-2s' }} />
          <div className="fd-float absolute left-[10%] -bottom-20 w-64 h-64 rounded-full bg-amber-300/25 blur-3xl" style={{ animationDelay: '-4s' }} />
          <div className="fd-float hidden sm:block absolute right-[12%] -bottom-16 w-60 h-60 rounded-full bg-emerald-300/20 blur-3xl" style={{ animationDelay: '-1s' }} />
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className={`fd-spark absolute rounded-full ${i > 5 ? 'hidden sm:block' : ''}`}
              style={{ left: `${s.l}%`, top: `${s.t}%`, width: 7, height: 7, background: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#0EA5E9'][i % 5], opacity: 0.7, animationDelay: `${s.d}s` }}
            />
          ))}
        </>
      )}

      {/* 🌙 EID — hanging lanterns and twinkling stars */}
      {(type === 'eid-fitr' || type === 'eid-adha') && (
        <>
          <div className="fd-swing absolute top-0 left-[6%]"><Lantern /></div>
          <div className="hidden sm:block absolute top-0 left-[14%]" style={{ transform: 'scale(.8)', transformOrigin: 'top center' }}><div className="fd-swing" style={{ animationDelay: '-1.5s' }}><Lantern /></div></div>
          <div className="fd-swing absolute top-0 right-[6%]" style={{ animationDelay: '-2s' }}><Lantern /></div>
          {SPARKS.slice(0, 8).map((s, i) => (
            <svg key={i} className={`fd-spark absolute ${i > 4 ? 'hidden sm:block' : ''}`} style={{ left: `${s.l}%`, top: `${s.t * 0.6}%`, animationDelay: `${s.d}s` }} width="10" height="10" viewBox="0 0 10 10">
              <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z" fill="#20B8BE" opacity="0.6" />
            </svg>
          ))}
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#20B8BE]/10 blur-3xl" />
        </>
      )}

      {/* 🎄 CHRISTMAS — gentle snowfall and a soft festive glow */}
      {type === 'christmas' && (
        <>
          {FLAKES.map((f, i) => (
            <span
              key={i}
              className={`fd-flake absolute rounded-full bg-sky-200 ${i % 2 ? 'hidden sm:block' : ''}`}
              style={{ left: `${f.l}%`, top: -20, width: f.size, height: f.size, opacity: 0.8, animationDuration: `${f.dur}s, 4s`, animationDelay: `${f.delay}s, ${f.delay}s` }}
            />
          ))}
          <div className="absolute -left-24 bottom-0 w-72 h-72 rounded-full bg-red-300/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 w-72 h-72 rounded-full bg-emerald-300/15 blur-3xl" />
        </>
      )}

      {/* 🇮🇳 INDEPENDENCE / REPUBLIC DAY — tricolour ribbon and confetti */}
      {(type === 'independence' || type === 'republic') && (
        <>
          <div className="absolute inset-x-0 top-0 flex flex-col">
            <span className="h-[3px] bg-[#FF9933]" />
            <span className="h-[3px] bg-white" />
            <span className="h-[3px] bg-[#138808]" />
          </div>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className={`fd-float absolute rounded-sm ${i > 5 ? 'hidden sm:block' : ''}`}
              style={{ left: `${s.l}%`, top: `${s.t}%`, width: 8, height: 4, background: i % 2 ? '#FF9933' : '#138808', opacity: 0.55, transform: `rotate(${i * 37}deg)`, animationDelay: `${-s.d * 2}s` }}
            />
          ))}
          <div className="absolute -left-24 -top-24 w-72 h-72 rounded-full bg-[#FF9933]/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 w-72 h-72 rounded-full bg-[#138808]/10 blur-3xl" />
        </>
      )}
    </div>
  );
}
