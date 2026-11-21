import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RefreshCw,
  Minus,
  Plus,
  Check,
  SkipForward,
  Trophy,
  ChevronRight,
  Timer,
  Sparkles,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';
import {
  AdaptedSession,
  AuraMode,
  CheckInState,
  CompletedSession,
  EffortFeeling,
  Exercise,
  ExerciseSessionLog,
  HeartRateState,
  SetLog,
  ThemeMode,
} from '../types/workout';
import { EXERCISES } from '../data/exercises';
import { getEffortMeta } from '../utils/progressionEngine';
import {
  playRestCompleteChime,
  releaseScreenWakeLock,
  requestScreenWakeLock,
  triggerHaptic,
} from '../services/wakeLock';
import { ExerciseDiagram } from './ExerciseDiagram';
import { HeartRatePill } from './HeartRatePill';
import { ThemeToggleButton } from './ThemeToggleButton';

interface WorkoutViewProps {
  session: AdaptedSession;
  checkIn: CheckInState;
  hr: HeartRateState;
  theme: ThemeMode;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onAuraChange: (mode: AuraMode) => void;
  onOpenBluetooth: () => void;
  onFinish: (completed: CompletedSession) => void;
  onCancel: () => void;
}

type Stage = 'warmup' | 'exercise' | 'summary';
type ActionDeckMode = 'ready' | 'effort' | 'rest';

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  session,
  checkIn,
  hr,
  theme,
  onToggleTheme,
  soundEnabled,
  hapticsEnabled,
  onAuraChange,
  onOpenBluetooth,
  onFinish,
  onCancel,
}) => {
  const startedAtRef = useRef<number>(Date.now());
  const hrSamplesRef = useRef<number[]>([]);

  const [stage, setStage] = useState<Stage>('warmup');
  const [warmupIdx, setWarmupIdx] = useState(0);
  const [warmupSecLeft, setWarmupSecLeft] = useState(session.routine.warmupSteps[0]?.seconds ?? 120);
  const [warmupRunning, setWarmupRunning] = useState(false);

  const [planItems, setPlanItems] = useState(() =>
    session.exercises.map((item) => ({
      ...item,
      originalExerciseId: item.exercise.id,
      swappedReason: (item.adaptedReason ? 'discomfort' : undefined) as
        | 'occupied'
        | 'discomfort'
        | 'ai'
        | undefined,
    }))
  );

  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [deckMode, setDeckMode] = useState<ActionDeckMode>('ready');
  const [weightKg, setWeightKg] = useState(planItems[0]?.recommendedWeightKg ?? 10);
  const [reps, setReps] = useState(planItems[0]?.recommendedReps ?? 10);
  const [restTotal, setRestTotal] = useState(planItems[0]?.exercise.restSeconds ?? 75);
  const [restLeft, setRestLeft] = useState(0);

  const [plankRunning, setPlankRunning] = useState(false);
  const [plankElapsed, setPlankElapsed] = useState(0);

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeNotice, setWakeNotice] = useState(false);

  const [logs, setLogs] = useState<Record<number, SetLog[]>>({});

  const currentItem = planItems[exIdx];
  const currentExercise = currentItem?.exercise;

  // Keep screen awake during workout
  useEffect(() => {
    let mounted = true;
    requestScreenWakeLock().then((ok) => {
      if (mounted) setWakeLockActive(ok);
    });
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        requestScreenWakeLock().then((ok) => {
          if (mounted) setWakeLockActive(ok);
        });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVis);
      releaseScreenWakeLock();
    };
  }, []);

  useEffect(() => {
    if (hr.connected && hr.bpm) {
      hrSamplesRef.current.push(hr.bpm);
    }
  }, [hr.connected, hr.bpm]);

  useEffect(() => {
    if (stage === 'warmup') onAuraChange('warmup');
    else if (stage === 'summary') onAuraChange('celebrate');
    else if (deckMode === 'rest') onAuraChange('rest');
    else onAuraChange('active');
  }, [stage, deckMode, onAuraChange]);

  useEffect(() => {
    if (!currentItem) return;
    setWeightKg(currentItem.recommendedWeightKg);
    setReps(currentItem.recommendedReps);
    setRestTotal(currentItem.exercise.restSeconds);
    setPlankRunning(false);
    setPlankElapsed(0);
  }, [exIdx, currentItem?.exercise.id]);

  // Warmup timer
  useEffect(() => {
    if (stage !== 'warmup' || !warmupRunning) return;
    const id = window.setInterval(() => {
      setWarmupSecLeft((prev) => {
        if (prev <= 1) {
          playRestCompleteChime(soundEnabled);
          triggerHaptic([30, 50, 30], hapticsEnabled);
          setWarmupRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, warmupRunning, soundEnabled, hapticsEnabled]);

  // Rest timer
  useEffect(() => {
    if (stage !== 'exercise' || deckMode !== 'rest') return;
    if (restLeft <= 0) return;
    const id = window.setInterval(() => {
      setRestLeft((prev) => {
        if (prev <= 1) {
          playRestCompleteChime(soundEnabled);
          triggerHaptic([40, 60, 40], hapticsEnabled);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, deckMode, restLeft, soundEnabled, hapticsEnabled]);

  // Plank stopwatch
  useEffect(() => {
    if (!plankRunning) return;
    const id = window.setInterval(() => {
      setPlankElapsed((p) => p + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [plankRunning]);

  const advanceWarmup = () => {
    triggerHaptic(16, hapticsEnabled);
    const next = warmupIdx + 1;
    if (next < session.routine.warmupSteps.length) {
      setWarmupIdx(next);
      setWarmupSecLeft(session.routine.warmupSteps[next].seconds);
      setWarmupRunning(false);
    } else {
      setStage('exercise');
    }
  };

  const handleSetCompletedPress = () => {
    triggerHaptic(20, hapticsEnabled);
    if (currentExercise.isTimed && plankRunning) {
      setPlankRunning(false);
      if (plankElapsed >= 5) setReps(plankElapsed);
    }
    setDeckMode('effort');
  };

  const handleEffortSelected = (effort: EffortFeeling) => {
    triggerHaptic(24, hapticsEnabled);
    const newSet: SetLog = {
      setNumber: setIdx + 1,
      weightKg: currentExercise.isBodyweight ? 0 : weightKg,
      reps,
      effort,
      heartRateBpm: hr.bpm ?? undefined,
      completedAt: new Date().toISOString(),
    };

    setLogs((prev) => ({
      ...prev,
      [exIdx]: [...(prev[exIdx] ?? []), newSet],
    }));

    const isLastSetOfExercise = setIdx + 1 >= currentItem.sets;
    const isLastExercise = exIdx + 1 >= planItems.length;

    if (isLastSetOfExercise && isLastExercise) {
      playRestCompleteChime(soundEnabled);
      triggerHaptic([40, 60, 80], hapticsEnabled);
      setStage('summary');
      return;
    }

    const restSecs = currentExercise.restSeconds;
    setRestTotal(restSecs);
    setRestLeft(restSecs);
    setDeckMode('rest');
  };

  const handleContinueAfterRest = () => {
    triggerHaptic(16, hapticsEnabled);
    setRestLeft(0);
    setDeckMode('ready');
    setPlankElapsed(0);
    setPlankRunning(false);

    if (setIdx + 1 < currentItem.sets) {
      setSetIdx((s) => s + 1);
    } else if (exIdx + 1 < planItems.length) {
      setExIdx((e) => e + 1);
      setSetIdx(0);
    } else {
      setStage('summary');
    }
  };

  const handleSwapOccupied = (altExercise: Exercise) => {
    triggerHaptic(22, hapticsEnabled);
    setPlanItems((prev) =>
      prev.map((item, idx) =>
        idx === exIdx
          ? {
              ...item,
              exercise: altExercise,
              recommendedWeightKg: altExercise.defaultWeightKg,
              recommendedReps: altExercise.targetReps,
              swappedReason: 'occupied' as const,
            }
          : item
      )
    );
    setWeightKg(altExercise.defaultWeightKg);
    setReps(altExercise.targetReps);
    setRestTotal(altExercise.restSeconds);
    setSwapModalOpen(false);
  };

  const summaryStats = useMemo(() => {
    const exerciseLogs: ExerciseSessionLog[] = planItems
      .map((item, idx) => ({
        exerciseId: item.exercise.id,
        originalExerciseId:
          item.originalExerciseId !== item.exercise.id ? item.originalExerciseId : undefined,
        swappedReason: item.swappedReason,
        sets: logs[idx] ?? [],
      }))
      .filter((l) => l.sets.length > 0);

    const totalSets = exerciseLogs.reduce((acc, e) => acc + e.sets.length, 0);
    const totalVolumeKg = exerciseLogs.reduce(
      (acc, e) => acc + e.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
      0
    );
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000));
    const samples = hrSamplesRef.current;
    const avgHeartRateBpm =
      samples.length > 0 ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : undefined;
    const maxHeartRateBpm = samples.length > 0 ? Math.max(...samples) : undefined;

    return {
      exerciseLogs,
      totalSets,
      totalVolumeKg,
      durationMinutes,
      avgHeartRateBpm,
      maxHeartRateBpm,
    };
  }, [logs, planItems]);

  const handleSaveAndClose = () => {
    triggerHaptic([30, 40, 30], hapticsEnabled);
    const completed: CompletedSession = {
      id: `sess_${Date.now()}`,
      routineId: session.routine.id,
      routineTitle: session.routine.title,
      dateIso: new Date().toISOString(),
      durationMinutes: summaryStats.durationMinutes,
      checkIn,
      exercises: summaryStats.exerciseLogs,
      totalVolumeKg: summaryStats.totalVolumeKg,
      avgHeartRateBpm: summaryStats.avgHeartRateBpm,
      maxHeartRateBpm: summaryStats.maxHeartRateBpm,
    };
    onFinish(completed);
  };

  const handleRequestExit = () => {
    if (summaryStats.totalSets > 0) {
      setExitConfirmOpen(true);
    } else {
      onCancel();
    }
  };

  const formatSec = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ======================== WARMUP STAGE ========================
  if (stage === 'warmup') {
    const step = session.routine.warmupSteps[warmupIdx];
    const pct = step ? 1 - warmupSecLeft / step.seconds : 1;
    const radius = 64;
    const circ = 2 * Math.PI * radius;

    return (
      <div className="flex h-full flex-col justify-between px-4 py-3 gap-2.5 overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-2">
          <button
            onClick={onCancel}
            className="glass-pill flex h-8 w-8 items-center justify-center rounded-full text-slate-300"
            aria-label="Salir"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-sky-400/15 border border-sky-400/40 px-3 py-1 text-[10.5px] font-bold text-sky-200">
            CALENTAMIENTO · {warmupIdx + 1}/{session.routine.warmupSteps.length}
          </span>
          <div className="flex items-center gap-1.5">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <HeartRatePill hr={hr} onClick={onOpenBluetooth} />
          </div>
        </header>

        <div className="glass-panel flex flex-1 min-h-0 flex-col items-center justify-between rounded-[30px] p-4 text-center overflow-hidden">
          {/* Real gym photo strip for warmup equipment */}
          <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-white/10">
            <img
              src={step.photo}
              alt={step.equipment}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2 rounded-full bg-slate-950/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold keep-white-text text-white">
              {step.equipment}
            </div>
          </div>

          <div className="relative flex h-40 w-40 items-center justify-center my-1">
            <svg viewBox="0 0 156 156" className="h-full w-full -rotate-90">
              <circle
                cx="78"
                cy="78"
                r={radius}
                fill="none"
                stroke="rgba(148,163,184,0.16)"
                strokeWidth="9"
              />
              <circle
                cx="78"
                cy="78"
                r={radius}
                fill="none"
                stroke="url(#warmupGrad)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="warmupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#00F5D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-num text-3xl font-extrabold text-white">
                {formatSec(warmupSecLeft)}
              </span>
              <button
                onClick={() => setWarmupRunning((r) => !r)}
                className="mt-1.5 rounded-full bg-cyan-400/20 border border-cyan-400/40 px-3 py-0.5 text-[10px] font-bold text-cyan-200 active:scale-95"
              >
                {warmupRunning ? 'Pausar' : 'Iniciar'}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-white leading-tight">{step.title}</h2>
            <p className="mt-1 text-xs text-slate-300 max-w-[290px] leading-snug">{step.detail}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2.5">
          <button
            onClick={() => setStage('exercise')}
            className="glass-pill flex items-center justify-center gap-1.5 rounded-2xl py-3.5 text-xs font-bold text-slate-300 active:scale-95 transition-transform"
          >
            <SkipForward className="h-4 w-4" />
            <span>Ir directo a fuerza</span>
          </button>
          <button
            onClick={advanceWarmup}
            className="keep-dark-text flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 py-3.5 text-xs font-extrabold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.4)] active:scale-95 transition-transform"
          >
            <span>
              {warmupIdx + 1 < session.routine.warmupSteps.length ? 'Siguiente' : 'Empezar fuerza'}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ======================== SUMMARY STAGE ========================
  if (stage === 'summary') {
    return (
      <div className="flex h-full flex-col justify-between px-4 py-4 overflow-hidden">
        <div className="text-center pt-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-teal-300 to-amber-300 shadow-[0_0_45px_rgba(0,245,212,0.5)]"
          >
            <Trophy className="h-10 w-10 text-slate-950" />
          </motion.div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">¡Sesión completada!</h1>
          <p className="text-xs text-slate-300 mt-1">
            {session.routine.title} · Suma limpia y segura
          </p>
        </div>

        <div className="glass-panel rounded-[28px] p-4 space-y-3 my-auto">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="surface-soft rounded-2xl p-3">
              <div className="font-mono-num text-xl font-extrabold text-cyan-300">
                {summaryStats.durationMinutes}m
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Duración</div>
            </div>
            <div className="surface-soft rounded-2xl p-3">
              <div className="font-mono-num text-xl font-extrabold text-white">
                {summaryStats.totalSets}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Series</div>
            </div>
            <div className="surface-soft rounded-2xl p-3">
              <div className="font-mono-num text-xl font-extrabold text-amber-300">
                {summaryStats.totalVolumeKg > 0 ? `${summaryStats.totalVolumeKg}` : 'Core'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {summaryStats.totalVolumeKg > 0 ? 'kg movidos' : 'Control'}
              </div>
            </div>
          </div>

          {summaryStats.avgHeartRateBpm && (
            <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 border border-rose-400/25 px-3.5 py-2.5 text-xs">
              <span className="text-rose-200 font-medium">Pulsera registrada</span>
              <span className="font-mono-num font-bold text-white">
                Media {summaryStats.avgHeartRateBpm} bpm · Máx {summaryStats.maxHeartRateBpm}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 p-3 text-xs text-emerald-100">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              Tus sensaciones de hoy ya ajustan automáticamente los pesos seguros de tu próxima sesión.
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSaveAndClose}
          className="keep-dark-text w-full rounded-[22px] bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 py-4 text-base font-extrabold text-slate-950 shadow-[0_0_32px_rgba(0,245,212,0.45)]"
        >
          Guardar y volver a Hoy
        </motion.button>
      </div>
    );
  }

  // ======================== ACTIVE EXERCISE STAGE (ZERO-SCROLL) ========================
  const alternatives = currentExercise.alternatives
    .map((id) => EXERCISES[id])
    .filter(Boolean);

  const restPct = restTotal > 0 ? Math.max(0, Math.min(1, 1 - restLeft / restTotal)) : 1;

  return (
    <div className="relative flex h-full flex-col justify-between px-3.5 pt-2.5 pb-3 gap-2 overflow-hidden">
      {/* TOP BAR + SEGMENTED PROGRESS */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={handleRequestExit}
            className="glass-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 active:scale-90 transition-transform"
            aria-label="Salir del entreno"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Exercise step pills */}
          <div className="flex flex-1 items-center gap-1 px-1">
            {planItems.map((item, idx) => (
              <button
                key={`${item.exercise.id}-${idx}`}
                onClick={() => {
                  setExIdx(idx);
                  setSetIdx(0);
                  setDeckMode('ready');
                }}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  idx < exIdx
                    ? 'bg-emerald-400'
                    : idx === exIdx
                    ? 'bg-cyan-400 shadow-[0_0_10px_#00F5D4]'
                    : 'bg-slate-500/30'
                }`}
                aria-label={`Ejercicio ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {wakeLockActive && (
              <button
                onClick={() => {
                  setWakeNotice(true);
                  setTimeout(() => setWakeNotice(false), 1800);
                }}
                className="glass-pill flex h-8 w-8 items-center justify-center rounded-full text-emerald-400"
                title="Pantalla siempre encendida"
                aria-label="Pantalla siempre encendida"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            )}
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <HeartRatePill hr={hr} onClick={onOpenBluetooth} />
          </div>
        </div>

        {/* Tiny floating Wake Lock confirmation toast */}
        <AnimatePresence>
          {wakeNotice && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-center text-[10.5px] font-semibold text-emerald-200"
            >
              Pantalla siempre encendida activa mientras entrenas
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exercise Title + Equipment + "Ocupada" Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-extrabold tracking-tight text-white leading-tight">
              {currentExercise.name}
            </h1>
            <p className="truncate text-[11px] text-cyan-200/90">
              {currentExercise.equipmentLabel}
            </p>
          </div>

          {alternatives.length > 0 && (
            <button
              onClick={() => setSwapModalOpen(true)}
              className="glass-pill flex shrink-0 items-center gap-1 rounded-full border-amber-400/45 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 active:scale-95 transition-transform"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Ocupada</span>
            </button>
          )}
        </div>
      </div>

      {/* VISUAL BIOMECHANICAL DIAGRAM STAGE (HERO) */}
      <div className="flex-1 min-h-0">
        <ExerciseDiagram exercise={currentExercise} theme={theme} />
      </div>

      {/* SET STEPPER DECK */}
      <div className="glass-panel shrink-0 rounded-[22px] px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 rounded-md bg-cyan-400/15 border border-cyan-400/35 px-2 py-0.5 font-bold text-cyan-200">
              Serie {setIdx + 1} / {currentItem.sets}
            </span>
            <span className="text-slate-400 truncate">
              {currentItem.lastSessionHint ?? currentItem.progressionNote}
            </span>
          </div>
          <span className="font-mono-num shrink-0 text-[10px] text-slate-400 ml-1">
            Ej {exIdx + 1}/{planItems.length}
          </span>
        </div>

        <div className={`grid gap-2 ${currentExercise.isBodyweight ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!currentExercise.isBodyweight && (
            <div className="surface-inset flex items-center justify-between rounded-2xl p-1.5">
              <button
                onClick={() => {
                  triggerHaptic(10, hapticsEnabled);
                  setWeightKg((w) => Math.max(currentExercise.minWeightKg, w - currentExercise.weightStepKg));
                }}
                disabled={weightKg <= currentExercise.minWeightKg}
                className="surface-soft flex h-10 w-10 items-center justify-center rounded-xl text-white active:scale-90 transition-transform disabled:opacity-35"
                aria-label="Bajar peso"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <div className="font-mono-num text-xl font-extrabold text-white leading-none">
                  {weightKg}
                </div>
                <div className="text-[10px] text-slate-400">kg</div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(10, hapticsEnabled);
                  setWeightKg((w) => Math.min(currentExercise.maxWeightKg, w + currentExercise.weightStepKg));
                }}
                disabled={weightKg >= currentExercise.maxWeightKg}
                className="surface-soft flex h-10 w-10 items-center justify-center rounded-xl text-white active:scale-90 transition-transform disabled:opacity-35"
                aria-label="Subir peso"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="surface-inset flex items-center justify-between rounded-2xl p-1.5">
            <button
              onClick={() => {
                triggerHaptic(10, hapticsEnabled);
                setReps((r) => Math.max(1, r - (currentExercise.isTimed ? 5 : 1)));
              }}
              className="surface-soft flex h-10 w-10 items-center justify-center rounded-xl text-white active:scale-90 transition-transform"
              aria-label="Menos repeticiones"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="font-mono-num text-xl font-extrabold text-white leading-none">
                {currentExercise.isTimed && plankRunning ? plankElapsed : reps}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentExercise.isTimed ? 'segundos' : 'reps'}
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic(10, hapticsEnabled);
                setReps((r) => r + (currentExercise.isTimed ? 5 : 1));
              }}
              className="surface-soft flex h-10 w-10 items-center justify-center rounded-xl text-white active:scale-90 transition-transform"
              aria-label="Más repeticiones"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MORPHING ACTION DECK: READY -> EFFORT -> LIVING REST TIMER */}
      <div className="shrink-0">
        <AnimatePresence mode="wait">
          {deckMode === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2"
            >
              {currentExercise.isTimed && (
                <button
                  onClick={() => setPlankRunning((r) => !r)}
                  className="glass-pill flex items-center justify-center gap-1.5 rounded-[20px] px-4 py-3.5 text-xs font-bold text-cyan-200 border-cyan-400/40"
                >
                  <Timer className="h-4 w-4" />
                  <span>{plankRunning ? `${plankElapsed}s` : 'Crono'}</span>
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSetCompletedPress}
                className="keep-dark-text flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 py-3.5 text-base font-extrabold text-slate-950 shadow-[0_0_28px_rgba(0,245,212,0.38)]"
              >
                <Check className="h-5 w-5 stroke-[2.8]" />
                <span>Serie completada</span>
              </motion.button>
            </motion.div>
          )}

          {deckMode === 'effort' && (
            <motion.div
              key="effort"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass-panel rounded-[22px] p-2.5"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <button
                  onClick={() => setDeckMode('ready')}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Volver</span>
                </button>
                <span className="text-[11px] font-bold text-slate-200">
                  ¿Cómo sentiste esta serie?
                </span>
                <span className="w-10" />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['easy', 'ideal', 'hard', 'max'] as EffortFeeling[]).map((eff) => {
                  const meta = getEffortMeta(eff);
                  return (
                    <button
                      key={eff}
                      onClick={() => handleEffortSelected(eff)}
                      className="flex flex-col items-center justify-center rounded-xl border py-2 px-1 transition-transform active:scale-95"
                      style={{
                        backgroundColor: meta.bg,
                        borderColor: meta.border,
                      }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full mb-1" style={{ background: meta.color }} />
                      <span className="text-[11px] font-extrabold text-white">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {deckMode === 'rest' && (
            <motion.div
              key="rest"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-panel rounded-[22px] p-2.5 flex items-center justify-between gap-2 border-indigo-400/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="4" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={restLeft === 0 ? '#10B981' : '#818CF8'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={125.6}
                      strokeDashoffset={125.6 * (1 - restPct)}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute font-mono-num text-xs font-extrabold text-white">
                    {restLeft > 0 ? `${restLeft}s` : 'YA'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">
                    {restLeft > 0 ? 'Recuperando...' : '¡Listo para la siguiente!'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button
                      onClick={() => setRestLeft((r) => Math.max(0, r - 15))}
                      className="surface-soft rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-300"
                    >
                      -15s
                    </button>
                    <button
                      onClick={() => setRestLeft((r) => r + 15)}
                      className="surface-soft rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-300"
                    >
                      +15s
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinueAfterRest}
                className={`keep-dark-text rounded-2xl px-4 py-3 text-xs font-extrabold transition-all active:scale-95 ${
                  restLeft === 0
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.45)]'
                    : 'bg-cyan-400 text-slate-950'
                }`}
              >
                {setIdx + 1 < currentItem.sets ? 'Siguiente serie →' : 'Siguiente ej. →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "MÁQUINA OCUPADA" OVERLAY SHEET */}
      <AnimatePresence>
        {swapModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-end bg-slate-950/75 backdrop-blur-sm p-3"
            onClick={() => setSwapModalOpen(false)}
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full rounded-[26px] p-4 space-y-3 border-amber-400/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">¿Máquina ocupada?</h3>
                  <p className="text-[11px] text-slate-400">
                    Cambia al instante por un equivalente de tu gimnasio:
                  </p>
                </div>
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="surface-soft rounded-full p-1.5 text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => handleSwapOccupied(alt)}
                    className="surface-soft flex w-full items-center gap-2.5 rounded-2xl p-2.5 text-left transition-transform active:scale-[0.98]"
                  >
                    <img
                      src={alt.machinePhoto}
                      alt={alt.equipmentLabel}
                      className="h-11 w-11 shrink-0 rounded-xl object-cover border border-white/15"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-bold text-white">{alt.name}</div>
                      <div className="truncate text-[11px] text-cyan-200">{alt.equipmentLabel}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-cyan-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAFE EXIT CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {exitConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
            onClick={() => setExitConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full rounded-[26px] p-4 space-y-3 border-white/15"
            >
              <div>
                <h3 className="text-base font-extrabold text-white">¿Salir del entreno?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Llevas {summaryStats.totalSets} {summaryStats.totalSets === 1 ? 'serie registrada' : 'series registradas'}. ¿Qué prefieres hacer?
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setExitConfirmOpen(false)}
                  className="keep-dark-text w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-300 py-3 text-xs font-extrabold text-slate-950"
                >
                  Seguir entrenando
                </button>
                <button
                  onClick={handleSaveAndClose}
                  className="surface-soft w-full rounded-2xl py-2.5 text-xs font-bold text-emerald-200 border-emerald-400/35"
                >
                  Terminar y guardar lo hecho
                </button>
                <button
                  onClick={onCancel}
                  className="w-full rounded-2xl bg-rose-500/15 border border-rose-400/35 py-2.5 text-xs font-bold text-rose-200"
                >
                  Salir sin guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
