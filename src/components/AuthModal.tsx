import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ContractViewerModal from './ContractViewerModal';

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
  const [acceptedMembership, setAcceptedMembership] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [activeContractKey, setActiveContractKey] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const { t, language } = useLanguage();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!acceptedMembership || !acceptedKvkk) {
        setError(
          language === 'tr'
            ? 'Lütfen devam etmek için zorunlu sözleşmeleri onaylayın.'
            : 'Please accept the required agreements to continue.'
        );
        return;
      }
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

          {isSignUp && (
            <div className="space-y-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
              {/* Membership Agreement */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptedMembership"
                  checked={acceptedMembership}
                  onChange={() => {
                    if (!acceptedMembership) {
                      setActiveContractKey('ticari_alici_üyelik_sözleşmesi');
                    } else {
                      setAcceptedMembership(false);
                    }
                  }}
                  className="mt-0.5 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="acceptedMembership" className="cursor-pointer font-light select-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveContractKey('ticari_alici_üyelik_sözleşmesi');
                    }}
                    className="font-semibold text-orange-600 hover:text-orange-700 underline mr-1"
                  >
                    {language === 'tr' ? 'Alıcı Üyelik Sözleşmesi' : 'Buyer Membership Agreement'}
                  </button>
                  {language === 'tr' ? '\'ni okudum, onaylıyorum.' : 'I have read and agree.'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
              </div>

              {/* KVKK Agreement */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptedKvkk"
                  checked={acceptedKvkk}
                  onChange={() => {
                    if (!acceptedKvkk) {
                      setActiveContractKey('kvkk_aydinlatma_metni_alici');
                    } else {
                      setAcceptedKvkk(false);
                    }
                  }}
                  className="mt-0.5 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="acceptedKvkk" className="cursor-pointer font-light select-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveContractKey('kvkk_aydinlatma_metni_alici');
                    }}
                    className="font-semibold text-orange-600 hover:text-orange-700 underline mr-1"
                  >
                    {language === 'tr' ? 'KVKK Aydınlatma Metni' : 'KVKK Clarification Text'}
                  </button>
                  {language === 'tr' ? '\'ni okudum, onaylıyorum.' : 'I have read and agree.'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
              </div>

              {/* Commercial Electronic Message (Optional) */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptedMarketing"
                  checked={acceptedMarketing}
                  onChange={(e) => setAcceptedMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="acceptedMarketing" className="cursor-pointer font-light select-none">
                  {language === 'tr' ? (
                    <>
                      Tarafıma{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveContractKey('kvkk_kurum_i̇çi-ticari_elektronik_i̇leti');
                        }}
                        className="font-semibold text-orange-600 hover:text-orange-700 underline mx-1"
                      >
                        Ticari Elektronik İleti
                      </button>{' '}
                      gönderilmesine onay veriyorum.
                    </>
                  ) : (
                    <>
                      I consent to receiving{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveContractKey('kvkk_kurum_i̇çi-ticari_elektronik_i̇leti');
                        }}
                        className="font-semibold text-orange-600 hover:text-orange-700 underline mx-1"
                      >
                        Commercial Electronic Communications
                      </button>
                      .
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

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

      {activeContractKey && (
        <ContractViewerModal
          contractKey={activeContractKey}
          viewOnly={activeContractKey === 'kvkk_kurum_i̇çi-ticari_elektronik_i̇leti'}
          onAccept={() => {
            if (activeContractKey === 'ticari_alici_üyelik_sözleşmesi') {
              setAcceptedMembership(true);
            } else if (activeContractKey === 'kvkk_aydinlatma_metni_alici') {
              setAcceptedKvkk(true);
            }
            setActiveContractKey(null);
          }}
          onReject={() => {
            if (activeContractKey === 'ticari_alici_üyelik_sözleşmesi') {
              setAcceptedMembership(false);
            } else if (activeContractKey === 'kvkk_aydinlatma_metni_alici') {
              setAcceptedKvkk(false);
            }
            setActiveContractKey(null);
          }}
          onClose={() => setActiveContractKey(null)}
        />
      )}
    </div>
  );
}
