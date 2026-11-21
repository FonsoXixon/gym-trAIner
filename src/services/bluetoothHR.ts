import { HeartRateState } from '../types/workout';

// Minimal Web Bluetooth typing so strict TS compiles cleanly without extra @types package
interface BluetoothCharacteristicLike {
  startNotifications(): Promise<BluetoothCharacteristicLike>;
  addEventListener(type: string, listener: (ev: Event) => void): void;
  value?: DataView;
}
interface BluetoothServiceLike {
  getCharacteristic(uuid: number | string): Promise<BluetoothCharacteristicLike>;
}
interface BluetoothGattLike {
  connected: boolean;
  connect(): Promise<BluetoothGattLike>;
  disconnect(): void;
  getPrimaryService(uuid: number | string): Promise<BluetoothServiceLike>;
}
interface BluetoothDeviceLike {
  name?: string;
  gatt?: BluetoothGattLike;
  addEventListener(type: string, listener: () => void): void;
}
interface NavigatorBluetoothLike {
  bluetooth?: {
    requestDevice(options: {
      filters?: Array<{ services?: Array<number | string> }>;
      optionalServices?: Array<number | string>;
    }): Promise<BluetoothDeviceLike>;
  };
}

export function getHeartRateZone(bpm: number | null, age = 44): HeartRateState['zone'] {
  if (!bpm) return 'reposo';
  const maxHr = 220 - age; // ~176 for 44yo
  const pct = bpm / maxHr;
  if (pct < 0.55) return 'reposo';
  if (pct < 0.68) return 'calentamiento';
  if (pct < 0.78) return 'quema';
  if (pct < 0.88) return 'intenso';
  return 'pico';
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean((navigator as unknown as NavigatorBluetoothLike).bluetooth);
}

class BluetoothHRManager {
  private device: BluetoothDeviceLike | null = null;
  private simTimer: number | null = null;
  private listeners = new Set<(state: HeartRateState) => void>();
  private state: HeartRateState = {
    connected: false,
    connecting: false,
    simulated: false,
    deviceName: null,
    bpm: null,
    zone: 'reposo',
    error: null,
  };

  subscribe(fn: (state: HeartRateState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(partial: Partial<HeartRateState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn(this.state));
  }

  async connectReal(age = 44): Promise<void> {
    this.stopSimulation();
    const nav = navigator as unknown as NavigatorBluetoothLike;
    if (!nav.bluetooth) {
      this.emit({
        error:
          'Tu navegador actual no soporta Bluetooth directo. En Android usa Chrome o prueba el modo demo.',
      });
      return;
    }

    try {
      this.emit({ connecting: true, error: null });
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      });

      this.device = device;
      device.addEventListener('gattserverdisconnected', () => {
        this.emit({
          connected: false,
          connecting: false,
          bpm: null,
          zone: 'reposo',
          deviceName: null,
        });
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('No se pudo conectar al sensor GATT.');

      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as unknown as BluetoothCharacteristicLike;
        const value = target.value;
        if (!value) return;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        const bpm = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        this.emit({
          bpm,
          zone: getHeartRateZone(bpm, age),
        });
      });

      this.emit({
        connected: true,
        connecting: false,
        simulated: false,
        deviceName: device.name || 'Pulsera Bluetooth',
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Conexión cancelada';
      this.emit({
        connecting: false,
        connected: false,
        error: msg.includes('cancelled') || msg.includes('User cancelled')
          ? null
          : 'Activa "Compartir frecuencia cardíaca" en Mi Fitness / Zepp y reintenta.',
      });
    }
  }

  startSimulation(age = 44, deviceLabel = 'Xiaomi Band 10 (Demo)'): void {
    this.disconnect();
    let current = 94;
    this.emit({
      connected: true,
      connecting: false,
      simulated: true,
      deviceName: deviceLabel,
      bpm: current,
      zone: getHeartRateZone(current, age),
      error: null,
    });

    this.simTimer = window.setInterval(() => {
      const delta = Math.round((Math.random() - 0.46) * 6);
      current = Math.max(76, Math.min(142, current + delta));
      this.emit({
        bpm: current,
        zone: getHeartRateZone(current, age),
      });
    }, 1800);
  }

  stopSimulation(): void {
    if (this.simTimer !== null) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  disconnect(): void {
    this.stopSimulation();
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.emit({
      connected: false,
      connecting: false,
      simulated: false,
      deviceName: null,
      bpm: null,
      zone: 'reposo',
      error: null,
    });
  }
}

export const bluetoothHR = new BluetoothHRManager();
