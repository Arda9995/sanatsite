import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AdminProvider } from './contexts/AdminContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ArtworksPage from './pages/ArtworksPage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import ArtistsPage from './pages/ArtistsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ArtistDashboard from './pages/ArtistDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import ArtistApplicationForm from './pages/ArtistApplicationForm';
import AdminPanel from './pages/AdminPanel';
import VerifyEmail from './pages/VerifyEmail';
import AuthCallback from './pages/AuthCallback';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <AuthProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <ToastProvider>
            <AdminProvider>
              <CartProvider>
                <div className="min-h-screen bg-white">
                  <ScrollToTop />
                  <Header />

                  <main>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/artworks" element={<ArtworksPage />} />
                      <Route path="/artwork/:artworkId" element={
                        <ArtworkDetailPage
                          onShowAuth={() => setShowAuthModal(true)}
                        />
                      } />
                      <Route path="/artists" element={<ArtistsPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/dashboard" element={<CustomerDashboard />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/artist-dashboard" element={<ArtistDashboard />} />
                      <Route path="/artist-application" element={<ArtistApplicationForm />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      {/* Artist slug routes must be last to avoid catching other routes */}
                      <Route path="/artist/:artistSlug" element={<ArtistsPage />} />
                      <Route path="/:artistSlug" element={<ArtistsPage />} />

                    </Routes>
                  </main>

                  <Footer />
                  {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
                </div>
              </CartProvider>
            </AdminProvider>
          </ToastProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
