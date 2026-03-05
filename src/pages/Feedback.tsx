import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Check } from 'lucide-react';

export default function Feedback() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !body.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from('tester_feedback')
      .insert({ user_id: user.id, body: body.trim() });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
    setBody('');
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-20">
      <h2 className="text-2xl font-bold text-center text-emerald-800 dark:text-emerald-200 mb-2">
        {t('feedback.title')}
      </h2>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('feedback.subtitle')}
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-emerald-100 dark:border-gray-600 overflow-hidden">
        <div className="p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                {t('feedback.thankYou')}
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {t('feedback.sendAnother')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.label')}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t('feedback.placeholder')}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !body.trim()}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={18} />
                {loading ? t('feedback.sending') : t('feedback.send')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
