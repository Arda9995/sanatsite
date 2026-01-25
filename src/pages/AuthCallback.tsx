import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, LogIn, AlertCircle, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { CornerFrame, AbstractBrush, PaintSplatter } from '../components/DecorativeElements';

export default function AuthCallback() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const queryParams = new URLSearchParams(window.location.search);

                // 1. Check for errors from Supabase in URL
                const errorMsg = queryParams.get('error_description') || queryParams.get('error');
                if (errorMsg) {
                    setError(errorMsg);
                    setLoading(false);
                    return;
                }

                // 2. Handle the PKCE auth code
                const code = queryParams.get('code');
                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
                        setError(exchangeError.message);
                        setLoading(false);
                        return;
                    }
                } else {
                    // If no code, check if we're already authenticated
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        // No code and no session = directly visited or failed flow
                        // If it's the newer PKCE, the URL MUST have a code
                        const hash = window.location.hash;
                        if (!hash) {
                            setError("No authentication code found. Please try the link in your email again.");
                            setLoading(false);
                            return;
                        }
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        handleCallback();
    }, []);

    useEffect(() => {
        if (!loading && !error && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (!loading && !error && countdown === 0) {
            navigate('/?login=true');
        }
    }, [loading, error, countdown, navigate]);

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
            {/* Decorative Elements */}
            <div className={`absolute inset-0 bg-gradient-to-br ${error ? 'from-red-50/30 via-orange-50/30' : 'from-green-50/30 via-blue-50/30'} to-purple-50/30 -z-10`} />
            <CornerFrame position="top-right" className="opacity-40" />
            <CornerFrame position="bottom-left" className="opacity-40" />
            <AbstractBrush className="bottom-1/4 right-10 opacity-20 rotate-45" />
            <PaintSplatter className="top-1/4 left-10 opacity-20" size={120} />

            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10 text-center">
                {loading ? (
                    <div className="space-y-6">
                        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-gray-900">{t('processing')}</h1>
                    </div>
                ) : error ? (
                    <div className="animate-scaleIn">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {t('error')}
                        </h1>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            {error}
                        </p>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            {t('goBackToSite')}
                        </button>
                    </div>
                ) : (
                    <div className="animate-scaleIn">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {t('verificationSuccessful')}
                        </h1>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            {t('verificationSuccessSubtitle')}
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/?login=true')}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                {t('goBackToSite')}
                            </button>

                            <p className="text-sm text-gray-400">
                                {t('redirectingToLogin').replace('{seconds}', countdown.toString())}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
