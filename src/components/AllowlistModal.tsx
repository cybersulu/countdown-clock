import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { AllowlistEntry } from '../firebase';
import { BOOTSTRAP_ADMIN_EMAIL } from '../firebase';

interface AllowlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowlist: AllowlistEntry[];
  isAdmin: boolean;
  currentUserEmail?: string | null;
  onAddEmail: (email: string, role: 'admin' | 'creator') => Promise<void>;
  onRemoveEmail: (docId: string) => Promise<void>;
}

export const AllowlistModal: React.FC<AllowlistModalProps> = ({
  isOpen,
  onClose,
  allowlist,
  isAdmin,
  currentUserEmail,
  onAddEmail,
  onRemoveEmail,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'creator'>('creator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setStatusMsg({ text: 'Please enter a valid Google email address.', isError: true });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddEmail(newEmail.trim(), role);
      setNewEmail('');
      setStatusMsg({ text: `Successfully allow-listed ${newEmail}!`, isError: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add to allow-list';
      setStatusMsg({ text: msg, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (docId: string, email: string) => {
    if (confirm(`Remove ${email} from allow-list? They will no longer be able to add or edit countdown events.`)) {
      try {
        await onRemoveEmail(docId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to remove user';
        alert(msg);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Allow-listed Creators
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Only authenticated Google accounts on this list are permitted to add and manage countdown events.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`mb-5 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              statusMsg.isError
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {statusMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {statusMsg.text}
          </div>
        )}

        {/* Add new email form (only for admin) */}
        {isAdmin && (
          <form onSubmit={handleAdd} className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-cyan-400" /> Allow-list New Google Account
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="user@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'creator')}
                className="py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="creator">Event Creator</option>
                <option value="admin">Administrator</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Adding...' : 'Grant Access'}
              </button>
            </div>
          </form>
        )}

        {/* List of Allow-listed Accounts */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {/* Primary Administrator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  {BOOTSTRAP_ADMIN_EMAIL}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Primary Admin
                  </span>
                </p>
                <p className="text-[10px] text-slate-400">Default System Administrator</p>
              </div>
            </div>
          </div>

          {allowlist.map((entry) => {
            const isSelf = currentUserEmail && entry.email.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {entry.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {entry.email}
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">You</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Role: <strong className="text-slate-300 capitalize">{entry.role}</strong>
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleRemove(entry.id, entry.email)}
                    title="Remove access"
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-5 mt-5 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
