/**
 * Web Audio API synthesizer for customizable event alarms
 * Works out-of-the-box in modern browsers without needing external audio file downloads.
 */

export type AlarmSoundType = 'chime' | 'bell' | 'urgent' | 'fanfare' | 'zen' | 'radar';

export interface SoundOption {
  id: AlarmSoundType;
  name: string;
  description: string;
  iconName: string;
}

export const ALARM_SOUND_OPTIONS: SoundOption[] = [
  { id: 'chime', name: 'Digital Chime', description: 'Bright, melodic electronic chime', iconName: 'BellRing' },
  { id: 'bell', name: 'Resonant Bell', description: 'Rich acoustic bell with lingering overtones', iconName: 'Bell' },
  { id: 'urgent', name: 'Urgent Alert', description: 'Sharp pulsing alert for high-priority events', iconName: 'AlertTriangle' },
  { id: 'fanfare', name: 'Triumph Fanfare', description: 'Celebratory harmonic ascending arpeggio', iconName: 'PartyPopper' },
  { id: 'zen', name: 'Zen Bowl', description: 'Deep calming singing bowl chime', iconName: 'Sparkles' },
  { id: 'radar', name: 'Sonar Pulse', description: 'Futuristic radar sweep beacon', iconName: 'Radio' },
];

let audioCtx: AudioContext | null = null;
let currentLoopTimer: number | null = null;
let isCurrentlyPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single iteration of a selected alarm sound
 */
export function playAlarmSound(sound: AlarmSoundType, volume = 0.8): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), now);
    masterGain.connect(ctx.destination);

    switch (sound) {
      case 'chime': {
        // Melodic 3-tone chime (E5, G#5, B5, E6)
        const notes = [659.25, 830.61, 987.77, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.9);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.9);
        });
        break;
      }

      case 'bell': {
        // Resonant acoustic bell with rich harmonic overtones
        const fundamental = 440;
        const ratios = [1, 2.02, 3.01, 4.2, 5.4];
        const decays = [1.8, 1.4, 1.0, 0.7, 0.5];

        ratios.forEach((ratio, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(fundamental * ratio, now);

          gain.gain.setValueAtTime(0.4 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + decays[idx]);
        });
        break;
      }

      case 'urgent': {
        // Double pulsing buzzer beeps
        for (let burst = 0; burst < 3; burst++) {
          const burstStart = now + burst * 0.35;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, burstStart);
          osc.frequency.exponentialRampToValueAtTime(1046.5, burstStart + 0.15);

          // Lowpass filter to avoid harsh buzzing
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, burstStart);

          gain.gain.setValueAtTime(0, burstStart);
          gain.gain.linearRampToValueAtTime(0.4, burstStart + 0.02);
          gain.gain.setValueAtTime(0.4, burstStart + 0.15);
          gain.gain.linearRampToValueAtTime(0.001, burstStart + 0.22);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(burstStart);
          osc.stop(burstStart + 0.25);
        }
        break;
      }

      case 'fanfare': {
        // Celebratory triumphant trumpet fanfare arpeggio
        const fanfareNotes = [
          { f: 523.25, t: 0, d: 0.18 }, // C5
          { f: 659.25, t: 0.18, d: 0.18 }, // E5
          { f: 783.99, t: 0.36, d: 0.22 }, // G5
          { f: 1046.5, t: 0.58, d: 0.8 }, // C6 (hold)
        ];

        fanfareNotes.forEach((n) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.f, now + n.t);

          gain.gain.setValueAtTime(0, now + n.t);
          gain.gain.linearRampToValueAtTime(0.35, now + n.t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + n.t);
          osc.stop(now + n.t + n.d);
        });
        break;
      }

      case 'zen': {
        // Deep Tibetan singing bowl (180 Hz with soft subtle beating)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(174.61, now); // F3
        osc2.frequency.setValueAtTime(177.2, now); // slight beat frequency

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.5);
        osc2.stop(now + 2.5);
        break;
      }

      case 'radar': {
        // Sonar sweep ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.8);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.2);
        break;
      }
    }
  } catch (err) {
    console.warn('Audio playback error (browser user gesture may be required):', err);
  }
}

/**
 * Start looping an alarm until stopContinuousAlarm is called
 */
export function startContinuousAlarm(sound: AlarmSoundType, volume = 0.8): void {
  stopContinuousAlarm();
  isCurrentlyPlaying = true;
  playAlarmSound(sound, volume);

  const interval = sound === 'zen' ? 3000 : sound === 'urgent' ? 1400 : 2000;
  currentLoopTimer = window.setInterval(() => {
    if (isCurrentlyPlaying) {
      playAlarmSound(sound, volume);
    }
  }, interval);
}

/**
 * Stop any currently looping continuous alarm
 */
export function stopContinuousAlarm(): void {
  isCurrentlyPlaying = false;
  if (currentLoopTimer !== null) {
    clearInterval(currentLoopTimer);
    currentLoopTimer = null;
  }
}
