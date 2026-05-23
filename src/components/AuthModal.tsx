import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (isSignUp && !acceptedAgreement) {
      setShowAgreementModal(true);
      return;
    }

    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError(t('emailNotVerified'));
      } else if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        setError(t('emailAlreadyExists'));
      } else {
        setError(error.message);
      }
    } else {
      if (isSignUp) {
        onClose();
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  const handleAgree = async () => {
    if (loading) return;
    setAcceptedAgreement(true);
    setShowAgreementModal(false);

    setLoading(true);
    setError('');

    try {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          setError(t('emailAlreadyExists'));
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        onClose();
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent mb-2">
            {isSignUp ? t('createAccount') : t('welcomeBack')}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? t('joinCommunity') : t('signInTitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {loading ? t('loading') : isSignUp ? t('signUp') : t('signIn2')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            {isSignUp
              ? t('alreadyHaveAccount')
              : t('dontHaveAccount')}
          </button>
        </div>
      </div>

      {showAgreementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowAgreementModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900">{t('userAgreementLabel')}</h3>
            <div className="prose prose-sm max-h-[60vh] overflow-y-auto pr-4 mb-8">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {t('userAgreementContent')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setShowAgreementModal(false);
                  setAcceptedAgreement(false);
                }}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {t('noIDisagree')}
              </button>
              <button
                onClick={handleAgree}
                className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                {t('yesIAgree')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
