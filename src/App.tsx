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
import { BluetoothModal } from './components/BluetoothModal';

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
  const [bluetoothModalOpen, setBluetoothModalOpen] = useState(false);

  const [hr, setHr] = useState<HeartRateState>({
    connected: false,
    connecting: false,
    simulated: false,
    deviceName: null,
    bpm: null,
    zone: 'reposo',
    error: null,
  });

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

  const handleToggleTheme = () => {
    handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleUpdateCheckIn = (patch: Partial<CheckInState>) => {
    setCheckIn((prev) => {
      const next = { ...prev, ...patch };
      saveTodayCheckIn(next);
      return next;
    });
  };

  const handleDataImported = () => {
    setSettings(loadSettings());
    const freshHistory = loadHistory();
    setHistory(freshHistory);
    setSelectedRoutineId(getSuggestedRoutineId(freshHistory));
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
    setActiveTab('settings');
  };

  const currentAuraMode: AuraMode = workoutActive
    ? workoutAura
    : checkIn.discomfort.length > 0
    ? 'safe'
    : 'calm';

  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark';

  return (
    <div
      className={`${themeClass} relative flex h-[100dvh] w-full items-center justify-center overflow-hidden transition-colors duration-500`}
      style={{
        backgroundColor: settings.theme === 'light' ? '#DCE8F5' : '#03050A',
      }}
    >
      {/* Subtle outer desktop glow */}
      <div
        className="pointer-events-none hidden md:block absolute inset-0"
        style={{
          background:
            settings.theme === 'light'
              ? 'radial-gradient(circle at 50% 40%, rgba(14,165,233,0.16), transparent 60%)'
              : 'radial-gradient(circle at 50% 40%, rgba(0,245,212,0.09), transparent 60%)',
        }}
      />

      {/* App Shell: Full-bleed on Pixel 9a, sleek floating mobile frame on desktop */}
      <main
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden md:h-[min(92dvh,860px)] md:max-w-[420px] md:rounded-[40px] md:border md:shadow-[0_30px_100px_rgba(0,0,0,0.45)] transition-colors duration-500"
        style={{
          backgroundColor: settings.theme === 'light' ? '#EDF4FB' : '#05070C',
          borderColor:
            settings.theme === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)',
        }}
      >
        {/* Living Reactive World Background */}
        <LivingAura mode={currentAuraMode} theme={settings.theme} bpm={hr.bpm} />

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
                  theme={settings.theme}
                  onToggleTheme={handleToggleTheme}
                  soundEnabled={settings.soundEnabled}
                  hapticsEnabled={settings.hapticsEnabled}
                  onAuraChange={setWorkoutAura}
                  onOpenBluetooth={() => setBluetoothModalOpen(true)}
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
                  theme={settings.theme}
                  onToggleTheme={handleToggleTheme}
                  selectedRoutineId={selectedRoutineId}
                  suggestedRoutineId={suggestedRoutineId}
                  onSelectRoutine={setSelectedRoutineId}
                  checkIn={checkIn}
                  onUpdateCheckIn={handleUpdateCheckIn}
                  adaptedSession={adaptedSession}
                  weekCount={weeklyStats.weekCount}
                  weeklyGoal={weeklyStats.weeklyGoal}
                  hr={hr}
                  onOpenBluetooth={() => setBluetoothModalOpen(true)}
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
                  theme={settings.theme}
                  onToggleTheme={handleToggleTheme}
                  hr={hr}
                  onOpenBluetooth={() => setBluetoothModalOpen(true)}
                  onOpenSettingsAI={() => openSettingsTab('cloud')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                <GymSettingsView
                  initialTab={settingsSubTab}
                  settings={settings}
                  theme={settings.theme}
                  onToggleTheme={handleToggleTheme}
                  onUpdateSettings={handleUpdateSettings}
                  onDataImported={handleDataImported}
                  hr={hr}
                  onOpenBluetooth={() => setBluetoothModalOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Bottom Navigation */}
        {!workoutActive && <BottomNav active={activeTab} onChange={setActiveTab} />}

        {/* In-Place Non-Destructive Bluetooth Heart Rate Overlay (works even mid-workout!) */}
        <BluetoothModal
          open={bluetoothModalOpen}
          onClose={() => setBluetoothModalOpen(false)}
          hr={hr}
          age={settings.age}
          wearableModel={settings.wearableModel}
        />
      </main>
    </div>
  );
}

export default App;
