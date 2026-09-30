import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Volume2,
  Play,
  Square,
  Sparkles,
  Pin,
  Clock,
  Palette,
  Tag,
} from 'lucide-react';
import type { CountdownEvent } from '../firebase';
import { ALARM_SOUND_OPTIONS, type AlarmSoundType, playAlarmSound } from '../utils/audio';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CountdownEvent, 'id' | 'createdByUid' | 'createdByEmail' | 'createdAt'>) => Promise<void>;
  initialEvent?: CountdownEvent | null;
}

const COLOR_OPTIONS = [
  { id: 'cyan', label: 'Cyan Glow', bg: 'bg-cyan-500', ring: 'ring-cyan-400' },
  { id: 'emerald', label: 'Emerald Glow', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { id: 'amber', label: 'Amber Glow', bg: 'bg-amber-500', ring: 'ring-amber-400' },
  { id: 'rose', label: 'Rose Glow', bg: 'bg-rose-500', ring: 'ring-rose-400' },
  { id: 'purple', label: 'Purple Glow', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'blue', label: 'Blue Glow', bg: 'bg-blue-500', ring: 'ring-blue-400' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState('cyan');
  const [alarmSound, setAlarmSound] = useState<AlarmSoundType>('chime');
  const [alarmVolume, setAlarmVolume] = useState(0.8);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewingSound, setPreviewingSound] = useState<AlarmSoundType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description || '');
      // Format to datetime-local string (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(initialEvent.targetDate);
        const pad = (n: number) => (n < 10 ? `0${n}` : n);
        const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setTargetDate(localIso);
      } catch {
        setTargetDate('');
      }
      setCategory(initialEvent.category || 'Personal');
      setColor(initialEvent.color || 'cyan');
      setAlarmSound(initialEvent.alarmSound || 'chime');
      setAlarmVolume(initialEvent.alarmVolume ?? 0.8);
      setAlarmEnabled(initialEvent.alarmEnabled ?? true);
      setIsPinned(initialEvent.isPinned ?? false);
    } else {
      // Default to 1 week from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      defaultDate.setMinutes(0);
      defaultDate.setSeconds(0);
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
      const localIso = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

      setTitle('');
      setDescription('');
      setTargetDate(localIso);
      setCategory('Personal');
      setColor('cyan');
      setAlarmSound('chime');
      setAlarmVolume(0.8);
      setAlarmEnabled(true);
      setIsPinned(false);
    }
    setError(null);
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleTestSound = (sound: AlarmSoundType) => {
    setPreviewingSound(sound);
    playAlarmSound(sound, alarmVolume);
    setTimeout(() => {
      setPreviewingSound((current) => (current === sound ? null : current));
    }, 1800);
  };

  const applyPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setMinutes(0);
    d.setSeconds(0);
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    setTargetDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const applyNewYearsPreset = () => {
    const nextYear = new Date().getFullYear() + 1;
    setTargetDate(`${nextYear}-01-01T00:00`);
    if (!title) setTitle(`New Year ${nextYear}`);
    if (category === 'Personal') setCategory('Holiday');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the countdown event.');
      return;
    }

    if (!targetDate) {
      setError('Please select a valid target date and time.');
      return;
    }

    const isoTarget = new Date(targetDate).toISOString();

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        targetDate: isoTarget,
        category: category.trim(),
        color,
        alarmSound,
        alarmVolume,
        alarmEnabled,
        isPinned,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save event';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {initialEvent ? 'Edit Countdown Event' : 'Create Countdown Event'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set precise timing in years, months, days, hours, and seconds with customizable alarms.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Custom Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Event Title <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g., Space Exploration Launch, Product V2, My Birthday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Target Date & Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Target Date & Time <span className="text-cyan-400">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400">
                <Clock className="w-3 h-3" />
                <span>Local Timezone</span>
              </div>
            </div>

            <input
              type="datetime-local"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />

            {/* Quick Timing Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset(1)}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                +24 Hours
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => applyPreset(365)}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={applyNewYearsPreset}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 cursor-pointer"
              >
                🎉 New Year
              </button>
            </div>
          </div>

          {/* Category & Accent Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" /> Category
              </label>
              <input
                type="text"
                maxLength={40}
                placeholder="Personal, Work, Milestone..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" /> Color Accent
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-transform cursor-pointer ${
                      color === c.id ? `scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900` : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Add key milestones, reminders, or goals for this countdown..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Customizable Alarm Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Customizable Alarm
              </span>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alarmEnabled}
                  onChange={(e) => setAlarmEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                <span className="text-xs text-slate-300">
                  {alarmEnabled ? 'Armed' : 'Disabled'}
                </span>
              </label>
            </div>

            {alarmEnabled && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                    Alarm Sound Profile
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALARM_SOUND_OPTIONS.map((snd) => (
                      <div
                        key={snd.id}
                        onClick={() => setAlarmSound(snd.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          alarmSound === snd.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-white'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <p className="font-semibold truncate">{snd.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSound(snd.id);
                          }}
                          title="Preview sound"
                          className="p-1 rounded-md bg-slate-700 hover:bg-slate-600 text-cyan-300 flex-shrink-0"
                        >
                          {previewingSound === snd.id ? (
                            <Square className="w-3 h-3 fill-cyan-400" />
                          ) : (
                            <Play className="w-3 h-3 fill-cyan-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Alarm Volume</span>
                    <span className="font-semibold text-slate-200">{Math.round(alarmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={alarmVolume}
                    onChange={(e) => setAlarmVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* Pin to Hero Spotlight */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-400" /> Pin to Spotlight (Centerpiece)
            </span>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialEvent ? 'Update Countdown' : 'Create Countdown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
