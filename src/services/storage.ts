import { CheckInState, CompletedSession, UserSettings } from '../types/workout';
import { getTodayKey } from '../utils/progressionEngine';

const KEYS = {
  HISTORY: 'gym_trainer_history_v1',
  SETTINGS: 'gym_trainer_settings_v1',
  CHECKIN: 'gym_trainer_checkin_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  name: 'Fonso',
  age: 44,
  weeklyGoal: 3,
  defaultDuration: 45,
  theme: 'dark',
  geminiApiKey: '',
  soundEnabled: true,
  hapticsEnabled: true,
  wearableModel: 'Xiaomi Smart Band 10',
  firebaseProjectId: '',
  disabledEquipmentIds: [],
};

export function getDefaultCheckIn(duration: 30 | 45 | 60 = 45): CheckInState {
  return {
    energy: 'normal',
    discomfort: [],
    duration,
    dateKey: getTodayKey(),
  };
}

export function loadHistory(): CompletedSession[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompletedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(sessions: CompletedSession[]): void {
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(sessions));
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadTodayCheckIn(defaultDuration: 30 | 45 | 60): CheckInState {
  try {
    const raw = localStorage.getItem(KEYS.CHECKIN);
    if (!raw) return getDefaultCheckIn(defaultDuration);
    const parsed = JSON.parse(raw) as CheckInState;
    if (parsed.dateKey !== getTodayKey()) {
      return getDefaultCheckIn(defaultDuration);
    }
    return parsed;
  } catch {
    return getDefaultCheckIn(defaultDuration);
  }
}

export function saveTodayCheckIn(checkIn: CheckInState): void {
  localStorage.setItem(KEYS.CHECKIN, JSON.stringify(checkIn));
}

export function exportBackupJson(): string {
  return JSON.stringify(
    {
      app: 'gym-trAIner',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: loadSettings(),
      history: loadHistory(),
    },
    null,
    2
  );
}

export function importBackupJson(jsonStr: string): { ok: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (data.history && Array.isArray(data.history)) {
      saveHistory(data.history);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'El archivo no tiene un formato válido de gym trAIner.' };
  }
}
