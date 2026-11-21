import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  X,
  Flame,
  Calendar,
  Activity,
} from 'lucide-react';
import { CompletedSession, HeartRateState, ThemeMode, UserSettings } from '../types/workout';
import { buildCoachExportReport, getWeeklyStats } from '../utils/progressionEngine';
import { askGeminiCoach } from '../services/geminiCoach';
import { EXERCISES } from '../data/exercises';
import { ThemeToggleButton } from './ThemeToggleButton';
import { HeartRatePill } from './HeartRatePill';

interface ProgressViewProps {
  history: CompletedSession[];
  settings: UserSettings;
  theme: ThemeMode;
  onToggleTheme: () => void;
  hr: HeartRateState;
  onOpenBluetooth: () => void;
  onOpenSettingsAI: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  history,
  settings,
  theme,
  onToggleTheme,
  hr,
  onOpenBluetooth,
  onOpenSettingsAI,
}) => {
  const stats = getWeeklyStats(history, settings.weeklyGoal);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [coachOpen, setCoachOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const selectedSession = history[selectedIdx];

  const chartSessions = [...history].slice(0, 7).reverse();
  const maxVol = Math.max(100, ...chartSessions.map((s) => s.totalVolumeKg || 100));

  const handleCopyReport = async () => {
    const report = buildCoachExportReport(history, settings.age, settings.wearableModel);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleAskGemini = async (promptText?: string) => {
    const q = (promptText ?? question).trim();
    if (!q) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const answer = await askGeminiCoach(
        settings.geminiApiKey,
        q,
        history,
        settings.age,
        settings.wearableModel
      );
      setAiReply(answer);
      setQuestion('');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'No se pudo consultar a Gemini.');
    } finally {
      setAiLoading(false);
    }
  };

  const ringRadius = 38;
  const ringCirc = 2 * Math.PI * ringRadius;

  return (
    <div className="relative flex h-full flex-col justify-between px-4 pt-3 pb-2 gap-2.5 overflow-hidden">
      {/* HEADER */}
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-white">Tu Evolución</h1>
          <p className="text-[11px] text-slate-400">Constancia segura · sin obsesiones</p>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
          <HeartRatePill hr={hr} onClick={onOpenBluetooth} />
        </div>
      </header>

      {/* WEEKLY RING + KEY METRICS + COACH CTA */}
      <section className="glass-panel shrink-0 rounded-[24px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
              <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r={ringRadius}
                fill="none"
                stroke="url(#progRing)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc * (1 - stats.weekProgressPct / 100)}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="progRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5D4" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-num text-lg font-extrabold text-white">
                {stats.weekCount}/{stats.weeklyGoal}
              </span>
              <span className="text-[9px] text-slate-400">semana</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2">
            <div className="surface-soft rounded-2xl p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Flame className="h-3 w-3 text-amber-400" />
                <span>Totales</span>
              </div>
              <div className="font-mono-num text-lg font-extrabold text-white mt-0.5">
                {stats.totalSessions}
              </div>
            </div>
            <div className="surface-soft rounded-2xl p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Activity className="h-3 w-3 text-cyan-400" />
                <span>Semana</span>
              </div>
              <div className="font-mono-num text-lg font-extrabold text-cyan-200 mt-0.5">
                {stats.totalMinutesWeek}m
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCoachOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-indigo-400/20 border border-cyan-400/40 py-2.5 text-xs font-bold text-cyan-200 active:scale-[0.98] transition-transform"
        >
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Abrir Coach IA · Ajustar mi plan</span>
        </button>
      </section>

      {/* VISUAL STRENGTH TREND SPARKLINE */}
      <section className="glass-panel shrink-0 rounded-[24px] p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-200">Fuerza acumulada por sesión</span>
          <span className="text-[10px] text-cyan-300 font-semibold">
            {chartSessions.length > 0 ? `${chartSessions.length} sesiones` : 'Empieza hoy'}
          </span>
        </div>

        {chartSessions.length < 2 ? (
          <div className="surface-soft flex h-16 items-center justify-center rounded-2xl border-dashed text-xs text-slate-400 text-center px-4">
            Completa 2 sesiones y verás aquí tu curva viva de progreso en fuerza.
          </div>
        ) : (
          <svg viewBox="0 0 280 72" className="h-16 w-full overflow-visible">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F5D4" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#00F5D4" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = chartSessions.map((s, i) => {
                const x = 14 + (i / (chartSessions.length - 1)) * 252;
                const y = 60 - ((s.totalVolumeKg || 60) / maxVol) * 48;
                return { x, y };
              });
              const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaD = `${lineD} L ${pts[pts.length - 1].x} 68 L ${pts[0].x} 68 Z`;
              return (
                <>
                  <path d={areaD} fill="url(#areaGrad)" />
                  <path d={lineD} fill="none" stroke="#06B6D4" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#05070C" stroke="#00F5D4" strokeWidth="2.2" />
                  ))}
                </>
              );
            })()}
          </svg>
        )}
      </section>

      {/* RECENT SESSION INSPECTOR */}
      <section className="glass-panel flex flex-1 min-h-0 flex-col justify-between rounded-[24px] p-3.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            <span>Historial reciente</span>
          </div>
          {history.length > 0 && (
            <div className="flex gap-1">
              {history.slice(0, 4).map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors ${
                    selectedIdx === i
                      ? 'bg-cyan-400 keep-dark-text text-slate-950'
                      : 'surface-soft text-slate-400'
                  }`}
                >
                  {s.routineId}
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedSession ? (
          <div className="my-auto text-center py-2">
            <p className="text-xs text-slate-200 font-semibold">Aún no hay sesiones guardadas</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              En cuanto termines tu primera Sesión A aparecerá aquí con detalle.
            </p>
          </div>
        ) : (
          <div className="mt-2 flex-1 min-h-0 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-white">{selectedSession.routineTitle}</span>
              <span>
                {new Date(selectedSession.dateIso).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                })}{' '}
                · {selectedSession.durationMinutes}m
              </span>
            </div>

            <div className="mt-1.5 space-y-1 overflow-hidden">
              {selectedSession.exercises.slice(0, 4).map((ex) => {
                const name = EXERCISES[ex.exerciseId]?.shortName ?? ex.exerciseId;
                const best = ex.sets[ex.sets.length - 1];
                return (
                  <div
                    key={ex.exerciseId}
                    className="surface-soft flex items-center justify-between rounded-xl px-2.5 py-1 text-[11px]"
                  >
                    <span className="text-slate-200 truncate">{name}</span>
                    <span className="font-mono-num text-cyan-200 shrink-0">
                      {ex.sets.length}×{best?.reps ?? 0}
                      {best && best.weightKg > 0 ? ` · ${best.weightKg}kg` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* COACH IA MODAL SHEET */}
      <AnimatePresence>
        {coachOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-end bg-slate-950/75 backdrop-blur-md p-3"
            onClick={() => setCoachOpen(false)}
          >
            <motion.div
              initial={{ y: 90 }}
              animate={{ y: 0 }}
              exit={{ y: 90 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel flex max-h-[82%] w-full flex-col rounded-[28px] p-4 border-cyan-400/35 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-white">Coach IA · Adaptación</h3>
                </div>
                <button
                  onClick={() => setCoachOpen(false)}
                  className="surface-soft rounded-full p-1.5 text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleCopyReport}
                className="surface-soft flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-xs font-semibold text-slate-100 active:scale-[0.98] transition-transform"
              >
                <span>
                  {copied
                    ? '¡Informe copiado al portapapeles!'
                    : 'Copiar parte completo (para Antigravity / ChatGPT)'}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-cyan-400 shrink-0" />
                )}
              </button>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Hoy dormí mal, ¿qué ajusto?',
                  'Me tira un poco el hombro',
                  '¿Cuándo subo de peso?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleAskGemini(q)}
                    className="rounded-full bg-cyan-400/15 border border-cyan-400/35 px-2.5 py-1 text-[10px] font-bold text-cyan-200"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="surface-inset flex-1 min-h-[110px] overflow-y-auto no-scrollbar rounded-2xl p-3 text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                {aiLoading ? (
                  <span className="text-cyan-300">Pensando tu ajuste seguro con Gemini...</span>
                ) : aiError ? (
                  <div className="space-y-2">
                    <p className="text-amber-300">{aiError}</p>
                    <button
                      onClick={() => {
                        setCoachOpen(false);
                        onOpenSettingsAI();
                      }}
                      className="rounded-xl bg-cyan-400/20 border border-cyan-400/40 px-3 py-1.5 text-[11px] font-bold text-cyan-200"
                    >
                      Configurar Gemini API Key →
                    </button>
                  </div>
                ) : aiReply ? (
                  aiReply
                ) : (
                  <span className="text-slate-400">
                    Pregunta en directo a Gemini (con tu clave gratuita de AI Studio) o copia el parte arriba para analizarlo juntos.
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskGemini();
                }}
                className="flex gap-2"
              >
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ej: Solo tengo 25 min hoy..."
                  className="surface-inset flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="keep-dark-text flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
