import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  ShieldCheck,
  LogOut,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import type { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  isAllowlisted: boolean;
  isAdmin: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenCreateModal: () => void;
  onOpenAllowlistModal: () => void;
  activeTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const THEMES = [
  { id: 'obsidian', name: 'Cyber Obsidian', color: '#06b6d4', bg: 'bg-[#090d16]' },
  { id: 'amoled', name: 'True AMOLED', color: '#10b981', bg: 'bg-black' },
  { id: 'slate', name: 'Midnight Slate', color: '#38bdf8', bg: 'bg-[#0f172a]' },
  { id: 'nebula', name: 'Violet Nebula', color: '#c084fc', bg: 'bg-[#0d0b1a]' },
];

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isAllowlisted,
  isAdmin,
  onSignIn,
  onSignOut,
  onOpenCreateModal,
  onOpenAllowlistModal,
  activeTheme,
  onSelectTheme,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Clock className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg md:text-xl tracking-tight text-white">
                CHRONOS
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Precision Clock
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-event countdown with customizable alarms
            </p>
          </div>
        </div>

        {/* Center: Live Local Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono tabular-nums text-slate-300 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>Local:</span>
          <span className="text-white font-bold tracking-wider">{timeString}</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            24H
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Dark Mode Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              title="Theme Style"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Moon className="w-4 h-4 text-cyan-400" />
              <span className="hidden lg:inline capitalize">Theme</span>
            </button>

            {themeDropdownOpen && (
              <div
                onClick={() => setThemeDropdownOpen(false)}
                className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in space-y-1"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Dark Mode Themes
                </div>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      activeTheme === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: t.color }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Allow-list view/admin button */}
          <button
            onClick={onOpenAllowlistModal}
            title={isAdmin ? 'Manage Allow-listed Users' : 'View Allow-listed Creators'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-emerald-400' : 'text-slate-400'}`} />
          </button>

          {/* Add Countdown Event Button */}
          {isAllowlisted ? (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          ) : user ? (
            <button
              onClick={() =>
                alert(
                  `Your Google account (${user.email}) is not allow-listed to create events. Contact pete.teoh@gmail.com for creator permissions.`
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 cursor-not-allowed opacity-80"
              title="Allow-listed users only"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Add Event (Locked)</span>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Sign in to Add</span>
            </button>
          )}

          {/* User Profile or Google Sign In */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-800"
                title={`Signed in as ${user.email}`}
              >
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="hidden xl:block text-left">
                <p className="text-xs font-medium text-white truncate max-w-[130px]">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-cyan-400 truncate">
                  {isAdmin ? 'Primary Admin' : isAllowlisted ? 'Allow-listed' : 'Viewer'}
                </p>
              </div>

              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            >
              {/* Google Colored G icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
