import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AuraMode,
  CheckInState,
  CompletedSession,
  HeartRateState,
  UserSettings,
} from './types/workout';
import {
  loadHistory,
  loadSettings,
  loadTodayCheckIn,
  saveHistory,
  saveSettings,
  saveTodayCheckIn,
} from './services/storage';
import {
  buildAdaptedSession,
  getSuggestedRoutineId,
  getWeeklyStats,
} from './utils/progressionEngine';
import { bluetoothHR } from './services/bluetoothHR';
import { LivingAura } from './components/LivingAura';
import { BottomNav, NavTab } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { WorkoutView } from './components/WorkoutView';
import { ProgressView } from './components/ProgressView';
import { GymSettingsView, SettingsSubTab } from './components/GymSettingsView';

export function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [history, setHistory] = useState<CompletedSession[]>(() => loadHistory());
  const [checkIn, setCheckIn] = useState<CheckInState>(() =>
    loadTodayCheckIn(loadSettings().defaultDuration)
  );

  const suggestedRoutineId = useMemo(() => getSuggestedRoutineId(history), [history]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<'A' | 'B' | 'C'>(suggestedRoutineId);

  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('gym');
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutAura, setWorkoutAura] = useState<AuraMode>('calm');

  const [hr, setHr] = useState<HeartRateState>({
    connected: false,
    connecting: false,
    simulated: false,
    deviceName: null,
    bpm: null,
    zone: 'reposo',
    error: null,
  });

  // Subscribe to Bluetooth / Demo heart rate stream
  useEffect(() => {
    return bluetoothHR.subscribe(setHr);
  }, []);

  const handleUpdateSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const handleUpdateCheckIn = (patch: Partial<CheckInState>) => {
    setCheckIn((prev) => {
      const next = { ...prev, ...patch };
      saveTodayCheckIn(next);
      return next;
    });
  };

  const adaptedSession = useMemo(
    () =>
      buildAdaptedSession(
        selectedRoutineId,
        checkIn,
        history,
        settings.disabledEquipmentIds
      ),
    [selectedRoutineId, checkIn, history, settings.disabledEquipmentIds]
  );

  const weeklyStats = useMemo(
    () => getWeeklyStats(history, settings.weeklyGoal),
    [history, settings.weeklyGoal]
  );

  const handleFinishWorkout = (completed: CompletedSession) => {
    const updated = [completed, ...history];
    setHistory(updated);
    saveHistory(updated);
    setSelectedRoutineId(getSuggestedRoutineId(updated));
    setWorkoutActive(false);
    setActiveTab('progress');
  };

  const openSettingsTab = (tab: SettingsSubTab) => {
    setSettingsSubTab(tab);
    setWorkoutActive(false);
    setActiveTab('settings');
  };

  // Compute global living aura mode
  const currentAuraMode: AuraMode = workoutActive
    ? workoutAura
    : checkIn.discomfort.length > 0
    ? 'safe'
    : 'calm';

  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#03050A]">
      {/* Subtle outer desktop glow */}
      <div className="pointer-events-none hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,245,212,0.09),transparent_60%)]" />

      {/* App Shell: Full-bleed on mobile (Pixel 9a), sleek floating mobile frame on desktop */}
      <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#05070C] md:h-[min(92dvh,860px)] md:max-w-[420px] md:rounded-[40px] md:border md:border-white/[0.12] md:shadow-[0_30px_100px_rgba(0,0,0,0.85)]">
        {/* Living Reactive World Background */}
        <LivingAura mode={currentAuraMode} bpm={hr.bpm} />

        {/* Foreground Interactive Views */}
        <div className="relative z-10 flex flex-1 min-h-0 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {workoutActive ? (
              <motion.div
                key="workout"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="h-full w-full"
              >
                <WorkoutView
                  session={adaptedSession}
                  checkIn={checkIn}
                  hr={hr}
                  soundEnabled={settings.soundEnabled}
                  hapticsEnabled={settings.hapticsEnabled}
                  onAuraChange={setWorkoutAura}
                  onOpenWatchSettings={() => openSettingsTab('watch')}
                  onFinish={handleFinishWorkout}
                  onCancel={() => setWorkoutActive(false)}
                />
              </motion.div>
            ) : activeTab === 'today' ? (
              <motion.div
                key="today"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                <TodayView
                  userName={settings.name}
                  selectedRoutineId={selectedRoutineId}
                  suggestedRoutineId={suggestedRoutineId}
                  onSelectRoutine={setSelectedRoutineId}
                  checkIn={checkIn}
                  onUpdateCheckIn={handleUpdateCheckIn}
                  adaptedSession={adaptedSession}
                  weekCount={weeklyStats.weekCount}
                  weeklyGoal={weeklyStats.weeklyGoal}
                  hr={hr}
                  onOpenWatchSettings={() => openSettingsTab('watch')}
                  onStartWorkout={() => setWorkoutActive(true)}
                />
              </motion.div>
            ) : activeTab === 'progress' ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                <ProgressView
                  history={history}
                  settings={settings}
                  onOpenSettingsAI={() => openSettingsTab('cloud')}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`settings-${settingsSubTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                <GymSettingsView
                  initialTab={settingsSubTab}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  hr={hr}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Bottom Navigation (Hidden during active workout for max zero-scroll visual room) */}
        {!workoutActive && <BottomNav active={activeTab} onChange={setActiveTab} />}
      </main>
    </div>
  );
}

export default App;
