import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Square,
  Pin,
  Calendar,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import type { CountdownEvent } from '../firebase';
import { calculatePreciseCountdown, formatFriendlyDateTime } from '../utils/countdown';
import { CountdownDigit } from './CountdownDigit';
import { playAlarmSound } from '../utils/audio';

interface HeroCountdownProps {
  event: CountdownEvent | null;
  onEdit?: (event: CountdownEvent) => void;
  canEdit?: boolean;
}

export const HeroCountdown: React.FC<HeroCountdownProps> = ({ event, onEdit, canEdit }) => {
  const [now, setNow] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!event) {
    return (
      <div className="w-full rounded-3xl p-12 text-center bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Countdown</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Add an event countdown or pin one from the list to display in the centerpiece clock.
        </p>
      </div>
    );
  }

  const countdown = calculatePreciseCountdown(event.targetDate, now);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleTestAudio = () => {
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      playAlarmSound(event.alarmSound, event.alarmVolume ?? 0.8);
      setTimeout(() => setIsPlayingPreview(false), 2000);
    }
  };

  const handleShare = () => {
    const text = `Countdown to "${event.title}": ${countdown.formattedString} (${formatFriendlyDateTime(event.targetDate)})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventColor = event.color || 'cyan';

  return (
    <div
      className={`relative w-full rounded-3xl p-6 md:p-10 transition-all duration-300 overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none flex flex-col justify-center items-center bg-slate-950 p-8'
          : 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-xl'
      }`}
    >
      {/* Ambient Radial Lighting Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8 relative z-10 w-full max-w-6xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {event.isPinned && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Pin className="w-3.5 h-3.5 rotate-45" /> Featured Spotlight
            </span>
          )}
          {event.category && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700/60 text-slate-300">
              {event.category}
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              countdown.isPast
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
            }`}
          >
            {countdown.isPast ? 'Target Reached (Elapsed)' : 'Live Countdown'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestAudio}
            title={`Preview alarm sound: ${event.alarmSound}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            {isPlayingPreview ? (
              <>
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Playing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span className="capitalize">Sound: {event.alarmSound}</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            title="Copy countdown summary"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
            >
              Edit Event
            </button>
          )}
        </div>
      </div>

      {/* Center Event Title and Date */}
      <div className="text-center mb-8 relative z-10 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-3 break-words drop-shadow-md">
          {event.title}
        </h1>
        {event.description && (
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-4 font-normal">
            {event.description}
          </p>
        )}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs md:text-sm text-slate-400">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Target: <strong className="text-slate-200">{formatFriendlyDateTime(event.targetDate)}</strong></span>
        </div>
      </div>

      {/* The 6 Big Countdown Digits: Years, Months, Days, Hours, Minutes, Seconds */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5 relative z-10 w-full max-w-5xl mx-auto mb-6">
        <CountdownDigit
          value={countdown.years}
          label="Years"
          size={isFullscreen ? 'xl' : 'lg'}
          color={eventColor}
          isPast={countdown.isPast}
        />
        <CountdownDigit
          value={countdown.months}
          label="Months"
          size={isFullscreen ? 'xl' : 'lg'}
          color={eventColor}
          isPast={countdown.isPast}
        />
        <CountdownDigit
          value={countdown.days}
          label="Days"
          size={isFullscreen ? 'xl' : 'lg'}
          color={eventColor}
          isPast={countdown.isPast}
        />
        <CountdownDigit
          value={countdown.hours}
          label="Hours"
          size={isFullscreen ? 'xl' : 'lg'}
          color={eventColor}
          isPast={countdown.isPast}
        />
        <CountdownDigit
          value={countdown.minutes}
          label="Minutes"
          size={isFullscreen ? 'xl' : 'lg'}
          color={eventColor}
          isPast={countdown.isPast}
        />
        <CountdownDigit
          value={countdown.seconds}
          label="Seconds"
          size={isFullscreen ? 'xl' : 'lg'}
          color={eventColor}
          isPast={countdown.isPast}
        />
      </div>

      {/* Footer Meta bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 relative z-10 w-full max-w-5xl mx-auto pt-4 border-t border-slate-800/80">
        <span className="flex items-center gap-1.5">
          {event.alarmEnabled ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Volume2 className="w-3.5 h-3.5" /> Alarm Armed ({event.alarmSound} at {Math.round((event.alarmVolume ?? 0.8) * 100)}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <VolumeX className="w-3.5 h-3.5" /> Alarm Muted
            </span>
          )}
        </span>

        <span className="text-slate-400">
          Created by <span className="text-slate-300 font-medium">{event.createdByEmail}</span>
        </span>
      </div>
    </div>
  );
};
