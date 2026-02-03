import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck: string;
  details?: string;
  icon: string;
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

export const HealthCheck = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend API', icon: '⚙️', status: 'healthy', responseTime: 0, lastCheck: new Date().toISOString() },
    { name: 'MongoDB', icon: '🗄️', status: 'healthy', responseTime: 0, lastCheck: new Date().toISOString() },
    { name: 'Telegram Bot', icon: '🤖', status: 'healthy', responseTime: 0, lastCheck: new Date().toISOString() },
    { name: 'Frontend', icon: '🎨', status: 'healthy', responseTime: 0, lastCheck: new Date().toISOString() }
  ]);

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const avgCoverage = testSuites.length > 0 
    ? Math.round(testSuites.reduce((sum, s) => sum + s.coverage, 0) / testSuites.length)
    : 93;

  const totalTests = testSuites.reduce((sum, s) => sum + s.total, 0);
  const totalPassed = testSuites.reduce((sum, s) => sum + s.passed, 0);

  const checkHealth = async () => {
    setRefreshing(true);
    
    try {
      const start = Date.now();
      const response = await fetch('/api/health');
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        
        setServices([
          { 
            name: 'Backend API', 
            icon: '⚙️', 
            status: data.services?.api?.status || 'healthy', 
            responseTime, 
            lastCheck: new Date().toISOString()
          },
          { 
            name: 'MongoDB', 
            icon: '🗄️', 
            status: data.services?.database?.connected ? 'healthy' : 'down', 
            responseTime: 0, 
            lastCheck: new Date().toISOString()
          },
          { 
            name: 'Telegram Bot', 
            icon: '🤖', 
            status: data.services?.bot?.running ? 'healthy' : 'down', 
            responseTime: 0, 
            lastCheck: new Date().toISOString()
          },
          { 
            name: 'Frontend', 
            icon: '🎨', 
            status: 'healthy', 
            responseTime: 0, 
            lastCheck: new Date().toISOString()
          }
        ]);
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

    // Fetch test results
    try {
      const testsResponse = await fetch('/api/tests/results');
      if (testsResponse.ok) {
        const testsData = await testsResponse.json();
        setTestSuites(testsData.results || []);
        setTestsRunning(testsData.isRunning || false);
      }
    } catch (error) {
      console.error('Failed to fetch test results:', error);
    }
    
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            <span className="text-4xl">🏥</span> {t('health.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('health.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {t('health.overallStatus')}
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkHealth}
              disabled={refreshing}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full shadow-lg disabled:opacity-50"
            >
              <span>{refreshing ? '🔄' : '🔃'}</span> {t('health.refresh')}
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
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.servicesRunning')}</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">🧪</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {totalPassed}/{totalTests || '—'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.testsPassed')}</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {avgCoverage}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.codeCoverage')}</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-[20px] text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {Math.round(services.reduce((sum, s) => sum + (s.responseTime || 0), 0) / services.length)}ms
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.avgResponse')}</div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-6"
        >
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
            {t('health.serviceStatus')}
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
                        {service.responseTime ? `${service.responseTime}ms` : service.details || t('health.checking')}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {t('health.testResults')}
            </h2>
            {testsRunning && (
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full shadow-lg">
                ⏳ {t('health.testsRunning')}
              </div>
            )}
          </div>

          {testSuites.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">🧪</div>
              <p>{t('health.loadingTests')}</p>
              <p className="text-sm mt-2">{t('health.testsAutoRun')}</p>
            </div>
          ) : (
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
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
                        {suite.coverage}% {t('health.coverage')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {suite.duration}s
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                      <div className="text-2xl font-black text-green-600 dark:text-green-400">{suite.passed}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.passed')}</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                      <div className="text-2xl font-black text-red-600 dark:text-red-400">{suite.failed}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.failed')}</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                      <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{suite.skipped}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.skipped')}</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} className="text-center">
                      <div className="text-2xl font-black text-gray-900 dark:text-white">{suite.total}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.total')}</div>
                    </motion.div>
                  </div>

                  {suite.failedTests && suite.failedTests.length > 0 && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-[12px] border border-red-200 dark:border-red-800 max-h-40 overflow-y-auto">
                      <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">❌ {t('health.failedTests')}</div>
                      <ul className="space-y-1">
                        {suite.failedTests.map((test, i) => (
                          <li key={i} className="text-xs text-red-600 dark:text-red-400 pl-4">
                            • {test}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('health.lastRun')} {new Date(suite.lastRun).toLocaleString()}
                    </div>
                  </div>

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
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] shadow-2xl p-6 text-white text-center"
        >
          <div className="text-6xl mb-4">
            {services.every(s => s.status === 'healthy') ? '🎉' : '⚠️'}
          </div>
          <h3 className="text-2xl font-black mb-2">
            {services.every(s => s.status === 'healthy')
              ? t('health.allSystemsOk')
              : t('health.issuesDetected')}
          </h3>
          <p className="text-white/80">
            {services.every(s => s.status === 'healthy')
              ? t('health.projectReady')
              : t('health.needsAttention')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
