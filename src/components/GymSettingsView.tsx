import React, { useEffect, useRef, useState } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  Dumbbell,
  KeyRound,
  Cloud,
  Download,
  Upload,
  Volume2,
  Vibrate,
  CheckCircle2,
  Radio,
  Sun,
  Moon,
} from 'lucide-react';
import { HeartRateState, ThemeMode, UserSettings } from '../types/workout';
import { COMPANY_GYM_EQUIPMENT } from '../data/gymEquipment';
import { bluetoothHR, isWebBluetoothSupported } from '../services/bluetoothHR';
import { exportBackupJson, importBackupJson } from '../services/storage';
import { ThemeToggleButton } from './ThemeToggleButton';
import { HeartRatePill } from './HeartRatePill';

export type SettingsSubTab = 'gym' | 'watch' | 'cloud';

interface GymSettingsViewProps {
  initialTab?: SettingsSubTab;
  settings: UserSettings;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onDataImported: () => void;
  hr: HeartRateState;
  onOpenBluetooth: () => void;
}

export const GymSettingsView: React.FC<GymSettingsViewProps> = ({
  initialTab = 'gym',
  settings,
  theme,
  onToggleTheme,
  onUpdateSettings,
  onDataImported,
  hr,
  onOpenBluetooth,
}) => {
  const [subTab, setSubTab] = useState<SettingsSubTab>(initialTab);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Always sync sub-tab when navigated via deep link (e.g. Coach IA -> Configurar clave)
  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  const toggleEquipment = (id: string) => {
    const disabled = settings.disabledEquipmentIds.includes(id);
    onUpdateSettings({
      disabledEquipmentIds: disabled
        ? settings.disabledEquipmentIds.filter((x) => x !== id)
        : [...settings.disabledEquipmentIds, id],
    });
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-trAIner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Copia JSON descargada');
    setTimeout(() => setBackupNotice(null), 2400);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackupJson(String(reader.result ?? ''));
      if (res.ok) {
        onDataImported();
        setBackupNotice('Copia restaurada con éxito');
      } else {
        setBackupNotice(res.error ?? 'Error al importar');
      }
      setTimeout(() => setBackupNotice(null), 2800);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-full flex-col justify-between px-4 pt-3 pb-2 gap-2.5 overflow-hidden">
      {/* HEADER + SUB-TABS */}
      <header className="shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold text-white">Mi Gym y Ajustes</h1>
            <p className="text-[11px] text-slate-400">Fotos reales de tu gimnasio y reloj</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            <HeartRatePill hr={hr} onClick={onOpenBluetooth} />
          </div>
        </div>

        <div className="surface-inset grid grid-cols-3 gap-1 rounded-2xl p-1">
          {(
            [
              { id: 'gym', label: 'Mi Gym', icon: Dumbbell },
              { id: 'watch', label: 'Reloj', icon: Bluetooth },
              { id: 'cloud', label: 'IA & Nube', icon: Cloud },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                subTab === id
                  ? 'keep-dark-text bg-gradient-to-r from-cyan-300 to-teal-300 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: MI GYM WITH REAL COMPANY PHOTOS */}
      {subTab === 'gym' && (
        <section className="glass-panel flex flex-1 min-h-0 flex-col rounded-[24px] p-3 overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Tus máquinas reales
            </span>
            <span className="text-[10px] text-slate-400">Toca si alguna está averiada</span>
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-2 gap-2 overflow-y-auto no-scrollbar">
            {COMPANY_GYM_EQUIPMENT.map((item) => {
              const enabled = !settings.disabledEquipmentIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleEquipment(item.id)}
                  className={`flex flex-col overflow-hidden rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    enabled
                      ? 'border-cyan-400/35 bg-cyan-400/[0.06]'
                      : 'surface-soft opacity-50 grayscale'
                  }`}
                >
                  <div className="relative h-20 w-full overflow-hidden">
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/75 p-0.5">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${enabled ? 'text-cyan-300' : 'text-slate-500'}`}
                      />
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {item.name}
                    </div>
                    <p className="mt-0.5 text-[9.5px] text-slate-400 leading-tight line-clamp-2">
                      {item.specs}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: RELOJ / BLUETOOTH */}
      {subTab === 'watch' && (
        <section className="glass-panel flex flex-1 min-h-0 flex-col justify-between rounded-[24px] p-4 overflow-hidden">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white">Pulso en directo (Bluetooth)</h2>
                <p className="text-[11px] text-slate-400">
                  Pixel 9a · selecciona tu reloj actual
                </p>
              </div>
              {hr.connected ? (
                <BluetoothConnected className="h-5 w-5 text-cyan-400" />
              ) : (
                <Bluetooth className="h-5 w-5 text-slate-400" />
              )}
            </div>

            {/* Wearable switcher */}
            <div className="grid grid-cols-2 gap-1.5">
              {['Xiaomi Smart Band 10', 'Amazfit Active Max'].map((model) => {
                const active = settings.wearableModel === model;
                return (
                  <button
                    key={model}
                    onClick={() => onUpdateSettings({ wearableModel: model })}
                    className={`rounded-xl border py-2 px-2 text-[11px] font-bold transition-all ${
                      active
                        ? 'border-cyan-400/55 bg-cyan-400/15 text-cyan-200'
                        : 'surface-soft text-slate-400'
                    }`}
                  >
                    {model}
                  </button>
                );
              })}
            </div>

            {/* Live BPM Display */}
            <div className="surface-inset flex items-center justify-between rounded-2xl p-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  {hr.connected ? hr.deviceName : 'Sin sensor conectado'}
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="font-mono-num text-3xl font-extrabold text-white">
                    {hr.bpm ?? '--'}
                  </span>
                  <span className="text-xs text-slate-400">bpm · zona {hr.zone}</span>
                </div>
              </div>
              {hr.connected && (
                <button
                  onClick={() => bluetoothHR.disconnect()}
                  className="rounded-xl bg-rose-500/20 border border-rose-400/40 px-3 py-1.5 text-[11px] font-bold text-rose-200"
                >
                  Desconectar
                </button>
              )}
            </div>

            {hr.error && (
              <div className="rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-2 text-[11px] text-amber-200">
                {hr.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => bluetoothHR.connectReal(settings.age)}
                className="keep-dark-text flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 py-3 text-xs font-extrabold text-slate-950 active:scale-95 transition-transform"
              >
                <Bluetooth className="h-4 w-4" />
                <span>{hr.connecting ? 'Buscando...' : 'Conectar real'}</span>
              </button>
              <button
                onClick={() =>
                  hr.simulated
                    ? bluetoothHR.disconnect()
                    : bluetoothHR.startSimulation(settings.age, `${settings.wearableModel} (Demo)`)
                }
                className="surface-soft flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <Radio className="h-4 w-4 text-cyan-400" />
                <span>{hr.simulated ? 'Parar demo' : 'Probar demo'}</span>
              </button>
            </div>
          </div>

          {/* Setup guide */}
          <div className="surface-soft space-y-1 rounded-2xl p-3 text-[10.5px] text-slate-300">
            <div className="font-bold text-cyan-200">Guía rápida (solo 1 vez):</div>
            <div>
              • <strong>Xiaomi Band 10 (Mi Fitness):</strong> Dispositivo → Frecuencia cardíaca → <em>Compartir FC</em>.
            </div>
            <div>
              • <strong>Amazfit Active Max (Zepp):</strong> Dispositivo → Ajustes → <em>Push de frecuencia cardíaca</em>.
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              {isWebBluetoothSupported()
                ? '✓ Este navegador soporta Bluetooth directo.'
                : 'ℹ Abre la app en Chrome en tu Pixel 9a para enlace Bluetooth real.'}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: IA & NUBE */}
      {subTab === 'cloud' && (
        <section className="glass-panel flex flex-1 min-h-0 flex-col justify-between rounded-[24px] p-4 overflow-hidden">
          <div className="space-y-3">
            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white">
                <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                <span>Gemini API Key (Google AI Studio)</span>
              </label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => onUpdateSettings({ geminiApiKey: e.target.value })}
                placeholder="Pega tu clave AIza... (se guarda solo en tu móvil)"
                className="surface-inset w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Activa el Coach IA directo dentro de la pestaña Progreso.
              </p>
            </div>

            {/* Theme + Sound + Haptics */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={onToggleTheme}
                className="surface-soft flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-[11px] font-bold text-white active:scale-95 transition-transform"
              >
                {theme === 'light' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-300" />
                )}
                <span>{theme === 'light' ? 'Modo Día' : 'Oscuro'}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border py-2.5 text-[11px] font-bold active:scale-95 transition-transform ${
                  settings.soundEnabled
                    ? 'border-cyan-400/45 bg-cyan-400/15 text-cyan-200'
                    : 'surface-soft text-slate-400'
                }`}
              >
                <Volume2 className="h-4 w-4" />
                <span>Sonido {settings.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border py-2.5 text-[11px] font-bold active:scale-95 transition-transform ${
                  settings.hapticsEnabled
                    ? 'border-cyan-400/45 bg-cyan-400/15 text-cyan-200'
                    : 'surface-soft text-slate-400'
                }`}
              >
                <Vibrate className="h-4 w-4" />
                <span>Vibrar {settings.hapticsEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Firebase Status */}
            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-400/30 p-3 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-200">Firebase Hosting + Firestore</span>
                <span className="rounded-full bg-indigo-400/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200">
                  Listo Fase 4
                </span>
              </div>
              <p className="text-slate-300 leading-snug">
                Todo se guarda offline al instante y tu código ya está en GitHub. Cuando quieras lo desplegamos en tu Firebase.
              </p>
            </div>
          </div>

          {/* 2-way JSON Backup */}
          <div className="space-y-1.5">
            {backupNotice && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/35 px-3 py-1.5 text-center text-[11px] font-bold text-emerald-200">
                {backupNotice}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadBackup}
                className="surface-soft flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <Download className="h-4 w-4 text-cyan-400" />
                <span>Exportar JSON</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="surface-soft flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Importar JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
