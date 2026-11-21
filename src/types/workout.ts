export type AuraMode = 'calm' | 'warmup' | 'active' | 'rest' | 'safe' | 'celebrate';

export type EnergyLevel = 'low' | 'normal' | 'high';

export type DiscomfortZone = 'lumbar' | 'rodillas' | 'hombros' | 'cuello';

export type SessionDuration = 30 | 45 | 60;

export type EffortFeeling = 'easy' | 'ideal' | 'hard' | 'max';

export type MuscleGroup =
  | 'cuadriceps'
  | 'gluteos'
  | 'isquios'
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'lumbar';

export type DiagramType =
  | 'multipower_squat'
  | 'goblet_squat'
  | 'multipower_bench'
  | 'incline_pushup'
  | 'lat_pulldown'
  | 'band_pulldown'
  | 'leg_extension'
  | 'lunge'
  | 'plank'
  | 'back_extension'
  | 'glute_bridge'
  | 'seated_row'
  | 'db_row'
  | 'db_shoulder_press'
  | 'band_shoulder_press'
  | 'seated_leg_curl'
  | 'db_rdl'
  | 'pallof_press'
  | 'incline_db_press'
  | 'close_grip_pulldown'
  | 'trx_row'
  | 'cable_arms'
  | 'db_arms'
  | 'controlled_crunch';

export interface CheckInState {
  energy: EnergyLevel;
  discomfort: DiscomfortZone[];
  duration: SessionDuration;
  dateKey: string;
}

export interface Exercise {
  id: string;
  name: string;
  shortName: string;
  equipmentId: string;
  equipmentLabel: string;
  diagramType: DiagramType;
  category: 'pierna' | 'empuje' | 'tiron' | 'core' | 'brazos';
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  defaultSets: number;
  targetReps: number;
  repRange: [number, number];
  isTimed?: boolean; // e.g., plank in seconds
  defaultWeightKg: number;
  weightStepKg: number;
  minWeightKg: number;
  maxWeightKg: number;
  isBodyweight?: boolean;
  restSeconds: number;
  exhaleCue: string;
  inhaleCue: string;
  goodForm: [string, string];
  avoidForm: [string, string];
  setupPin: string;
  alternatives: string[];
  avoidWhenDiscomfort?: DiscomfortZone[];
  safeSwapId?: string;
}

export interface RoutineTemplate {
  id: 'A' | 'B' | 'C';
  title: string;
  subtitle: string;
  focusTag: string;
  accent: 'cyan' | 'violet' | 'amber';
  warmupSteps: {
    title: string;
    detail: string;
    seconds: number;
    equipment: string;
  }[];
  exerciseIds: string[];
  bonusExerciseId: string; // Added when user selects 60 min
}

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  effort: EffortFeeling;
  heartRateBpm?: number;
  completedAt: string;
}

export interface ExerciseSessionLog {
  exerciseId: string;
  originalExerciseId?: string;
  swappedReason?: 'occupied' | 'discomfort' | 'ai';
  sets: SetLog[];
}

export interface CompletedSession {
  id: string;
  routineId: 'A' | 'B' | 'C';
  routineTitle: string;
  dateIso: string;
  durationMinutes: number;
  checkIn: CheckInState;
  exercises: ExerciseSessionLog[];
  totalVolumeKg: number;
  avgHeartRateBpm?: number;
  maxHeartRateBpm?: number;
}

export interface GymEquipmentItem {
  id: string;
  name: string;
  category: 'maquina' | 'peso_libre' | 'accesorio' | 'cardio';
  specs: string;
  available: boolean;
}

export interface UserSettings {
  name: string;
  age: number;
  weeklyGoal: number;
  defaultDuration: SessionDuration;
  geminiApiKey: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  wearableModel: string;
  firebaseProjectId: string;
  disabledEquipmentIds: string[];
}

export interface HeartRateState {
  connected: boolean;
  connecting: boolean;
  simulated: boolean;
  deviceName: string | null;
  bpm: number | null;
  zone: 'reposo' | 'calentamiento' | 'quema' | 'intenso' | 'pico';
  error: string | null;
}

export interface AdaptedSession {
  routine: RoutineTemplate;
  exercises: {
    exercise: Exercise;
    sets: number;
    recommendedWeightKg: number;
    recommendedReps: number;
    lastSessionHint?: string;
    progressionNote?: string;
    adaptedReason?: string;
  }[];
  safetyNotes: string[];
  estimatedMinutes: number;
}
