import React from 'react';
import { AnatomicalPose, MachineBackdrop, Pt } from './poseData';
import { ThemeMode } from '../../types/workout';

// Build a smooth closed tapered anatomical limb capsule between two points
function capsulePath(a: Pt, b: Pt, r1: number, r2: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 0.01) {
    return `M ${a[0] - r1} ${a[1]} A ${r1} ${r1} 0 1 0 ${a[0] + r1} ${a[1]} A ${r1} ${r1} 0 1 0 ${a[0] - r1} ${a[1]} Z`;
  }
  const nx = -dy / len;
  const ny = dx / len;

  const p1x = a[0] + nx * r1;
  const p1y = a[1] + ny * r1;
  const p2x = b[0] + nx * r2;
  const p2y = b[1] + ny * r2;
  const p3x = b[0] - nx * r2;
  const p3y = b[1] - ny * r2;
  const p4x = a[0] - nx * r1;
  const p4y = a[1] - ny * r1;

  return [
    `M ${p1x.toFixed(1)} ${p1y.toFixed(1)}`,
    `L ${p2x.toFixed(1)} ${p2y.toFixed(1)}`,
    `A ${r2.toFixed(1)} ${r2.toFixed(1)} 0 0 0 ${p3x.toFixed(1)} ${p3y.toFixed(1)}`,
    `L ${p4x.toFixed(1)} ${p4y.toFixed(1)}`,
    `A ${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 0 ${p1x.toFixed(1)} ${p1y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

// Build a contoured torso (either straight or visibly curved via spineMid for posture comparison!)
function torsoPath(shoulder: Pt, hip: Pt, spineMid?: Pt): string {
  if (!spineMid) {
    return capsulePath(shoulder, hip, 8.8, 7.2);
  }
  // Curved torso using two segments + smooth quadratic thickness
  const dx = hip[0] - shoulder[0];
  const dy = hip[1] - shoulder[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const rS = 8.4;
  const rM = 7.4;
  const rH = 7.0;

  const sL: Pt = [shoulder[0] + nx * rS, shoulder[1] + ny * rS];
  const mL: Pt = [spineMid[0] + nx * rM, spineMid[1] + ny * rM];
  const hL: Pt = [hip[0] + nx * rH, hip[1] + ny * rH];

  const hR: Pt = [hip[0] - nx * rH, hip[1] - ny * rH];
  const mR: Pt = [spineMid[0] - nx * rM, spineMid[1] - ny * rM];
  const sR: Pt = [shoulder[0] - nx * rS, shoulder[1] - ny * rS];

  return [
    `M ${sL[0].toFixed(1)} ${sL[1].toFixed(1)}`,
    `Q ${mL[0].toFixed(1)} ${mL[1].toFixed(1)} ${hL[0].toFixed(1)} ${hL[1].toFixed(1)}`,
    `A ${rH} ${rH} 0 0 0 ${hR[0].toFixed(1)} ${hR[1].toFixed(1)}`,
    `Q ${mR[0].toFixed(1)} ${mR[1].toFixed(1)} ${sR[0].toFixed(1)} ${sR[1].toFixed(1)}`,
    `A ${rS} ${rS} 0 0 0 ${sL[0].toFixed(1)} ${sL[1].toFixed(1)}`,
    'Z',
  ].join(' ');
}

interface AnatomicalFigureProps {
  pose: AnatomicalPose;
  variant: 'live' | 'ghost' | 'good' | 'bad';
  theme: ThemeMode;
}

export const AnatomicalFigure: React.FC<AnatomicalFigureProps> = ({
  pose,
  variant,
  theme,
}) => {
  const isLight = theme === 'light';

  const colors = (() => {
    if (variant === 'ghost') {
      return {
        torso: 'none',
        limb: 'none',
        farLimb: 'none',
        stroke: isLight ? 'rgba(8, 145, 178, 0.28)' : 'rgba(0, 245, 212, 0.24)',
        joint: 'none',
        head: 'none',
        shoe: 'none',
      };
    }
    if (variant === 'good') {
      return {
        torso: isLight ? '#059669' : '#34D399',
        limb: isLight ? '#10B981' : '#6EE7B7',
        farLimb: isLight ? 'rgba(5, 150, 105, 0.4)' : 'rgba(52, 211, 153, 0.35)',
        stroke: isLight ? '#064E3B' : '#ECFDF5',
        joint: '#00F5D4',
        head: isLight ? '#059669' : '#A7F3D0',
        shoe: isLight ? '#047857' : '#10B981',
      };
    }
    if (variant === 'bad') {
      return {
        torso: isLight ? '#E11D48' : '#FB7185',
        limb: isLight ? '#F43F5E' : '#FDA4AF',
        farLimb: isLight ? 'rgba(225, 29, 72, 0.4)' : 'rgba(251, 113, 133, 0.35)',
        stroke: isLight ? '#881337' : '#FFF1F2',
        joint: '#F43F5E',
        head: isLight ? '#E11D48' : '#FECDD3',
        shoe: isLight ? '#BE123C' : '#F43F5E',
      };
    }
    // Live figure
    return {
      torso: isLight ? '#1E293B' : '#F1F5F9',
      limb: isLight ? '#334155' : '#E2E8F0',
      farLimb: isLight ? '#94A3B8' : '#64748B',
      stroke: isLight ? '#0F172A' : 'rgba(15, 23, 42, 0.45)',
      joint: isLight ? '#0891B2' : '#00F5D4',
      head: isLight ? '#1E293B' : '#F8FAFC',
      shoe: isLight ? '#0E7490' : '#38BDF8',
    };
  })();

  const isGhost = variant === 'ghost';
  const strokeW = isGhost ? 1.3 : 0.9;
  const dash = isGhost ? '3 3' : undefined;

  // Compute shoe tip direction based on facing & lying
  const shoeDir = pose.facing === 0 ? 1 : pose.facing;
  const footTip: Pt =
    pose.lying === 'supine'
      ? [pose.foot[0] + 6, pose.foot[1] - 7]
      : pose.lying === 'prone'
      ? [pose.foot[0] - 4, pose.foot[1] + 5]
      : [pose.foot[0] + shoeDir * 11, pose.foot[1] + 1];

  // Subtle face direction indicator on head so user immediately sees where person looks
  const gazeX =
    pose.lying === 'supine'
      ? pose.head[0]
      : pose.lying === 'prone'
      ? pose.head[0] - 4
      : pose.head[0] + (pose.facing || 1) * 8.5;
  const gazeY =
    pose.lying === 'supine'
      ? pose.head[1] - 8
      : pose.lying === 'prone'
      ? pose.head[1] + 7
      : pose.head[1] - 1;

  return (
    <g opacity={isGhost ? 0.65 : 1}>
      {/* FAR LIMBS (depth layer) */}
      {pose.knee2 && pose.foot2 && (
        <g>
          <path
            d={capsulePath(pose.hip, pose.knee2, 6.2, 4.8)}
            fill={colors.farLimb}
            stroke={isGhost ? colors.stroke : 'none'}
            strokeWidth={strokeW}
            strokeDasharray={dash}
          />
          <path
            d={capsulePath(pose.knee2, pose.foot2, 4.6, 3.2)}
            fill={colors.farLimb}
            stroke={isGhost ? colors.stroke : 'none'}
            strokeWidth={strokeW}
            strokeDasharray={dash}
          />
        </g>
      )}
      {pose.elbow2 && pose.hand2 && (
        <g>
          <path
            d={capsulePath(pose.shoulder, pose.elbow2, 4.6, 3.8)}
            fill={colors.farLimb}
            stroke={isGhost ? colors.stroke : 'none'}
            strokeWidth={strokeW}
            strokeDasharray={dash}
          />
          <path
            d={capsulePath(pose.elbow2, pose.hand2, 3.6, 2.8)}
            fill={colors.farLimb}
            stroke={isGhost ? colors.stroke : 'none'}
            strokeWidth={strokeW}
            strokeDasharray={dash}
          />
        </g>
      )}

      {/* NEAR LEG (thigh + calf + sneaker) */}
      <path
        d={capsulePath(pose.hip, pose.knee, 7.2, 5.4)}
        fill={colors.limb}
        stroke={colors.stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />
      <path
        d={capsulePath(pose.knee, pose.foot, 5.2, 3.6)}
        fill={colors.limb}
        stroke={colors.stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />
      {!isGhost && (
        <path
          d={capsulePath(pose.foot, footTip, 3.8, 2.8)}
          fill={colors.shoe}
        />
      )}

      {/* SCULPTED TORSO + NECK */}
      <path
        d={capsulePath(pose.neck, pose.shoulder, 4.2, 4.8)}
        fill={colors.torso}
        stroke={isGhost ? colors.stroke : 'none'}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />
      <path
        d={torsoPath(pose.shoulder, pose.hip, pose.spineMid)}
        fill={colors.torso}
        stroke={colors.stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />

      {/* HEAD + GAZE VISOR */}
      <circle
        cx={pose.head[0]}
        cy={pose.head[1]}
        r="10.5"
        fill={colors.head}
        stroke={colors.stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />
      {!isGhost && (
        <circle
          cx={gazeX}
          cy={gazeY}
          r="2.2"
          fill={colors.joint}
        />
      )}

      {/* NEAR ARM (upper arm + forearm + gripping hand) */}
      <path
        d={capsulePath(pose.shoulder, pose.elbow, 5.4, 4.3)}
        fill={colors.limb}
        stroke={colors.stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />
      <path
        d={capsulePath(pose.elbow, pose.hand, 4.1, 3.1)}
        fill={colors.limb}
        stroke={colors.stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
      />
      {!isGhost && <circle cx={pose.hand[0]} cy={pose.hand[1]} r="3.8" fill={colors.torso} stroke={colors.stroke} strokeWidth="0.8" />}

      {/* LUMINOUS BIOMECHANICAL JOINT DOTS (live mode) */}
      {variant === 'live' && (
        <g>
          <circle cx={pose.shoulder[0]} cy={pose.shoulder[1]} r="2.8" fill={colors.joint} />
          <circle cx={pose.hip[0]} cy={pose.hip[1]} r="2.8" fill={isLight ? '#0284C7' : '#38BDF8'} />
          <circle cx={pose.knee[0]} cy={pose.knee[1]} r="2.4" fill={isLight ? '#0284C7' : '#38BDF8'} />
        </g>
      )}
    </g>
  );
};

interface MachineBackdropProps {
  machine: MachineBackdrop;
  pose: AnatomicalPose;
  theme: ThemeMode;
}

export const MachineSchematic: React.FC<MachineBackdropProps> = ({
  machine,
  pose,
  theme,
}) => {
  const isLight = theme === 'light';
  const frameStroke = isLight ? 'rgba(51, 65, 85, 0.45)' : 'rgba(148, 163, 184, 0.36)';
  const towerFill = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 41, 59, 0.62)';
  const padFill = isLight ? 'rgba(14, 165, 233, 0.22)' : 'rgba(56, 189, 248, 0.22)';
  const padStroke = isLight ? 'rgba(2, 132, 199, 0.7)' : 'rgba(56, 189, 248, 0.6)';
  const accent = isLight ? '#0891B2' : '#00F5D4';
  const cableCol = isLight ? '#0284C7' : '#38BDF8';

  switch (machine) {
    case 'multipower':
      return (
        <g>
          <line x1="142" y1="18" x2="142" y2="180" stroke={frameStroke} strokeWidth="4" strokeLinecap="round" />
          <line x1="154" y1="18" x2="154" y2="180" stroke={frameStroke} strokeWidth="1.5" opacity="0.5" />
          <line x1="122" y1="20" x2="174" y2="20" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          {/* Green safety stopper */}
          <rect x="136" y="130" width="12" height="6" rx="2.5" fill="#10B981" />
          {pose.bar && (
            <g>
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="13" fill={isLight ? '#E2E8F0' : '#0F172A'} stroke={accent} strokeWidth="2.8" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="4" fill={accent} />
            </g>
          )}
        </g>
      );

    case 'multipower_bench':
      return (
        <g>
          <line x1="134" y1="18" x2="134" y2="180" stroke={frameStroke} strokeWidth="4" strokeLinecap="round" />
          <rect x="92" y="138" width="108" height="11" rx="5.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <line x1="108" y1="149" x2="104" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="186" y1="149" x2="190" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          {pose.bar && (
            <g>
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="12" fill={isLight ? '#E2E8F0' : '#0F172A'} stroke={accent} strokeWidth="2.6" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="3.5" fill={accent} />
            </g>
          )}
        </g>
      );

    case 'pulldown_seated':
      return (
        <g>
          {/* Weight stack tower on left */}
          <rect x="66" y="22" width="26" height="156" rx="6" fill={towerFill} stroke={frameStroke} strokeWidth="1.6" />
          {[116, 126, 136, 146, 156].map((y) => (
            <line key={y} x1="71" y1={y} x2="87" y2={y} stroke={frameStroke} strokeWidth="2" />
          ))}
          <line x1="79" y1="22" x2="156" y2="22" stroke={frameStroke} strokeWidth="4" strokeLinecap="round" />
          {pose.bar && (
            <g>
              <line x1="150" y1="22" x2={pose.bar[0]} y2={pose.bar[1]} stroke={cableCol} strokeWidth="2" strokeDasharray="3 2" />
              <line x1={pose.bar[0] - 14} y1={pose.bar[1]} x2={pose.bar[0] + 14} y2={pose.bar[1]} stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
            </g>
          )}
          {/* Blue seat & thigh roller */}
          <rect x="134" y="146" width="44" height="9" rx="4.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <line x1="156" y1="155" x2="156" y2="180" stroke={frameStroke} strokeWidth="3.5" />
          <circle cx="128" cy="128" r="7" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
        </g>
      );

    case 'seated_row':
      return (
        <g>
          <rect x="60" y="24" width="26" height="154" rx="6" fill={towerFill} stroke={frameStroke} strokeWidth="1.6" />
          <circle cx="92" cy="122" r="5.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <line x1="92" y1="164" x2="214" y2="164" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="160" y="146" width="46" height="9" rx="4.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          {/* Footrest */}
          <line x1="100" y1="146" x2="100" y2="172" stroke={frameStroke} strokeWidth="4" strokeLinecap="round" />
          {pose.bar && (
            <g>
              <line x1="92" y1="122" x2={pose.bar[0]} y2={pose.bar[1]} stroke={cableCol} strokeWidth="2.2" strokeDasharray="3 2" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="5.5" fill={accent} />
            </g>
          )}
        </g>
      );

    case 'cable_high_standing':
      return (
        <g>
          {/* Clean standing cable tower — NO seat overlapping the legs! */}
          <rect x="64" y="20" width="26" height="158" rx="6" fill={towerFill} stroke={frameStroke} strokeWidth="1.6" />
          {[118, 128, 138, 148, 158].map((y) => (
            <line key={y} x1="69" y1={y} x2="85" y2={y} stroke={frameStroke} strokeWidth="2" />
          ))}
          <line x1="77" y1="20" x2="148" y2="20" stroke={frameStroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="144" cy="24" r="5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          {pose.bar && (
            <g>
              <line x1="144" y1="24" x2={pose.bar[0]} y2={pose.bar[1]} stroke={cableCol} strokeWidth="2.2" strokeDasharray="3 2" />
              <line x1={pose.bar[0] - 9} y1={pose.bar[1]} x2={pose.bar[0] + 9} y2={pose.bar[1]} stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
            </g>
          )}
        </g>
      );

    case 'cable_low_standing':
      return (
        <g>
          <rect x="64" y="20" width="26" height="158" rx="6" fill={towerFill} stroke={frameStroke} strokeWidth="1.6" />
          <circle cx="96" cy="170" r="6" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          {pose.bar && (
            <g>
              <line x1="96" y1="170" x2={pose.bar[0]} y2={pose.bar[1]} stroke={cableCol} strokeWidth="2.2" strokeDasharray="3 2" />
              <line x1={pose.bar[0] - 9} y1={pose.bar[1]} x2={pose.bar[0] + 9} y2={pose.bar[1]} stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
            </g>
          )}
        </g>
      );

    case 'cable_mid_standing':
      return (
        <g>
          <rect x="62" y="20" width="24" height="158" rx="6" fill={towerFill} stroke={frameStroke} strokeWidth="1.6" />
          <circle cx="90" cy="84" r="5.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          {pose.bar && (
            <g>
              <line x1="90" y1="84" x2={pose.bar[0]} y2={pose.bar[1]} stroke={cableCol} strokeWidth="2.2" strokeDasharray="4 2" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="5" fill={accent} />
            </g>
          )}
        </g>
      );

    case 'leg_machine':
      return (
        <g>
          <rect x="58" y="34" width="34" height="144" rx="10" fill={towerFill} stroke={frameStroke} strokeWidth="1.6" />
          <line x1="112" y1="70" x2="122" y2="132" stroke={padStroke} strokeWidth="10" strokeLinecap="round" />
          <rect x="122" y="134" width="56" height="10" rx="5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <circle cx="178" cy="134" r="6.5" fill={cableCol} opacity="0.65" />
          {pose.bar && (
            <g>
              <line x1="178" y1="134" x2={pose.bar[0]} y2={pose.bar[1]} stroke={frameStroke} strokeWidth="3.8" strokeLinecap="round" />
              <circle cx={pose.bar[0]} cy={pose.bar[1]} r="7.5" fill={padFill} stroke={accent} strokeWidth="2.2" />
            </g>
          )}
        </g>
      );

    case 'hyper_45':
      return (
        <g>
          <line x1="146" y1="112" x2="212" y2="178" stroke={frameStroke} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="158" y1="124" x2="138" y2="178" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="134" y="106" width="24" height="11" rx="5.5" transform="rotate(-35 145 111)" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <circle cx="194" cy="158" r="7.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
        </g>
      );

    case 'bench_incline':
      return (
        <g>
          <line x1="108" y1="94" x2="162" y2="142" stroke={padStroke} strokeWidth="11" strokeLinecap="round" />
          <line x1="164" y1="144" x2="198" y2="144" stroke={padStroke} strokeWidth="10" strokeLinecap="round" />
          <line x1="126" y1="114" x2="118" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="184" y1="148" x2="190" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="7" fill={accent} />}
        </g>
      );

    case 'bench_flat_pushup':
      return (
        <g>
          <rect x="64" y="128" width="60" height="11" rx="5.5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <line x1="76" y1="139" x2="72" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="112" y1="139" x2="116" y2="180" stroke={frameStroke} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );

    case 'bench_upright':
      return (
        <g>
          <line x1="132" y1="70" x2="138" y2="136" stroke={padStroke} strokeWidth="10" strokeLinecap="round" />
          <rect x="136" y="138" width="46" height="10" rx="5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <line x1="144" y1="148" x2="140" y2="180" stroke={frameStroke} strokeWidth="3.5" />
          <line x1="174" y1="148" x2="178" y2="180" stroke={frameStroke} strokeWidth="3.5" />
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="7" fill={accent} />}
        </g>
      );

    case 'bench_row':
      return (
        <g>
          <rect x="114" y="134" width="90" height="10" rx="5" fill={padFill} stroke={padStroke} strokeWidth="1.6" />
          <line x1="126" y1="144" x2="122" y2="180" stroke={frameStroke} strokeWidth="3.5" />
          <line x1="194" y1="144" x2="198" y2="180" stroke={frameStroke} strokeWidth="3.5" />
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="7.5" fill={accent} />}
        </g>
      );

    case 'wall_bars_high':
    case 'wall_bars_mid': {
      const anchorY = machine === 'wall_bars_high' ? 38 : 60;
      return (
        <g>
          <line x1="76" y1="20" x2="76" y2="180" stroke="rgba(245, 158, 11, 0.55)" strokeWidth="4.5" strokeLinecap="round" />
          {[32, 56, 80, 104, 128, 152].map((y) => (
            <line key={y} x1="69" y1={y} x2="83" y2={y} stroke="rgba(245, 158, 11, 0.65)" strokeWidth="2.8" strokeLinecap="round" />
          ))}
          {pose.bar && (
            <line x1="76" y1={anchorY} x2={pose.bar[0]} y2={pose.bar[1]} stroke={accent} strokeWidth="2.8" strokeDasharray="5 2.5" />
          )}
        </g>
      );
    }

    case 'mat':
      return (
        <rect
          x="42"
          y="172"
          width="216"
          height="8"
          rx="4"
          fill="rgba(16, 185, 129, 0.25)"
          stroke="rgba(16, 185, 129, 0.6)"
          strokeWidth="1.4"
        />
      );

    case 'floor_band':
      return (
        <g>
          {pose.bar && (
            <line x1={pose.foot[0]} y1={pose.foot[1]} x2={pose.bar[0]} y2={pose.bar[1]} stroke="#F59E0B" strokeWidth="2.8" strokeDasharray="4 2" />
          )}
          {pose.bar && <circle cx={pose.bar[0]} cy={pose.bar[1]} r="5.5" fill={accent} />}
        </g>
      );

    case 'floor_db':
    default:
      return (
        <g>
          {pose.bar && (
            <g>
              <rect x={pose.bar[0] - 9} y={pose.bar[1] - 4.5} width="18" height="9" rx="3.5" fill={accent} />
            </g>
          )}
        </g>
      );
  }
};
