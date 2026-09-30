import React from 'react';

interface CountdownDigitProps {
  value: number;
  label: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  isPast?: boolean;
}

export const CountdownDigit: React.FC<CountdownDigitProps> = ({
  value,
  label,
  size = 'md',
  color = 'cyan',
  isPast = false,
}) => {
  const displayVal = value < 10 && value >= 0 ? `0${value}` : `${value}`;

  const sizeClasses = {
    sm: {
      card: 'px-2 py-1.5 min-w-[52px] rounded-lg',
      number: 'text-lg md:text-xl font-bold',
      label: 'text-[9px] font-semibold tracking-wider',
    },
    md: {
      card: 'px-3 py-2 min-w-[68px] md:min-w-[76px] rounded-xl',
      number: 'text-2xl md:text-3xl font-extrabold',
      label: 'text-[10px] md:text-xs font-semibold tracking-wider',
    },
    lg: {
      card: 'px-4 py-3 min-w-[85px] md:min-w-[105px] rounded-2xl',
      number: 'text-3xl md:text-5xl font-black',
      label: 'text-[11px] md:text-xs font-bold tracking-widest',
    },
    xl: {
      card: 'px-4 md:px-6 py-4 md:py-6 min-w-[100px] md:min-w-[140px] rounded-2xl md:rounded-3xl',
      number: 'text-4xl md:text-7xl font-black',
      label: 'text-xs md:text-sm font-bold tracking-widest',
    },
  }[size];

  // Glow color accents
  const glowBorder = {
    cyan: 'border-cyan-500/30 group-hover:border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    emerald: 'border-emerald-500/30 group-hover:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    amber: 'border-amber-500/30 group-hover:border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    rose: 'border-rose-500/30 group-hover:border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    purple: 'border-purple-500/30 group-hover:border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    blue: 'border-blue-500/30 group-hover:border-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  }[color] || 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]';

  const textGradient = {
    cyan: 'from-cyan-200 via-cyan-100 to-cyan-400',
    emerald: 'from-emerald-200 via-emerald-100 to-emerald-400',
    amber: 'from-amber-200 via-amber-100 to-amber-400',
    rose: 'from-rose-200 via-rose-100 to-rose-400',
    purple: 'from-purple-200 via-purple-100 to-purple-400',
    blue: 'from-blue-200 via-blue-100 to-blue-400',
  }[color] || 'from-cyan-200 via-cyan-100 to-cyan-400';

  return (
    <div
      className={`group flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md border ${glowBorder} transition-all duration-300 relative overflow-hidden ${sizeClasses.card}`}
    >
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* Mid crease line like classic split flap clock */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/40 pointer-events-none" />

      <span
        className={`font-mono tabular-nums leading-none tracking-tight bg-gradient-to-b ${
          isPast ? 'from-slate-400 to-slate-500' : textGradient
        } bg-clip-text text-transparent drop-shadow-sm ${sizeClasses.number}`}
      >
        {displayVal}
      </span>

      <span className={`uppercase mt-1.5 text-slate-400/80 ${sizeClasses.label}`}>
        {label}
      </span>
    </div>
  );
};
