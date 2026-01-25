import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CornerFrame, AbstractBrush, CirclePattern, PaintSplatter } from '../components/DecorativeElements';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const { verifyOtp, signUp } = useAuth();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailParam = params.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [location]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];
        pastedData.forEach((char, i) => {
            if (/^\d$/.test(char)) {
                newOtp[i] = char;
            }
        });
        setOtp(newOtp);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return;

        setLoading(true);
        setError('');

        const { error } = await verifyOtp(email, code);

        if (error) {
            setError(t('invalidCode'));
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                navigate('/?login=true');
            }, 2000);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setResending(true);
        setError('');
        setMessage('');

        // In Supabase, if the user already exists but isn't confirmed, 
        // calling signUp again with the same email sends a new confirmation OTP.
        const { error } = await signUp(email, 'dummy-not-used-for-resend');

        if (error && !error.message.includes('already registered')) {
            setError(error.message);
        } else {
            setMessage(t('verificationEmailSent'));
        }
        setResending(false);
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
            {/* Decorative Elements */}
            <div className={`absolute inset-0 bg-gradient-to-br ${success ? 'from-green-50/30 via-emerald-50/30' : 'from-orange-50/30 via-pink-50/30'} to-purple-50/30 -z-10`} />
            <CornerFrame position="top-left" className="opacity-40" />
            <CornerFrame position="bottom-right" className="opacity-40" />
            <AbstractBrush className="top-1/4 right-10 opacity-20" />
            <PaintSplatter className="bottom-1/4 left-10 opacity-20" size={120} />
            <CirclePattern className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5" />

            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10 text-center">
                {success ? (
                    <div className="animate-scaleIn">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('verificationSuccessful')}</h1>
                        <p className="text-gray-600 mb-2">{t('verificationSuccessSubtitle')}</p>
                        <p className="text-sm text-gray-400">Redirecting to login...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6">
                            <Mail className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-4">
                            {t('enterOtpTitle')}
                        </h1>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            {t('enterOtpMessage')}
                            {email && <strong className="block text-gray-900 mt-2">{email}</strong>}
                        </p>

                        <form onSubmit={handleVerify} className="space-y-8">
                            <div className="flex justify-between gap-2" onPaste={handlePaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none bg-white/50"
                                        disabled={loading}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="flex items-center justify-center gap-2 text-red-600 text-sm font-medium animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || otp.some(d => !d)}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl hover:shadow-gray-200 disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? t('verifyingCode') : t('verifyCode')}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                            <button
                                onClick={handleResend}
                                disabled={resending || loading}
                                className="text-sm font-semibold text-gray-600 hover:text-orange-600 flex items-center justify-center gap-2 mx-auto transition-colors disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                                {t('resendVerificationEmail')}
                            </button>

                            {message && (
                                <p className="text-green-600 text-xs font-medium animate-fadeIn">
                                    {message}
                                </p>
                            )}

                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 group text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                {t('backToSignIn')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
