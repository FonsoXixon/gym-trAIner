import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, ShieldCheck, Activity } from 'lucide-react';
import { DiagramType, Exercise, MuscleGroup } from '../types/workout';

interface ExerciseDiagramProps {
  exercise: Exercise;
}

type VisualTab = 'motion' | 'safety' | 'muscles';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  cuadriceps: 'Muslo frontal',
  gluteos: 'Glúteo',
  isquios: 'Pierna trasera',
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Abdomen / Core',
  lumbar: 'Espalda baja',
};

// Interpolate between two pose keyframes smoothly in [0..1]
interface JointPose {
  head: [number, number];
  shoulder: [number, number];
  elbow: [number, number];
  hand: [number, number];
  hip: [number, number];
  knee: [number, number];
  foot: [number, number];
  // Optional second limb for depth/bilateral motions
  elbow2?: [number, number];
  hand2?: [number, number];
  knee2?: [number, number];
  foot2?: [number, number];
  // Equipment dynamic anchor
  bar?: [number, number];
  bar2?: [number, number];
  glowSpot: [number, number, number]; // x, y, radius of working muscle glow
}

interface DiagramSpec {
  machine:
    | 'multipower'
    | 'multipower_bench'
    | 'pulldown'
    | 'seated_row'
    | 'leg_machine'
    | 'hyper_45'
    | 'bench_incline'
    | 'bench_upright'
    | 'bench_row'
    | 'mat'
    | 'wall_bars'
    | 'floor';
  start: JointPose;
  end: JointPose;
  arrowPath: string;
  safetyGoodPath: string;
  safetyBadPath: string;
  safetyBadSpot: [number, number];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPt(a: [number, number], b: [number, number], t: number): [number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function interpolatePose(a: JointPose, b: JointPose, t: number): JointPose {
  return {
    head: lerpPt(a.head, b.head, t),
    shoulder: lerpPt(a.shoulder, b.shoulder, t),
    elbow: lerpPt(a.elbow, b.elbow, t),
    hand: lerpPt(a.hand, b.hand, t),
    hip: lerpPt(a.hip, b.hip, t),
    knee: lerpPt(a.knee, b.knee, t),
    foot: lerpPt(a.foot, b.foot, t),
    elbow2: a.elbow2 && b.elbow2 ? lerpPt(a.elbow2, b.elbow2, t) : undefined,
    hand2: a.hand2 && b.hand2 ? lerpPt(a.hand2, b.hand2, t) : undefined,
    knee2: a.knee2 && b.knee2 ? lerpPt(a.knee2, b.knee2, t) : undefined,
    foot2: a.foot2 && b.foot2 ? lerpPt(a.foot2, b.foot2, t) : undefined,
    bar: a.bar && b.bar ? lerpPt(a.bar, b.bar, t) : undefined,
    bar2: a.bar2 && b.bar2 ? lerpPt(a.bar2, b.bar2, t) : undefined,
    glowSpot: [
      lerp(a.glowSpot[0], b.glowSpot[0], t),
      lerp(a.glowSpot[1], b.glowSpot[1], t),
      lerp(a.glowSpot[2], b.glowSpot[2], t),
    ],
  };
}

const DIAGRAM_SPECS: Record<DiagramType, DiagramSpec> = {
  multipower_squat: {
    machine: 'multipower',
    start: {
      head: [152, 42],
      shoulder: [148, 62],
      elbow: [164, 78],
      hand: [152, 62],
      hip: [145, 108],
      knee: [158, 144],
      foot: [164, 178],
      bar: [148, 60],
      glowSpot: [150, 128, 22],
    },
    end: {
      head: [146, 78],
      shoulder: [140, 96],
      elbow: [156, 110],
      hand: [144, 96],
      hip: [120, 140],
      knee: [164, 144],
      foot: [164, 178],
      bar: [140, 94],
      glowSpot: [142, 142, 28],
    },
    arrowPath: 'M 205 64 L 205 128',
    safetyGoodPath: 'M 65 44 L 62 96 L 92 100 L 92 136',
    safetyBadPath: 'M 192 50 Q 170 76 196 102 L 222 108 L 210 136',
    safetyBadSpot: [182, 78],
  },

  goblet_squat: {
    machine: 'floor',
    start: {
      head: [150, 44],
      shoulder: [148, 64],
      elbow: [162, 86],
      hand: [170, 74],
      hip: [146, 108],
      knee: [154, 144],
      foot: [154, 178],
      bar: [173, 74],
      glowSpot: [150, 128, 22],
    },
    end: {
      head: [148, 82],
      shoulder: [142, 100],
      elbow: [160, 122],
      hand: [168, 106],
      hip: [118, 142],
      knee: [162, 142],
      foot: [154, 178],
      bar: [171, 106],
      glowSpot: [142, 142, 28],
    },
    arrowPath: 'M 206 72 L 206 134',
    safetyGoodPath: 'M 68 48 L 62 98 L 94 98 L 90 136',
    safetyBadPath: 'M 204 62 Q 178 80 184 108 L 216 106 L 212 136',
    safetyBadSpot: [186, 86],
  },

  multipower_bench: {
    machine: 'multipower_bench',
    start: {
      head: [102, 126],
      shoulder: [126, 130],
      elbow: [130, 152],
      hand: [134, 106],
      hip: [182, 132],
      knee: [212, 146],
      foot: [216, 178],
      bar: [134, 104],
      glowSpot: [134, 126, 22],
    },
    end: {
      head: [102, 126],
      shoulder: [126, 130],
      elbow: [132, 98],
      hand: [134, 62],
      hip: [182, 132],
      knee: [212, 146],
      foot: [216, 178],
      bar: [134, 60],
      glowSpot: [136, 122, 28],
    },
    arrowPath: 'M 176 108 L 176 58',
    safetyGoodPath: 'M 42 108 L 106 108 M 62 108 L 70 68',
    safetyBadPath: 'M 172 108 Q 204 86 236 108',
    safetyBadSpot: [204, 92],
  },

  incline_pushup: {
    machine: 'bench_incline',
    start: {
      head: [110, 74],
      shoulder: [126, 86],
      elbow: [116, 108],
      hand: [106, 124],
      hip: [168, 124],
      knee: [198, 150],
      foot: [224, 176],
      glowSpot: [126, 92, 22],
    },
    end: {
      head: [98, 92],
      shoulder: [112, 104],
      elbow: [134, 114],
      hand: [106, 124],
      hip: [162, 134],
      knee: [196, 156],
      foot: [224, 176],
      glowSpot: [120, 106, 26],
    },
    arrowPath: 'M 140 66 L 122 88',
    safetyGoodPath: 'M 42 74 L 116 132',
    safetyBadPath: 'M 172 74 Q 204 128 242 132',
    safetyBadSpot: [204, 114],
  },

  lat_pulldown: {
    machine: 'pulldown',
    start: {
      head: [152, 74],
      shoulder: [150, 92],
      elbow: [154, 64],
      hand: [158, 36],
      hip: [150, 138],
      knee: [186, 138],
      foot: [186, 176],
      bar: [158, 36],
      glowSpot: [148, 108, 22],
    },
    end: {
      head: [148, 76],
      shoulder: [144, 94],
      elbow: [138, 120],
      hand: [158, 86],
      hip: [150, 138],
      knee: [186, 138],
      foot: [186, 176],
      bar: [158, 86],
      glowSpot: [144, 112, 28],
    },
    arrowPath: 'M 200 42 L 200 94',
    safetyGoodPath: 'M 74 52 L 74 114 M 74 68 L 58 96',
    safetyBadPath: 'M 218 58 L 194 114 M 212 68 L 228 50',
    safetyBadSpot: [216, 62],
  },

  close_grip_pulldown: {
    machine: 'pulldown',
    start: {
      head: [152, 74],
      shoulder: [150, 92],
      elbow: [160, 66],
      hand: [164, 38],
      hip: [150, 138],
      knee: [186, 138],
      foot: [186, 176],
      bar: [164, 38],
      glowSpot: [148, 110, 22],
    },
    end: {
      head: [148, 76],
      shoulder: [145, 94],
      elbow: [142, 124],
      hand: [164, 92],
      hip: [150, 138],
      knee: [186, 138],
      foot: [186, 176],
      bar: [164, 92],
      glowSpot: [146, 114, 28],
    },
    arrowPath: 'M 204 44 L 204 98',
    safetyGoodPath: 'M 74 52 L 74 114 M 74 72 L 66 102',
    safetyBadPath: 'M 222 64 L 190 114',
    safetyBadSpot: [212, 74],
  },

  band_pulldown: {
    machine: 'wall_bars',
    start: {
      head: [168, 66],
      shoulder: [166, 86],
      elbow: [146, 64],
      hand: [122, 46],
      hip: [168, 132],
      knee: [166, 156],
      foot: [166, 178],
      bar: [122, 46],
      glowSpot: [168, 104, 22],
    },
    end: {
      head: [168, 66],
      shoulder: [168, 86],
      elbow: [182, 112],
      hand: [154, 102],
      hip: [168, 132],
      knee: [166, 156],
      foot: [166, 178],
      bar: [154, 102],
      glowSpot: [170, 106, 28],
    },
    arrowPath: 'M 116 58 L 154 96',
    safetyGoodPath: 'M 74 52 L 74 128',
    safetyBadPath: 'M 206 54 Q 222 86 204 128',
    safetyBadSpot: [216, 86],
  },

  leg_extension: {
    machine: 'leg_machine',
    start: {
      head: [126, 60],
      shoulder: [124, 80],
      elbow: [130, 106],
      hand: [146, 122],
      hip: [136, 128],
      knee: [176, 128],
      foot: [176, 172],
      bar: [176, 166],
      glowSpot: [156, 126, 22],
    },
    end: {
      head: [126, 60],
      shoulder: [124, 80],
      elbow: [130, 106],
      hand: [146, 122],
      hip: [136, 128],
      knee: [176, 128],
      foot: [222, 126],
      bar: [218, 126],
      glowSpot: [158, 126, 28],
    },
    arrowPath: 'M 188 170 Q 224 166 232 132',
    safetyGoodPath: 'M 54 56 L 60 104 L 106 104',
    safetyBadPath: 'M 182 62 L 204 94 L 242 96',
    safetyBadSpot: [204, 94],
  },

  seated_leg_curl: {
    machine: 'leg_machine',
    start: {
      head: [126, 60],
      shoulder: [124, 80],
      elbow: [132, 106],
      hand: [150, 120],
      hip: [136, 128],
      knee: [176, 128],
      foot: [220, 134],
      bar: [216, 134],
      glowSpot: [158, 134, 22],
    },
    end: {
      head: [126, 60],
      shoulder: [124, 80],
      elbow: [132, 106],
      hand: [150, 120],
      hip: [136, 128],
      knee: [176, 128],
      foot: [164, 170],
      bar: [166, 168],
      glowSpot: [158, 138, 28],
    },
    arrowPath: 'M 226 144 Q 214 176 176 174',
    safetyGoodPath: 'M 54 56 L 60 104 L 96 104 L 88 138',
    safetyBadPath: 'M 188 54 L 180 96 L 222 86 L 210 132',
    safetyBadSpot: [216, 88],
  },

  plank: {
    machine: 'mat',
    start: {
      head: [82, 132],
      shoulder: [104, 136],
      elbow: [102, 168],
      hand: [82, 168],
      hip: [162, 144],
      knee: [204, 156],
      foot: [238, 168],
      glowSpot: [148, 144, 24],
    },
    end: {
      head: [82, 130],
      shoulder: [104, 134],
      elbow: [102, 168],
      hand: [82, 168],
      hip: [162, 141],
      knee: [204, 154],
      foot: [238, 168],
      glowSpot: [148, 142, 30],
    },
    arrowPath: 'M 134 114 L 186 118',
    safetyGoodPath: 'M 38 96 L 122 114',
    safetyBadPath: 'M 168 92 Q 204 134 246 112',
    safetyBadSpot: [204, 122],
  },

  back_extension: {
    machine: 'hyper_45',
    start: {
      head: [102, 126],
      shoulder: [116, 114],
      elbow: [108, 132],
      hand: [116, 116],
      hip: [146, 108],
      knee: [176, 138],
      foot: [204, 168],
      glowSpot: [144, 110, 22],
    },
    end: {
      head: [98, 62],
      shoulder: [114, 76],
      elbow: [110, 96],
      hand: [118, 84],
      hip: [146, 108],
      knee: [176, 138],
      foot: [204, 168],
      glowSpot: [140, 104, 28],
    },
    arrowPath: 'M 84 118 Q 76 86 92 64',
    safetyGoodPath: 'M 48 64 L 112 128',
    safetyBadPath: 'M 192 52 Q 186 88 238 128',
    safetyBadSpot: [194, 82],
  },

  glute_bridge: {
    machine: 'mat',
    start: {
      head: [74, 164],
      shoulder: [96, 166],
      elbow: [122, 168],
      hand: [150, 168],
      hip: [148, 164],
      knee: [184, 132],
      foot: [206, 168],
      glowSpot: [152, 158, 20],
    },
    end: {
      head: [74, 164],
      shoulder: [96, 166],
      elbow: [122, 168],
      hand: [150, 168],
      hip: [148, 132],
      knee: [188, 124],
      foot: [206, 168],
      glowSpot: [152, 136, 28],
    },
    arrowPath: 'M 148 118 L 148 86',
    safetyGoodPath: 'M 42 122 L 96 90 L 114 122',
    safetyBadPath: 'M 170 122 Q 204 68 238 122',
    safetyBadSpot: [204, 80],
  },

  seated_row: {
    machine: 'seated_row',
    start: {
      head: [184, 68],
      shoulder: [178, 88],
      elbow: [144, 106],
      hand: [112, 118],
      hip: [180, 140],
      knee: [142, 146],
      foot: [104, 158],
      bar: [112, 118],
      glowSpot: [178, 106, 22],
    },
    end: {
      head: [188, 68],
      shoulder: [184, 88],
      elbow: [206, 116],
      hand: [168, 120],
      hip: [180, 140],
      knee: [142, 146],
      foot: [104, 158],
      bar: [168, 120],
      glowSpot: [184, 108, 28],
    },
    arrowPath: 'M 118 96 L 168 96',
    safetyGoodPath: 'M 86 52 L 86 116',
    safetyBadPath: 'M 228 56 L 194 116',
    safetyBadSpot: [216, 74],
  },

  db_row: {
    machine: 'bench_row',
    start: {
      head: [114, 92],
      shoulder: [130, 100],
      elbow: [134, 130],
      hand: [134, 158],
      hip: [184, 104],
      knee: [186, 134],
      foot: [212, 174],
      bar: [134, 160],
      glowSpot: [146, 102, 22],
    },
    end: {
      head: [114, 92],
      shoulder: [130, 100],
      elbow: [152, 84],
      hand: [156, 114],
      hip: [184, 104],
      knee: [186, 134],
      foot: [212, 174],
      bar: [156, 116],
      glowSpot: [148, 100, 28],
    },
    arrowPath: 'M 102 152 L 102 108',
    safetyGoodPath: 'M 42 88 L 114 88',
    safetyBadPath: 'M 170 92 Q 204 64 242 94',
    safetyBadSpot: [204, 74],
  },

  db_shoulder_press: {
    machine: 'bench_upright',
    start: {
      head: [148, 64],
      shoulder: [146, 84],
      elbow: [166, 100],
      hand: [166, 76],
      hip: [148, 132],
      knee: [184, 136],
      foot: [186, 176],
      bar: [166, 74],
      glowSpot: [148, 84, 22],
    },
    end: {
      head: [148, 64],
      shoulder: [146, 84],
      elbow: [156, 62],
      hand: [154, 34],
      hip: [148, 132],
      knee: [184, 136],
      foot: [186, 176],
      bar: [154, 32],
      glowSpot: [148, 82, 28],
    },
    arrowPath: 'M 196 82 L 196 34',
    safetyGoodPath: 'M 74 52 L 74 118',
    safetyBadPath: 'M 204 52 Q 224 88 202 118',
    safetyBadSpot: [216, 88],
  },

  band_shoulder_press: {
    machine: 'floor',
    start: {
      head: [150, 56],
      shoulder: [150, 76],
      elbow: [172, 92],
      hand: [172, 68],
      hip: [150, 120],
      knee: [152, 150],
      foot: [152, 178],
      bar: [172, 68],
      glowSpot: [150, 78, 22],
    },
    end: {
      head: [150, 56],
      shoulder: [150, 76],
      elbow: [162, 54],
      hand: [158, 28],
      hip: [150, 120],
      knee: [152, 150],
      foot: [152, 178],
      bar: [158, 28],
      glowSpot: [150, 76, 28],
    },
    arrowPath: 'M 200 76 L 200 30',
    safetyGoodPath: 'M 74 48 L 74 132',
    safetyBadPath: 'M 204 48 Q 224 86 204 132',
    safetyBadSpot: [216, 86],
  },

  db_rdl: {
    machine: 'floor',
    start: {
      head: [152, 42],
      shoulder: [150, 62],
      elbow: [154, 92],
      hand: [156, 118],
      hip: [148, 108],
      knee: [152, 144],
      foot: [152, 178],
      bar: [158, 120],
      glowSpot: [148, 126, 22],
    },
    end: {
      head: [194, 76],
      shoulder: [176, 88],
      elbow: [174, 118],
      hand: [170, 146],
      hip: [122, 108],
      knee: [148, 144],
      foot: [152, 178],
      bar: [170, 148],
      glowSpot: [138, 126, 28],
    },
    arrowPath: 'M 134 94 L 102 98',
    safetyGoodPath: 'M 102 68 L 54 94 L 70 134',
    safetyBadPath: 'M 232 74 Q 202 58 182 96 L 198 134',
    safetyBadSpot: [204, 70],
  },

  pallof_press: {
    machine: 'wall_bars',
    start: {
      head: [164, 48],
      shoulder: [164, 68],
      elbow: [156, 90],
      hand: [150, 88],
      hip: [164, 114],
      knee: [166, 148],
      foot: [166, 178],
      bar: [150, 88],
      glowSpot: [164, 98, 22],
    },
    end: {
      head: [164, 48],
      shoulder: [164, 68],
      elbow: [188, 84],
      hand: [214, 84],
      hip: [164, 114],
      knee: [166, 148],
      foot: [166, 178],
      bar: [214, 84],
      glowSpot: [164, 98, 28],
    },
    arrowPath: 'M 170 68 L 218 68',
    safetyGoodPath: 'M 74 48 L 74 132',
    safetyBadPath: 'M 192 52 L 216 132',
    safetyBadSpot: [202, 86],
  },

  lunge: {
    machine: 'floor',
    start: {
      head: [154, 42],
      shoulder: [154, 62],
      elbow: [154, 92],
      hand: [154, 118],
      hip: [152, 108],
      knee: [156, 144],
      foot: [156, 178],
      knee2: [148, 144],
      foot2: [148, 178],
      bar: [154, 120],
      glowSpot: [156, 130, 22],
    },
    end: {
      head: [154, 66],
      shoulder: [154, 86],
      elbow: [154, 114],
      hand: [154, 138],
      hip: [150, 128],
      knee: [186, 136],
      foot: [188, 178],
      knee2: [122, 166],
      foot2: [96, 176],
      bar: [154, 140],
      glowSpot: [166, 134, 28],
    },
    arrowPath: 'M 128 168 L 94 168',
    safetyGoodPath: 'M 74 52 L 74 102 L 104 104 L 104 136',
    safetyBadPath: 'M 218 62 L 194 102 L 236 106 L 222 136',
    safetyBadSpot: [228, 106],
  },

  incline_db_press: {
    machine: 'bench_incline',
    start: {
      head: [118, 86],
      shoulder: [132, 100],
      elbow: [134, 124],
      hand: [154, 104],
      hip: [168, 134],
      knee: [204, 142],
      foot: [208, 178],
      bar: [156, 102],
      glowSpot: [142, 104, 22],
    },
    end: {
      head: [118, 86],
      shoulder: [132, 100],
      elbow: [150, 82],
      hand: [166, 56],
      hip: [168, 134],
      knee: [204, 142],
      foot: [208, 178],
      bar: [168, 54],
      glowSpot: [142, 102, 28],
    },
    arrowPath: 'M 188 102 L 188 54',
    safetyGoodPath: 'M 52 108 L 88 74 M 70 90 L 90 54',
    safetyBadPath: 'M 182 108 Q 204 82 224 108',
    safetyBadSpot: [204, 92],
  },

  trx_row: {
    machine: 'wall_bars',
    start: {
      head: [176, 86],
      shoulder: [168, 102],
      elbow: [144, 88],
      hand: [120, 74],
      hip: [146, 136],
      knee: [128, 156],
      foot: [112, 176],
      bar: [120, 74],
      glowSpot: [162, 110, 22],
    },
    end: {
      head: [142, 62],
      shoulder: [136, 78],
      elbow: [158, 96],
      hand: [124, 78],
      hip: [126, 124],
      knee: [118, 152],
      foot: [112, 176],
      bar: [124, 78],
      glowSpot: [138, 90, 28],
    },
    arrowPath: 'M 186 108 L 154 74',
    safetyGoodPath: 'M 94 56 L 54 132',
    safetyBadPath: 'M 224 58 Q 222 104 184 132',
    safetyBadSpot: [218, 100],
  },

  cable_arms: {
    machine: 'pulldown',
    start: {
      head: [168, 48],
      shoulder: [168, 68],
      elbow: [168, 98],
      hand: [146, 94],
      hip: [168, 116],
      knee: [168, 148],
      foot: [168, 178],
      bar: [146, 94],
      glowSpot: [166, 86, 20],
    },
    end: {
      head: [168, 48],
      shoulder: [168, 68],
      elbow: [168, 98],
      hand: [148, 126],
      hip: [168, 116],
      knee: [168, 148],
      foot: [168, 178],
      bar: [148, 126],
      glowSpot: [168, 88, 26],
    },
    arrowPath: 'M 122 86 L 122 132',
    safetyGoodPath: 'M 74 48 L 74 132',
    safetyBadPath: 'M 218 52 L 194 132',
    safetyBadSpot: [208, 86],
  },

  db_arms: {
    machine: 'floor',
    start: {
      head: [152, 46],
      shoulder: [152, 66],
      elbow: [152, 98],
      hand: [156, 126],
      hip: [152, 114],
      knee: [152, 148],
      foot: [152, 178],
      bar: [156, 128],
      glowSpot: [154, 86, 20],
    },
    end: {
      head: [152, 46],
      shoulder: [152, 66],
      elbow: [152, 98],
      hand: [170, 76],
      hip: [152, 114],
      knee: [152, 148],
      foot: [152, 178],
      bar: [170, 74],
      glowSpot: [156, 86, 26],
    },
    arrowPath: 'M 188 124 Q 204 98 188 74',
    safetyGoodPath: 'M 74 48 L 74 132',
    safetyBadPath: 'M 192 52 Q 214 88 198 132',
    safetyBadSpot: [208, 86],
  },

  controlled_crunch: {
    machine: 'mat',
    start: {
      head: [82, 162],
      shoulder: [104, 164],
      elbow: [106, 134],
      hand: [108, 108],
      hip: [158, 164],
      knee: [162, 126],
      foot: [194, 126],
      glowSpot: [134, 160, 22],
    },
    end: {
      head: [82, 162],
      shoulder: [104, 164],
      elbow: [82, 152],
      hand: [56, 144],
      hip: [158, 164],
      knee: [196, 152],
      foot: [228, 154],
      glowSpot: [134, 160, 28],
    },
    arrowPath: 'M 184 114 L 226 138',
    safetyGoodPath: 'M 42 122 L 116 122',
    safetyBadPath: 'M 170 122 Q 204 102 238 122',
    safetyBadSpot: [204, 108],
  },
};

function renderMachineBackdrop(machine: DiagramSpec['machine'], pose: JointPose) {
  const frameStroke = 'rgba(148, 163, 184, 0.34)';
  const padFill = 'rgba(56, 189, 248, 0.22)';
  const padStroke = 'rgba(56, 189, 248, 0.55)';

  switch (machine) {
    case 'multipower':
      return (
        <g>
          {/* Rails */}
          <line x1="144" y1="22" x2="144" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="154" y1="22" x2="154" y2="180" stroke="rgba(148,163,184,0.16)" strokeWidth="1.5" />
          <line x1="126" y1="24" x2="174" y2="24" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          {/* Safety stopper */}
          <rect x="139" y="128" width="10" height="5" rx="2" fill="#22C55E" opacity="0.7" />
          {/* Plate on bar */}
          {pose.bar && (
            <g>
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="12" fill="rgba(15,23,42,0.85)" stroke="#00F5D4" strokeWidth="2.5" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="4" fill="#00F5D4" />
            </g>
          )}
        </g>
      );

    case 'multipower_bench':
      return (
        <g>
          <line x1="134" y1="22" x2="134" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          {/* Blue flat bench */}
          <rect x="96" y="138" width="104" height="10" rx="5" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          <line x1="112" y1="148" x2="108" y2="180" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="186" y1="148" x2="190" y2="180" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          {pose.bar && (
            <g>
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="11" fill="rgba(15,23,42,0.85)" stroke="#00F5D4" strokeWidth="2.5" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="3.5" fill="#00F5D4" />
            </g>
          )}
        </g>
      );

    case 'pulldown':
      return (
        <g>
          {/* Tower */}
          <rect x="74" y="24" width="22" height="154" rx="5" fill="rgba(30,41,59,0.55)" stroke={frameStroke} strokeWidth="1.5" />
          <line x1="85" y1="24" x2="162" y2="24" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          {/* Cable */}
          {pose.bar && (
            <g>
              <line x1="162" y1="24" x2={pose.bar[0]} y2={pose.bar[1]} stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="3 2" />
              <line x1={pose.bar[0] - 12} y1={pose.bar[1]} x2={pose.bar[0] + 12} y2={pose.bar[1]} stroke="#00F5D4" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}
          {/* Seat & thigh roller */}
          <rect x="134" y="144" width="38" height="8" rx="4" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          <line x1="152" y1="152" x2="152" y2="180" stroke={frameStroke} strokeWidth="3" />
          <circle cx="170" cy="130" r="6" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
        </g>
      );

    case 'seated_row':
      return (
        <g>
          <rect x="64" y="26" width="22" height="152" rx="5" fill="rgba(30,41,59,0.55)" stroke={frameStroke} strokeWidth="1.5" />
          <circle cx="92" cy="122" r="5" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          <line x1="92" y1="164" x2="210" y2="164" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          <rect x="160" y="146" width="44" height="8" rx="4" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          {pose.bar && (
            <g>
              <line x1="92" y1="122" x2={pose.bar[0]} y2={pose.bar[1]} stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="5" fill="#00F5D4" />
            </g>
          )}
        </g>
      );

    case 'leg_machine':
      return (
        <g>
          <rect x="64" y="34" width="34" height="144" rx="10" fill="rgba(30,41,59,0.5)" stroke={frameStroke} strokeWidth="1.5" />
          {/* Backrest & seat */}
          <line x1="114" y1="74" x2="122" y2="132" stroke={padStroke} strokeWidth="9" strokeLinecap="round" />
          <rect x="122" y="134" width="54" height="9" rx="4.5" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          {/* Pivot & moving lever arm */}
          <circle cx="176" cy="134" r="6" fill="#38BDF8" opacity="0.6" />
          {pose.bar && (
            <g>
              <line x1="176" y1="134" x2={pose.bar[0]} y2={pose.bar[1]} stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="7" fill={padFill} stroke="#00F5D4" strokeWidth="2" />
            </g>
          )}
        </g>
      );

    case 'hyper_45':
      return (
        <g>
          <line x1="146" y1="112" x2="210" y2="178" stroke={frameStroke} strokeWidth="4" strokeLinecap="round" />
          <line x1="158" y1="124" x2="138" y2="178" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          <rect x="134" y="106" width="22" height="10" rx="5" transform="rotate(-35 145 111)" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          <circle cx="192" cy="158" r="7" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
        </g>
      );

    case 'bench_incline':
      return (
        <g>
          <line x1="110" y1="96" x2="162" y2="142" stroke={padStroke} strokeWidth="10" strokeLinecap="round" />
          <line x1="164" y1="144" x2="196" y2="144" stroke={padStroke} strokeWidth="9" strokeLinecap="round" />
          <line x1="126" y1="114" x2="118" y2="180" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="184" y1="148" x2="190" y2="180" stroke={frameStroke} strokeWidth="3" strokeLinecap="round" />
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="6.5" fill="#00F5D4" />}
        </g>
      );

    case 'bench_upright':
      return (
        <g>
          <line x1="134" y1="74" x2="138" y2="136" stroke={padStroke} strokeWidth="9" strokeLinecap="round" />
          <rect x="136" y="138" width="44" height="9" rx="4.5" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          <line x1="144" y1="146" x2="140" y2="180" stroke={frameStroke} strokeWidth="3" />
          <line x1="172" y1="146" x2="176" y2="180" stroke={frameStroke} strokeWidth="3" />
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="6.5" fill="#00F5D4" />}
        </g>
      );

    case 'bench_row':
      return (
        <g>
          <rect x="116" y="134" width="88" height="9" rx="4.5" fill={padFill} stroke={padStroke} strokeWidth="1.5" />
          <line x1="128" y1="143" x2="124" y2="180" stroke={frameStroke} strokeWidth="3" />
          <line x1="194" y1="143" x2="198" y2="180" stroke={frameStroke} strokeWidth="3" />
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="7" fill="#00F5D4" />}
        </g>
      );

    case 'wall_bars':
      return (
        <g>
          {/* Espaldera de madera */}
          <line x1="78" y1="24" x2="78" y2="180" stroke="rgba(251,191,36,0.35)" strokeWidth="4" strokeLinecap="round" />
          {[36, 60, 84, 108, 132, 156].map((y) => (
            <line key={y} x1="72" y1={y} x2="84" y2={y} stroke="rgba(251,191,36,0.45)" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          {pose.bar && (
            <line x1="78" y1="60" x2={pose.bar[0]} y2={pose.bar[1]} stroke="#00F5D4" strokeWidth="2.4" strokeDasharray="4 2" />
          )}
        </g>
      );

    case 'mat':
      return (
        <rect x="46" y="172" width="212" height="7" rx="3.5" fill="rgba(34,197,94,0.22)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.2" />
      );

    case 'floor':
    default:
      return (
        <g>
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="6.5" fill="#00F5D4" />}
        </g>
      );
  }
}

function MuscleMapSvg({
  primary,
  secondary,
}: {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
}) {
  const colorFor = (m: MuscleGroup) => {
    if (primary.includes(m)) return '#00F5D4';
    if (secondary.includes(m)) return '#818CF8';
    return 'rgba(148, 163, 184, 0.22)';
  };
  const glowFor = (m: MuscleGroup) => (primary.includes(m) ? 'url(#muscleGlow)' : undefined);

  return (
    <svg viewBox="0 0 280 180" className="h-full w-full">
      <defs>
        <filter id="muscleGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* FRONT SILHOUETTE */}
      <g transform="translate(36, 8)">
        <text x="42" y="10" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontWeight="600">
          FRENTE
        </text>
        <circle cx="42" cy="26" r="9" fill="rgba(148,163,184,0.26)" />
        {/* Shoulders */}
        <circle cx="24" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        <circle cx="60" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        {/* Chest */}
        <rect x="28" y="42" width="28" height="17" rx="6" fill={colorFor('pecho')} filter={glowFor('pecho')} />
        {/* Core */}
        <rect x="31" y="61" width="22" height="28" rx="6" fill={colorFor('core')} filter={glowFor('core')} />
        {/* Biceps */}
        <rect x="17" y="54" width="8" height="24" rx="4" fill={colorFor('biceps')} filter={glowFor('biceps')} />
        <rect x="59" y="54" width="8" height="24" rx="4" fill={colorFor('biceps')} filter={glowFor('biceps')} />
        {/* Forearms */}
        <rect x="16" y="80" width="7" height="22" rx="3.5" fill="rgba(148,163,184,0.22)" />
        <rect x="61" y="80" width="7" height="22" rx="3.5" fill="rgba(148,163,184,0.22)" />
        {/* Quads */}
        <rect x="27" y="92" width="13" height="36" rx="6" fill={colorFor('cuadriceps')} filter={glowFor('cuadriceps')} />
        <rect x="44" y="92" width="13" height="36" rx="6" fill={colorFor('cuadriceps')} filter={glowFor('cuadriceps')} />
        {/* Calves */}
        <rect x="29" y="131" width="10" height="30" rx="5" fill="rgba(148,163,184,0.22)" />
        <rect x="45" y="131" width="10" height="30" rx="5" fill="rgba(148,163,184,0.22)" />
      </g>

      {/* BACK SILHOUETTE */}
      <g transform="translate(160, 8)">
        <text x="42" y="10" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontWeight="600">
          ESPALDA
        </text>
        <circle cx="42" cy="26" r="9" fill="rgba(148,163,184,0.26)" />
        {/* Shoulders back */}
        <circle cx="24" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        <circle cx="60" cy="46" r="7" fill={colorFor('hombros')} filter={glowFor('hombros')} />
        {/* Upper Back */}
        <path d="M26 42 L58 42 L53 69 L31 69 Z" fill={colorFor('espalda')} filter={glowFor('espalda')} />
        {/* Lower Back / Lumbar */}
        <rect x="33" y="71" width="18" height="16" rx="5" fill={colorFor('lumbar')} filter={glowFor('lumbar')} />
        {/* Triceps */}
        <rect x="17" y="54" width="8" height="24" rx="4" fill={colorFor('triceps')} filter={glowFor('triceps')} />
        <rect x="59" y="54" width="8" height="24" rx="4" fill={colorFor('triceps')} filter={glowFor('triceps')} />
        {/* Glutes */}
        <rect x="27" y="88" width="14" height="18" rx="7" fill={colorFor('gluteos')} filter={glowFor('gluteos')} />
        <rect x="43" y="88" width="14" height="18" rx="7" fill={colorFor('gluteos')} filter={glowFor('gluteos')} />
        {/* Hamstrings */}
        <rect x="28" y="108" width="12" height="24" rx="5" fill={colorFor('isquios')} filter={glowFor('isquios')} />
        <rect x="44" y="108" width="12" height="24" rx="5" fill={colorFor('isquios')} filter={glowFor('isquios')} />
        {/* Calves */}
        <rect x="29" y="135" width="10" height="26" rx="5" fill="rgba(148,163,184,0.22)" />
        <rect x="45" y="135" width="10" height="26" rx="5" fill="rgba(148,163,184,0.22)" />
      </g>
    </svg>
  );
}

export const ExerciseDiagram: React.FC<ExerciseDiagramProps> = ({ exercise }) => {
  const [tab, setTab] = useState<VisualTab>('motion');
  const [phase, setPhase] = useState(0); // 0..1 smooth oscillation
  const [exhaling, setExhaling] = useState(false);

  // Reset to motion view when exercise changes
  useEffect(() => {
    setTab('motion');
  }, [exercise.id]);

  // Smooth biomechanical cycle: 3.4s full rep tempo (controlled eccentric + deliberate concentric)
  useEffect(() => {
    if (tab !== 'motion') return;
    let raf = 0;
    const startTime = performance.now();
    const cycleMs = 3400;

    const tick = (now: number) => {
      const elapsed = (now - startTime) % cycleMs;
      const norm = elapsed / cycleMs; // 0..1
      // Ease in-out ping-pong with tiny pause at peak contraction
      let t = 0;
      if (norm < 0.44) {
        const u = norm / 0.44;
        t = 0.5 - 0.5 * Math.cos(Math.PI * u);
        setExhaling(true);
      } else if (norm < 0.56) {
        t = 1;
        setExhaling(true);
      } else {
        const u = (norm - 0.56) / 0.44;
        t = 0.5 + 0.5 * Math.cos(Math.PI * u);
        setExhaling(false);
      }
      setPhase(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tab, exercise.id]);

  const spec = DIAGRAM_SPECS[exercise.diagramType];
  const pose = interpolatePose(spec.start, spec.end, phase);

  return (
    <div className="glass-panel relative flex h-full w-full flex-col overflow-hidden rounded-[26px] p-3">
      {/* Top Bar: Segmented visual mode switcher */}
      <div className="z-10 flex items-center justify-between gap-2">
        <div className="flex rounded-full bg-slate-950/75 p-0.5 border border-white/10">
          {(
            [
              { id: 'motion', label: 'Movimiento', icon: Activity },
              { id: 'safety', label: 'Bien / Evita', icon: ShieldCheck },
              { id: 'muscles', label: 'Músculos', icon: Wind },
            ] as const
          ).map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  active ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="diagramTabPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300 shadow-[0_0_16px_rgba(0,245,212,0.45)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Live breathing phase badge */}
        {tab === 'motion' && (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors duration-300 ${
              exhaling
                ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
                : 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200'
            }`}
          >
            <Wind className="h-3 w-3" />
            <span className="truncate max-w-[130px]">
              {exhaling ? exercise.exhaleCue : exercise.inhaleCue}
            </span>
          </div>
        )}
      </div>

      {/* Main Visual Stage */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {tab === 'motion' && (
            <motion.div
              key="motion"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="relative h-full w-full flex flex-col items-center justify-center"
            >
              <svg viewBox="0 0 300 192" className="flex-1 min-h-0 max-h-[250px] w-full">
                <defs>
                  <radialGradient id="activeZone" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00F5D4" stopOpacity="0.65" />
                    <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="limbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>
                  <marker
                    id="arrowHead"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5.5"
                    markerHeight="5.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#00F5D4" />
                  </marker>
                </defs>

                {/* Floor horizon glow */}
                <line
                  x1="36"
                  y1="180"
                  x2="264"
                  y2="180"
                  stroke="rgba(148,163,184,0.22)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Equipment schematic */}
                {renderMachineBackdrop(spec.machine, pose)}

                {/* Working muscle luminous aura directly on body */}
                <circle
                  cx={pose.glowSpot[0]}
                  cy={pose.glowSpot[1]}
                  r={pose.glowSpot[2]}
                  fill="url(#activeZone)"
                />

                {/* Animated Force Direction Arrow */}
                <path
                  d={spec.arrowPath}
                  fill="none"
                  stroke="#00F5D4"
                  strokeWidth="2.4"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowHead)"
                  className="animate-dash-flow"
                  opacity="0.9"
                />

                {/* Optional back leg (for lunges) */}
                {pose.knee2 && pose.foot2 && (
                  <g opacity="0.45">
                    <line
                      x1={pose.hip[0]}
                      y1={pose.hip[1]}
                      x2={pose.knee2[0]}
                      y2={pose.knee2[1]}
                      stroke="#94A3B8"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <line
                      x1={pose.knee2[0]}
                      y1={pose.knee2[1]}
                      x2={pose.foot2[0]}
                      y2={pose.foot2[1]}
                      stroke="#94A3B8"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Articulated Kinematic Figure */}
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Leg */}
                  <line
                    x1={pose.hip[0]}
                    y1={pose.hip[1]}
                    x2={pose.knee[0]}
                    y2={pose.knee[1]}
                    stroke="url(#limbGrad)"
                    strokeWidth="9.5"
                  />
                  <line
                    x1={pose.knee[0]}
                    y1={pose.knee[1]}
                    x2={pose.foot[0]}
                    y2={pose.foot[1]}
                    stroke="url(#limbGrad)"
                    strokeWidth="8"
                  />
                  {/* Torso */}
                  <line
                    x1={pose.shoulder[0]}
                    y1={pose.shoulder[1]}
                    x2={pose.hip[0]}
                    y2={pose.hip[1]}
                    stroke="#F8FAFC"
                    strokeWidth="12"
                  />
                  {/* Arm */}
                  <line
                    x1={pose.shoulder[0]}
                    y1={pose.shoulder[1]}
                    x2={pose.elbow[0]}
                    y2={pose.elbow[1]}
                    stroke="#CBD5E1"
                    strokeWidth="7.5"
                  />
                  <line
                    x1={pose.elbow[0]}
                    y1={pose.elbow[1]}
                    x2={pose.hand[0]}
                    y2={pose.hand[1]}
                    stroke="#E2E8F0"
                    strokeWidth="6.5"
                  />
                  {/* Head */}
                  <circle cx={pose.head[0]} cy={pose.head[1]} r="11" fill="#F8FAFC" />
                  {/* Glowing joint energy nodes */}
                  <circle cx={pose.shoulder[0]} cy={pose.shoulder[1]} r="3.5" fill="#00F5D4" />
                  <circle cx={pose.hip[0]} cy={pose.hip[1]} r="3.5" fill="#38BDF8" />
                  <circle cx={pose.knee[0]} cy={pose.knee[1]} r="3" fill="#38BDF8" />
                </g>
              </svg>

              {/* Micro setup cue pill at bottom */}
              <div className="mt-0.5 w-full rounded-xl bg-white/[0.04] px-2.5 py-1.5 text-center text-[11px] text-slate-300 border border-white/[0.06]">
                <span className="text-cyan-300 font-semibold">Clave: </span>
                {exercise.setupPin}
              </div>
            </motion.div>
          )}

          {tab === 'safety' && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full flex-col justify-center gap-3 pt-2"
            >
              {/* Visual alignment comparison SVG */}
              <svg viewBox="0 0 280 156" className="w-full flex-1 min-h-0 max-h-[195px]">
                {/* Left: GOOD */}
                <rect
                  x="8"
                  y="4"
                  width="126"
                  height="148"
                  rx="16"
                  fill="rgba(34, 197, 94, 0.08)"
                  stroke="rgba(34, 197, 94, 0.35)"
                  strokeWidth="1.2"
                />
                <text x="71" y="23" textAnchor="middle" fill="#4ADE80" fontSize="11" fontWeight="700">
                  ✓ POSTURA SEGURA
                </text>
                <path
                  d={spec.safetyGoodPath}
                  fill="none"
                  stroke="#4ADE80"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Right: AVOID */}
                <rect
                  x="146"
                  y="4"
                  width="126"
                  height="148"
                  rx="16"
                  fill="rgba(244, 63, 94, 0.08)"
                  stroke="rgba(244, 63, 94, 0.35)"
                  strokeWidth="1.2"
                />
                <text x="209" y="23" textAnchor="middle" fill="#FB7185" fontSize="11" fontWeight="700">
                  ✕ ERROR A EVITAR
                </text>
                <path
                  d={spec.safetyBadPath}
                  fill="none"
                  stroke="#FB7185"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 5"
                />
                <circle
                  cx={spec.safetyBadSpot[0]}
                  cy={spec.safetyBadSpot[1]}
                  r="11"
                  fill="rgba(244, 63, 94, 0.28)"
                  stroke="#FB7185"
                  strokeWidth="2"
                />
              </svg>

              {/* 2-column visual pills, zero long paragraphs */}
              <div className="grid shrink-0 grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 p-2.5 space-y-1.5">
                  {exercise.goodForm.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-tight text-emerald-100">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-rose-500/10 border border-rose-400/25 p-2.5 space-y-1.5">
                  {exercise.avoidForm.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-tight text-rose-100">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'muscles' && (
            <motion.div
              key="muscles"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full flex-col items-center justify-center gap-3 pt-1"
            >
              <div className="flex-1 min-h-0 max-h-[225px] w-full">
                <MuscleMapSvg
                  primary={exercise.primaryMuscles}
                  secondary={exercise.secondaryMuscles}
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5">
                {exercise.primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-cyan-400/15 border border-cyan-300/40 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200"
                  >
                    ● Principal: {MUSCLE_LABELS[m]}
                  </span>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-indigo-400/15 border border-indigo-300/35 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200"
                  >
                    ○ Apoyo: {MUSCLE_LABELS[m]}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
