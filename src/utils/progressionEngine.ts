import {
  AdaptedSession,
  CheckInState,
  CompletedSession,
  DiscomfortZone,
  EffortFeeling,
  Exercise,
  RoutineTemplate,
} from '../types/workout';
import { EXERCISES } from '../data/exercises';
import { ROUTINES, ROUTINE_ORDER } from '../data/routines';

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function getSuggestedRoutineId(history: CompletedSession[]): 'A' | 'B' | 'C' {
  if (history.length === 0) return 'A';
  const last = history[0]; // history is sorted newest first
  const idx = ROUTINE_ORDER.indexOf(last.routineId);
  return ROUTINE_ORDER[(idx + 1) % ROUTINE_ORDER.length];
}

function findLastLogForExercise(exerciseId: string, history: CompletedSession[]) {
  for (const session of history) {
    const found = session.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
    if (found) return found;
  }
  return null;
}

function getSafeAlternative(
  exercise: Exercise,
  discomfort: DiscomfortZone[],
  disabledEquipmentIds: string[]
): { exercise: Exercise; reason?: string } {
  // Check discomfort first
  if (
    exercise.avoidWhenDiscomfort &&
    exercise.avoidWhenDiscomfort.some((z) => discomfort.includes(z)) &&
    exercise.safeSwapId &&
    EXERCISES[exercise.safeSwapId]
  ) {
    const matchedZone = exercise.avoidWhenDiscomfort.find((z) => discomfort.includes(z));
    return {
      exercise: EXERCISES[exercise.safeSwapId],
      reason: `Adaptado para cuidar ${matchedZone}`,
    };
  }

  // Check if equipment is disabled in Mi Gym
  if (disabledEquipmentIds.includes(exercise.equipmentId)) {
    for (const altId of exercise.alternatives) {
      const alt = EXERCISES[altId];
      if (alt && !disabledEquipmentIds.includes(alt.equipmentId)) {
        return {
          exercise: alt,
          reason: 'Equipo sustituido según tu gimnasio',
        };
      }
    }
  }

  return { exercise };
}

export function buildAdaptedSession(
  routineId: 'A' | 'B' | 'C',
  checkIn: CheckInState,
  history: CompletedSession[],
  disabledEquipmentIds: string[]
): AdaptedSession {
  const routine: RoutineTemplate = ROUTINES[routineId];
  const safetyNotes: string[] = [];

  // Select exercises according to duration (30 / 45 / 60 min)
  let baseIds = [...routine.exerciseIds];
  if (checkIn.duration === 30) {
    baseIds = baseIds.slice(0, 4);
    safetyNotes.push('Sesión exprés (30 min): nos quedamos con los 4 básicos clave.');
  } else if (checkIn.duration === 60 && routine.bonusExerciseId) {
    baseIds.push(routine.bonusExerciseId);
    safetyNotes.push('Sesión extendida (60 min): añadimos un extra controlado al final.');
  }

  // Energy modifier
  const lowEnergy = checkIn.energy === 'low';
  if (lowEnergy) {
    safetyNotes.push('Energía baja hoy: reducimos 1 serie y suavizamos cargas para sumar sin desgastar.');
  }

  if (checkIn.discomfort.length > 0) {
    safetyNotes.push(
      `Modo protección activo (${checkIn.discomfort.join(', ')}): evitamos tensión en esa zona.`
    );
  }

  const usedIds = new Set<string>();
  const adaptedExercises = baseIds.map((rawId) => {
    const original = EXERCISES[rawId];
    let { exercise, reason } = getSafeAlternative(
      original,
      checkIn.discomfort,
      disabledEquipmentIds
    );

    // Avoid duplicating an exercise already in the session
    if (usedIds.has(exercise.id)) {
      const fallback = original.alternatives
        .map((id) => EXERCISES[id])
        .find((ex) => ex && !usedIds.has(ex.id));
      if (fallback) {
        exercise = fallback;
      }
    }
    usedIds.add(exercise.id);

    const lastLog = findLastLogForExercise(exercise.id, history);
    let recommendedWeightKg = exercise.defaultWeightKg;
    let recommendedReps = exercise.targetReps;
    let lastSessionHint: string | undefined;
    let progressionNote: string | undefined;

    if (lastLog && lastLog.sets.length > 0) {
      const avgWeight =
        lastLog.sets.reduce((acc, s) => acc + s.weightKg, 0) / lastLog.sets.length;
      const lastWeight = Math.round(avgWeight / (exercise.weightStepKg || 1)) * (exercise.weightStepKg || 1);
      const lastReps = lastLog.sets[lastLog.sets.length - 1].reps;
      const lastEffort = lastLog.sets[lastLog.sets.length - 1].effort;

      lastSessionHint = exercise.isBodyweight
        ? `Última vez: ${lastReps}${exercise.isTimed ? 's' : ' reps'}`
        : `Última vez: ${lastWeight} kg × ${lastReps}`;

      recommendedWeightKg = lastWeight;
      recommendedReps = lastReps;

      if (lastEffort === 'easy') {
        if (!exercise.isBodyweight && lastWeight + exercise.weightStepKg <= exercise.maxWeightKg) {
          recommendedWeightKg = lastWeight + exercise.weightStepKg;
          recommendedReps = exercise.repRange[0];
          progressionNote = `Subimos +${exercise.weightStepKg} kg con seguridad`;
        } else {
          recommendedReps = Math.min(exercise.repRange[1], lastReps + (exercise.isTimed ? 5 : 2));
          progressionNote = `Subimos un poco el reto (+${exercise.isTimed ? '5s' : '2 reps'})`;
        }
      } else if (lastEffort === 'ideal') {
        if (lastReps < exercise.repRange[1]) {
          recommendedReps = lastReps + (exercise.isTimed ? 5 : 1);
          progressionNote = 'Mismo peso, +1 rep para afianzar';
        } else if (!exercise.isBodyweight && lastWeight + exercise.weightStepKg <= exercise.maxWeightKg) {
          recommendedWeightKg = lastWeight + exercise.weightStepKg;
          recommendedReps = exercise.repRange[0];
          progressionNote = `¡Listo para subir +${exercise.weightStepKg} kg!`;
        } else {
          progressionNote = 'Consolida esta marca perfecta';
        }
      } else if (lastEffort === 'hard') {
        progressionNote = 'Mantenemos peso hasta sentirlo cómodo';
      } else if (lastEffort === 'max') {
        if (!exercise.isBodyweight && lastWeight - exercise.weightStepKg >= exercise.minWeightKg) {
          recommendedWeightKg = lastWeight - exercise.weightStepKg;
          progressionNote = 'Bajamos un paso para técnica limpia';
        } else {
          recommendedReps = Math.max(exercise.repRange[0], lastReps - 2);
          progressionNote = 'Suavizamos repeticiones por seguridad';
        }
      }
    } else {
      progressionNote = 'Peso inicial seguro para aprender el gesto';
    }

    // Soften slightly on low energy day
    if (lowEnergy && !exercise.isBodyweight && recommendedWeightKg > exercise.minWeightKg) {
      recommendedWeightKg = Math.max(
        exercise.minWeightKg,
        recommendedWeightKg - exercise.weightStepKg
      );
    }

    const sets = lowEnergy ? Math.max(2, exercise.defaultSets - 1) : exercise.defaultSets;

    return {
      exercise,
      sets,
      recommendedWeightKg,
      recommendedReps,
      lastSessionHint,
      progressionNote,
      adaptedReason: reason,
    };
  });

  return {
    routine,
    exercises: adaptedExercises,
    safetyNotes,
    estimatedMinutes: checkIn.duration,
  };
}

