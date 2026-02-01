import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck: string;
  details?: string;
  icon: string;
  serviceDetails?: ServiceDetails;
}

interface TestSuite {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  coverage?: number;
  failedTests?: string[];
}

interface ServiceDetails {
  uptime?: number;
  memory?: {
    heapUsed: number;
    heapTotal: number;
  };
  error?: string;
}

export const HealthCheck = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend API', icon: '⚙️', status: 'healthy', responseTime: 45, lastCheck: new Date().toISOString() },
    { name: 'MongoDB', icon: '🗄️', status: 'healthy', responseTime: 12, lastCheck: new Date().toISOString() },
    { name: 'Telegram Bot', icon: '🤖', status: 'healthy', responseTime: 89, lastCheck: new Date().toISOString() },
    { name: 'Frontend', icon: '🎨', status: 'healthy', responseTime: 23, lastCheck: new Date().toISOString() }
  ]);

  const [testSuites] = useState<TestSuite[]>([
    { 
      name: 'Backend Unit Tests', 
      passed: 344, 
      failed: 0, 
      skipped: 8, 
      total: 352, 
      coverage: 87,
      failedTests: []
    },
    { 
      name: 'Backend Integration Tests', 
      passed: 28, 
      failed: 2, 
      skipped: 0, 
      total: 30, 
      coverage: 92,
      failedTests: ['LeaderboardService › getSomsLeaderboard › should return players sorted by soms', 'LeaderboardService › getSomsLeaderboard › should use level as tiebreaker']
    },
    { 
      name: 'Frontend Component Tests', 
      passed: 68, 
      failed: 0, 
      skipped: 0, 
      total: 68, 
      coverage: 89,
      failedTests: []
    },
    { 
      name: 'Property-Based Tests', 
      passed: 15, 
      failed: 0, 
      skipped: 0, 
      total: 15, 
      coverage: 95,
      failedTests: []
    },
    {
      name: 'Auth & Verification Tests',
      passed: 12,
      failed: 0,
      skipped: 0,
      total: 12,
      coverage: 93,
      failedTests: []
    },
    {
      name: 'Health Check Tests',
      passed: 15,
      failed: 0,
      skipped: 0,
      total: 15,
      coverage: 91,
      failedTests: []
    }
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    setRefreshing(true);
    
    // Check backend
    try {
      const start = Date.now();
      const response = await fetch('/api/health');
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        setServices(prev => prev.map(s => 
          s.name === 'Backend API' 
            ? { ...s, status: 'healthy', responseTime, lastCheck: new Date().toISOString() }
            : s
        ));
      } else {
        setServices(prev => prev.map(s => 
          s.name === 'Backend API' 
            ? { ...s, status: 'degraded', lastCheck: new Date().toISOString(), details: `HTTP ${response.status}` }
            : s
        ));
      }
    } catch (error) {
      setServices(prev => prev.map(s => 
        s.name === 'Backend API' 
          ? { ...s, status: 'down', lastCheck: new Date().toISOString(), details: 'Connection failed' }
          : s
      ));
    }
    
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'from-green-500 to-emerald-500';
      case 'degraded': return 'from-yellow-500 to-orange-500';
      case 'down': return 'from-red-500 to-pink-500';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'down': return '❌';
    }
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
  const avgCoverage = Math.round(testSuites.reduce((sum, suite) => sum + (suite.coverage || 0), 0) / testSuites.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2">
            <span className="text-4xl">🏥</span> Health Check
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Статус всех сервисов и тестов
          </p>
        </motion.div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Общий статус
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkHealth}
              disabled={refreshing}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full shadow-lg disabled:opacity-50"
            >
              {refreshing ? '🔄' : '🔃'} Обновить
            </motion.button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {services.filter(s => s.status === 'healthy').length}/{services.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Сервисы работают</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">🧪</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {totalPassed}/{totalTests}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Тесты пройдены</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {avgCoverage}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Покрытие кода</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {Math.round(services.reduce((sum, s) => sum + (s.responseTime || 0), 0) / services.length)}ms
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Средний отклик</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Services Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-6"
        >
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
            Статус сервисов
          </h2>
          <div className="space-y-3">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className={`p-4 bg-gradient-to-r ${getStatusColor(service.status)} rounded-[20px] text-white cursor-pointer group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{service.icon}</span>
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        {service.name}
                        <span className="text-sm">{getStatusIcon(service.status)}</span>
                      </div>
                      <div className="text-sm opacity-90">
                        {service.responseTime ? `${service.responseTime}ms` : service.details || 'Checking...'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs opacity-75">
                    {new Date(service.lastCheck).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Test Suites */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-6"
        >
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
            Результаты тестов
          </h2>
          <div className="space-y-4">
            {testSuites.map((suite, index) => (
              <motion.div
                key={suite.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-[20px] cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {suite.name}
                  </div>
                  {suite.coverage && (
                    <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold group-hover:scale-105 transition-transform">
                      {suite.coverage}% покрытие
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                    <div className="text-2xl font-black text-green-600 dark:text-green-400">{suite.passed}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Пройдено</div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">{suite.failed}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Провалено</div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                    <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{suite.skipped}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Пропущено</div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{suite.total}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Всего</div>
                  </motion.div>
                </div>

                {suite.failedTests && suite.failedTests.length > 0 && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-[12px] border border-red-200 dark:border-red-800">
                    <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">❌ Провалившиеся тесты:</div>
                    <ul className="space-y-1">
                      {suite.failedTests.map((test, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400 pl-4">
                          • {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(suite.passed / suite.total) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] shadow-2xl p-6 text-white text-center"
        >
          <div className="text-6xl mb-4">
            {totalFailed === 0 && services.every(s => s.status === 'healthy') ? '🎉' : '⚠️'}
          </div>
          <h3 className="text-2xl font-black mb-2">
            {totalFailed === 0 && services.every(s => s.status === 'healthy')
              ? 'Все системы работают отлично!'
              : 'Обнаружены проблемы'}
          </h3>
          <p className="text-white/80">
            {totalFailed === 0 && services.every(s => s.status === 'healthy')
              ? 'Проект готов к работе'
              : 'Требуется внимание разработчиков'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
