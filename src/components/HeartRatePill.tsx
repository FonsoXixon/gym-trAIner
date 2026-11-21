import React from 'react';
import { Bluetooth, Heart } from 'lucide-react';
import { HeartRateState } from '../types/workout';

interface HeartRatePillProps {
  hr: HeartRateState;
  onClick: () => void;
}

const ZONE_COLORS: Record<HeartRateState['zone'], string> = {
  reposo: '#38BDF8',
  calentamiento: '#22C55E',
  quema: '#00F5D4',
  intenso: '#F59E0B',
  pico: '#F43F5E',
};

export const HeartRatePill: React.FC<HeartRatePillProps> = ({ hr, onClick }) => {
  const color = ZONE_COLORS[hr.zone];

  if (hr.connected && hr.bpm) {
    const beatMs = Math.max(420, Math.round(60000 / hr.bpm));
    return (
      <button
        onClick={onClick}
        className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-transform active:scale-95"
        style={{ borderColor: `${color}55` }}
        title={hr.deviceName ?? 'Pulso en directo'}
      >
        <Heart
          className="h-3.5 w-3.5 fill-current"
          style={{
            color,
            animation: `breatheOrb ${beatMs}ms ease-in-out infinite`,
          }}
        />
        <span className="font-mono-num text-white">{hr.bpm}</span>
        <span className="text-[10px] text-slate-400">bpm</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-transform active:scale-95 hover:text-white"
    >
      <Bluetooth className="h-3.5 w-3.5 text-cyan-400" />
      <span>{hr.connecting ? 'Buscando...' : 'Pulsera'}</span>
    </button>
  );
};
