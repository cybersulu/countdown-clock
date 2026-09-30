import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { BellRing, Volume2, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import type { CountdownEvent } from '../firebase';
import { stopContinuousAlarm } from '../utils/audio';

interface AlarmTriggerModalProps {
  event: CountdownEvent | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const AlarmTriggerModal: React.FC<AlarmTriggerModalProps> = ({
  event,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    if (!event) return;

    // Trigger celebratory confetti burst
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore in environments without canvas
    }

    return () => {
      stopContinuousAlarm();
    };
  }, [event]);

  if (!event) return null;

  const handleDismiss = () => {
    stopContinuousAlarm();
    onDismiss();
  };

  const handleSnooze = (mins: number) => {
    stopContinuousAlarm();
    onSnooze(mins);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-cyan-500/70 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(6,182,212,0.4)] text-center overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Ringing Bell Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
          <div className="absolute inset-0 rounded-2xl animate-ping bg-cyan-400/20" />
          <BellRing className="w-10 h-10 animate-bounce" />
        </div>

        <span className="block text-xs font-bold tracking-widest text-cyan-400 uppercase mb-2">
          Event Countdown Reached!
        </span>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight break-words">
          {event.title}
        </h2>

        {event.description && (
          <p className="text-slate-300 text-sm mb-6 max-h-24 overflow-y-auto px-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 py-2.5 px-4 mb-6 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Alarm: <span className="capitalize text-white font-semibold">{event.alarmSound}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-cyan-400" />
            Target: <span className="text-white font-semibold">00:00:00</span>
          </span>
        </div>

        {/* Snooze and Dismiss actions */}
        <div className="space-y-3">
          <button
            onClick={handleDismiss}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            Dismiss Alarm
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => handleSnooze(5)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Snooze 5 Min
            </button>
            <button
              onClick={() => handleSnooze(10)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Snooze 10 Min
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
