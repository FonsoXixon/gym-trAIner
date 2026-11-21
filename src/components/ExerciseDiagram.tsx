import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Pause, Play, Gauge, Camera } from 'lucide-react';
import { Exercise, MuscleGroup, ThemeMode } from '../types/workout';
import { DIAGRAM_SPECS, interpolateAnatomicalPose } from './diagram/poseData';
import { AnatomicalFigure, MachineSchematic } from './diagram/AnatomicalFigure';

interface ExerciseDiagramProps {
  exercise: Exercise;
  theme?: ThemeMode;
}

type VisualTab = 'motion' | 'safety' | 'muscles' | 'machine';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  cuadriceps: 'Muslo delante',
  gluteos: 'Glúteo',
  isquios: 'Pierna detrás',
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps (delante)',
  triceps: 'Tríceps (detrás)',
  core: 'Abdomen',
  lumbar: 'Espalda baja',
};

function MuscleMapSvg({
  primary,
  secondary,
  theme,
}: {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  theme: ThemeMode;
}) {
  const isLight = theme === 'light';
  const baseCol = isLight ? 'rgba(100, 116, 139, 0.28)' : 'rgba(148, 163, 184, 0.22)';
  const primCol = isLight ? '#0891B2' : '#00F5D4';
  const secCol = isLight ? '#6366F1' : '#818CF8';
  const labelCol = isLight ? '#475569' : 'rgba(148,163,184,0.8)';

  const colorFor = (m: MuscleGroup) => {
    if (primary.includes(m)) return primCol;
    if (secondary.includes(m)) return secCol;
    return baseCol;
  };
  const glowFor = (m: MuscleGroup) => (primary.includes(m) ? 'url(#muscleGlow)' : undefined);

  return (
    <svg viewBox="0 0 280 180" className="h-full w-full">
      <defs>
        <filter id="muscleGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* FRONT SILHOUETTE */}
      <g transform="translate(36, 8)">
        <text x="42" y="10" textAnchor="middle" fill={labelCol} fontSize="9.5" fontWeight="700">
          FRENTE
        </text>
        <circle cx="42" cy="26" r="9" fill={baseCol} />
        <circle cx="24" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        <circle cx="60" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        <rect x="28" y="42" width="28" height="17" rx="6" fill={colorFor('pecho')} filter={glowFor('pecho')} />
        <rect x="31" y="61" width="22" height="28" rx="6" fill={colorFor('core')} filter={glowFor('core')} />
        <rect x="17" y="54" width="8" height="24" rx="4" fill={colorFor('biceps')} filter={glowFor('biceps')} />
        <rect x="59" y="54" width="8" height="24" rx="4" fill={colorFor('biceps')} filter={glowFor('biceps')} />
        <rect x="16" y="80" width="7" height="22" rx="3.5" fill={baseCol} />
        <rect x="61" y="80" width="7" height="22" rx="3.5" fill={baseCol} />
        <rect x="27" y="92" width="13" height="36" rx="6" fill={colorFor('cuadriceps')} filter={glowFor('cuadriceps')} />
        <rect x="44" y="92" width="13" height="36" rx="6" fill={colorFor('cuadriceps')} filter={glowFor('cuadriceps')} />
        <rect x="29" y="131" width="10" height="30" rx="5" fill={baseCol} />
        <rect x="45" y="131" width="10" height="30" rx="5" fill={baseCol} />
      </g>

      {/* BACK SILHOUETTE */}
      <g transform="translate(160, 8)">
        <text x="42" y="10" textAnchor="middle" fill={labelCol} fontSize="9.5" fontWeight="700">
          ESPALDA
        </text>
        <circle cx="42" cy="26" r="9" fill={baseCol} />
        <circle cx="24" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        <circle cx="60" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        <path d="M26 42 L58 42 L53 69 L31 69 Z" fill={colorFor('espalda')} filter={glowFor('espalda')} />
        <rect x="33" y="71" width="18" height="16" rx="5" fill={colorFor('lumbar')} filter={glowFor('lumbar')} />
        <rect x="17" y="54" width="8" height="24" rx="4" fill={colorFor('triceps')} filter={glowFor('triceps')} />
        <rect x="59" y="54" width="8" height="24" rx="4" fill={colorFor('triceps')} filter={glowFor('triceps')} />
        <rect x="27" y="88" width="14" height="18" rx="7" fill={colorFor('gluteos')} filter={glowFor('gluteos')} />
        <rect x="43" y="88" width="14" height="18" rx="7" fill={colorFor('gluteos')} filter={glowFor('gluteos')} />
        <rect x="28" y="108" width="12" height="24" rx="5" fill={colorFor('isquios')} filter={glowFor('isquios')} />
        <rect x="44" y="108" width="12" height="24" rx="5" fill={colorFor('isquios')} filter={glowFor('isquios')} />
        <rect x="29" y="135" width="10" height="26" rx="5" fill={baseCol} />
        <rect x="45" y="135" width="10" height="26" rx="5" fill={baseCol} />
      </g>
    </svg>
  );
}

