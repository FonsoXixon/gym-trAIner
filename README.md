# gym trAIner

App móvil (PWA) de entrenamiento de fuerza seguro, visual y sin tecnicismos, diseñada para el gimnasio de empresa y optimizada para **Google Pixel 9a** + sensores de pulso Bluetooth (**Xiaomi Smart Band 10** / **Amazfit Active Max**).

## Características principales

- **Diseño Living Dark Zero-Scroll (`100dvh`)**: estética oscura viva que cambia de atmósfera según fase (reposo, calentamiento, serie activa, descanso o modo protección).
- **1 ejercicio = 1 pantalla con esquemas animados**: dibujos biomecánicos SVG con ritmo de movimiento, respiración en vivo, comparativa visual `Postura segura ✅ vs Error típico ❌` y mapa corporal iluminado.
- **Check-in de seguridad de 5 segundos**: adapta automáticamente cargas, series y ejercicios si marcas energía baja, poco tiempo (`30 / 45 / 60 min`) o molestias (`Lumbar`, `Rodillas`, `Hombros`, `Cuello`).
- **Botón "Máquina ocupada"**: sustituye al instante cualquier ejercicio por un equivalente disponible en tu gimnasio.
- **Esfuerzo sin tecnicismos**: valoración de 1 toque (*Fácil · Ideal · Dura · Al límite*) que ajusta de forma segura la progresión de tu próxima sesión.
- **Pulsera Bluetooth en directo**: lectura GATT Heart Rate estándar desde Chrome en Android + modo demo para pruebas en escritorio.
- **Coach IA flexible**: conexión directa opcional con **Gemini API** (Google AI Studio) + exportación en 1 toque del informe de progreso.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```
