import React, { useEffect, useRef } from 'react';
import { AuraMode } from '../types/workout';

interface LivingAuraProps {
  mode: AuraMode;
  bpm?: number | null;
}

const PALETTES: Record<
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

export const LivingAura: React.FC<LivingAuraProps> = ({ mode, bpm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = PALETTES[mode];

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
      r: 0.9 + Math.random() * 1.9,
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

        const twinkle = 0.22 + 0.45 * (0.5 + 0.5 * Math.sin(time * 0.0018 * speedMult + p.phase));
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
  }, [palette.particle, bpm, mode]);

  const pulseDuration = bpm ? `${Math.max(0.55, 60 / bpm).toFixed(2)}s` : '4.6s';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#05070C]">
      {/* Organic breathing aurora fields */}
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

      {/* Ultra-subtle organic living particles */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />

      {/* Subtle top sheen & vignette for maximum readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 52%), linear-gradient(180deg, rgba(5,7,12,0.12) 0%, rgba(5,7,12,0.58) 100%)',
        }}
      />
    </div>
  );
};
