import React from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, SlidersHorizontal } from 'lucide-react';

export type NavTab = 'today' | 'progress' | 'settings';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'today', label: 'Hoy', icon: Flame },
  { id: 'progress', label: 'Progreso', icon: TrendingUp },
  { id: 'settings', label: 'Mi Gym', icon: SlidersHorizontal },
];

export const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  return (
    <nav className="z-20 shrink-0 px-4 pb-3 pt-1">
      <div className="glass-panel mx-auto flex items-center justify-between rounded-full p-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-colors ${
                isActive ? 'keep-dark-text text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-sky-300 shadow-[0_0_22px_rgba(0,245,212,0.45)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
