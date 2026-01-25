import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CornerFrame, AbstractBrush, PaintSplatter } from '../components/DecorativeElements';

export default function AuthCallback() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Supabase handles the session automatically via its listener in AuthContext
        // We just show a success message and redirect
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!loading && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (!loading && countdown === 0) {
            navigate('/');
        }
    }, [loading, countdown, navigate]);

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
            {/* Decorative Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-blue-50/30 to-purple-50/30 -z-10" />
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
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                {t('goToSignIn')}
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
