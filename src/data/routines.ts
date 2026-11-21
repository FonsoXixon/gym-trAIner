import { RoutineTemplate } from '../types/workout';

export const ROUTINES: Record<'A' | 'B' | 'C', RoutineTemplate> = {
  A: {
    id: 'A',
    title: 'Sesión A · Base y Empuje',
    subtitle: 'Pierna guiada, pecho, espalda alta y core',
    focusTag: 'Cuerpo Completo A',
    accent: 'cyan',
    warmupSteps: [
      {
        title: 'Activa el pulso suave',
        detail: 'Bici o elíptica a ritmo cómodo donde puedas hablar',
        seconds: 180,
        equipment: 'Bici o elíptica',
      },
      {
        title: 'Hombros y espalda con palo',
        detail: '10 círculos suaves por encima de la cabeza + giros de cintura',
        seconds: 90,
        equipment: 'Palo de madera',
      },
    ],
    exerciseIds: [
      'multipower_squat',
      'multipower_bench',
      'lat_pulldown',
      'leg_extension',
      'plank',
    ],
    bonusExerciseId: 'db_arms',
  },

  B: {
    id: 'B',
    title: 'Sesión B · Espalda y Glúteo',
    subtitle: 'Cadena posterior blindada, remo y hombros',
    focusTag: 'Cuerpo Completo B',
    accent: 'violet',
    warmupSteps: [
      {
        title: 'Sube temperatura articular',
        detail: 'Cinta caminando ligero o bici suave',
        seconds: 180,
        equipment: 'Cinta o bici',
      },
      {
        title: 'Abre pecho con banda',
        detail: '12 separaciones de banda al frente + 10 sentadillas al aire suaves',
        seconds: 90,
        equipment: 'Banda elástica',
      },
    ],
    exerciseIds: [
      'back_extension',
      'seated_row',
      'db_shoulder_press',
      'seated_leg_curl',
      'pallof_press',
    ],
    bonusExerciseId: 'incline_pushup',
  },

  C: {
    id: 'C',
    title: 'Sesión C · Funcional y Brazos',
    subtitle: 'Equilibrio, empuje inclinado, tirón y brazos',
    focusTag: 'Cuerpo Completo C',
    accent: 'amber',
    warmupSteps: [
      {
        title: 'Movilidad general',
        detail: 'Elíptica suave moviendo bien los brazos',
        seconds: 180,
        equipment: 'Elíptica',
      },
      {
        title: 'Caderas y escápulas',
        detail: '10 balanceos suaves de pierna + 10 remos suaves con banda',
        seconds: 90,
        equipment: 'Espaldera + banda',
      },
    ],
    exerciseIds: [
      'lunge',
      'incline_db_press',
      'close_grip_pulldown',
      'cable_arms',
      'controlled_crunch',
    ],
    bonusExerciseId: 'glute_bridge',
  },
};

export const ROUTINE_ORDER: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
