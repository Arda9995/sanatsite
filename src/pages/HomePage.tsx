import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Artwork, Artist, Category } from '../lib/database.types';
import { CornerFrame, AbstractBrush, CirclePattern, Sparkle, DottedCircle, PaintSplatter, HandDrawnStar, FloatingShapes, ScribbleCircle, Doodle } from '../components/DecorativeElements';
import { useLanguage } from '../contexts/LanguageContext';

interface ArtworkWithArtist extends Artwork {
  artists: Artist;
  categories: Category | null;
}

interface CategoryWithArtwork {
  category: Category;
  artwork: ArtworkWithArtist;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [categoryArtworks, setCategoryArtworks] = useState<CategoryWithArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadCategoryArtworks();
  }, []);

  const loadCategoryArtworks = async () => {
    // New category system - 4 main categories
    const HOMEPAGE_CATEGORIES = [
      { slug: 'open-edition-prints', label: 'open-edition-prints', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80' },
      { slug: 'photography', label: 'photography', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80' },
      { slug: 'digital-art', label: 'digital-art', image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&q=80' },
      { slug: 'original-works', label: 'original-works', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80' },
    ];

    const categoryData: CategoryWithArtwork[] = [];

    // Fetch all categories from DB
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('*');

    const safeDbCategories = (dbCategories as Category[]) || [];

    for (const homeCat of HOMEPAGE_CATEGORIES) {
      // Try to find matching DB category
      const dbCat = safeDbCategories.find(c =>
        c.slug === homeCat.slug ||
        c.name.toLowerCase() === homeCat.label.toLowerCase()
      );

      let artwork: ArtworkWithArtist | null = null;
      let category: Category;

      if (dbCat) {
        category = dbCat;
        // Fetch one artwork for this category
        const { data: dbArtwork } = await supabase
          .from('artworks')
          .select('*, artists(*), categories(*)')
          .eq('category_id', dbCat.id)
          .eq('is_available', true)
          .neq('image_url', '')
          .not('image_url', 'is', null)
          .limit(1)
          .maybeSingle();

        if (dbArtwork) {
          artwork = dbArtwork as ArtworkWithArtist;
        }
      } else {
        // Mock category if not in DB
        category = {
          id: `mock-${homeCat.slug}`,
          name: t(homeCat.label),
          slug: homeCat.slug,
          description: '',
          created_at: new Date().toISOString()
        };
      }

      // Use placeholder if no artwork found
      if (!artwork) {
        artwork = {
          id: `placeholder-${homeCat.slug}`,
          title: `${t(homeCat.label)} ${t('collection')}`,
          description: t('exploreOurCuratedCollectionDesc'),
          price: 0,
          image_url: homeCat.image,
          category_id: category.id,
          artist_id: 'system',
          is_available: true,
          created_at: new Date().toISOString(),
          medium: t(homeCat.label),
          dimensions: t('various'),
          year: 2024,
          featured: true,
          base_currency: 'EUR',
          orientation: 'horizontal',
          artists: {
            id: 'system',
            user_id: 'system',
            name: t('featuredArtists'),
            bio: '',
            created_at: new Date().toISOString(),
            avatar_url: null,
            website: null,
            instagram: null,
            slug: 'featured-artists'
          },
          categories: category
        } as ArtworkWithArtist;
      }

      categoryData.push({ category, artwork });
    }

    setCategoryArtworks(categoryData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-600">{t('loadingGallery')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-orange-100 to-yellow-100" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzMzZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-pink-50/50 to-yellow-50/50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        {/* Corner Frames */}
        <CornerFrame position="top-left" className="opacity-60" />
        <CornerFrame position="top-right" className="opacity-60" />

        {/* Paint Splatters - VIBRANT */}
        <PaintSplatter className="top-10 left-10 opacity-50" size={150} />
        <PaintSplatter className="top-20 right-40 opacity-40" size={120} />
        <PaintSplatter className="bottom-12 right-1/4 opacity-50" size={130} />
        <PaintSplatter className="bottom-20 left-1/3 opacity-35" size={110} />

        {/* Abstract Brush Strokes - PROMINENT */}
        <AbstractBrush className="top-20 right-32 opacity-60 scale-150 rotate-12 animate-float" />
        <AbstractBrush className="bottom-24 left-16 opacity-50 scale-150 -rotate-12 animate-float delay-200" />
        <AbstractBrush className="top-1/2 right-10 opacity-45 -rotate-12" />

        {/* Floating Shapes and Patterns */}
        <FloatingShapes className="top-24 left-20" />
        <FloatingShapes className="bottom-32 right-24" />
        <CirclePattern className="bottom-10 left-10 animate-pulse opacity-60" />
        <CirclePattern className="top-16 right-16 animate-pulse opacity-50" />

        {/* Dotted Circles - LARGER */}
        <DottedCircle className="top-12 left-1/4 animate-float" size={120} />
        <DottedCircle className="bottom-16 right-20 animate-float delay-200" size={120} />
        <DottedCircle className="top-32 right-1/3 animate-float delay-400" size={100} />

        {/* Sparkles - MORE VISIBLE */}
        <Sparkle className="top-16 left-1/4 opacity-80" delay={0} />
        <Sparkle className="top-32 right-1/3 opacity-80" delay={300} />
        <Sparkle className="bottom-24 left-1/3 opacity-80" delay={600} />
        <Sparkle className="top-1/2 left-10 opacity-80" delay={900} />

        {/* Hand Drawn Stars - LARGER */}
        <HandDrawnStar className="top-20 left-1/3 opacity-70" delay={200} />
        <HandDrawnStar className="bottom-28 right-1/4 opacity-70" delay={500} />

        {/* Artistic Doodles - MORE PROMINENT */}
        <Doodle className="top-28 right-10 animate-float opacity-60" type="swirl" />
        <Doodle className="bottom-20 left-20 animate-float delay-300 opacity-60" type="wave" />
        <Doodle className="top-40 left-1/2 animate-float delay-600 opacity-50" type="zigzag" />

        {/* Scribble Circles - LARGER AND MORE VISIBLE */}
        <ScribbleCircle className="top-24 right-1/4 opacity-70" size={110} />
        <ScribbleCircle className="bottom-32 left-1/4 opacity-60" size={90} />

        {/* Large Animated Gradient Orbs - VERY VISIBLE */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse delay-1000"></div>

        {/* Medium Gradient Orbs - ENHANCED */}
        <div className="absolute top-20 left-10 w-56 h-56 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"></div>
        <div className="absolute top-40 right-20 w-56 h-56 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float delay-400"></div>
        <div className="absolute top-1/2 right-1/4 w-52 h-52 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float delay-600"></div>
        <div className="absolute top-40 left-10 w-40 h-40 bg-rose-400 rounded-full mix-blend-multiply filter blur-2xl opacity-35 animate-float delay-800"></div>
        <div className="absolute bottom-40 right-10 w-44 h-44 bg-amber-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float delay-1000"></div>

        {/* Artistic Border Accents */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>

        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto z-10 relative">
              {/* Title with artistic underline */}
              <div className="relative inline-block">
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-6 tracking-tight opacity-0 animate-fadeInUp">
                  {t('galleryHeroTitle')}
                </h1>
                {/* Artistic underline */}
                <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-70 rounded-full"></div>
              </div>

              <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto font-light leading-relaxed mb-10 opacity-0 animate-fadeInUp delay-100 mt-8">
                {t('galleryHeroSubtitle')}
              </p>

              <div className="flex flex-wrap gap-4 justify-center opacity-0 animate-fadeInUp delay-300">
                <button
                  onClick={() => navigate('/artworks')}
                  className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1"
                >
                  {t('startExploring') || "Start Exploring"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categoryArtworks.map((item, index) => {
        const isEven = index % 2 === 0;

        return (
          <section key={item.category.id} className="relative overflow-hidden min-h-screen">
            <div className="absolute inset-0">
              <img
                src={item.artwork.image_url}
                alt={item.artwork.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/50" />
            </div>

            <CornerFrame position={isEven ? "top-left" : "top-right"} className="opacity-20" />
            <CornerFrame position={isEven ? "bottom-right" : "bottom-left"} className="opacity-20" />
            <AbstractBrush className={`${isEven ? 'top-20 right-20' : 'top-20 left-20'} opacity-30 animate-float`} />
            <CirclePattern className={`${isEven ? 'bottom-32 left-20' : 'bottom-32 right-20'} opacity-20 animate-pulse`} />
            <FloatingShapes className={`${isEven ? 'top-40 left-10' : 'top-40 right-10'}`} />
            <Sparkle className="top-24 right-1/4" delay={0} />
            <Sparkle className="bottom-32 left-1/4" delay={300} />
            <HandDrawnStar className={`${isEven ? 'top-36 right-1/3' : 'top-36 left-1/3'}`} delay={200} />
            <PaintSplatter className={`${isEven ? 'bottom-48 right-20' : 'bottom-48 left-20'} animate-float delay-300`} size={80} />
            <ScribbleCircle className={`${isEven ? 'top-1/2 left-20' : 'top-1/2 right-20'}`} size={70} />
            <Doodle className={`${isEven ? 'bottom-40 left-1/3' : 'bottom-40 right-1/3'} animate-float delay-400`} type="wave" />
            <DottedCircle className={`${isEven ? 'top-80 right-10' : 'top-80 left-10'} animate-float delay-200`} size={100} />

            <div className="relative h-screen flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className={`max-w-3xl ${isEven ? 'ml-0' : 'ml-auto'}`}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white/90 mb-6">
                    {t(item.category.slug)}
                  </div>

                  <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
                    {t(item.category.slug)}
                  </h2>

                  <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed">
                    {item.category.description}
                  </p>

                  <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <p className="text-sm text-white/70 mb-2">{t('featuredArtwork')}</p>
                    <h3 className="text-2xl font-bold text-white mb-2">{item.artwork.title}</h3>
                    <p className="text-white/80 mb-1">
                      {t('by')}{' '}
                      <button
                        onClick={() => {
                          if (item.artwork.artists) {
                            navigate(item.artwork.artists.slug ? `/${item.artwork.artists.slug}` : `/artist/${item.artwork.artists.id}`);
                          }
                        }}
                        className="font-bold hover:text-orange-400 underline decoration-white/20 underline-offset-4 transition-colors"
                      >
                        {item.artwork.artists?.name || t('unknownArtist')}
                      </button>
                    </p>
                    <div className="flex gap-4 text-sm text-white/70">
                      {item.artwork.medium && <span>{item.artwork.medium}</span>}
                      {item.artwork.year && <span>{item.artwork.year}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate(`/artworks?category=${item.category.slug}`)}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-medium text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                      {t('shopCategory')} {t(item.category.slug)}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/artwork/${item.artwork.id}`, {
                        state: { from: 'home' }
                      })}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium text-lg hover:bg-white/30 transition-all transform hover:scale-105 border-2 border-white/30"
                    >
                      {t('viewArtwork')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
