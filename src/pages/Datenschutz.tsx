import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Datenschutz() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline mb-8"
        >
          <ArrowLeft size={18} /> {t('common.back')}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('datenschutz.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('datenschutz.date')}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s1Title')}</h2>
            <p>
              {t('datenschutz.s1Text')}{' '}
              <a href="mailto:alimalshishani@gmail.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                alimalshishani@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s2Title')}</h2>
            <p>{t('datenschutz.s2Intro')}</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>{t('datenschutz.s2Account')}</li>
              <li>{t('datenschutz.s2Profile')}</li>
              <li>{t('datenschutz.s2Progress')}</li>
              <li>{t('datenschutz.s2Plan')}</li>
              <li>{t('datenschutz.s2Push')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s3Title')}</h2>
            <p>{t('datenschutz.s3Text')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s4Title')}</h2>
            <p>{t('datenschutz.s4Text')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s5Title')}</h2>
            <p>{t('datenschutz.s5Text')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s6Title')}</h2>
            <p>{t('datenschutz.s6Text')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s7Title')}</h2>
            <p>{t('datenschutz.s7Intro')}</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>{t('datenschutz.s7_1')}</li>
              <li>{t('datenschutz.s7_2')}</li>
              <li>{t('datenschutz.s7_3')}</li>
              <li>{t('datenschutz.s7_4')}</li>
              <li>{t('datenschutz.s7_5')}</li>
              <li>{t('datenschutz.s7_6')}</li>
              <li>{t('datenschutz.s7_7')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s8Title')}</h2>
            <p>
              {t('datenschutz.s8Text')}{' '}
              <a href="mailto:alimalshishani@gmail.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                alimalshishani@gmail.com
              </a>
            </p>
          </section>

          <section id="konto-loeschen">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{t('datenschutz.s9Title')}</h2>
            <p className="mb-3">{t('datenschutz.s9Intro')}</p>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t('datenschutz.s9Step1')}</li>
              <li>{t('datenschutz.s9Step2')}</li>
            </ol>
            <p className="font-semibold mb-1">{t('datenschutz.s9DataTitle')}</p>
            <p className="mb-3">{t('datenschutz.s9DataText')}</p>
            <p className="font-semibold mb-1">{t('datenschutz.s9RetentionTitle')}</p>
            <p>{t('datenschutz.s9RetentionText')}</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft size={18} /> {t('common.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
