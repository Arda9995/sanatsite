import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, CreditCard, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { CornerFrame, AbstractBrush, Sparkle, DottedCircle, PaintSplatter, HandDrawnStar, FloatingShapes, ScribbleCircle, SketchLine, Doodle } from '../components/DecorativeElements';
import { Country, State, City, IState, ICity } from 'country-state-city';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Location State
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [availableStates, setAvailableStates] = useState<IState[]>([]);
  const [availableCities, setAvailableCities] = useState<ICity[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  // Location Handlers
  const handleCountryChange = (isoCode: string) => {
    setSelectedCountry(isoCode);

    // Find country name for form data
    const countryData = Country.getCountryByCode(isoCode);
    setFormData(prev => ({ ...prev, country: countryData?.name || '' }));

    // Reset dependents
    setSelectedState('');
    setSelectedCity('');
    setAvailableStates(State.getStatesOfCountry(isoCode));
    setAvailableCities([]);
  };

  const handleStateChange = (isoCode: string) => {
    setSelectedState(isoCode);

    // Find state name for form data
    const stateData = State.getStateByCodeAndCountry(isoCode, selectedCountry);
    setFormData(prev => ({ ...prev, state: stateData?.name || '' }));

    // Reset dependent
    setSelectedCity('');
    setAvailableCities(City.getCitiesOfState(selectedCountry, isoCode));
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setFormData(prev => ({ ...prev, city: cityName }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const isMockUser = user.id === 'da3db02a-6096-4876-857e-000000000000';
    let order = null;
    let orderError = null;

    if (isMockUser) {
      console.log('🤖 Admin Mock User: Simulating order creation');
      order = { id: `mock-order-${Date.now()}` };
    } else {
      const { data: ordersData, error: err } = await (supabase
        .from('orders') as any)
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          shipping_address: formData as any,
        })
        .select();

      order = ordersData?.[0];
      orderError = err;
    }

    if (!orderError && order) {
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        artwork_id: item.artwork_id,
        price: item.price || item.artwork.price,
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        frame: item.frame
      }));

      if (!isMockUser) {
        await (supabase.from('order_items') as any).insert(orderItems);

        for (const item of cartItems) {
          await (supabase
            .from('artworks') as any)
            .update({ is_available: false })
            .eq('id', item.artwork_id);
        }
      }

      await clearCart();
      showToast(t('orderConfirmed'), 'success');
      setOrderComplete(true);
    } else {
      console.error('Order error DETAILS:', orderError);
      if (orderError) {
        showToast(`${t('failedToCompleteOrder')}: ${orderError.message || 'Unknown error'}`, 'error');
      } else {
        showToast(t('failedToCompleteOrder'), 'error');
      }
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">{t('signInToCheckout')}</p>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
        <CornerFrame position="top-left" className="opacity-30" />
        <CornerFrame position="top-right" className="opacity-30" />
        <CornerFrame position="bottom-left" className="opacity-30" />
        <CornerFrame position="bottom-right" className="opacity-30" />
        <FloatingShapes className="top-20 left-20" />
        <FloatingShapes className="bottom-20 right-20" />
        <Sparkle className="top-32 left-1/4" delay={0} />
        <Sparkle className="top-40 right-1/4" delay={300} />
        <HandDrawnStar className="bottom-40 left-1/3" delay={200} />
        <HandDrawnStar className="top-48 right-1/3" delay={400} />
        <PaintSplatter className="top-60 left-10" size={90} />
        <ScribbleCircle className="bottom-32 right-10" size={85} />
        <Doodle className="top-72 right-1/4 animate-float" type="swirl" />

        <div className="text-center max-w-md relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent relative inline-block">
            {t('orderCompleteTitle')}
            <SketchLine className="absolute -bottom-1 left-0 w-full" />
          </h1>
          <p className="text-gray-600 mb-8">
            {t('orderCompleteMessage')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            {t('continueShopping')}
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('cartEmpty')}</p>
          <button
            onClick={() => navigate('/artworks')}
            className="px-8 py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            {t('browseArtworks')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 relative overflow-hidden">
      <CornerFrame position="top-left" className="opacity-20" />
      <CornerFrame position="top-right" className="opacity-20" />
      <AbstractBrush className="top-40 right-20 animate-float" />
      <DottedCircle className="top-60 left-10 animate-pulse" size={100} />
      <FloatingShapes className="top-96 right-1/3" />
      <Sparkle className="top-32 right-1/4" delay={0} />
      <Sparkle className="bottom-80 left-1/4" delay={400} />
      <HandDrawnStar className="top-80 right-10" delay={300} />
      <PaintSplatter className="bottom-40 left-20" size={80} />
      <ScribbleCircle className="top-52 right-1/4" size={75} />
      <Doodle className="bottom-60 right-1/3 animate-float delay-200" type="wave" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <button
          onClick={() => navigate('/artworks')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('backToShopping')}
        </button>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent relative inline-block">
          {t('checkout')}
          <SketchLine className="absolute -bottom-1 left-0 w-full" />
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                  {t('shippingInformation')}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+90 555 123 4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('address')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  {/* Country Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('country')}
                    </label>
                    <select
                      required
                      value={selectedCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="">{t('selectCountry')}</option>
                      {Country.getAllCountries().map((country) => (
                        <option key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('stateLabel')}
                    </label>
                    <select
                      required
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={!selectedCountry}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">{t('selectCity')}</option>
                      {availableStates.map((state) => (
                        <option key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City Dropdown (District) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cityLabel')}
                    </label>
                    <select
                      required
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      disabled={!selectedState}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">{t('selectDistrict')}</option>
                      {availableCities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('zipCode')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      pattern="^[0-9A-Za-z\s\-]{3,10}$"
                      title={t('enterValidZip')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium text-lg hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {loading ? t('processing') : t('completePurchase')}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">{t('orderSummary')}</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.artwork?.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={item.artwork?.title || t('unknownArtwork')}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.artwork?.title || t('unknownArtwork')}</h3>
                      <p className="text-sm text-gray-600">{item.artwork?.artists?.name || t('unknownArtist')}</p>
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
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>{t('subtotal')}</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('shipping')}</span>
                  <span>{t('free')}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>{t('total')}</span>
                  <span className="bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
