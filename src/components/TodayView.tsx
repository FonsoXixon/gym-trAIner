import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ShieldCheck,
  Clock,
  Sparkles,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Dumbbell,
  Eye,
  X,
} from 'lucide-react';
import {
  AdaptedSession,
  CheckInState,
  DiscomfortZone,
  EnergyLevel,
  Exercise,
  HeartRateState,
  SessionDuration,
  ThemeMode,
} from '../types/workout';
import { ROUTINE_ORDER, ROUTINES } from '../data/routines';
import { HeartRatePill } from './HeartRatePill';
import { ThemeToggleButton } from './ThemeToggleButton';
import { ExerciseDiagram } from './ExerciseDiagram';

interface TodayViewProps {
  userName: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  selectedRoutineId: 'A' | 'B' | 'C';
  suggestedRoutineId: 'A' | 'B' | 'C';
  onSelectRoutine: (id: 'A' | 'B' | 'C') => void;
  checkIn: CheckInState;
  onUpdateCheckIn: (patch: Partial<CheckInState>) => void;
  adaptedSession: AdaptedSession;
  weekCount: number;
  weeklyGoal: number;
  hr: HeartRateState;
  onOpenBluetooth: () => void;
  onStartWorkout: () => void;
}

const DISCOMFORT_OPTIONS: { id: DiscomfortZone; label: string }[] = [
  { id: 'lumbar', label: 'Lumbar' },
  { id: 'rodillas', label: 'Rodillas' },
  { id: 'hombros', label: 'Hombros' },
  { id: 'cuello', label: 'Cuello' },
];

const ENERGY_OPTIONS: {
  id: EnergyLevel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    id: 'low',
    label: 'Suave',
    icon: BatteryLow,
    activeClass: 'bg-amber-400/20 border-amber-400/60 text-amber-200',
  },
  {
    id: 'normal',
    label: 'Normal',
    icon: BatteryMedium,
    activeClass: 'bg-cyan-400/20 border-cyan-400/60 text-cyan-200',
  },
  {
    id: 'high',
    label: 'A tope',
    icon: BatteryFull,
    activeClass: 'bg-emerald-400/20 border-emerald-400/60 text-emerald-200',
  },
];

