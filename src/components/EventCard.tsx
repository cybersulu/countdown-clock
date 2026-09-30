import React, { useState, useEffect } from 'react';
import {
  Pin,
  Calendar,
  Volume2,
  VolumeX,
  Play,
  Square,
  MoreVertical,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import type { CountdownEvent } from '../firebase';
import { calculatePreciseCountdown, formatFriendlyDateTime } from '../utils/countdown';
import { CountdownDigit } from './CountdownDigit';
import { playAlarmSound } from '../utils/audio';

interface EventCardProps {
  event: CountdownEvent;
  isHero: boolean;
  canManage: boolean;
  onSetHero: (event: CountdownEvent) => void;
  onEdit: (event: CountdownEvent) => void;
  onDelete: (eventId: string) => void;
  onTogglePin: (event: CountdownEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isHero,
  canManage,
  onSetHero,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const [now, setNow] = useState(new Date());
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = calculatePreciseCountdown(event.targetDate, now);

  const handleTestAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playAlarmSound(event.alarmSound, event.alarmVolume ?? 0.8);
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  const eventColor = event.color || 'cyan';

  return (
    <div
      onClick={() => onSetHero(event)}
      className={`group relative rounded-2xl p-5 md:p-6 transition-all duration-300 cursor-pointer border ${
        isHero
          ? 'bg-slate-900/90 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg hover:shadow-xl'
      }`}
    >
      {/* Top action row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {event.isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Pin className="w-3 h-3 rotate-45" /> Pinned
              </span>
            )}
            {event.category && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {event.category}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                countdown.isPast
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
              }`}
            >
              {countdown.isPast ? 'Elapsed' : 'Active'}
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition-colors">
            {event.title}
          </h3>
        </div>

        {/* Options Menu & Sound Test */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTestAudio}
            title={`Preview alarm sound: ${event.alarmSound}`}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isPlayingAudio ? (
              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            ) : (
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            )}
          </button>

          {canManage && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-1 z-30 animate-fade-in"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onTogglePin(event);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                    {event.isPinned ? 'Unpin Event' : 'Pin to Top'}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(event);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    Edit Event
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(event.id);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {event.description && (
        <p className="text-slate-400 text-xs mb-4 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* 6-Unit Countdown Grid */}
      <div className="grid grid-cols-6 gap-1.5 md:gap-2 mb-4">
        <CountdownDigit value={countdown.years} label="Yrs" size="sm" color={eventColor} isPast={countdown.isPast} />
        <CountdownDigit value={countdown.months} label="Mos" size="sm" color={eventColor} isPast={countdown.isPast} />
        <CountdownDigit value={countdown.days} label="Days" size="sm" color={eventColor} isPast={countdown.isPast} />
        <CountdownDigit value={countdown.hours} label="Hrs" size="sm" color={eventColor} isPast={countdown.isPast} />
        <CountdownDigit value={countdown.minutes} label="Min" size="sm" color={eventColor} isPast={countdown.isPast} />
        <CountdownDigit value={countdown.seconds} label="Sec" size="sm" color={eventColor} isPast={countdown.isPast} />
      </div>

      {/* Target Date and Audio Indicator */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
        <span className="flex items-center gap-1.5 truncate max-w-[200px]">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{formatFriendlyDateTime(event.targetDate)}</span>
        </span>

        <span className="flex items-center gap-1 flex-shrink-0">
          {event.alarmEnabled ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Volume2 className="w-3 h-3" />
              <span className="capitalize">{event.alarmSound}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <VolumeX className="w-3 h-3" />
              <span>Muted</span>
            </span>
          )}
        </span>
      </div>

      {isHero && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/50">
          <Sparkles className="w-3 h-3" /> Centerpiece
        </div>
      )}
    </div>
  );
};
