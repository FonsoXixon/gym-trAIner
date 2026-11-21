import React, { useEffect, useRef } from 'react';
import { AuraMode, ThemeMode } from '../types/workout';

interface LivingAuraProps {
  mode: AuraMode;
  theme: ThemeMode;
  bpm?: number | null;
}

const DARK_PALETTES: Record<
  AuraMode,
  { primary: string; secondary: string; tertiary: string; particle: string }
> = {
  calm: {
    primary: 'rgba(0, 245, 212, 0.24)',
    secondary: 'rgba(37, 99, 235, 0.28)',
    tertiary: 'rgba(129, 140, 248, 0.18)',
    particle: '0, 245, 212',
  },
  warmup: {
    primary: 'rgba(56, 189, 248, 0.28)',
    secondary: 'rgba(16, 185, 129, 0.22)',
    tertiary: 'rgba(250, 204, 21, 0.14)',
    particle: '56, 189, 248',
  },
  active: {
    primary: 'rgba(255, 122, 47, 0.28)',
    secondary: 'rgba(244, 63, 94, 0.22)',
    tertiary: 'rgba(0, 245, 212, 0.14)',
    particle: '255, 138, 76',
  },
  rest: {
    primary: 'rgba(129, 140, 248, 0.30)',
    secondary: 'rgba(0, 229, 255, 0.22)',
    tertiary: 'rgba(168, 85, 247, 0.20)',
    particle: '147, 197, 253',
  },
  safe: {
    primary: 'rgba(34, 197, 94, 0.26)',
    secondary: 'rgba(0, 245, 212, 0.20)',
    tertiary: 'rgba(14, 165, 233, 0.16)',
    particle: '52, 211, 153',
  },
  celebrate: {
    primary: 'rgba(0, 245, 212, 0.34)',
    secondary: 'rgba(250, 204, 21, 0.22)',
    tertiary: 'rgba(168, 85, 247, 0.26)',
    particle: '250, 204, 21',
  },
};

const LIGHT_PALETTES: Record<
  AuraMode,
  { primary: string; secondary: string; tertiary: string; particle: string }
> = {
  calm: {
    primary: 'rgba(14, 165, 233, 0.22)',
    secondary: 'rgba(20, 184, 166, 0.20)',
    tertiary: 'rgba(99, 102, 241, 0.16)',
    particle: '8, 145, 178',
  },
  warmup: {
    primary: 'rgba(56, 189, 248, 0.26)',
    secondary: 'rgba(52, 211, 153, 0.22)',
    tertiary: 'rgba(251, 191, 36, 0.16)',
    particle: '2, 132, 199',
  },
  active: {
    primary: 'rgba(249, 115, 22, 0.22)',
    secondary: 'rgba(244, 63, 94, 0.18)',
    tertiary: 'rgba(20, 184, 166, 0.16)',
    particle: '234, 88, 12',
  },
  rest: {
    primary: 'rgba(99, 102, 241, 0.24)',
    secondary: 'rgba(6, 182, 212, 0.20)',
    tertiary: 'rgba(168, 85, 247, 0.18)',
    particle: '79, 70, 229',
  },
  safe: {
    primary: 'rgba(16, 185, 129, 0.26)',
    secondary: 'rgba(20, 184, 166, 0.20)',
    tertiary: 'rgba(56, 189, 248, 0.18)',
    particle: '5, 150, 105',
  },
  celebrate: {
    primary: 'rgba(20, 184, 166, 0.28)',
    secondary: 'rgba(245, 158, 11, 0.22)',
    tertiary: 'rgba(99, 102, 241, 0.20)',
    particle: '217, 119, 6',
  },
};

export const LivingAura: React.FC<LivingAuraProps> = ({ mode, theme, bpm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = theme === 'light' ? LIGHT_PALETTES[mode] : DARK_PALETTES[mode];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 26;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 440,
      y: Math.random() * 900,
      r: 0.9 + Math.random() * 2.0,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.14 - Math.random() * 0.28,
      phase: i * 0.7,
    }));

    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const speedMult = bpm ? Math.max(0.8, Math.min(2.1, bpm / 85)) : mode === 'active' ? 1.45 : 1;

      for (const p of particles) {
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const baseAlpha = theme === 'light' ? 0.16 : 0.22;
        const twinkle =
          baseAlpha + 0.36 * (0.5 + 0.5 * Math.sin(time * 0.0018 * speedMult + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.particle}, ${twinkle.toFixed(3)})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [palette.particle, bpm, mode, theme]);

  const pulseDuration = bpm ? `${Math.max(0.55, 60 / bpm).toFixed(2)}s` : '4.6s';

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: theme === 'light' ? '#EDF4FB' : '#05070C' }}
    >
      <div
        className="animate-float-slow absolute -top-24 -left-20 h-80 w-80 rounded-full blur-[95px] transition-colors duration-1000"
        style={{ background: palette.primary }}
      />
      <div
        className="animate-float-slow-alt absolute top-1/3 -right-24 h-96 w-96 rounded-full blur-[110px] transition-colors duration-1000"
        style={{ background: palette.secondary }}
      />
      <div
        className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full blur-[95px] transition-colors duration-1000"
        style={{
          background: palette.tertiary,
          animation: `breatheOrb ${pulseDuration} ease-in-out infinite`,
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />

      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            theme === 'light'
              ? 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.65) 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(226,238,250,0.45) 100%)'
              : 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 52%), linear-gradient(180deg, rgba(5,7,12,0.12) 0%, rgba(5,7,12,0.58) 100%)',
        }}
      />
    </div>
  );
};