export const TodayView: React.FC<TodayViewProps> = ({
  userName,
  theme,
  onToggleTheme,
  selectedRoutineId,
  suggestedRoutineId,
  onSelectRoutine,
  checkIn,
  onUpdateCheckIn,
  adaptedSession,
  weekCount,
  weeklyGoal,
  hr,
  onOpenBluetooth,
  onStartWorkout,
}) => {
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const toggleDiscomfort = (zone: DiscomfortZone) => {
    const exists = checkIn.discomfort.includes(zone);
    onUpdateCheckIn({
      discomfort: exists
        ? checkIn.discomfort.filter((z) => z !== zone)
        : [...checkIn.discomfort, zone],
    });
  };

  const hasSafetyAdaptation =
    checkIn.discomfort.length > 0 ||
    checkIn.energy === 'low' ||
    adaptedSession.exercises.some((e) => e.adaptedReason);

  return (
    <div className="relative flex h-full flex-col justify-between px-4 pt-3 pb-2 gap-2.5 overflow-hidden">
      {/* TOP BAR */}
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-white">
              gym tr
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                AI
              </span>
              ner
            </span>
            <span className="rounded-full bg-cyan-400/15 border border-cyan-400/35 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
              {weekCount}/{weeklyGoal} sem
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Hola {userName} · Fuerza segura hoy</p>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
          <HeartRatePill hr={hr} onClick={onOpenBluetooth} />
        </div>
      </header>

      {/* CHECK-IN DE SEGURIDAD (5 SEGUNDOS) */}
      <section className="glass-panel shrink-0 rounded-[24px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wide text-slate-100">
              CHECK-IN RÁPIDO
            </span>
          </div>
          <div className="surface-inset flex items-center gap-1 rounded-full p-0.5">
            {([30, 45, 60] as SessionDuration[]).map((mins) => (
              <button
                key={mins}
                onClick={() => onUpdateCheckIn({ duration: mins })}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                  checkIn.duration === mins
                    ? 'bg-cyan-400 keep-dark-text text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Energy 3-pill selector */}
        <div className="grid grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map(({ id, label, icon: Icon, activeClass }) => {
            const active = checkIn.energy === id;
            return (
              <button
                key={id}
                onClick={() => onUpdateCheckIn({ energy: id })}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all active:scale-95 ${
                  active
                    ? activeClass
                    : 'surface-soft text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Discomfort protection pills */}
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-medium text-slate-400">¿Molestias?</span>
          <div className="flex flex-1 items-center justify-end gap-1.5">
            {DISCOMFORT_OPTIONS.map(({ id, label }) => {
              const active = checkIn.discomfort.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleDiscomfort(id)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all active:scale-95 ${
                    active
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(34,197,94,0.28)]'
                      : 'surface-soft text-slate-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SESSION HERO CARD (ADAPTED TO COMPANY GYM) */}
      <section className="glass-panel glass-card-glow relative flex flex-1 min-h-0 flex-col justify-between overflow-hidden rounded-[28px] p-3.5">
        {/* Session selector A / B / C */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {ROUTINE_ORDER.map((rid) => {
              const active = selectedRoutineId === rid;
              const isSuggested = suggestedRoutineId === rid;
              return (
                <button
                  key={rid}
                  onClick={() => onSelectRoutine(rid)}
                  className={`relative rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-cyan-400 keep-dark-text text-slate-950 shadow-[0_0_18px_rgba(0,245,212,0.3)]'
                      : 'surface-soft text-slate-300'
                  }`}
                >
                  Día {rid}
                  {isSuggested && !active && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F5D4]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="surface-soft flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-200">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>{adaptedSession.estimatedMinutes} min</span>
          </div>
        </div>

        {/* Title + Live Safety Badge */}
        <div className="mt-1.5">
          <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">
            {ROUTINES[selectedRoutineId].title}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {ROUTINES[selectedRoutineId].subtitle}
          </p>

          {hasSafetyAdaptation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-200"
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Sesión adaptada automáticamente para cuidarte</span>
            </motion.div>
          )}
        </div>

        {/* Interactive Zero-Scroll Preview List (tap any row to preview diagram & gym photo!) */}
        <div className="flex flex-1 min-h-0 flex-col justify-center gap-1.5 my-1 overflow-y-auto no-scrollbar">
          {adaptedSession.exercises.map((item, idx) => (
            <button
              key={`${item.exercise.id}-${idx}`}
              onClick={() => setPreviewExercise(item.exercise)}
              className="surface-soft flex w-full items-center justify-between rounded-2xl px-2.5 py-1.5 text-left transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono-num text-[11px] font-bold text-cyan-200">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-100 leading-tight">
                    {item.exercise.shortName}
                    {item.adaptedReason && (
                      <span className="ml-1.5 text-[10px] font-semibold text-emerald-400">
                        · Protegido
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-slate-400 leading-tight mt-0.5">
                    {item.exercise.equipmentLabel}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-mono-num text-slate-300">
                <span>
                  {item.sets}×{item.recommendedReps}
                  {item.exercise.isTimed ? 's' : ''}
                </span>
                {!item.exercise.isBodyweight && (
                  <span className="rounded-md bg-cyan-400/15 border border-cyan-400/25 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
                    {item.recommendedWeightKg}kg
                  </span>
                )}
                <Eye className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Bottom subtle hint */}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3 text-cyan-400" />
            Toca cualquier ejercicio para ver cómo se hace
          </span>
          <span>5m calent.</span>
        </div>
      </section>

      {/* PRIMARY LIVING CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStartWorkout}
        className="keep-dark-text group relative flex shrink-0 w-full items-center justify-center gap-2.5 overflow-hidden rounded-[22px] bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 py-3.5 text-base font-extrabold text-slate-950 shadow-[0_0_32px_rgba(0,245,212,0.42)] transition-shadow hover:shadow-[0_0_40px_rgba(0,245,212,0.6)]"
      >
        <Play className="h-5 w-5 fill-slate-950" />
        <span>Empezar sesión</span>
      </motion.button>

      {/* QUICK EXERCISE PREVIEW MODAL */}
      <AnimatePresence>
        {previewExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewExercise(null)}
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel flex h-[72%] w-full flex-col rounded-[28px] p-3.5 gap-2.5 border-cyan-400/35"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-white">
                    {previewExercise.name}
                  </h3>
                  <p className="truncate text-[11px] text-cyan-200">
                    {previewExercise.equipmentLabel}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewExercise(null)}
                  className="surface-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300"
                  aria-label="Cerrar vista previa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ExerciseDiagram exercise={previewExercise} theme={theme} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
