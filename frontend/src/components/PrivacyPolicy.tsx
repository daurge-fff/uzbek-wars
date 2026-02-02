import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackButton } from './BackButton';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <BackButton />
      
      {/* Theme and Language Switchers */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <ThemeToggle />
        <LanguageSwitcher 
          currentLanguage={i18n.language as 'ru' | 'uz' | 'uk' | 'en'}
          onLanguageChange={(lang) => i18n.changeLanguage(lang)}
        />
      </div>
      
      <div className="max-w-4xl mx-auto pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
            {t('legal.privacy.title')}
          </h1>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t('legal.lastUpdated')}: {new Date().toLocaleDateString()}
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.intro.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.privacy.intro.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.dataCollection.title')}
              </h2>
              <p className="leading-relaxed mb-3">
                {t('legal.privacy.dataCollection.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.privacy.dataCollection.item1')}</li>
                <li>{t('legal.privacy.dataCollection.item2')}</li>
                <li>{t('legal.privacy.dataCollection.item3')}</li>
                <li>{t('legal.privacy.dataCollection.item4')}</li>
                <li>{t('legal.privacy.dataCollection.item5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.dataUsage.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.privacy.dataUsage.item1')}</li>
                <li>{t('legal.privacy.dataUsage.item2')}</li>
                <li>{t('legal.privacy.dataUsage.item3')}</li>
                <li>{t('legal.privacy.dataUsage.item4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.thirdParty.title')}
              </h2>
              <p className="leading-relaxed mb-3">
                {t('legal.privacy.thirdParty.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google OAuth:</strong> {t('legal.privacy.thirdParty.google')}</li>
                <li><strong>Telegram:</strong> {t('legal.privacy.thirdParty.telegram')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.dataSecurity.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.privacy.dataSecurity.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.cookies.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.privacy.cookies.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.userRights.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.privacy.userRights.item1')}</li>
                <li>{t('legal.privacy.userRights.item2')}</li>
                <li>{t('legal.privacy.userRights.item3')}</li>
                <li>{t('legal.privacy.userRights.item4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.dataRetention.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.privacy.dataRetention.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.children.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.privacy.children.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.changes.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.privacy.changes.text')}
              </p>
            </section>

            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-[20px] border border-indigo-200 dark:border-indigo-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.privacy.contact.title')}
              </h2>
              <p className="leading-relaxed mb-3">
                {t('legal.privacy.contact.text')}
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> support@uzbekwars.top</p>
                <p><strong>Telegram:</strong> @daurge</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
