import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackButton } from './BackButton';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export const TermsOfService = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4">
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
            {t('legal.terms.title')}
          </h1>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t('legal.lastUpdated')}: {new Date().toLocaleDateString()}<br/>
            {t('legal.effectiveDate')}: 01.01.2024
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.acceptance.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.acceptance.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.serviceDescription.title')}
              </h2>
              <p className="leading-relaxed mb-3">
                {t('legal.terms.serviceDescription.text')}
              </p>
            </section>

            <section className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-[20px] border-2 border-yellow-300 dark:border-yellow-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                ⚠️ {t('legal.terms.donations.title')}
              </h2>
              <p className="leading-relaxed mb-3 font-semibold">
                {t('legal.terms.donations.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t('legal.terms.donations.item1')}</strong></li>
                <li><strong>{t('legal.terms.donations.item2')}</strong></li>
                <li><strong>{t('legal.terms.donations.item3')}</strong></li>
                <li><strong>{t('legal.terms.donations.item4')}</strong></li>
                <li><strong>{t('legal.terms.donations.item5')}</strong></li>
                <li><strong>{t('legal.terms.donations.item6')}</strong></li>
                <li><strong>{t('legal.terms.donations.item7')}</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.userAccount.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.terms.userAccount.item1')}</li>
                <li>{t('legal.terms.userAccount.item2')}</li>
                <li>{t('legal.terms.userAccount.item3')}</li>
                <li>{t('legal.terms.userAccount.item4')}</li>
                <li>{t('legal.terms.userAccount.item5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.prohibitedConduct.title')}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.terms.prohibitedConduct.item1')}</li>
                <li>{t('legal.terms.prohibitedConduct.item2')}</li>
                <li>{t('legal.terms.prohibitedConduct.item3')}</li>
                <li>{t('legal.terms.prohibitedConduct.item4')}</li>
                <li>{t('legal.terms.prohibitedConduct.item5')}</li>
                <li>{t('legal.terms.prohibitedConduct.item6')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.userContent.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.userContent.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.intellectualProperty.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.intellectualProperty.text')}
              </p>
            </section>

            <section className="bg-red-50 dark:bg-red-900/20 p-6 rounded-[20px] border-2 border-red-300 dark:border-red-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                🛡️ {t('legal.terms.disclaimer.title')}
              </h2>
              <p className="leading-relaxed mb-3 font-semibold uppercase">
                {t('legal.terms.disclaimer.intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t('legal.terms.disclaimer.item1')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item2')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item3')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item4')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item5')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item6')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item7')}</strong></li>
                <li><strong>{t('legal.terms.disclaimer.item8')}</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.limitationLiability.title')}
              </h2>
              <p className="leading-relaxed mb-3 font-semibold">
                {t('legal.terms.limitationLiability.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.termination.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.termination.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.governingLaw.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.governingLaw.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.severability.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.severability.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.minors.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.minors.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.thirdPartyServices.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.thirdPartyServices.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.dataRights.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.dataRights.text')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.modifications.title')}
              </h2>
              <p className="leading-relaxed">
                {t('legal.terms.modifications.text')}
              </p>
            </section>

            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-[20px] border border-indigo-200 dark:border-indigo-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('legal.terms.contact.title')}
              </h2>
              <p className="leading-relaxed mb-3">
                {t('legal.terms.contact.text')}
              </p>
              <div className="space-y-2">
                <p><strong>Developer:</strong> German Vitiaz</p>
                <p><strong>Email:</strong> support@uzbekwars.top</p>
                <p><strong>Telegram:</strong> @daurge</p>
                <p><strong>Project:</strong> Uzbek Wars v1.0.0</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
