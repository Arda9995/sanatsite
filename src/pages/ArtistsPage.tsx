import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Instagram, Globe, Edit3, Users, Palette, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Artist } from '../lib/database.types';
import { CornerFrame, AbstractBrush, CirclePattern, Sparkle, DottedCircle, SketchLine, PaintSplatter, HandDrawnStar, FloatingShapes, ScribbleCircle, ScribbleUnderline, Doodle } from '../components/DecorativeElements';

interface ArtistWithCount extends Artist {
  artwork_count?: number;
}

export default function ArtistsPage() {
  const { artistSlug } = useParams<{ artistSlug: string }>();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [artists, setArtists] = useState<ArtistWithCount[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithCount | null>(null);
  const [artistArtworks, setArtistArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (artistSlug) {
      loadArtistBySlug(artistSlug);
    } else {
      setSelectedArtist(null);
      loadArtists();
    }
  }, [artistSlug]);

  const loadArtists = async () => {
    setLoading(true);
    const { data } = await (supabase
      .from('artists') as any)
      .select('*')
      .order('name');

    if (data) {
      const artistsWithCount = await Promise.all(
        data.map(async (artist: any) => {
          const { count } = await (supabase
            .from('artworks') as any)
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artist.id)
            .eq('is_available', true)
            .eq('is_deleted', false);

          return { ...artist, artwork_count: count || 0 };
        })
      );
      setArtists(artistsWithCount);
    }
    setLoading(false);
  };

  const loadArtistBySlug = async (slug: string) => {
    setLoading(true);
    const { data } = await (supabase
      .from('artists') as any)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    const artist = data as Artist | null;

    if (artist) {
      const { data: artworks } = await (supabase
        .from('artworks') as any)
        .select('*')
        .eq('artist_id', artist.id)
        .eq('is_available', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      setSelectedArtist({ ...(artist as any), artwork_count: artworks?.length || 0 });
      setArtistArtworks(artworks || []);

      // Check if user is following this artist
      if (user && artist) {
        const { data: followData } = await (supabase
          .from('artist_follows') as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('artist_id', artist.id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
    } else {
      // Fallback: try loading by ID if slug not found (for old links)
      await loadArtistDetail(slug);
    }
    setLoading(false);
  };

  const loadArtistDetail = async (id: string) => {
    const { data: artist } = await (supabase
      .from('artists') as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (artist) {
      const { data: artworks } = await (supabase
        .from('artworks') as any)
        .select('*, artists(*)')
        .eq('artist_id', id)
        .eq('is_available', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      setSelectedArtist({ ...(artist as any), artwork_count: artworks?.length || 0 });
      setArtistArtworks(artworks || []);

      // Check if user is following this artist
      if (user && artist) {
        const { data: followData } = await (supabase
          .from('artist_follows') as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('artist_id', artist.id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      alert(t('pleaseSignIn'));
      return;
    }

    if (!selectedArtist) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await (supabase
          .from('artist_follows') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', selectedArtist.id);
        setIsFollowing(false);
      } else {
        // Follow
        await (supabase
          .from('artist_follows') as any)
          .insert([{
            user_id: user.id,
            artist_id: selectedArtist.id
          }]);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (artistSlug && loading && !selectedArtist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (artistSlug && !loading && !selectedArtist) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Users className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('artistNotFound')}</h2>
        <p className="text-gray-600 mb-8">{t('artistNotFoundDesc')}</p>
        <button
          onClick={() => navigate('/artists')}
          className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all"
        >
          {t('backToArtists')}
        </button>
      </div>
    );
  }

  if (artistSlug && selectedArtist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Premium Hero Section with Background */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 py-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzMzZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

          <CornerFrame position="top-left" className="opacity-20" />
          <CornerFrame position="top-right" className="opacity-20" />
          <CirclePattern className="top-10 left-1/4 animate-pulse opacity-20" />
          <AbstractBrush className="top-32 right-10 animate-float opacity-20" />
          <FloatingShapes className="top-40 left-10 opacity-30" />
          <Sparkle className="top-24 left-20" delay={0} />
          <Sparkle className="top-48 right-1/3" delay={300} />
          <HandDrawnStar className="top-36 right-1/4" delay={200} />
          <PaintSplatter className="bottom-24 left-1/4 opacity-20" size={95} />
          <Doodle className="top-52 left-1/3 animate-float delay-400 opacity-20" type="swirl" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            {/* Avatar with Enhanced Glow */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-orange-500 to-yellow-500 rounded-full blur-2xl opacity-40 scale-125 animate-pulse" />
              <DottedCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30" size={180} />
              <img
                src={selectedArtist.avatar_url || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={selectedArtist.name}
                className="relative w-40 h-40 rounded-full mx-auto object-cover border-4 border-white shadow-2xl"
              />
            </div>

            {/* Artist Name with Edit Button */}
            <div className="mb-6">
              <h1 className="text-6xl md:text-7xl font-black mb-2 inline-block">
                <span className="bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent relative">
                  {selectedArtist.name}
                  <SketchLine className="absolute -bottom-2 left-0 w-full" />
                </span>
              </h1>
              {user && selectedArtist.user_id === user.id && (
                <button
                  onClick={() => navigate('/artist-dashboard')}
                  className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full text-sm text-orange-600 hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl align-middle"
                  title={t('edit')}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('edit')}</span>
                </button>
              )}
              {user && selectedArtist.user_id !== user.id && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`ml-4 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl align-middle ${isFollowing
                    ? 'bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white hover:shadow-2xl'
                    }`}
                >
                  {followLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>{t('following')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{t('follow')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Bio */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              {selectedArtist.bio}
            </p>

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <div className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20">
                <p className="text-sm font-semibold text-gray-600">
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                    {artistArtworks.length}
                  </span>{' '}
                  {artistArtworks.length === 1 ? t('artworkCount') : t('artworksCount')}
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-4">
              {selectedArtist.website && (
                <a
                  href={selectedArtist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-pink-400 hover:to-orange-500 hover:text-white transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">{t('website')}</span>
                </a>
              )}
              {selectedArtist.instagram && (
                <a
                  href={`https://instagram.com/${selectedArtist.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-pink-400 hover:to-orange-500 hover:text-white transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="font-medium">{t('instagram')}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Artworks Gallery Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <AbstractBrush className="top-10 right-20 rotate-45 opacity-20" />
          <Sparkle className="top-20 left-10" delay={100} />
          <PaintSplatter className="top-32 right-1/3 opacity-20" size={70} />
          <ScribbleCircle className="top-60 left-20 opacity-20" size={80} />
          <FloatingShapes className="bottom-40 right-10 opacity-30" />
          <Doodle className="top-48 left-1/4 animate-float delay-300 opacity-20" type="wave" />

          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 relative inline-block">
              <span className="bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                {t('artworks')}
              </span>
              <ScribbleUnderline className="absolute -bottom-2 left-0 w-full" />
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              {artistArtworks.length} {artistArtworks.length === 1 ? t('pieceAvailable') : t('piecesAvailable')}
            </p>
          </div>

          {artistArtworks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Palette className="w-12 h-12 text-orange-400" />
              </div>
              <p className="text-xl text-gray-600">{t('noArtworksYet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artistArtworks.map((artwork: any, index: number) => (
                <div
                  key={artwork.id}
                  onClick={() => navigate(`/artwork/${artwork.id}`, {
                    state: {
                      from: 'artist',
                      artistId: selectedArtist.id,
                      artistSlug: selectedArtist.slug
                    }
                  })}
                  className="group cursor-pointer opacity-0 animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  {/* Artwork Card */}
                  <div className="relative overflow-hidden rounded-2xl mb-4 aspect-square bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-bold text-lg mb-1">{artwork.title}</h3>
                        <p className="text-sm text-white/80">{t('clickToViewDetails')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Artwork Info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:via-orange-600 group-hover:to-yellow-500 group-hover:bg-clip-text transition-all">
                      {artwork.title}
                    </h3>
                    <p className="text-lg font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                      {formatPrice(artwork.price, 'USD')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzMzZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <CornerFrame position="top-left" className="opacity-20" />
        <CornerFrame position="top-right" className="opacity-20" />
        <AbstractBrush className="top-20 right-32 animate-float opacity-20" />
        <CirclePattern className="bottom-10 left-10 animate-pulse opacity-20" />
        <FloatingShapes className="top-24 left-16 opacity-30" />
        <Sparkle className="top-16 left-1/4" delay={0} />
        <Sparkle className="top-32 right-1/3" delay={300} />
        <HandDrawnStar className="top-20 left-1/3" delay={200} />
        <PaintSplatter className="bottom-12 right-1/4" size={85} />
        <Doodle className="top-28 right-10 animate-float" type="wave" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-orange-600 mb-4 opacity-0 animate-fadeIn">
              <Users className="w-4 h-4" />
              {t('discoverTalentedCreators')}
            </div>

            <h1 className="text-6xl md:text-7xl font-black mb-6 opacity-0 animate-fadeInUp delay-100">
              <span className="bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent relative inline-block">
                {t('meetOurArtists')}
                <SketchLine className="absolute -bottom-2 left-0 w-full" />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fadeInUp delay-200">
              {t('meetOurArtistsDesc')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4 opacity-0 animate-fadeInUp delay-300">
              <button
                onClick={() => navigate('/artist-application')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium text-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                {t('joinUsAsArtist')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Artists Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <DottedCircle className="top-20 right-10 opacity-20" size={80} />
        <AbstractBrush className="top-60 left-10 rotate-180 opacity-20" />
        <Sparkle className="top-40 right-1/4" delay={100} />
        <HandDrawnStar className="top-32 left-20" delay={250} />
        <PaintSplatter className="top-80 right-32 opacity-20" size={75} />
        <ScribbleCircle className="top-72 left-1/4 opacity-20" size={70} />
        <FloatingShapes className="bottom-40 right-1/3 opacity-30" />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[4/5] rounded-3xl mb-4" />
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.map((artist, index) => (
              <div
                key={artist.id}
                onClick={() => navigate(artist.slug ? `/${artist.slug}` : `/artist/${artist.id}`)}
                className="group cursor-pointer relative opacity-0 animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                {/* Glassmorphic Card */}
                <div className="relative bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:border-transparent">
                  {/* Gradient Border on Hover */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-400 via-orange-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ padding: '2px' }}>
                    <div className="w-full h-full bg-white rounded-3xl" />
                  </div>

                  {/* Card Content */}
                  <div className="p-8">
                    {/* Avatar with Glow Effect */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-orange-500 to-yellow-500 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-110" />
                      <img
                        src={artist.avatar_url || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={artist.name}
                        className="relative w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Artist Name */}
                    <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:via-orange-600 group-hover:to-yellow-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {artist.name}
                    </h3>

                    {/* Bio */}
                    <p className="text-gray-600 text-center text-sm mb-4 line-clamp-3 leading-relaxed">
                      {artist.bio}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="px-4 py-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-full">
                        <p className="text-sm font-semibold text-orange-600">
                          {artist.artwork_count} {artist.artwork_count === 1 ? t('artworkCount') : t('artworksCount')}
                        </p>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {artist.website && (
                        <a
                          href={artist.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-gray-100 rounded-full hover:bg-gradient-to-r hover:from-pink-400 hover:to-orange-500 hover:text-white transition-all"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {artist.instagram && (
                        <a
                          href={`https://instagram.com/${artist.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-gray-100 rounded-full hover:bg-gradient-to-r hover:from-pink-400 hover:to-orange-500 hover:text-white transition-all"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* View Profile Button - Appears on Hover */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <div className="w-full py-2 text-center text-sm font-medium bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                        {t('viewProfile')} →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
