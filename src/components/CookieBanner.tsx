import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ContractViewerModal from './ContractViewerModal';

export default function CookieBanner() {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [functionalCookies, setFunctionalCookies] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('comunart-cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('comunart-cookie-consent', 'accepted');
    localStorage.setItem('comunart-functional-cookies', 'true');
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('comunart-cookie-consent', 'rejected');
    localStorage.setItem('comunart-functional-cookies', 'false');
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('comunart-cookie-consent', 'custom');
    localStorage.setItem('comunart-functional-cookies', functionalCookies ? 'true' : 'false');
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-[9998] p-6 animate-slideUp">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Info Text */}
          <div className="flex-1 text-sm text-gray-600 leading-relaxed font-light text-center lg:text-left">
            {language === 'tr' ? (
              <p>
                Sanat deneyiminizi kişiselleştirmek ve size en uygun eserleri sunabilmek için çerezler kullanıyoruz. 
                Zorunlu çerezler platformun çalışması için elzemdir. Diğer çerezler aracılığıyla kişisel verilerinizin 
                işlenmesini ve yurt dışına aktarılmasını kabul ediyorsanız <strong>'Kabul Et'</strong>i, tercihlerinizi yönetmek istiyorsanız 
                <strong>'Ayarlar'</strong>ı veya çerezleri istemiyorsanız <strong>'Reddet'</strong>i seçebilirsiniz. 
                Detaylı bilgi için{' '}
                <button 
                  onClick={() => setActiveDocKey('kvkk_çerez_aydinlatma_metni')} 
                  className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  Çerez Aydınlatma Metni
                </button>{' '}
                ve{' '}
                <button 
                  onClick={() => setActiveDocKey('kvkk_çerez_politikasi')} 
                  className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  Çerez Politikası
                </button>
                'nı inceleyebilirsiniz.
              </p>
            ) : (
              <p>
                We use cookies to personalize your art experience and recommend the most suitable artworks. 
                Necessary cookies are essential for the platform to run. If you consent to processing and transferring 
                of your personal data abroad via other cookies, select <strong>'Accept'</strong>. If you want to manage choices, 
                select <strong>'Settings'</strong>. If you do not want cookies, select <strong>'Reject'</strong>. 
                For details, see{' '}
                <button 
                  onClick={() => setActiveDocKey('kvkk_çerez_aydinlatma_metni')} 
                  className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  Cookie Clarification Text
                </button>{' '}
                and{' '}
                <button 
                  onClick={() => setActiveDocKey('kvkk_çerez_politikasi')} 
                  className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  Cookie Policy
                </button>
                .
              </p>
            )}
          </div>

          {/* Action Buttons - Accept and Reject are styled identically */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowSettings(true)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors w-full sm:w-auto text-center"
            >
              {language === 'tr' ? 'Ayarlar' : 'Settings'}
            </button>
            <button
              onClick={handleRejectAll}
              className="px-6 py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors w-full sm:w-auto text-center shadow-md"
            >
              {language === 'tr' ? 'Reddet' : 'Reject'}
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-6 py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors w-full sm:w-auto text-center shadow-md"
            >
              {language === 'tr' ? 'Kabul Et' : 'Accept'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scaleIn border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {language === 'tr' ? 'Çerez Ayarları' : 'Cookie Settings'}
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Necessary Cookies - Always Active */}
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {language === 'tr' ? 'Zorunlu Çerezler' : 'Necessary Cookies'}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1 font-light">
                    {language === 'tr' 
                      ? 'Platformun çalışması, güvenliği ve sepet işlemleri için zorunludur.' 
                      : 'Required for platform functionality, security, and checkout processes.'}
                  </span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-semibold uppercase">
                  {language === 'tr' ? 'Etkin' : 'Active'}
                </span>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {language === 'tr' ? 'İşlevsel Çerezler' : 'Functional Cookies'}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1 font-light">
                    {language === 'tr' 
                      ? 'Dil tercihlerinizi ve takip ettiğiniz sanatçıları hatırlamamızı sağlar.' 
                      : 'Allows us to remember language choices and followed artists.'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={functionalCookies}
                  onChange={(e) => setFunctionalCookies(e.target.checked)}
                  className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                {language === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors shadow-md"
              >
                {language === 'tr' ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Viewer for Banner Links */}
      {activeDocKey && (
        <ContractViewerModal
          contractKey={activeDocKey}
          viewOnly={true}
          onClose={() => setActiveDocKey(null)}
        />
      )}
    </>
  );
}