export function getEffortMeta(effort: EffortFeeling) {
  switch (effort) {
    case 'easy':
      return {
        label: 'Fácil',
        hint: 'Podría hacer muchas más',
        color: '#22C55E',
        bg: 'rgba(34, 197, 94, 0.16)',
        border: 'rgba(34, 197, 94, 0.45)',
      };
    case 'ideal':
      return {
        label: 'Ideal',
        hint: 'Reto justo y seguro',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.16)',
        border: 'rgba(56, 189, 248, 0.45)',
      };
    case 'hard':
      return {
        label: 'Dura',
        hint: 'Últimas reps exigentes',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.16)',
        border: 'rgba(245, 158, 11, 0.45)',
      };
    case 'max':
      return {
        label: 'Al límite',
        hint: 'Mejor bajar un poco',
        color: '#F43F5E',
        bg: 'rgba(244, 63, 94, 0.16)',
        border: 'rgba(244, 63, 94, 0.45)',
      };
  }
}

export function getWeeklyStats(history: CompletedSession[], weeklyGoal: number) {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dayOfWeek);

  const thisWeek = history.filter((s) => new Date(s.dateIso) >= monday);
  const totalSessions = history.length;
  const weekVolume = thisWeek.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const totalMinutesWeek = thisWeek.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Simple streak in weeks or consecutive active days
  const streakDays = Math.min(history.length, 99);

  return {
    weekCount: thisWeek.length,
    weeklyGoal,
    weekProgressPct: Math.min(100, Math.round((thisWeek.length / Math.max(1, weeklyGoal)) * 100)),
    totalSessions,
    weekVolume,
    totalMinutesWeek,
    streakDays,
  };
}

export function buildCoachExportReport(
  history: CompletedSession[],
  age: number,
  wearableModel: string
): string {
  const recent = history.slice(0, 6);
  const lines: string[] = [
    `=== INFORME GYM TRAINER ===`,
    `Perfil: ${age} años · Objetivo: perder grasa manteniendo/ganando músculo · 3 días/semana (45 min)`,
    `Reloj: ${wearableModel}`,
    `Equipamiento: Multipower, Polea alta/baja (100kg), Máquina pierna dual (70kg), Mancuernas (hasta 10kg), Banco lumbar 45°, Banco regulable, Bandas, Correas suspensión, Espaldera, Cardio.`,
    `Sesiones totales registradas: ${history.length}`,
    ``,
    `ÚLTIMAS SESIONES:`,
  ];

  if (recent.length === 0) {
    lines.push('- Todavía sin sesiones registradas (listo para empezar Sesión A).');
  } else {
    for (const s of recent) {
      const dateStr = new Date(s.dateIso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });
      lines.push(
        `• ${dateStr} | ${s.routineTitle} (${s.durationMinutes} min · Energía: ${s.checkIn.energy}${
          s.checkIn.discomfort.length ? ` · Molestias: ${s.checkIn.discomfort.join(',')}` : ''
        }${s.avgHeartRateBpm ? ` · FC media: ${s.avgHeartRateBpm} bpm` : ''})`
      );
      for (const exLog of s.exercises) {
        const exName = EXERCISES[exLog.exerciseId]?.shortName ?? exLog.exerciseId;
        const summary = exLog.sets
          .map((set) => `${set.weightKg > 0 ? `${set.weightKg}kg×` : ''}${set.reps}(${set.effort})`)
          .join(', ');
        lines.push(`    - ${exName}: ${summary}`);
      }
    }
  }

  lines.push(``);
  lines.push(`Pregunta: ¿Qué ajustes de pesos, ejercicios o progresión me recomiendas para la próxima semana manteniendo seguridad articular?`);
  return lines.join('\n');
}
