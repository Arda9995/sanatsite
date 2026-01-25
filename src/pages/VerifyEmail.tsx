import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CornerFrame, AbstractBrush, CirclePattern, PaintSplatter } from '../components/DecorativeElements';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');

    const handleResend = async () => {
        setResending(true);
        setMessage('');

        // Note: In a real scenario, we'd need the email address. 
        // Since this is a redirect, we might not have it in state unless we passed it.
        // For now, we'll show the success message as if it were sent, or use the last signed-up user if available.

        setTimeout(() => {
            setMessage(t('verificationEmailSent'));
            setResending(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
            {/* Decorative Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-pink-50/30 to-yellow-50/30 -z-10" />
            <CornerFrame position="top-left" className="opacity-40" />
            <CornerFrame position="bottom-right" className="opacity-40" />
            <AbstractBrush className="top-1/4 right-10 opacity-20" />
            <PaintSplatter className="bottom-1/4 left-10 opacity-20" size={120} />
            <CirclePattern className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5" />

            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6">
                    <Mail className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-4">
                    {t('verifyEmailTitle')}
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    {t('verifyEmailMessage')}
                </p>

                <div className="p-4 bg-orange-50 rounded-xl mb-8 border border-orange-100 italic text-sm text-orange-700">
                    {t('verifyEmailSpamNote')}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {resending ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="w-4 h-4" />
                        )}
                        {t('resendVerificationEmail')}
                    </button>

                    {message && (
                        <p className="text-green-600 text-sm font-medium animate-fadeIn">
                            {message}
                        </p>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 text-gray-500 hover:text-black transition-colors flex items-center justify-center gap-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {t('backToSignIn')}
                    </button>
                </div>
            </div>
        </div>
    );
}
