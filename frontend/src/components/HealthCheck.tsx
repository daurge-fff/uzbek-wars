import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

type LampStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface BackendService {
  status?: string;
  connected?: boolean;
  running?: boolean;
  uptime?: number;
  latencyMs?: number | null;
  memory?: { rss?: number; heapUsed?: number; heapTotal?: number };
}

interface BackendCheck {
  id: string;
  label?: string;
  status?: string;
  detail?: string;
  latencyMs?: number | null;
}

interface HealthPayload {
  status?: string;
  timestamp?: string;
  services?: {
    api?: BackendService;
    database?: BackendService;
    bot?: BackendService;
  };
  checks?: BackendCheck[];
}

interface TestSuite {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  coverage: number;
  duration: number;
  lastRun: string;
  failedTests: string[];
}

interface ServiceCard {
  id: string;
  label: string;
  status: LampStatus;
  latencyMs: number | null;
  detail: string;
  critical: boolean;
}

const REFRESH_INTERVAL_S = 30;
const TESTS_POLL_MS = 4000;

const LAMP_CLASS: Record<LampStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
  unknown: 'bg-gray-400 dark:bg-gray-500',
};

const STATUS_TEXT_CLASS: Record<LampStatus, string> = {
  healthy: 'text-green-700 dark:text-green-400',
  degraded: 'text-amber-700 dark:text-amber-400',
  down: 'text-red-700 dark:text-red-400',
  unknown: 'text-gray-600 dark:text-gray-400',
};

const CARD_CLASS =
  'rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-900';

const STATUS_DEFAULT: Record<LampStatus, string> = {
  healthy: 'Работает',
  degraded: 'Замедлено',
  down: 'Не работает',
  unknown: 'Нет данных',
};

const VERDICT_DEFAULT: Record<LampStatus, string> = {
  healthy: 'Все системы работают',
  degraded: 'Есть отклонения',
  down: 'Сервис недоступен',
  unknown: 'Статус неизвестен',
};

const normalizeStatus = (value?: string): LampStatus =>
  value === 'healthy' || value === 'degraded' || value === 'down' ? value : 'unknown';

const Lamp = ({ status, large = false }: { status: LampStatus; large?: boolean }) => (
  <span
    aria-hidden="true"
    className={`inline-block shrink-0 rounded-full ${large ? 'h-6 w-6' : 'h-3 w-3'} ${LAMP_CLASS[status]}`}
  />
);

const formatBytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb >= 100 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
};

const formatUptime = (seconds: number, t: TFunction): string => {
  if (seconds < 60) return `${Math.round(seconds)} ${t('health.unitSeconds', 'с')}`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('health.unitMinutes', 'мин')}`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} ${t('health.unitHours', 'ч')} ${minutes} ${t('health.unitMinutes', 'мин')}`;
};

const formatLatency = (latencyMs: number | null): string =>
  latencyMs === null ? '—' : `${Math.round(latencyMs)} ms`;

