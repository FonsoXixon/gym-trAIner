import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../types/workout';

interface ThemeToggleButtonProps {
  theme: ThemeMode;
  onToggle: () => void;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ theme, onToggle }) => {
  const isLight = theme === 'light';
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onToggle}
      className="glass-pill flex h-8 w-8 items-center justify-center rounded-full transition-colors"
      aria-label={isLight ? 'Cambiar a modo noche' : 'Cambiar a modo día'}
      title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo día'}
    >
      {isLight ? (
        <Moon className="h-4 w-4 text-indigo-600" />
      ) : (
        <Sun className="h-4 w-4 text-amber-300" />
      )}
    </motion.button>
  );
};
