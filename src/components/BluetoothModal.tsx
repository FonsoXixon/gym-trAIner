import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, BluetoothConnected, Radio, X } from 'lucide-react';
import { HeartRateState } from '../types/workout';
import { bluetoothHR, isWebBluetoothSupported } from '../services/bluetoothHR';

interface BluetoothModalProps {
  open: boolean;
  onClose: () => void;
  hr: HeartRateState;
  age: number;
  wearableModel: string;
}

export const BluetoothModal: React.FC<BluetoothModalProps> = ({
  open,
  onClose,
  hr,
  age,
  wearableModel,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-40 flex items-end bg-slate-950/65 backdrop-blur-sm p-3"
        >
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full rounded-[28px] p-4 space-y-3 border-cyan-400/35"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hr.connected ? (
                  <BluetoothConnected className="h-4 w-4 text-cyan-400" />
                ) : (
                  <Bluetooth className="h-4 w-4 text-cyan-400" />
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-white leading-tight">
                    Pulsera en directo
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sin salir de tu entrenamiento actual
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="surface-soft flex h-8 w-8 items-center justify-center rounded-full text-slate-300"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live readout */}
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
                onClick={() => bluetoothHR.connectReal(age)}
                className="keep-dark-text flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 py-3 text-xs font-extrabold text-slate-950 active:scale-95 transition-transform"
              >
                <Bluetooth className="h-4 w-4" />
                <span>{hr.connecting ? 'Buscando...' : 'Conectar real'}</span>
              </button>
              <button
                onClick={() =>
                  hr.simulated
                    ? bluetoothHR.disconnect()
                    : bluetoothHR.startSimulation(age, `${wearableModel} (Demo)`)
                }
                className="surface-soft flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <Radio className="h-4 w-4 text-cyan-400" />
                <span>{hr.simulated ? 'Parar demo' : 'Probar demo'}</span>
              </button>
            </div>

            <div className="surface-soft rounded-xl px-3 py-2 text-[10px] text-slate-400 leading-snug">
              {isWebBluetoothSupported()
                ? 'En Mi Fitness (Xiaomi) activa "Compartir FC" · En Zepp (Amazfit) activa "Push de FC".'
                : 'Abre la app en Chrome desde tu Pixel 9a para conectar Bluetooth real.'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
