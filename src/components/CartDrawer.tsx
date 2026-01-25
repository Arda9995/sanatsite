import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { cartItems, removeFromCart } = useCart();
  const { user } = useAuth();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const { t } = useLanguage();

  const total = cartItems.reduce((sum, item) => {
    const priceToUse = item.price || item.artwork?.price || 0;
    const baseCurrencyToUse = (item.artwork?.base_currency as any) || 'EUR';
    const priceInCurrentCurrency = convertPrice(
      priceToUse,
      baseCurrencyToUse,
      currency
    );
    return sum + (priceInCurrentCurrency * item.quantity);
  }, 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
              {t('shoppingCart')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!user ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{t('pleaseSignInToViewCart')}</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{t('yourCartIsEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={item.artwork?.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                    alt={item.artwork?.title || t('unknownArtwork')}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.artwork?.title || t('unknownArtwork')}
                    </h3>
                    {item.artwork?.artists && (
                      <button
                        onClick={() => {
                          navigate(item.artwork.artists.slug ? `/${item.artwork.artists.slug}` : `/artist/${item.artwork.artist_id}`);
                          onClose();
                        }}
                        className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
                      >
                        {item.artwork.artists.name}
                      </button>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatPrice((item.price || item.artwork?.price || 0) * item.quantity, (item.artwork?.base_currency as any) || 'EUR')}
                      </p>
                    </div>
                    {(item.size || item.material || item.frame) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.size && (
                          <span className="text-[10px] uppercase tracking-wider bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                            {item.size}
                          </span>
                        )}
                        {item.material && (
                          <span className="text-[10px] uppercase tracking-wider bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                            {t(item.material === 'photograph-paper' ? 'photographPaper' : item.material)}
                          </span>
                        )}
                        {item.frame && (
                          <span className="text-[10px] uppercase tracking-wider bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                            {t(item.frame === 'no-frame' ? 'noFrame' : item.frame === 'stretched-canvas' ? 'stretchedCanvas' : item.frame)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{t('total')}</span>
              <span className="text-2xl bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                {formatPrice(total, currency)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              {t('proceedToCheckout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
