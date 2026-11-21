import React, { useState } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  Dumbbell,
  KeyRound,
  Cloud,
  Download,
  Volume2,
  Vibrate,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { HeartRateState, UserSettings } from '../types/workout';
import { COMPANY_GYM_EQUIPMENT } from '../data/gymEquipment';
import { bluetoothHR, isWebBluetoothSupported } from '../services/bluetoothHR';
import { exportBackupJson } from '../services/storage';

export type SettingsSubTab = 'gym' | 'watch' | 'cloud';

interface GymSettingsViewProps {
  initialTab?: SettingsSubTab;
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  hr: HeartRateState;
}

export const GymSettingsView: React.FC<GymSettingsViewProps> = ({
  initialTab = 'gym',
  settings,
  onUpdateSettings,
  hr,
}) => {
  const [subTab, setSubTab] = useState<SettingsSubTab>(initialTab);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

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
    setTimeout(() => setBackupNotice(null), 2200);
  };

  return (
    <div className="flex h-full flex-col justify-between px-4 pt-3 pb-2 gap-2.5 overflow-hidden">
      {/* HEADER + SUB-TABS */}
      <header className="shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-white">Mi Gym y Ajustes</h1>
            <p className="text-[11px] text-slate-400">Personalizado para tu gimnasio y reloj</p>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold text-slate-300">
            v0.1 Git
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-950/75 p-1 border border-white/10">
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
                  ? 'bg-gradient-to-r from-cyan-300 to-teal-300 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: MI GYM */}
      {subTab === 'gym' && (
        <section className="glass-panel flex flex-1 min-h-0 flex-col rounded-[24px] p-3 overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Equipamiento de tu empresa
            </span>
            <span className="text-[10px] text-slate-400">Toca si algo está averiado</span>
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-2 gap-1.5 overflow-y-auto no-scrollbar">
            {COMPANY_GYM_EQUIPMENT.map((item) => {
              const enabled = !settings.disabledEquipmentIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleEquipment(item.id)}
                  className={`flex flex-col justify-between rounded-2xl border p-2.5 text-left transition-all active:scale-[0.98] ${
                    enabled
                      ? 'border-cyan-400/30 bg-cyan-400/[0.07]'
                      : 'border-white/[0.06] bg-white/[0.02] opacity-55'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[11px] font-bold text-white leading-tight">
                      {item.name}
                    </span>
                    <CheckCircle2
                      className={`h-3.5 w-3.5 shrink-0 ${
                        enabled ? 'text-cyan-300' : 'text-slate-600'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 leading-tight">{item.specs}</p>
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
                  Pixel 9a + Xiaomi Band 10 / futura Amazfit Active Max
                </p>
              </div>
              {hr.connected ? (
                <BluetoothConnected className="h-5 w-5 text-cyan-300" />
              ) : (
                <Bluetooth className="h-5 w-5 text-slate-500" />
              )}
            </div>

            {/* Live BPM Display */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-950/75 border border-white/10 p-3.5">
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
                  className="rounded-xl bg-rose-500/20 border border-rose-400/35 px-3 py-1.5 text-[11px] font-bold text-rose-200"
                >
                  Desconectar
                </button>
              )}
            </div>

            {hr.error && (
              <div className="rounded-xl bg-amber-500/15 border border-amber-400/35 px-3 py-2 text-[11px] text-amber-200">
                {hr.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => bluetoothHR.connectReal(settings.age)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 py-3 text-xs font-extrabold text-slate-950 active:scale-95 transition-transform"
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
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/[0.08] border border-white/15 py-3 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <Radio className="h-4 w-4 text-cyan-300" />
                <span>{hr.simulated ? 'Parar demo' : 'Probar demo'}</span>
              </button>
            </div>
          </div>

          {/* Super clear 2-line setup tips */}
          <div className="space-y-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3 text-[11px] text-slate-300">
            <div className="font-bold text-cyan-200">Guía rápida (1 vez):</div>
            <div>
              • <strong>Xiaomi Band 10 (Mi Fitness):</strong> Dispositivo → Frecuencia cardíaca → activar <em>Compartir FC</em>.
            </div>
            <div>
              • <strong>Amazfit Active Max (Zepp):</strong> Dispositivo → Ajustes → activar <em>Push de frecuencia cardíaca</em>.
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              {isWebBluetoothSupported()
                ? '✓ Este navegador soporta Web Bluetooth directo.'
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
                <KeyRound className="h-3.5 w-3.5 text-cyan-300" />
                <span>Gemini API Key (Google AI Studio)</span>
              </label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => onUpdateSettings({ geminiApiKey: e.target.value })}
                placeholder="Pega tu clave AIza... (se guarda solo en tu móvil)"
                className="w-full rounded-xl bg-slate-950/75 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Opcional: activa el Coach IA directo dentro de la pestaña Progreso.
              </p>
            </div>

            {/* Sound & Haptics */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-bold ${
                  settings.soundEnabled
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-400'
                }`}
              >
                <Volume2 className="h-4 w-4" />
                <span>Sonido {settings.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-bold ${
                  settings.hapticsEnabled
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-400'
                }`}
              >
                <Vibrate className="h-4 w-4" />
                <span>Vibración {settings.hapticsEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Firebase Status */}
            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-400/25 p-3 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-200">Firebase Hosting + Firestore</span>
                <span className="rounded-full bg-indigo-400/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200">
                  Listo Fase 4
                </span>
              </div>
              <p className="text-slate-300 leading-snug">
                Ahora mismo todo se guarda al instante en tu dispositivo (100% offline). Cuando quieras lo conectamos a tu proyecto de Firebase.
              </p>
            </div>
          </div>

          {/* Local JSON Backup */}
          <div className="space-y-1.5">
            <button
              onClick={handleDownloadBackup}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.08] border border-white/15 py-3 text-xs font-bold text-white active:scale-95 transition-transform"
            >
              <Download className="h-4 w-4 text-cyan-300" />
              <span>{backupNotice ?? 'Descargar copia de seguridad (JSON)'}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
