import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { CornerFrame, AbstractBrush, CirclePattern, Sparkle, DottedCircle, SketchLine, PaintSplatter, HandDrawnStar, FloatingShapes, ScribbleCircle, Doodle } from '../components/DecorativeElements';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    price: number;
    quantity: number;
    artworks: {
      title: string;
      image_url: string;
      artist_id: string;
      artists: { name: string; slug: string };
    };
  }[];
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          price,
          quantity,
          artworks (
            title,
            image_url,
            artist_id,
            artists (name, slug)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">{t('signInToViewOrders')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 py-16 relative overflow-hidden">
        <CornerFrame position="top-left" className="opacity-30" />
        <CornerFrame position="top-right" className="opacity-30" />
        <AbstractBrush className="top-20 right-32 animate-float" />
        <CirclePattern className="bottom-10 left-10 animate-pulse" />
        <FloatingShapes className="top-24 left-20" />
        <Sparkle className="top-16 left-1/4" delay={0} />
        <Sparkle className="top-32 right-1/3" delay={300} />
        <HandDrawnStar className="top-20 left-1/3" delay={200} />
        <PaintSplatter className="bottom-12 right-1/4" size={85} />
        <Doodle className="top-28 right-10 animate-float" type="wave" />
        <DottedCircle className="bottom-16 right-20" size={100} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h1 className="text-5xl font-bold text-center mb-4 relative inline-block left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
              {t('myOrdersLabel')}
            </span>
            <SketchLine className="absolute -bottom-1 left-0 w-full" />
          </h1>
          <p className="text-xl text-gray-600 text-center mt-6">
            {t('viewPurchaseHistory')}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <DottedCircle className="top-20 right-10" size={80} />
        <AbstractBrush className="top-60 left-10 rotate-180" />
        <Sparkle className="top-40 right-1/4" delay={100} />
        <HandDrawnStar className="top-80 left-20" delay={250} />
        <PaintSplatter className="bottom-40 right-32" size={75} />
        <ScribbleCircle className="top-72 left-1/4" size={70} />
        <FloatingShapes className="bottom-20 right-1/3" />
        <Doodle className="top-52 right-10 animate-float delay-350" type="zigzag" />
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl p-6 h-48" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">{t('noOrdersYet')}</p>
            <button
              onClick={() => navigate('/artworks')}
              className="px-8 py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
            >
              {t('startShopping')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-gray-900">
                        {t('orderHash')}{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {order.status === 'completed' ? t('completed') :
                        order.status === 'pending' ? t('pending') :
                          order.status === 'shipped' ? t('shipped') :
                            order.status === 'delivered' ? t('delivered') :
                              order.status === 'processing' ? t('processing2') : order.status}
                    </span>
                    <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent mt-2">
                      {formatPrice(order.total_amount, currency)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.artworks.image_url}
                        alt={item.artworks.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.artworks.title}</h3>
                        <button
                          onClick={() => navigate(item.artworks.artists?.slug ? `/${item.artworks.artists.slug}` : `/artist/${item.artworks.artist_id}`)}
                          className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
                        >
                          {item.artworks.artists?.name || t('unknownArtist')}
                        </button>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                          <p className="text-lg font-bold text-orange-600">
                            {formatPrice(item.price * item.quantity, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
