'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getSeasonalEvent,
  SeasonalEvent,
} from '@/lib/seasonalEvents';

export default function SeasonalBanner() {
  const [event, setEvent] =
    useState<SeasonalEvent | null>(null);

  useEffect(() => {
    setEvent(getSeasonalEvent());
  }, []);

  // Normal days
  if (!event) {
    return null;
  }

  const isIndiaEvent =
    event.type === 'independence' ||
    event.type === 'republic';

  const isEid =
    event.type === 'eid-fitr' ||
    event.type === 'eid-adha';

  const isDiwali =
    event.type === 'diwali';

  const isHoli =
    event.type === 'holi';

  const isChristmas =
    event.type === 'christmas';

  // =========================================================
  // INDIA FLAG
  // =========================================================

  const IndiaFlag = () => (
    <svg
      width="34"
      height="26"
      viewBox="0 0 34 26"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Indian flag"
      role="img"
    >
      {/* Flag */}
      <rect
        x="1"
        y="1"
        width="32"
        height="8"
        rx="1"
        fill="#FF9933"
      />

      <rect
        x="1"
        y="9"
        width="32"
        height="8"
        fill="#FFFFFF"
      />

      <rect
        x="1"
        y="17"
        width="32"
        height="8"
        rx="1"
        fill="#138808"
      />

      {/* Ashoka Chakra */}
      <circle
        cx="17"
        cy="13"
        r="3"
        fill="none"
        stroke="#245B92"
        strokeWidth="0.9"
      />

      <circle
        cx="17"
        cy="13"
        r="0.6"
        fill="#245B92"
      />

      {/* Chakra spokes */}
      <g
        stroke="#245B92"
        strokeWidth="0.45"
        strokeLinecap="round"
      >
        <line x1="17" y1="9.8" x2="17" y2="16.2" />
        <line x1="13.8" y1="13" x2="20.2" y2="13" />
        <line x1="14.7" y1="10.7" x2="19.3" y2="15.3" />
        <line x1="19.3" y1="10.7" x2="14.7" y2="15.3" />
      </g>

      {/* Border */}
      <rect
        x="1"
        y="1"
        width="32"
        height="24"
        rx="1"
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="0.7"
      />
    </svg>
  );

  // =========================================================
  // EID ICON — CRESCENT + STAR
  // =========================================================

  const EidIcon = () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Eid"
      role="img"
    >
      {/* Crescent */}
      <path
        d="M21.8 5.2
           C14.8 6.1 10.3 11.2 10.3 17
           C10.3 22.8 14.8 27.2 20.4 27.2
           C22.2 27.2 23.9 26.7 25.4 25.8
           C22.8 29.2 18.8 30.2 15.1 28.8
           C9.8 26.8 6.7 21.8 7.2 16.3
           C7.8 10.4 12.2 5.8 17.8 4.9
           C19.2 4.7 20.5 4.8 21.8 5.2Z"
        fill="#245B92"
      />

      {/* Star */}
      <path
        d="M24.8 6.3
           L25.7 8.4
           L28 8.6
           L26.3 10.1
           L26.8 12.4
           L24.8 11.2
           L22.8 12.4
           L23.3 10.1
           L21.6 8.6
           L23.9 8.4Z"
        fill="#20B8BE"
      />
    </svg>
  );

  // =========================================================
  // DIWALI ICON — DIYA + FLAME
  // =========================================================

  const DiwaliIcon = () => (
    <svg
      width="34"
      height="32"
      viewBox="0 0 34 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Diwali diya"
      role="img"
    >
      {/* Flame outer */}
      <path
        d="M17 3
           C13.8 7
           14.2 9.7
           16.1 11.5
           C17.5 10.3
           18.5 8.8
           18 6.5
           C21.2 9.7
           21.7 13.3
           19.3 15.4
           C17.2 17.2
           13.5 15.8
           13.5 12.8
           C10.9 16.1
           12.2 20
           17 20
           C21.7 20
           23 16.2
           20.7 12.9
           C23.2 9.5
           20.7 5.2
           17 3Z"
        fill="#F59E0B"
      />

      {/* Inner flame */}
      <path
        d="M17 9
           C15.6 11
           15.6 13
           17 14.3
           C18.4 13.2
           18.6 11.4
           17 9Z"
        fill="#FFF7ED"
      />

      {/* Diya bowl */}
      <path
        d="M7 20
           C9.5 25.2
           13.1 28
           17 28
           C20.9 28
           24.5 25.2
           27 20
           C21.2 22.1
           12.8 22.1 7 20Z"
        fill="#D97706"
      />

      {/* Bowl highlight */}
      <path
        d="M10 22.1
           C13.8 23.1
           20.2 23.1
           24 22.1"
        fill="none"
        stroke="#FBBF24"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );

  // =========================================================
  // HOLI ICON — COLOR SPLASH
  // =========================================================

  const HoliIcon = () => (
    <svg
      width="34"
      height="32"
      viewBox="0 0 34 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Holi colors"
      role="img"
    >
      {/* Palette */}
      <path
        d="M17 4
           C9.5 4 4 9.1 4 15.5
           C4 21.6 9.1 26 15.4 26
           H18
           C20.2 26 21.2 23.1 19.5 21.7
           C18.1 20.5 19.2 18.2 21.1 18.2
           H22.5
           C27 18.2 30 15.4 30 11.9
           C30 7.5 24.5 4 17 4Z"
        fill="#EC4899"
      />

      {/* Color circles */}
      <circle
        cx="11"
        cy="13"
        r="2.1"
        fill="#F59E0B"
      />

      <circle
        cx="16.5"
        cy="10"
        r="2"
        fill="#8B5CF6"
      />

      <circle
        cx="21.5"
        cy="12.5"
        r="2"
        fill="#10B981"
      />

      <circle
        cx="14"
        cy="18"
        r="2"
        fill="#EF4444"
      />

      {/* Splash dots */}
      <circle
        cx="27"
        cy="6"
        r="1.5"
        fill="#F59E0B"
      />

      <circle
        cx="30"
        cy="4"
        r="1"
        fill="#8B5CF6"
      />

      <circle
        cx="26"
        cy="23"
        r="1.2"
        fill="#10B981"
      />
    </svg>
  );

  // =========================================================
  // CHRISTMAS ICON — TREE
  // =========================================================

  const ChristmasIcon = () => (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Christmas tree"
      role="img"
    >
      {/* Star */}
      <path
        d="M17 2
           L18.5 5.4
           L22.2 5.7
           L19.4 8
           L20.3 11.6
           L17 9.7
           L13.7 11.6
           L14.6 8
           L11.8 5.7
           L15.5 5.4Z"
        fill="#F59E0B"
      />

      {/* Tree */}
      <path
        d="M17 8
           L10.5 17
           H13
           L8.5 23
           H12
           L7 29
           H27
           L22 23
           H25.5
           L21 17
           H23.5
           Z"
        fill="#059669"
      />

      {/* Tree trunk */}
      <rect
        x="15"
        y="27"
        width="4"
        height="4"
        rx="0.7"
        fill="#92400E"
      />

      {/* Decorations */}
      <circle
        cx="14"
        cy="18"
        r="1.2"
        fill="#EF4444"
      />

      <circle
        cx="20"
        cy="21"
        r="1.2"
        fill="#F59E0B"
      />

      <circle
        cx="15"
        cy="24"
        r="1.2"
        fill="#3B82F6"
      />
    </svg>
  );

  // =========================================================
  // FESTIVAL ICON SELECTOR
  // =========================================================

  const renderFestivalIcon = () => {
    switch (event.type) {
      case 'independence':
      case 'republic':
        return <IndiaFlag />;

      case 'eid-fitr':
      case 'eid-adha':
        return <EidIcon />;

      case 'diwali':
        return <DiwaliIcon />;

      case 'holi':
        return <HoliIcon />;

      case 'christmas':
        return <ChristmasIcon />;

      default:
        return null;
    }
  };

  // =========================================================
  // BACKGROUND
  // =========================================================

  const backgroundClass = isEid
    ? 'bg-gradient-to-r from-slate-50 via-white to-cyan-50'
    : isDiwali
      ? 'bg-gradient-to-r from-amber-50 via-white to-orange-50'
      : isHoli
        ? 'bg-gradient-to-r from-pink-50 via-white to-purple-50'
        : isChristmas
          ? 'bg-gradient-to-r from-red-50 via-white to-emerald-50'
          : 'bg-gradient-to-r from-orange-50 via-white to-emerald-50';

  // =========================================================
  // ICON BACKGROUND
  // =========================================================

  const iconBackground = isEid
    ? 'bg-cyan-50'
    : isDiwali
      ? 'bg-amber-100/70'
      : isHoli
        ? 'bg-pink-100/70'
        : isChristmas
          ? 'bg-emerald-100/70'
          : 'bg-white/80';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        ease: 'easeOut',
      }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Seasonal background */}

      <div
        className={`absolute inset-0 pointer-events-none ${backgroundClass}`}
      />

      {/* Soft glow */}

      <div
        className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-30 ${
          isEid
            ? 'bg-cyan-300'
            : isDiwali
              ? 'bg-amber-300'
              : isHoli
                ? 'bg-pink-300'
                : isChristmas
                  ? 'bg-emerald-300'
                  : 'bg-orange-300'
        }`}
      />

      {/* Main content */}

      <div className="relative px-4 sm:px-5 py-4 flex items-center gap-4">

        {/* Festival icon */}

        <motion.div
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBackground}`}
        >
          {renderFestivalIcon()}
        </motion.div>

        {/* Text */}

        <div className="min-w-0">

          <h3 className="text-sm sm:text-[15px] font-black text-slate-900">
            {event.greeting.replace(
              /[^\p{L}\p{N}\s&'-]/gu,
              ''
            )}
          </h3>

          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
            {event.subtitle}
          </p>

        </div>

      </div>

      {/* =====================================================
          BOTTOM SEASONAL ACCENT
          ===================================================== */}

      {isIndiaEvent && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] flex">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>
      )}

      {isEid && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#245B92] via-[#20B8BE] to-[#245B92]" />
      )}

      {isDiwali && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400" />
      )}

      {isHoli && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-400 via-purple-400 to-orange-400" />
      )}

      {isChristmas && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 via-white to-emerald-500" />
      )}
    </motion.div>
  );
}
