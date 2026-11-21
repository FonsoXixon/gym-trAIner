// Screen Wake Lock + Haptics + Gentle Synthesized Chime (Zero External Assets)

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
}

let activeSentinel: WakeLockSentinelLike | null = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  try {
    const nav = navigator as unknown as {
      wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock) return false;
    activeSentinel = await nav.wakeLock.request('screen');
    return true;
  } catch {
    return false;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (activeSentinel && !activeSentinel.released) {
      await activeSentinel.release();
    }
    activeSentinel = null;
  } catch {
    activeSentinel = null;
  }
}

export function triggerHaptic(pattern: number | number[] = 18, enabled = true): void {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on devices without vibration API
  }
}

export function playRestCompleteChime(enabled = true): void {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 pleasant harmonic chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);

      gain.gain.setValueAtTime(0.001, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.11 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.4);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
