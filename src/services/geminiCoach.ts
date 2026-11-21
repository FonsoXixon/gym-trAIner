import { CompletedSession } from '../types/workout';
import { buildCoachExportReport } from '../utils/progressionEngine';

export async function askGeminiCoach(
  apiKey: string,
  userQuestion: string,
  history: CompletedSession[],
  age: number,
  wearableModel: string
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Añade tu API Key gratuita de Google AI Studio en Ajustes > IA & Nube.');
  }

  const context = buildCoachExportReport(history, age, wearableModel);
  const systemPrompt = `Eres el entrenador personal de fuerza de gym trAIner.
Reglas estrictas:
- Habla en español cercano, muy claro y SIN NINGÚN tecnicismo de gimnasio (NO digas Multipower, polea, jalón, curl femoral, press, RPE, RIR ni hipertrofia; usa siempre nombres cotidianos como "máquina de barra con guías", "máquina de cables", "pesas de mano", "máquina azul de piernas").
- Prioriza siempre la seguridad articular (usuario de ${age} años empezando casi de cero, objetivo perder grasa manteniendo/ganando músculo).
- Respuestas cortas y accionables (máximo 5 puntos breves con viñetas).
- Usa SOLO el equipamiento de su gimnasio (máquina de barra con guías, máquina de cables arriba y abajo, máquina azul de piernas, pesas de mano hasta 10kg, banco inclinado de espalda, banco azul regulable, gomas elásticas, correas colgadas, barras de madera en pared, cardio).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    cleanKey
  )}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nCONTEXTO ACTUAL:\n${context}\n\nCONSULTA DEL USUARIO:\n${userQuestion}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      res.status === 400 || res.status === 403
        ? 'La API Key de Gemini no es válida o no tiene permisos.'
        : `Error de Gemini (${res.status}): ${errText.slice(0, 120)}`
    );
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió respuesta.');
  return text.trim();
}
