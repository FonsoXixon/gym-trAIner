import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  ShieldCheck,
  Clock,
  Sparkles,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Dumbbell,
} from 'lucide-react';
import {
  AdaptedSession,
  CheckInState,
  DiscomfortZone,
  EnergyLevel,
  HeartRateState,
  SessionDuration,
} from '../types/workout';
import { ROUTINE_ORDER, ROUTINES } from '../data/routines';
import { HeartRatePill } from './HeartRatePill';

interface TodayViewProps {
  userName: string;
  selectedRoutineId: 'A' | 'B' | 'C';
  suggestedRoutineId: 'A' | 'B' | 'C';
  onSelectRoutine: (id: 'A' | 'B' | 'C') => void;
  checkIn: CheckInState;
  onUpdateCheckIn: (patch: Partial<CheckInState>) => void;
  adaptedSession: AdaptedSession;
  weekCount: number;
  weeklyGoal: number;
  hr: HeartRateState;
  onOpenWatchSettings: () => void;
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
    activeClass: 'bg-amber-400/20 border-amber-400/55 text-amber-200',
  },
  {
    id: 'normal',
    label: 'Normal',
    icon: BatteryMedium,
    activeClass: 'bg-cyan-400/20 border-cyan-400/55 text-cyan-200',
  },
  {
    id: 'high',
    label: 'A tope',
    icon: BatteryFull,
    activeClass: 'bg-emerald-400/20 border-emerald-400/55 text-emerald-200',
  },
];

export const TodayView: React.FC<TodayViewProps> = ({
  userName,
  selectedRoutineId,
  suggestedRoutineId,
  onSelectRoutine,
  checkIn,
  onUpdateCheckIn,
  adaptedSession,
  weekCount,
  weeklyGoal,
  hr,
  onOpenWatchSettings,
  onStartWorkout,
}) => {
  const toggleDiscomfort = (zone: DiscomfortZone) => {
    const exists = checkIn.discomfort.includes(zone);
    onUpdateCheckIn({
      discomfort: exists
        ? checkIn.discomfort.filter((z) => z !== zone)
        : [...checkIn.discomfort, zone],
    });
  };

  const hasSafetyAdaptation =
    checkIn.discomfort.length > 0 || checkIn.energy === 'low' || adaptedSession.exercises.some((e) => e.adaptedReason);

  return (
    <div className="flex h-full flex-col justify-between px-4 pt-3 pb-2 gap-2.5 overflow-hidden">
      {/* TOP BAR */}
      <header className="flex shrink-0 items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-white">
              gym tr
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                AI
              </span>
              ner
            </span>
            <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              {weekCount}/{weeklyGoal} sem
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Hola {userName} · Fuerza segura hoy</p>
        </div>

        <HeartRatePill hr={hr} onClick={onOpenWatchSettings} />
      </header>

      {/* CHECK-IN DE SEGURIDAD (5 SEGUNDOS) */}
      <section className="glass-panel shrink-0 rounded-[24px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span className="text-xs font-bold tracking-wide text-slate-100">
              CHECK-IN RÁPIDO
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-slate-950/70 p-0.5 border border-white/10">
            {([30, 45, 60] as SessionDuration[]).map((mins) => (
              <button
                key={mins}
                onClick={() => onUpdateCheckIn({ duration: mins })}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                  checkIn.duration === mins
                    ? 'bg-white text-slate-950 shadow'
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
                    : 'border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-slate-200'
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
                      : 'border-white/10 bg-white/[0.03] text-slate-400'
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
      <section className="glass-panel glass-card-glow relative flex flex-1 min-h-0 flex-col justify-between overflow-hidden rounded-[28px] p-4">
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
                      ? 'bg-white text-slate-950 shadow-[0_0_18px_rgba(255,255,255,0.25)]'
                      : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
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

          <div className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-slate-200">
            <Clock className="h-3 w-3 text-cyan-300" />
            <span>{adaptedSession.estimatedMinutes} min</span>
          </div>
        </div>

        {/* Title + Live Safety Badge */}
        <div className="my-1.5">
          <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">
            {ROUTINES[selectedRoutineId].title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {ROUTINES[selectedRoutineId].subtitle}
          </p>

          {hasSafetyAdaptation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200"
            >
              <Sparkles className="h-3 w-3 text-emerald-300" />
              <span>Sesión adaptada automáticamente para cuidarte</span>
            </motion.div>
          )}
        </div>

        {/* Compact zero-scroll preview of today's exercises */}
        <div className="flex flex-1 min-h-0 flex-col justify-center gap-2 my-1">
          {adaptedSession.exercises.map((item, idx) => (
            <div
              key={`${item.exercise.id}-${idx}`}
              className="flex items-center justify-between rounded-2xl bg-white/[0.045] border border-white/[0.06] px-3 py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono-num text-[11px] font-bold text-cyan-200">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-100 leading-tight">
                    {item.exercise.shortName}
                    {item.adaptedReason && (
                      <span className="ml-1.5 text-[10px] font-semibold text-emerald-300">
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
                  <span className="rounded-md bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">
                    {item.recommendedWeightKg}kg
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom subtle gym tag */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3 text-cyan-400" />5 min calentamiento incluido
          </span>
          <span>1 ejercicio = 1 pantalla</span>
        </div>
      </section>

      {/* PRIMARY LIVING CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStartWorkout}
        className="group relative flex shrink-0 w-full items-center justify-center gap-2.5 overflow-hidden rounded-[22px] bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 py-4 text-base font-extrabold text-slate-950 shadow-[0_0_32px_rgba(0,245,212,0.42)] transition-shadow hover:shadow-[0_0_40px_rgba(0,245,212,0.62)]"
      >
        <Play className="h-5 w-5 fill-slate-950" />
        <span>Empezar sesión</span>
      </motion.button>
    </div>
  );
};
