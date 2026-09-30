/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Clock,
  Calendar,
  Grid,
  List,
  Layers,
} from 'lucide-react';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  type CountdownEvent,
  type AllowlistEntry,
  signInWithGoogle,
  logOut,
  subscribeToEvents,
  subscribeToAllowlist,
  createCountdownEvent,
  updateCountdownEvent,
  deleteCountdownEvent,
  addEmailToAllowlist,
  removeEmailFromAllowlist,
} from './firebase';
import { Navbar, THEMES } from './components/Navbar';
import { HeroCountdown } from './components/HeroCountdown';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { AlarmTriggerModal } from './components/AlarmTriggerModal';
import { AllowlistModal } from './components/AllowlistModal';
import { startContinuousAlarm, stopContinuousAlarm } from './utils/audio';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [activeTheme, setActiveTheme] = useState('obsidian');

  // Selected hero event
  const [selectedHeroEventId, setSelectedHeroEventId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'title' | 'created'>('date-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CountdownEvent | null>(null);
  const [isAllowlistModalOpen, setIsAllowlistModalOpen] = useState(false);

  // Active Alarm State
  const [alarmTriggeredEvent, setAlarmTriggeredEvent] = useState<CountdownEvent | null>(null);
  const triggeredEventsRef = useRef<Set<string>>(new Set());

  // Listen for Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to Events (publicly readable countdowns)
  useEffect(() => {
    const unsubEvents = subscribeToEvents(
      (data) => setEvents(data),
      (err) => console.warn('Events sync info:', err)
    );
    return () => unsubEvents();
  }, []);

  // Subscribe to Allowlist ONLY when user is authenticated
  useEffect(() => {
    if (!user) {
      setAllowlist([]);
      return;
    }

    const unsubAllow = subscribeToAllowlist(
      (data) => setAllowlist(data),
      (err) => console.warn('Allowlist sync info:', err)
    );

    return () => unsubAllow();
  }, [user]);

  // Determine permissions
  const isAdmin = useMemo(() => {
    if (!user || !user.email) return false;
    const emailLower = user.email.toLowerCase();
    if (emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;
    return allowlist.some((entry) => entry.email.toLowerCase() === emailLower && entry.role === 'admin');
  }, [user, allowlist]);

  const isAllowlisted = useMemo(() => {
    if (!user || !user.email) return false;
    const emailLower = user.email.toLowerCase();
    if (emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;
    return allowlist.some((entry) => entry.email.toLowerCase() === emailLower);
  }, [user, allowlist]);

  // Determine current Hero Event
  const heroEvent = useMemo(() => {
    if (events.length === 0) return null;
    if (selectedHeroEventId) {
      const found = events.find((e) => e.id === selectedHeroEventId);
      if (found) return found;
    }
    // Prefer pinned event
    const pinned = events.find((e) => e.isPinned);
    if (pinned) return pinned;

    // Otherwise, find soonest upcoming event
    const now = Date.now();
    const upcoming = events
      .filter((e) => new Date(e.targetDate).getTime() > now)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    if (upcoming.length > 0) return upcoming[0];
    return events[0];
  }, [events, selectedHeroEventId]);

  // 1-second ticker for monitoring alarm triggers
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now();

      events.forEach((evt) => {
        if (!evt.alarmEnabled) return;
        const targetMs = new Date(evt.targetDate).getTime();
        const diffMs = targetMs - nowMs;

        // If event just reached zero (within 2 seconds threshold) and hasn't been triggered yet
        if (diffMs <= 1000 && diffMs >= -2500 && !triggeredEventsRef.current.has(evt.id)) {
          triggeredEventsRef.current.add(evt.id);
          setAlarmTriggeredEvent(evt);
          startContinuousAlarm(evt.alarmSound, evt.alarmVolume ?? 0.8);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [events]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [events]);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    const now = Date.now();

    return events
      .filter((e) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchDesc = e.description?.toLowerCase().includes(q) ?? false;
          const matchCat = e.category?.toLowerCase().includes(q) ?? false;
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        // Status filter
        const isPast = new Date(e.targetDate).getTime() < now;
        if (statusFilter === 'active' && isPast) return false;
        if (statusFilter === 'past' && !isPast) return false;

        // Category filter
        if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

        return true;
      })
      .sort((a, b) => {
        // Pinned always bubble up slightly
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortBy === 'date-asc') {
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        }
        if (sortBy === 'date-desc') {
          return new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [events, searchQuery, statusFilter, selectedCategory, sortBy]);

  // Handlers
  const handleSaveEvent = async (
    eventData: Omit<CountdownEvent, 'id' | 'createdByUid' | 'createdByEmail' | 'createdAt'>
  ) => {
    if (editingEvent) {
      await updateCountdownEvent(editingEvent.id, eventData);
    } else {
      const newId = await createCountdownEvent(eventData);
      setSelectedHeroEventId(newId);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this countdown event?')) {
      await deleteCountdownEvent(eventId);
      if (selectedHeroEventId === eventId) {
        setSelectedHeroEventId(null);
      }
    }
  };

  const handleTogglePin = async (event: CountdownEvent) => {
    await updateCountdownEvent(event.id, { isPinned: !event.isPinned });
  };

  const handleSnoozeAlarm = (minutes: number) => {
    if (!alarmTriggeredEvent) return;
    const currentTarget = new Date(alarmTriggeredEvent.targetDate);
    const snoozedTarget = new Date(Date.now() + minutes * 60 * 1000);
    updateCountdownEvent(alarmTriggeredEvent.id, {
      targetDate: snoozedTarget.toISOString(),
    }).catch(console.error);

    // Reset trigger set so it can ring again when snoozed time comes
    triggeredEventsRef.current.delete(alarmTriggeredEvent.id);
    stopContinuousAlarm();
    setAlarmTriggeredEvent(null);
  };

  // Seed sample events if the board is empty and user is allow-listed
  const handleSeedSamples = async () => {
    if (!isAllowlisted) return;
    const now = new Date();
    const sample1 = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // New Year's Eve
    const sample2 = new Date(now.getTime() + 14 * 24 * 3600 * 1000 + 4 * 3600 * 1000); // 2 weeks out
    const sample3 = new Date(now.getTime() + 450 * 24 * 3600 * 1000); // ~1.2 years out

    try {
      await createCountdownEvent({
        title: `New Year's Eve ${sample1.getFullYear()}`,
        description: 'Global midnight celebration countdown with champagne and music.',
        targetDate: sample1.toISOString(),
        category: 'Holiday',
        color: 'cyan',
        alarmSound: 'fanfare',
        alarmVolume: 0.9,
        alarmEnabled: true,
        isPinned: true,
      });

      await createCountdownEvent({
        title: 'Project Chronos Production Launch',
        description: 'Major software release and worldwide system deployment.',
        targetDate: sample2.toISOString(),
        category: 'Milestone',
        color: 'emerald',
        alarmSound: 'chime',
        alarmVolume: 0.8,
        alarmEnabled: true,
        isPinned: false,
      });

      await createCountdownEvent({
        title: 'Next Total Solar Eclipse',
        description: 'Astronomical alignment of Sun, Moon, and Earth with celestial corona visibility.',
        targetDate: sample3.toISOString(),
        category: 'Astronomy',
        color: 'amber',
        alarmSound: 'zen',
        alarmVolume: 0.85,
        alarmEnabled: true,
        isPinned: false,
      });
    } catch (err) {
      console.error('Failed to seed events:', err);
    }
  };

  // Theme styling backgrounds
  const themeBg = {
    obsidian: 'bg-[#090d16] text-slate-100',
    amoled: 'bg-black text-slate-100',
    slate: 'bg-[#0f172a] text-slate-100',
    nebula: 'bg-[#0d0b1a] text-slate-100',
  }[activeTheme] || 'bg-[#090d16] text-slate-100';

  return (
    <div className={`min-h-screen ${themeBg} flex flex-col font-sans transition-colors duration-500 selection:bg-cyan-500/30 selection:text-cyan-200`}>
      {/* Top Navigation */}
      <Navbar
        user={user}
        isAllowlisted={isAllowlisted}
        isAdmin={isAdmin}
        onSignIn={signInWithGoogle}
        onSignOut={logOut}
        onOpenCreateModal={() => {
          setEditingEvent(null);
          setIsEventModalOpen(true);
        }}
        onOpenAllowlistModal={() => setIsAllowlistModalOpen(true)}
        activeTheme={activeTheme}
        onSelectTheme={setActiveTheme}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8 md:space-y-12">
        {/* Allow-list Status Notice if signed in but not allow-listed */}
        {user && !isAllowlisted && !authLoading && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs md:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">
                  Signed in as <span className="text-amber-300 font-bold">{user.email}</span> (Viewer Mode)
                </p>
                <p className="text-amber-200/80 text-xs mt-0.5">
                  Only allow-listed Google accounts have permission to create and manage countdown events. Contact primary admin ({BOOTSTRAP_ADMIN_EMAIL}) to request creator access.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAllowlistModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors flex-shrink-0 cursor-pointer"
            >
              View Allow-list
            </button>
          </div>
        )}

        {/* Hero Spotlight Countdown */}
        <section aria-label="Centerpiece Countdown Clock">
          <HeroCountdown
            event={heroEvent}
            onEdit={(evt) => {
              setEditingEvent(evt);
              setIsEventModalOpen(true);
            }}
            canEdit={isAllowlisted}
          />
        </section>

        {/* Event List Controls: Search, Filters, View Modes */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                All Event Countdowns
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {events.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Precision countdowns calculated in years, months, days, hours, minutes, and seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Input */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'past')}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Events</option>
                <option value="active">Active Only</option>
                <option value="past">Elapsed Only</option>
              </select>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date-asc' | 'date-desc' | 'title' | 'created')}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="date-asc">Soonest First</option>
                <option value="date-desc">Furthest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="created">Recently Created</option>
              </select>

              {/* Add event button if allow-listed */}
              {isAllowlisted && (
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setIsEventModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Countdown</span>
                </button>
              )}
            </div>
          </div>

          {/* Events Grid / List */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Countdown Events Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                {searchQuery || statusFilter !== 'all' || selectedCategory !== 'all'
                  ? 'No events match your current filter criteria. Try resetting filters.'
                  : 'Get started by creating your first countdown clock with custom alarms.'}
              </p>

              {isAllowlisted ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setIsEventModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors cursor-pointer"
                  >
                    Create First Event
                  </button>
                  {events.length === 0 && (
                    <button
                      onClick={handleSeedSamples}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Seed Sample Countdowns
                    </button>
                  )}
                </div>
              ) : !user ? (
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors cursor-pointer"
                >
                  Sign in with Google to Add
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isHero={heroEvent?.id === evt.id}
                  canManage={isAllowlisted && (evt.createdByUid === user?.uid || isAdmin)}
                  onSetHero={(e) => setSelectedHeroEventId(e.id)}
                  onEdit={(e) => {
                    setEditingEvent(e);
                    setIsEventModalOpen(true);
                  }}
                  onDelete={handleDeleteEvent}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Chronos Event Countdown & Alarms • Years, Months, Days, Hours, Minutes & Seconds</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Admin: {BOOTSTRAP_ADMIN_EMAIL}</span>
            <span>•</span>
            <span className="capitalize">Theme: {activeTheme}</span>
          </div>
        </div>
      </footer>

      {/* Event Create / Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
      />

      {/* Allow-list Management Modal */}
      <AllowlistModal
        isOpen={isAllowlistModalOpen}
        onClose={() => setIsAllowlistModalOpen(false)}
        allowlist={allowlist}
        isAdmin={isAdmin}
        currentUserEmail={user?.email}
        onAddEmail={async (email, role) => {
          await addEmailToAllowlist(email, role);
        }}
        onRemoveEmail={async (docId) => {
          await removeEmailFromAllowlist(docId);
        }}
      />

      {/* Alarm Trigger Alert Modal */}
      <AlarmTriggerModal
        event={alarmTriggeredEvent}
        onDismiss={() => {
          stopContinuousAlarm();
          setAlarmTriggeredEvent(null);
        }}
        onSnooze={handleSnoozeAlarm}
      />
    </div>
  );
}
