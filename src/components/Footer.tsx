import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ContractViewerModal from './ContractViewerModal';

export default function Footer() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [activeContractKey, setActiveContractKey] = useState<string | null>(null);

    const handleCategoryClick = (categorySlug: string) => {
        navigate(`/artworks?category=${categorySlug}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* WORK Column - New Categories */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">{t('work')}</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><button onClick={() => handleCategoryClick('open-edition-prints')} className="hover:text-orange-600 transition-colors">{t('open-edition-prints')}</button></li>
                            <li><button onClick={() => handleCategoryClick('photography')} className="hover:text-orange-600 transition-colors">{t('photography')}</button></li>
                            <li><button onClick={() => handleCategoryClick('digital-art')} className="hover:text-orange-600 transition-colors">{t('digital-art')}</button></li>
                        </ul>
                    </div>

                    {/* Shop Column */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">{t('shop')}</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link to="/artworks" className="hover:text-orange-600 transition-colors">{t('browseAllArt')}</Link></li>
                            <li><Link to="/artists" className="hover:text-orange-600 transition-colors">{t('artists')}</Link></li>
                            <li><Link to="/artist-application" className="hover:text-orange-600 transition-colors">{t('joinUsAsArtist')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">
                            {language === 'tr' ? 'Hukuki' : 'Legal'}
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li>
                                <button 
                                    onClick={() => setActiveContractKey('kullanim_şartlari___site_kullanim_koşullari')} 
                                    className="hover:text-orange-600 transition-colors text-left"
                                >
                                    {language === 'tr' ? 'Kullanım Şartları' : 'Terms of Use'}
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => setActiveContractKey('kvkk_yayin_kurum_i̇çi-kişisel_verilerin_korunmasi_politikasi')} 
                                    className="hover:text-orange-600 transition-colors text-left"
                                >
                                    {language === 'tr' ? 'KVKK Politikası' : 'Privacy / KVKK Policy'}
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => setActiveContractKey('kvkk_çerez_politikasi')} 
                                    className="hover:text-orange-600 transition-colors text-left"
                                >
                                    {language === 'tr' ? 'Çerez Politikası' : 'Cookie Policy'}
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => setActiveContractKey('i̇ptal-cayma_i̇adde_politikasi')} 
                                    className="hover:text-orange-600 transition-colors text-left"
                                >
                                    {language === 'tr' ? 'İptal ve İade Politikası' : 'Cancellation & Return Policy'}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media Column */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">{t('followUs')}</h3>
                        <div className="flex space-x-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors"><Facebook className="w-5 h-5" /></a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                    <p>{t('copyright')}</p>
                </div>
            </div>

            {activeContractKey && (
                <ContractViewerModal
                    contractKey={activeContractKey}
                    viewOnly={true}
                    onClose={() => setActiveContractKey(null)}
                />
            )}
        </footer >
    );
}