export const ExerciseDiagram: React.FC<ExerciseDiagramProps> = ({
  exercise,
  theme = 'dark',
}) => {
  const [tab, setTab] = useState<VisualTab>('motion');
  const [phase, setPhase] = useState(0);
  const [exhaling, setExhaling] = useState(false);
  const [paused, setPaused] = useState(false);
  const [slowMo, setSlowMo] = useState(false);

  const isLight = theme === 'light';

  useEffect(() => {
    setTab('motion');
    setPaused(false);
  }, [exercise.id]);

  useEffect(() => {
    if (tab !== 'motion' || paused) return;
    let raf = 0;
    let lastNow = performance.now();
    let accMs = 0;
    const cycleMs = slowMo ? 5800 : 3400;

    const tick = (now: number) => {
      accMs = (accMs + (now - lastNow)) % cycleMs;
      lastNow = now;
      const norm = accMs / cycleMs;
      let t = 0;
      if (norm < 0.43) {
        const u = norm / 0.43;
        t = 0.5 - 0.5 * Math.cos(Math.PI * u);
        setExhaling(true);
      } else if (norm < 0.57) {
        t = 1;
        setExhaling(true);
      } else {
        const u = (norm - 0.57) / 0.43;
        t = 0.5 + 0.5 * Math.cos(Math.PI * u);
        setExhaling(false);
      }
      setPhase(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tab, exercise.id, paused, slowMo]);

  const spec = DIAGRAM_SPECS[exercise.diagramType];
  const pose = interpolateAnatomicalPose(spec.start, spec.end, phase);

  return (
    <div className="glass-panel relative flex h-full w-full flex-col overflow-hidden rounded-[26px] p-2.5">
      {/* TOP BAR: 4 CLEAR VISUAL TABS */}
      <div className="z-10 flex items-center justify-between gap-1.5">
        <div className="surface-inset flex flex-1 items-center justify-between rounded-full p-0.5">
          {(
            [
              { id: 'motion', label: 'Movimiento' },
              { id: 'safety', label: 'Bien / Evita' },
              { id: 'muscles', label: 'Músculos' },
              { id: 'machine', label: 'Tu máquina' },
            ] as const
          ).map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex-1 rounded-full py-1 text-[10.5px] font-bold transition-colors ${
                  active ? 'keep-dark-text text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId={`diagramTab-${exercise.id}`}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300 shadow-[0_0_14px_rgba(0,245,212,0.4)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VISUAL STAGE */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center pt-1.5">
        <AnimatePresence mode="wait">
          {/* ============ TAB 1: SCULPTED ANIMATED MOVEMENT ============ */}
          {tab === 'motion' && (
            <motion.div
              key="motion"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-full w-full flex-col items-center justify-between"
            >
              {/* Floating controls bar: Breathing + Slow-Mo + Pause */}
              <div className="flex w-full items-center justify-between gap-1.5 px-0.5">
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors duration-300 ${
                    exhaling
                      ? 'border-amber-400/45 bg-amber-400/15 text-amber-200'
                      : 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200'
                  }`}
                >
                  <Wind className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {exhaling ? exercise.exhaleCue : exercise.inhaleCue}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSlowMo((s) => !s)}
                    className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                      slowMo
                        ? 'border-cyan-400/50 bg-cyan-400/20 text-cyan-200'
                        : 'surface-soft text-slate-400'
                    }`}
                    title="Velocidad lenta"
                  >
                    <Gauge className="h-3 w-3" />
                    <span>{slowMo ? '0.5×' : '1×'}</span>
                  </button>
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="surface-soft flex h-6 w-6 items-center justify-center rounded-full text-slate-200"
                    title={paused ? 'Reanudar animación' : 'Pausar animación'}
                    aria-label={paused ? 'Reanudar animación' : 'Pausar animación'}
                  >
                    {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <svg viewBox="0 0 300 192" className="flex-1 min-h-0 max-h-[245px] w-full">
                <defs>
                  <radialGradient id="activeZone" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={isLight ? '#0891B2' : '#00F5D4'} stopOpacity="0.58" />
                    <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </radialGradient>
                  <marker
                    id="arrowHead"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5.5"
                    markerHeight="5.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill={isLight ? '#0891B2' : '#00F5D4'} />
                  </marker>
                </defs>

                {/* Floor horizon */}
                <line
                  x1="34"
                  y1="180"
                  x2="266"
                  y2="180"
                  stroke={isLight ? 'rgba(51,65,85,0.28)' : 'rgba(148,163,184,0.25)'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />

                {/* Machine schematic */}
                <MachineSchematic machine={spec.machine} pose={pose} theme={theme} />

                {/* Ghost Start Blueprint so trajectory is clear even when paused */}
                <AnatomicalFigure pose={spec.start} variant="ghost" theme={theme} />

                {/* Active muscle bioluminescent glow */}
                <circle
                  cx={pose.glowSpot[0]}
                  cy={pose.glowSpot[1]}
                  r={pose.glowSpot[2]}
                  fill="url(#activeZone)"
                />

                {/* Sculpted moving human figure */}
                <AnatomicalFigure pose={pose} variant="live" theme={theme} />

                {/* Animated directional movement arrow */}
                <path
                  d={spec.arrowPath}
                  fill="none"
                  stroke={isLight ? '#0891B2' : '#00F5D4'}
                  strokeWidth="2.6"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowHead)"
                  className="animate-dash-flow"
                  opacity="0.92"
                />
              </svg>

              {/* Short visual key tip */}
              <div className="surface-soft w-full rounded-xl px-2.5 py-1.5 text-center text-[11px] text-slate-300 leading-tight">
                <span className="text-cyan-300 font-bold">Truco: </span>
                {exercise.setupPin}
              </div>
            </motion.div>
          )}

          {/* ============ TAB 2: FULL-BODY BIEN vs EVITA ============ */}
          {tab === 'safety' && (() => {
            const safetyViewBox =
              spec.machine === 'mat'
                ? '40 88 214 102'
                : '50 18 200 170';
            return (
            <motion.div
              key="safety"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full flex-col justify-between gap-2"
            >
              {/* Dual full-body visual cards side-by-side */}
              <div className="grid flex-1 min-h-0 grid-cols-2 gap-2">
                {/* LEFT: GOOD FULL BODY */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-emerald-500/[0.08] border border-emerald-400/40 p-1.5">
                  <div className="text-center text-[10px] font-extrabold tracking-wide text-emerald-400">
                    ✓ ASÍ SÍ (SEGURO)
                  </div>
                  <svg viewBox={safetyViewBox} className="flex-1 min-h-0 w-full">
                    <line
                      x1="44"
                      y1="180"
                      x2="250"
                      y2="180"
                      stroke="rgba(16,185,129,0.35)"
                      strokeWidth="1.5"
                    />
                    <MachineSchematic machine={spec.machine} pose={spec.goodPose} theme={theme} />
                    <AnatomicalFigure pose={spec.goodPose} variant="good" theme={theme} />
                    {/* Crisp green alignment guide line */}
                    <path
                      d={spec.goodGuidePath}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="6 4"
                    />
                  </svg>
                  <div className="rounded-lg bg-emerald-500/20 px-1.5 py-0.5 text-center text-[9.5px] font-bold text-emerald-200 leading-tight">
                    {spec.goodTag}
                  </div>
                </div>

                {/* RIGHT: BAD FULL BODY */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-rose-500/[0.08] border border-rose-400/40 p-1.5">
                  <div className="text-center text-[10px] font-extrabold tracking-wide text-rose-400">
                    ✕ EVITA ESTO
                  </div>
                  <svg viewBox={safetyViewBox} className="flex-1 min-h-0 w-full">
                    <line
                      x1="44"
                      y1="180"
                      x2="250"
                      y2="180"
                      stroke="rgba(244,63,94,0.35)"
                      strokeWidth="1.5"
                    />
                    <MachineSchematic machine={spec.machine} pose={spec.badPose} theme={theme} />
                    <AnatomicalFigure pose={spec.badPose} variant="bad" theme={theme} />
                    {/* Red warning fault curve + pulsing danger halo */}
                    <path
                      d={spec.badGuidePath}
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="6 4"
                    />
                    <circle
                      cx={spec.badWarnSpot[0]}
                      cy={spec.badWarnSpot[1]}
                      r="16"
                      fill="rgba(244, 63, 94, 0.28)"
                      stroke="#F43F5E"
                      strokeWidth="2.5"
                      className="animate-danger-pulse"
                    />
                  </svg>
                  <div className="rounded-lg bg-rose-500/20 px-1.5 py-0.5 text-center text-[9.5px] font-bold text-rose-200 leading-tight">
                    {spec.badTag}
                  </div>
                </div>
              </div>

              {/* Ultra-concise bullet pins below */}
              <div className="grid shrink-0 grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 p-2 space-y-1">
                  {exercise.goodForm.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10.5px] leading-tight text-emerald-100">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-rose-500/10 border border-rose-400/25 p-2 space-y-1">
                  {exercise.avoidForm.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10.5px] leading-tight text-rose-100">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            );
          })()}

          {/* ============ TAB 3: MUSCLE MAP ============ */}
          {tab === 'muscles' && (
            <motion.div
              key="muscles"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full flex-col items-center justify-center gap-2.5"
            >
              <div className="flex-1 min-h-0 max-h-[225px] w-full">
                <MuscleMapSvg
                  primary={exercise.primaryMuscles}
                  secondary={exercise.secondaryMuscles}
                  theme={theme}
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5">
                {exercise.primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-cyan-400/15 border border-cyan-400/40 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200"
                  >
                    ● Principal: {MUSCLE_LABELS[m]}
                  </span>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-indigo-400/15 border border-indigo-400/35 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-200"
                  >
                    ○ Apoyo: {MUSCLE_LABELS[m]}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ============ TAB 4: REAL PHOTO OF HIS COMPANY GYM MACHINE ============ */}
          {tab === 'machine' && (
            <motion.div
              key="machine"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full flex-col justify-between gap-2"
            >
              <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-950/60">
                <img
                  src={exercise.machinePhoto}
                  alt={exercise.equipmentLabel}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 px-2.5 py-1 text-[10px] font-bold keep-white-text text-white">
                  <Camera className="h-3 w-3 text-cyan-300" />
                  <span>En tu gimnasio · {exercise.equipmentLabel}</span>
                </div>
              </div>

              <div className="surface-soft shrink-0 rounded-xl px-3 py-2 text-[11px] text-slate-200 leading-snug">
                <span className="font-bold text-cyan-300">Cómo colocarla: </span>
                {exercise.machineHowToFind}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
