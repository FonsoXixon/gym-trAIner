import { RoutineTemplate } from '../types/workout';

export const ROUTINES: Record<'A' | 'B' | 'C', RoutineTemplate> = {
  A: {
    id: 'A',
    title: 'Sesión A · Base y Empuje',
    subtitle: 'Pierna guiada, pecho, espalda alta y abdomen',
    focusTag: 'Cuerpo Completo A',
    accent: 'cyan',
    warmupSteps: [
      {
        title: 'Activa el pulso suave',
        detail: 'Bici o elíptica a ritmo cómodo donde puedas hablar sin ahogarte',
        seconds: 180,
        equipment: 'Bici o elíptica',
        photo: '/gym/cardio.jpg',
      },
      {
        title: 'Despierta hombros y cintura',
        detail: 'Coge el palo de madera: 10 subidas suaves arriba + 10 giros de cintura',
        seconds: 90,
        equipment: 'Palo de madera',
        photo: '/gym/bandas.jpg',
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
    subtitle: 'Espalda fuerte, piernas detrás, hombros y escudo core',
    focusTag: 'Cuerpo Completo B',
    accent: 'violet',
    warmupSteps: [
      {
        title: 'Sube temperatura articular',
        detail: 'Cinta caminando ligero o bici suave para engrasar rodillas',
        seconds: 180,
        equipment: 'Cinta o bici',
        photo: '/gym/cardio.jpg',
      },
      {
        title: 'Abre pecho con goma elástica',
        detail: '12 separaciones suaves de goma al frente + 10 sentadillas sin peso',
        seconds: 90,
        equipment: 'Goma elástica',
        photo: '/gym/bandas.jpg',
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
    title: 'Sesión C · Equilibrio y Brazos',
    subtitle: 'Piernas, pecho inclinado, espalda, tríceps y abdomen',
    focusTag: 'Cuerpo Completo C',
    accent: 'amber',
    warmupSteps: [
      {
        title: 'Movilidad cuerpo completo',
        detail: 'Elíptica suave moviendo bien los brazos para calentar hombros',
        seconds: 180,
        equipment: 'Elíptica',
        photo: '/gym/cardio.jpg',
      },
      {
        title: 'Prepara caderas y espalda',
        detail: '10 balanceos suaves de pierna apoyado + 10 tirones suaves con goma',
        seconds: 90,
        equipment: 'Goma elástica',
        photo: '/gym/bandas.jpg',
      },
    ],
    exerciseIds: [
      'lunge',
      'incline_db_press',
      'close_grip_pulldown',
      'cable_triceps',
      'controlled_crunch',
    ],
    bonusExerciseId: 'cable_biceps',
  },
};

export const ROUTINE_ORDER: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
