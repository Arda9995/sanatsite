import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Palette, Coins, Settings, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdmin } from '../contexts/AdminContext';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';
import { Sparkle } from './DecorativeElements';

export default function Header() {
  const location = useLocation();
  const currentPath = location.pathname;

  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin, isArtist, artistProfile } = useAdmin();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkle className="top-2 left-1/4" delay={0} />
          <Sparkle className="top-4 right-1/3" delay={500} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link
              to="/"
              className="flex items-center space-x-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:rotate-12">
                <Palette className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-600 bg-clip-text text-transparent relative">
                Cominudade
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-600 group-hover:w-full transition-all duration-500"></span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors relative group ${isActive('/')
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
                  }`}
              >
                {t('gallery')}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 transition-all duration-300 ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
              <Link
                to="/artists"
                className={`text-sm font-medium transition-colors relative group ${isActive('/artists')
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
                  }`}
              >
                {t('artists')}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 transition-all duration-300 ${isActive('/artists') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
              <Link
                to="/artworks"
                className={`text-sm font-medium transition-colors relative group ${isActive('/artworks')
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
                  }`}
              >
                {t('allArtworks')}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 transition-all duration-300 ${isActive('/artworks') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                className="flex items-center space-x-1 px-2 md:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors rounded-lg hover:bg-gray-50 bg-transparent border-none cursor-pointer"
                title={language === 'en' ? t('switchToTurkish') : t('switchToEnglish')}
              >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium uppercase">{language}</span>
              </button>

              <div
                ref={currencyRef}
                className="relative"
              >
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center space-x-1 px-2 md:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors rounded-lg hover:bg-gray-50 uppercase"
                >
                  <Coins className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">{currency}</span>
                </button>
                {showCurrencyDropdown && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[100]">
                    <button
                      onClick={() => {
                        setCurrency('USD');
                        setShowCurrencyDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${currency === 'USD'
                        ? 'text-orange-600 bg-orange-50 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      USD ($)
                    </button>
                    <button
                      onClick={() => {
                        setCurrency('EUR');
                        setShowCurrencyDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${currency === 'EUR'
                        ? 'text-orange-600 bg-orange-50 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      EUR (€)
                    </button>
                    <button
                      onClick={() => {
                        setCurrency('GBP');
                        setShowCurrencyDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${currency === 'GBP'
                        ? 'text-orange-600 bg-orange-50 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      GBP (£)
                    </button>
                    <button
                      onClick={() => {
                        setCurrency('TRY');
                        setShowCurrencyDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${currency === 'TRY'
                        ? 'text-orange-600 bg-orange-50 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      TRY (₺)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowCartDrawer(true)}
                className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors"
              >
                <ShoppingBag className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-400 to-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative group">
                  <button className="p-2 text-gray-700 hover:text-orange-600 transition-colors">
                    <User className="w-6 h-6" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {t('adminPanel')}
                      </Link>
                    )}
                    {isArtist && (
                      <>
                        <Link
                          to="/artist-dashboard"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t('artistDashboard')}
                        </Link>
                        <Link
                          to={artistProfile?.slug ? `/${artistProfile.slug}` : `/artist/${artistProfile?.id}`}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t('myPublicProfile')}
                        </Link>
                      </>
                    )}
                    {!isAdmin && !isArtist && (
                      <Link
                        to="/dashboard"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t('customerDashboard')}
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('myOrders')}
                    </Link>
                    <button
                      onClick={signOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('signOut')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:block px-6 py-2 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                >
                  {t('signIn')}
                </button>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-700"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('gallery')}
              </Link>
              <Link
                to="/artists"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('artists')}
              </Link>
              <Link
                to="/artworks"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('allArtworks')}
              </Link>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  {t('language')}
                </div>
                <button
                  onClick={() => setLanguage('en')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${language === 'en' ? 'bg-orange-50 text-orange-600 font-medium' : ''
                    }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('tr')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${language === 'tr' ? 'bg-orange-50 text-orange-600 font-medium' : ''
                    }`}
                >
                  Türkçe
                </button>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  {t('currency')}
                </div>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${currency === 'USD' ? 'bg-orange-50 text-orange-600 font-medium' : ''
                    }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('EUR')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${currency === 'EUR' ? 'bg-orange-50 text-orange-600 font-medium' : ''
                    }`}
                >
                  EUR (€)
                </button>
                <button
                  onClick={() => setCurrency('GBP')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${currency === 'GBP' ? 'bg-orange-50 text-orange-600 font-medium' : ''
                    }`}
                >
                  GBP (£)
                </button>
                <button
                  onClick={() => setCurrency('TRY')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${currency === 'TRY' ? 'bg-orange-50 text-orange-600 font-medium' : ''
                    }`}
                >
                  TRY (₺)
                </button>
              </div>
              {!user && (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-lg"
                >
                  {t('signIn')}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showCartDrawer && (
        <CartDrawer onClose={() => setShowCartDrawer(false)} />
      )}
    </>
  );
}
