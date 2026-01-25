import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Heart, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Artwork, Artist } from '../lib/database.types';

interface ArtworkWithArtist extends Artwork {
  artists: Artist;
}

interface ArtworkDetailPageProps {
  onShowAuth: () => void;
}

export default function ArtworkDetailPage({ onShowAuth }: ArtworkDetailPageProps) {
  const { artworkId } = useParams<{ artworkId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationHistory = location.state as { from?: string; artistId?: string; artistSlug?: string } | null;

  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const [artwork, setArtwork] = useState<ArtworkWithArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Selection states
  const [selectedFrame, setSelectedFrame] = useState('no-frame');
  const [selectedMaterial, setSelectedMaterial] = useState('photograph-paper');
  const [selectedSize, setSelectedSize] = useState('38x50cm');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (artworkId) {
      loadArtwork();
    }
  }, [artworkId]);

  const loadArtwork = async () => {
    const { data } = await supabase
      .from('artworks')
      .select('*, artists(*)')
      .eq('id', artworkId as string)
      .maybeSingle();

    if (data) {
      setArtwork(data as ArtworkWithArtist);
    }

    // Check if favorited
    if (user && artworkId) {
      const { data: fav } = await (supabase
        .from('favorites') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('artwork_id', artworkId)
        .maybeSingle();
      setIsFavorited(!!fav);
    }

    setLoading(false);
  };

  const handleBack = () => {
    // Smart back button: return to artist page if we came from there
    if (navigationHistory?.from === 'artist' && navigationHistory?.artistSlug) {
      navigate(`/${navigationHistory.artistSlug}`);
    } else {
      // Otherwise go to all works
      navigate('/artworks');
    }
  };

  // Calculate price based on selected variants
  const calculatePrice = () => {
    if (!artwork) return 0;

    let price = artwork.price;

    // Size multipliers
    const sizeMultipliers: { [key: string]: number } = {
      '38x50cm': 1.0,
      '45x60cm': 1.3,
      '60x80cm': 1.6,
      '75x100cm': 2.0,
      '96x128cm': 2.5
    };

    // Material multipliers
    const materialMultipliers: { [key: string]: number } = {
      'photograph-paper': 1.0,
      'canvas': 1.4
    };

    // Format multipliers
    const formatMultipliers: { [key: string]: number } = {
      'no-frame': 1.0,
      'stretched-canvas': 1.8
    };

    price *= sizeMultipliers[selectedSize] || 1.0;
    price *= materialMultipliers[selectedMaterial] || 1.0;
    price *= formatMultipliers[selectedFrame] || 1.0;

    return Math.round(price);
  };

  const handleAddToCart = async () => {
    if (!user) {
      onShowAuth();
      return;
    }

    setAdding(true);
    if (artworkId) {
      await addToCart(artworkId, {
        size: selectedSize,
        material: selectedMaterial,
        frame: selectedFrame,
        price: calculatePrice()
      }, quantity);
    }
    setAdding(false);
  };

  // Helper for image scaling
  const getImageScale = () => {
    const scales: { [key: string]: number } = {
      '38x50cm': 0.8,
      '45x60cm': 0.85,
      '60x80cm': 0.9,
      '75x100cm': 0.95,
      '96x128cm': 1.0
    };
    return scales[selectedSize] || 1.0;
  };

  // Helpers for framing and material visuals
  const getFrameStyles = () => {
    if (selectedFrame === 'stretched-canvas') {
      return {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0,0,0,0.1)',
        padding: '2px',
        background: '#fcfcfc',
        borderRadius: '2px',
        borderRight: '15px solid rgba(0,0,0,0.05)',
        borderBottom: '15px solid rgba(0,0,0,0.1)',
      };
    }
    return {
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
    };
  };

  const getMaterialOverlay = () => {
    if (selectedMaterial === 'canvas') {
      return (
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url('https://www.transparenttextures.com/patterns/canvas-fabric.png')`,
            backgroundRepeat: 'repeat'
          }}
        />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!artwork) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center text-xs text-gray-500 uppercase tracking-widest space-x-2">
          <button onClick={() => navigate('/')} className="hover:text-black">{t('home')}</button>
          <ChevronRight className="w-3 h-3" />
          {navigationHistory?.from === 'artist' && navigationHistory?.artistSlug ? (
            <>
              <button onClick={() => navigate(artwork.artists?.slug ? `/${artwork.artists.slug}` : `/artist/${artwork.artist_id}`)} className="hover:text-black">
                {artwork.artists?.name || t('unknownArtist')}
              </button>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <button onClick={() => navigate('/artworks')} className="hover:text-black">{t('allArtworks')}</button>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-black">{artwork.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column - Image */}
          <div className="space-y-8">
            <div className="aspect-[4/5] bg-gray-50 relative flex items-center justify-center overflow-hidden rounded-2xl group">
              <div
                className="relative transition-all duration-500 ease-in-out"
                style={{
                  transform: `scale(${getImageScale()})`,
                  ...getFrameStyles()
                }}
              >
                <img
                  src={artwork.image_url}
                  alt={artwork.title}
                  className="w-full h-full object-contain relative z-0"
                />
                {getMaterialOverlay()}
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center uppercase tracking-widest">
              {t('framesDisplayOnly')}
            </p>
          </div>

          {/* Right Column - Details */}
          <div className="lg:pl-8 space-y-8">
            <div>
              <h1 className="text-3xl font-light uppercase tracking-wide text-gray-900 mb-2">
                {artwork.title}
              </h1>
              <p className="text-2xl font-light text-gray-900">
                {formatPrice(calculatePrice() * quantity, (artwork.base_currency as any) || 'EUR')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('basePrice')}: {formatPrice(artwork.price, (artwork.base_currency as any) || 'EUR')}
              </p>
            </div>

            <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-light">
              <p>
                {t('digitalPrintOf')}{' '}
                {artwork.artists ? (
                  <button
                    onClick={() => navigate(artwork.artists.slug ? `/${artwork.artists.slug}` : `/artist/${artwork.artists.id}`)}
                    className="font-medium text-gray-900 hover:text-orange-600 underline decoration-gray-200 underline-offset-4"
                  >
                    {artwork.artists.name}
                  </button>
                ) : (
                  <span className="font-medium text-gray-900">{t('unknownArtist')}</span>
                )}
                {' '}{t('original')}{' '}
                {artwork.medium ? (artwork.medium === 'Digital' ? t('digital') : artwork.medium) : t('digital')}.
              </p>
              <p>
                {language === 'tr' ? (
                  <>Bu {artwork.medium ? (artwork.medium === 'Digital' ? t('digital') : artwork.medium) : t('digital')} {artwork.year} {t('createdIn')}.</>
                ) : (
                  <>This {artwork.medium ? (artwork.medium === 'Digital' ? t('digital') : artwork.medium) : t('digital')} {t('createdIn')} {artwork.year}.</>
                )}
              </p>
              <p>{t('openEditionDescription')} {t('variousDimensions')}.</p>
            </div>

            {/* Options */}
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">{t('format')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedFrame('no-frame');
                      // Reset material if it was canvas when switching from stretched
                      if (selectedMaterial === 'canvas') {
                        setSelectedMaterial('photograph-paper');
                      }
                    }}
                    className={`px-4 py-2 text-sm border transition-all ${selectedFrame === 'no-frame'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-black text-gray-600'
                      }`}
                  >
                    {t('noFrame')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFrame('stretched-canvas');
                      // Force canvas material when stretched canvas is selected
                      setSelectedMaterial('canvas');
                      // Reset to smaller size if largest is selected
                      if (selectedSize === '96x128cm') {
                        setSelectedSize('75x100cm');
                      }
                    }}
                    className={`px-4 py-2 text-sm border transition-all ${selectedFrame === 'stretched-canvas'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-black text-gray-600'
                      }`}
                  >
                    {t('stretchedCanvas')}
                  </button>
                </div>
              </div>

              {/* Material Selection */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">{t('material')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMaterial('photograph-paper')}
                    disabled={selectedFrame === 'stretched-canvas'}
                    className={`px-4 py-2 text-sm border transition-all ${selectedMaterial === 'photograph-paper'
                      ? 'border-black bg-black text-white'
                      : selectedFrame === 'stretched-canvas'
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-black text-gray-600'
                      }`}
                  >
                    {t('photographPaper')}
                  </button>
                  <button
                    onClick={() => setSelectedMaterial('canvas')}
                    className={`px-4 py-2 text-sm border transition-all ${selectedMaterial === 'canvas'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-black text-gray-600'
                      }`}
                  >
                    {t('canvas')}
                  </button>
                  {/* Signed Archival Paper option removed per requirements */}
                </div>
                {selectedFrame === 'stretched-canvas' && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('stretchedCanvasNote')}
                  </p>
                )}
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">{t('size')}</h3>
                <div className="flex flex-wrap gap-2">
                  {['38x50cm', '45x60cm', '60x80cm', '75x100cm', '96x128cm'].map((size) => {
                    const isLargest = size === '96x128cm';
                    const isDisabled = selectedFrame === 'stretched-canvas' && isLargest;

                    return (
                      <button
                        key={size}
                        onClick={() => !isDisabled && setSelectedSize(size)}
                        disabled={isDisabled}
                        className={`px-4 py-2 text-sm border transition-all ${selectedSize === size
                          ? 'border-black bg-black text-white'
                          : isDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-black text-gray-600'
                          }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {selectedFrame === 'stretched-canvas' && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('largestSizeNote')}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                <span>{t('freeShipping')}</span>
              </div>
              <p className="text-sm text-gray-500">
                {t('estimatedShipping')} {(() => {
                  const start = new Date();
                  start.setDate(start.getDate() + 3);
                  const end = new Date();
                  end.setDate(end.getDate() + 5);
                  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                  return `${start.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options)} - ${end.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options)}`;
                })()}
              </p>

              <div className="flex gap-4 pt-4">
                <div className="w-20">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-full py-3 px-4 border border-gray-200 text-center focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={adding || !artwork.is_available}
                  className="flex-1 bg-black text-white hover:bg-gray-800 py-3 uppercase tracking-widest text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? t('addingToCart') : artwork.is_available ? t('addToCart') : t('soldOut')}
                </button>
                <button
                  onClick={async () => {
                    if (!user) {
                      onShowAuth();
                      return;
                    }

                    // Toggle favorite
                    const { data: existing } = await (supabase
                      .from('favorites') as any)
                      .select('id')
                      .eq('user_id', user.id)
                      .eq('artwork_id', artworkId)
                      .maybeSingle();

                    if (existing) {
                      // Remove from favorites
                      await (supabase
                        .from('favorites') as any)
                        .delete()
                        .eq('id', existing.id);
                    } else {
                      // Add to favorites
                      await (supabase
                        .from('favorites') as any)
                        .insert([{
                          user_id: user.id,
                          artwork_id: artworkId
                        }]);
                    }

                    // Reload to update heart state
                    loadArtwork();
                  }}
                  className="p-3 border border-gray-200 hover:border-black transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
              </div>

              {/* View in Room Button */}
              <button
                onClick={() => {
                  const mockupUrl = `https://mockupsistem.netlify.app/?painting=${encodeURIComponent(artwork.image_url)}`;
                  window.open(mockupUrl, '_blank');
                }}
                className="w-full bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white hover:shadow-lg py-3 uppercase tracking-widest text-sm font-medium transition-all"
              >
                {t('viewInRoom') || 'View in Room'}
              </button>

              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors pt-4"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('back')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
