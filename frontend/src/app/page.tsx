"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  api,
  AnalyticsSummary,
  SessionStatus,
  StartVerificationResult,
} from "@/lib/api";
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  MessageSquare,
  PhoneCall,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [phone, setPhone] = useState("+12025550199");
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] =
    useState<StartVerificationResult | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionStatus | null>(
    null,
  );
  const [otpCode, setOtpCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Поллинг статуса сессии
  useEffect(() => {
    const sessionId = activeSession?.sessionId;
    const isPending = !sessionDetails || sessionDetails.status === "PENDING";

    if (sessionId && isPending) {
      pollingRef.current = setInterval(async () => {
        try {
          const details = await api.getSessionStatus(sessionId);
          setSessionDetails(details);
          if (details.status !== "PENDING") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            loadAnalytics();
          }
        } catch (e) {
          console.error(e);
        }
      }, 2500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeSession?.sessionId, sessionDetails?.status, loadAnalytics]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setOtpCode("");

    try {
      const result = await api.startVerification(phone);
      setActiveSession(result);
      const details = await api.getSessionStatus(result.sessionId);
      setSessionDetails(details);
      loadAnalytics();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ошибка запуска сессии";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setVerifyLoading(true);
    setErrorMsg(null);

    try {
      await api.confirmCode(activeSession.sessionId, otpCode);
      setSuccessMsg("Код успешно подтвержден!");
      const details = await api.getSessionStatus(activeSession.sessionId);
      setSessionDetails(details);
      loadAnalytics();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Неверный код подтверждения";
      setErrorMsg(message);
      const details = await api.getSessionStatus(activeSession.sessionId);
      setSessionDetails(details);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleReset = () => {
    setActiveSession(null);
    setSessionDetails(null);
    setOtpCode("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "TELEGRAM":
        return <MessageSquare className="w-5 h-5 text-sky-400" />;
      case "FLASH_CALL":
        return <PhoneCall className="w-5 h-5 text-amber-400" />;
      case "SMS":
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      default:
        return <Send className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Заголовок */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                CascadeAuth Engine
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Движок каскадной верификации OTP с оптимизацией расходов на SMS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">
              Backend API Active
            </span>
          </div>
        </header>

        {/* Метрики экономии и конверсии */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">
                Сэкономлено
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              ${analytics?.totalSavedUsd.toFixed(2) ?? "0.00"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              По сравнению со 100% SMS
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">
                Конверсия
              </span>
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {analytics?.conversionRate ?? 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {analytics?.verifiedSessions ?? 0} из{" "}
              {analytics?.totalSessions ?? 0} успешно
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">
                SMS предотвращено
              </span>
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {analytics?.fallbackToSmsAvoidedCount ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Доставлено через Telegram / Звонки
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">
                Фактический расход
              </span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              ${analytics?.actualCostUsd.toFixed(3) ?? "0.000"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Базовый расход: $
              {analytics?.baselineCostUsd.toFixed(3) ?? "0.000"}
            </p>
          </div>
        </section>

        {/* Главная рабочая область: Песочница и Таймлайн */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Левая колонка: Форма верификации */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Live Sandbox</h2>
              {activeSession && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Сброс
                </button>
              )}
            </div>

            {!activeSession ? (
              <form onSubmit={handleStart} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Номер телефона (формат E.164)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+12025550199"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Каскад: Telegram (45с) → Flash-call (30с) → SMS
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? "Инициализация..." : "Запустить верификацию"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Сессия:</span>
                    <span className="font-mono text-slate-300">
                      {activeSession.sessionId.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Телефон:</span>
                    <span className="font-mono text-indigo-400 font-medium">
                      {activeSession.phone}
                    </span>
                  </div>
                  {activeSession.devOtpCode && (
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                      <span className="text-amber-400 font-medium">
                        Dev OTP Code:
                      </span>
                      <span className="font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                        {activeSession.devOtpCode}
                      </span>
                    </div>
                  )}
                </div>

                {sessionDetails?.status === "PENDING" && (
                  <form onSubmit={handleConfirm} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Введите код подтверждения
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-xl font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifyLoading || otpCode.length < 4}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm disabled:opacity-50"
                    >
                      {verifyLoading ? "Проверка..." : "Подтвердить код"}
                    </button>
                  </form>
                )}

                {sessionDetails?.status === "VERIFIED" && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-300">
                      Номер успешно подтвержден!
                    </p>
                  </div>
                )}

                {sessionDetails?.status === "BLOCKED" && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center space-y-1">
                    <Lock className="w-8 h-8 text-rose-400 mx-auto" />
                    <p className="text-sm font-semibold text-rose-300">
                      Сессия заблокирована (Anti-Bruteforce)
                    </p>
                  </div>
                )}

                {sessionDetails?.status === "EXPIRED" && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center space-y-1">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-sm font-semibold text-amber-300">
                      Время действия каскада истекло
                    </p>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3">
                {successMsg}
              </div>
            )}
          </div>

          {/* Правая колонка: Каскад шагов и Таймлайн доставки */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">
              Цепочка каскада и логи доставки
            </h2>

            {/* Схема шагов */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  order: 0,
                  channel: "TELEGRAM",
                  label: "Telegram Bot",
                  wait: "45s",
                },
                {
                  order: 1,
                  channel: "FLASH_CALL",
                  label: "Flash Call",
                  wait: "30s",
                },
                {
                  order: 2,
                  channel: "SMS",
                  label: "SMS Gateway",
                  wait: "Финал",
                },
              ].map((step) => {
                const isActive =
                  sessionDetails?.currentStepIndex === step.order &&
                  sessionDetails.status === "PENDING";
                const isPassed =
                  (sessionDetails?.currentStepIndex ?? -1) > step.order ||
                  sessionDetails?.status === "VERIFIED";

                return (
                  <div
                    key={step.order}
                    className={`border rounded-xl p-3.5 transition ${
                      isActive
                        ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50"
                        : isPassed
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-slate-800 bg-slate-950/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {getChannelIcon(step.channel)}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {step.wait}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {step.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {isActive
                        ? "Ожидание ввода..."
                        : isPassed
                          ? "Выполнено"
                          : "В очереди"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Детализированный лог попыток доставки */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Журнал доставки (Audit Trail)
              </span>

              {!sessionDetails?.timeline ||
              sessionDetails.timeline.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                  Запустите верификацию в песочнице, чтобы увидеть лог
                  переключения каналов в реальном времени.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessionDetails.timeline.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {getChannelIcon(attempt.channel)}
                        <div>
                          <div className="font-semibold text-slate-200">
                            {attempt.channel} ({attempt.provider})
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(attempt.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-emerald-400 font-medium">
                          ${Number(attempt.costUsd).toFixed(4)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {attempt.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
