'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Swords,
  LogOut,
  LogIn,
  ChevronDown,
  Shield,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { MatchHistoryModal } from './MatchHistoryModal';

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  // Determine user display metadata
  const meta = user.user_metadata || {};
  const avatarUrl = meta.avatar_url;
  const displayName =
    meta.full_name || meta.display_name || user.email?.split('@')[0] || (isGuest ? 'Guest Player' : 'Player');

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          {/* Avatar / Icon */}
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500/20 via-slate-800 to-cyan-500/20 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          <span className="hidden sm:inline font-semibold max-w-[100px] truncate">
            {displayName}
          </span>

          {/* Badge */}
          <span
            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
              isGuest
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {isGuest ? 'Guest' : 'Pro'}
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-52 rounded-2xl glass-panel border border-slate-800 shadow-2xl p-1.5 z-50 overflow-hidden"
            >
              {/* User Header in Dropdown */}
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-bold text-slate-200 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  {isGuest ? 'Guest Session' : user.email || 'Permanent Account'}
                </p>
              </div>

              {/* Menu Items */}
              <div className="flex flex-col gap-0.5">
                {/* Profile */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/profile');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 transition-colors w-full text-left"
                >
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  <span>Profile</span>
                </button>

                {/* Match History */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowHistoryModal(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors w-full text-left"
                >
                  <Swords className="w-4 h-4 text-cyan-400" />
                  <span>Match History</span>
                </button>

                <div className="my-1 h-px bg-slate-800/80" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Match History Modal */}
      <MatchHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
};

export default UserMenu;