export const HealthCheck = () => {
  const { t } = useTranslation();

  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [clientLatencyMs, setClientLatencyMs] = useState<number | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_S);

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);
  const [testsLoaded, setTestsLoaded] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [testsRequesting, setTestsRequesting] = useState(false);
  const [expandedSuite, setExpandedSuite] = useState<string | null>(null);

  const pollTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
    },
    []
  );

  const loadTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests/results');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { results?: TestSuite[]; isRunning?: boolean };
      setTestSuites(Array.isArray(data.results) ? data.results : []);
      setTestsRunning(Boolean(data.isRunning));
      setTestsError(null);
    } catch (error) {
      setTestsError(error instanceof Error ? error.message : String(error));
    } finally {
      setTestsLoaded(true);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setRefreshing(true);
    try {
      const startedAt = performance.now();
      const response = await fetch('/api/health');
      const roundTripMs = performance.now() - startedAt;

      let payload: HealthPayload | null = null;
      try {
        payload = (await response.json()) as HealthPayload;
      } catch {
        payload = null;
      }

      // A body without the expected contract means we cannot report a status —
      // never fall back to zeros or a green lamp.
      if (!payload || typeof payload.status !== 'string') {
        throw new Error(`HTTP ${response.status}: unexpected response body`);
      }

      setHealth(payload);
      setHttpStatus(response.status);
      setClientLatencyMs(roundTripMs);
      setHealthError(null);
      setLastUpdated(new Date());
    } catch (error) {
      setHealth(null);
      setClientLatencyMs(null);
      setHttpStatus(null);
      setHealthError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL_S);
    }

    await loadTests();
  }, [loadTests]);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCountdown(REFRESH_INTERVAL_S);
      void loadHealth();
    }
  }, [countdown, loadHealth]);

  const cards = useMemo<ServiceCard[]>(() => {
    const services = health?.services;
    const checks = health?.checks ?? [];
    const checkFor = (id: string) => checks.find(check => check.id === id);

    const apiService = services?.api;
    const databaseService = services?.database;
    const botService = services?.bot;

    const apiStatus = normalizeStatus(apiService?.status ?? checkFor('api')?.status);
    const databaseStatus: LampStatus =
      databaseService?.connected === false
        ? 'down'
        : normalizeStatus(databaseService?.status ?? checkFor('database')?.status);
    const botStatus: LampStatus =
      botService?.running === false
        ? 'down'
        : normalizeStatus(botService?.status ?? checkFor('bot')?.status);

    const apiDetails: string[] = [];
    if (typeof apiService?.uptime === 'number') {
      apiDetails.push(`${t('health.uptime', 'Аптайм')}: ${formatUptime(apiService.uptime, t)}`);
    }
    if (apiService?.memory?.rss) {
      apiDetails.push(`${t('health.memory', 'Память')}: ${formatBytes(apiService.memory.rss)}`);
    }

    const suiteTotals = testSuites.reduce(
      (acc, suite) => ({
        passed: acc.passed + (suite.passed || 0),
        total: acc.total + (suite.total || 0),
        failed: acc.failed + (suite.failed || 0)
      }),
      { passed: 0, total: 0, failed: 0 }
    );

    const testsStatus: LampStatus =
      !testsLoaded || testsError || testSuites.length === 0
        ? 'unknown'
        : suiteTotals.failed > 0
          ? 'degraded'
          : 'healthy';

    const testsDetail =
      testsStatus === 'unknown'
        ? t('health.noTestData', 'Нет данных о тестах')
        : `${suiteTotals.passed}/${suiteTotals.total} ${t('health.passed', 'Пройдено')}`;

    return [
      {
        id: 'api',
        label: t('health.service.api', 'Backend API'),
        status: apiStatus,
        latencyMs: clientLatencyMs,
        detail: apiDetails.join(' · '),
        critical: true
      },
      {
        id: 'database',
        label: t('health.service.database', 'MongoDB'),
        status: databaseStatus,
        latencyMs: databaseService?.latencyMs ?? checkFor('database')?.latencyMs ?? null,
        detail: `${t('health.connected', 'Подключение')}: ${
          databaseService?.connected
            ? t('health.connectedYes', 'есть')
            : t('health.connectedNo', 'нет')
        }`,
        critical: true
      },
      {
        id: 'bot',
        label: t('health.service.bot', 'Telegram Bot'),
        status: botStatus,
        latencyMs: null,
        detail: botService?.running
          ? t('health.botRunning', 'Запущен')
          : t('health.botNotRunning', 'Не запущен'),
        critical: false
      },
      {
        id: 'frontend',
        label: t('health.service.frontend', 'Frontend'),
        status: 'healthy',
        latencyMs: null,
        detail: t('health.frontendDetail', 'Страница отрисована в браузере'),
        critical: false
      },
      {
        id: 'tests',
        label: t('health.service.tests', 'Фоновые тесты'),
        status: testsStatus,
        latencyMs: null,
        detail: testsDetail,
        critical: false
      }
    ];
  }, [health, clientLatencyMs, testSuites, testsLoaded, testsError, t]);

  const verdict = useMemo<LampStatus>(() => {
    if (healthError) return 'down';
    if (!health) return 'unknown';
    if (cards.some(card => card.status === 'down' && card.critical)) return 'down';
    if (cards.some(card => card.status === 'down')) return 'degraded';
    if (cards.some(card => card.status === 'degraded')) return 'degraded';
    if (cards.some(card => card.critical && card.status === 'unknown')) return 'degraded';
    return 'healthy';
  }, [healthError, health, cards]);

  const healthyCount = cards.filter(card => card.status === 'healthy').length;

  const testsTotals = useMemo(
    () =>
      testSuites.reduce(
        (acc, suite) => ({
          passed: acc.passed + (suite.passed || 0),
          total: acc.total + (suite.total || 0),
          failed: acc.failed + (suite.failed || 0)
        }),
        { passed: 0, total: 0, failed: 0 }
      ),
    [testSuites]
  );

  const avgCoverage = useMemo(() => {
    if (testSuites.length === 0) return null;
    return Math.round(testSuites.reduce((sum, suite) => sum + (suite.coverage || 0), 0) / testSuites.length);
  }, [testSuites]);

  const avgLatency = useMemo(() => {
    const samples = cards
      .map(card => card.latencyMs)
      .filter((value): value is number => typeof value === 'number' && value >= 0);
    if (samples.length === 0) return null;
    return Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
  }, [cards]);

  const runTests = async () => {
    setTestsRequesting(true);
    try {
      const response = await fetch('/api/tests/run', { method: 'POST' });
      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const body = (await response.json()) as { error?: string };
          if (body?.error) detail = body.error;
        } catch {
          // keep the HTTP status when the body is not JSON
        }
        throw new Error(detail);
      }
      setTestsRunning(true);
      setTestsError(null);
      // The run continues in the background; refresh results shortly after.
      if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
      pollTimer.current = window.setTimeout(() => {
        void loadTests();
      }, TESTS_POLL_MS);
    } catch (error) {
      setTestsError(error instanceof Error ? error.message : String(error));
    } finally {
      setTestsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
            <span aria-hidden="true">🏥</span> {t('health.title', 'Проверка систем')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('health.subtitle', 'Статус всех сервисов и тестов')}
          </p>
        </header>

        {/* Overall verdict */}
        <section className={`${CARD_CLASS}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Lamp status={verdict} large />
              <div>
                <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  {t('health.overallStatus', 'Общий статус')}
                </div>
                <div className={`text-xl font-black ${STATUS_TEXT_CLASS[verdict]}`}>
                  {t(`health.verdict.${verdict}`, VERDICT_DEFAULT[verdict])}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {loading && !lastUpdated
                    ? t('health.checking', 'Проверка...')
                    : `${t('health.lastUpdated', 'Обновлено')}: ${lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}`}
                  {httpStatus !== null && ` · HTTP ${httpStatus}`}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => void loadHealth()}
                disabled={refreshing}
                className="min-h-touch rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-800 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {refreshing ? '🔄' : '🔃'} {t('health.refresh', 'Обновить')}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('health.autoRefreshIn', 'Автообновление через {{seconds}} с', {
                  seconds: Math.max(countdown, 0)
                })}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-700">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {healthyCount}/{cards.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('health.servicesRunning', 'Сервисы работают')}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-700">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {testsTotals.total > 0 ? `${testsTotals.passed}/${testsTotals.total}` : '—'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('health.testsPassed', 'Тесты пройдены')}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-700">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {avgCoverage === null ? '—' : `${avgCoverage}%`}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('health.codeCoverage', 'Покрытие кода')}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-700">
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {avgLatency === null ? '—' : `${avgLatency} ms`}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('health.avgResponse', 'Средний отклик')}
              </div>
            </div>
          </div>
        </section>

        {/* Explicit failure state — no silent zeros */}
        {healthError && (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-4 sm:p-5 dark:border-red-800 dark:bg-red-950/40">
            <div className="flex items-center gap-2 text-base font-bold text-red-700 dark:text-red-400">
              <Lamp status="down" />
              {t('health.errorTitle', 'Не удалось получить статус сервисов')}
            </div>
            <p className="mt-2 font-mono text-sm break-words text-red-700 dark:text-red-300">
              {healthError}
            </p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              {t(
                'health.errorHint',
                'Значения «нет данных» ниже означают, что проверка не прошла, а не нулевую нагрузку.'
              )}
            </p>
            <button
              type="button"
              onClick={() => void loadHealth()}
              disabled={refreshing}
              className="mt-3 min-h-touch rounded-lg border border-red-400 px-4 py-2 font-semibold text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-300"
            >
              {t('health.retry', 'Повторить')}
            </button>
          </section>
        )}

        {/* Services */}
        <section className={`${CARD_CLASS}`}>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {t('health.serviceStatus', 'Статус сервисов')}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(card => (
              <div
                key={card.id}
                className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Lamp status={card.status} />
                  <span className="font-bold text-gray-900 dark:text-white">{card.label}</span>
                </div>
                <div className={`mt-1 text-sm font-semibold ${STATUS_TEXT_CLASS[card.status]}`}>
                  {t(`health.status.${card.status}`, STATUS_DEFAULT[card.status])}
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {t('health.latency', 'Отклик')}: {formatLatency(card.latencyMs)}
                </div>
                {card.detail && (
                  <div className="mt-1 text-xs break-words text-gray-600 dark:text-gray-400">
                    {card.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tests */}
        <section className={`${CARD_CLASS}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {t('health.testResults', 'Результаты тестов')}
            </h2>
            <div className="flex items-center gap-2">
              {testsRunning && (
                <span className="rounded-full border border-amber-400 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-600 dark:text-amber-400">
                  ⏳ {t('health.testsRunning', 'Тесты выполняются...')}
                </span>
              )}
              <button
                type="button"
                onClick={() => void runTests()}
                disabled={testsRequesting || testsRunning}
                className="min-h-touch rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-800 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {t('health.runTests', 'Запустить тесты')}
              </button>
            </div>
          </div>

          {testsError ? (
            <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
              <div className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
                <Lamp status="down" />
                {t('health.testsErrorTitle', 'Не удалось получить результаты тестов')}
              </div>
              <p className="mt-1 font-mono text-xs break-words text-red-700 dark:text-red-300">
                {testsError}
              </p>
            </div>
          ) : !testsLoaded ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t('health.loadingTests', 'Загрузка результатов тестов...')}
            </p>
          ) : testSuites.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t('health.noTestData', 'Нет данных о тестах')} ·{' '}
              {t('health.testsAutoRun', 'Тесты запускаются автоматически каждые 5 минут')}
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {testSuites.map(suite => {
                const passRate =
                  suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : null;
                const suiteStatus: LampStatus =
                  suite.failed > 0 ? 'down' : suite.total > 0 ? 'healthy' : 'unknown';
                const isExpanded = expandedSuite === suite.name;

                return (
                  <div
                    key={suite.name}
                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lamp status={suiteStatus} />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {suite.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="rounded-full border border-gray-300 px-2 py-0.5 font-bold dark:border-gray-600">
                          {suite.coverage}% {t('health.coverage', 'покрытие')}
                        </span>
                        <span>
                          {t('health.duration', 'Длительность')}: {suite.duration}s
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-xl font-black text-green-600 dark:text-green-400">
                          {suite.passed}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t('health.passed', 'Пройдено')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-red-600 dark:text-red-400">
                          {suite.failed}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t('health.failed', 'Провалено')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                          {suite.skipped}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t('health.skipped', 'Пропущено')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-900 dark:text-white">
                          {suite.total}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t('health.total', 'Всего')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full ${suite.failed > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${passRate ?? 0}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {passRate === null
                          ? t('health.noTestData', 'Нет данных о тестах')
                          : `${suite.passed}/${suite.total} (${passRate}%)`}
                      </div>
                    </div>

                    {suite.failedTests && suite.failedTests.length > 0 && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedSuite(isExpanded ? null : suite.name)}
                          className="text-xs font-bold text-red-700 dark:text-red-400"
                        >
                          ❌ {t('health.failedTests', 'Провалившиеся тесты:')}{' '}
                          {suite.failedTests.length} {isExpanded ? '▲' : '▼'}
                        </button>
                        {isExpanded && (
                          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/40">
                            {suite.failedTests.map(test => (
                              <li
                                key={test}
                                className="font-mono text-xs break-words text-red-700 dark:text-red-300"
                              >
                                • {test}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('health.lastRun', 'Последний запуск:')}{' '}
                      {suite.lastRun ? new Date(suite.lastRun).toLocaleString() : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
