import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, ArrowLeft, Users, ClipboardList, Camera, Check, X, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

type Currency = 'USD' | 'EUR' | 'TRY' | 'GBP';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { exchangeRates, refreshRates } = useCurrency();
  const { t } = useLanguage();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [rates, setRates] = useState({ USD: '1.0', EUR: '0.92', GBP: '0.79', TRY: '34.50' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'rates' | 'artworks' | 'applications' | 'artists' | 'submissions'>('rates');

  const [artworkForm, setArtworkForm] = useState({
    title: '',
    artist_id: '',
    category_id: '',
    price: '',
    base_currency: 'EUR' as Currency,
    description: '',
    image_url: '',
    dimensions: '',
    year: '',
    medium: '',
    orientation: 'horizontal',
  });

  const [editingArtwork, setEditingArtwork] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    setRates({
      USD: exchangeRates.USD?.toString() || '1.0',
      EUR: exchangeRates.EUR?.toString() || '0.92',
      GBP: exchangeRates.GBP?.toString() || '0.79',
      TRY: exchangeRates.TRY?.toString() || '34.50',
    });
  }, [exchangeRates]);

  const loadData = async () => {
    setLoadingData(true);

    const [artworksRes, artistsRes, categoriesRes, applicationsRes, submissionsRes] = await Promise.all([
      (supabase.from('artworks' as any) as any).select('*, artists(name, slug), categories(name)').order('created_at', { ascending: false }),
      (supabase.from('artists' as any) as any).select('*').order('name'),
      (supabase.from('categories' as any) as any).select('id, name').order('name'),
      (supabase.from('artist_applications' as any) as any).select('*').order('created_at', { ascending: false }),
      (supabase.from('artwork_submissions' as any) as any).select('*, artists(name)').order('created_at', { ascending: false }),
    ]);

    if (artworksRes.data) setArtworks(artworksRes.data);
    if (artistsRes.data) setArtists(artistsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if ((applicationsRes as any).data) setApplications((applicationsRes as any).data);
    if ((submissionsRes as any).data) setSubmissions((submissionsRes as any).data);

    setLoadingData(false);
  };

  const handleSaveRates = async () => {
    setSaving(true);
    setMessage('');

    try {
      const updates = [
        { currency: 'USD', rate: parseFloat(rates.USD) },
        { currency: 'EUR', rate: parseFloat(rates.EUR) },
        { currency: 'GBP', rate: parseFloat(rates.GBP) },
        { currency: 'TRY', rate: parseFloat(rates.TRY) },
      ];

      for (const update of updates) {
        const { error } = await (supabase
          .from('exchange_rates' as any) as any)
          .update({ rate: update.rate, updated_at: new Date().toISOString() })
          .eq('currency', update.currency);

        if (error) throw error;
      }

      await refreshRates();
      setMessage(t('exchangeRatesUpdated'));
    } catch (error) {
      setMessage(t('exchangeRatesUpdateError'));
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleArtworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const artworkData = {
        title: artworkForm.title,
        artist_id: artworkForm.artist_id,
        category_id: artworkForm.category_id,
        price: parseFloat(artworkForm.price),
        base_currency: artworkForm.base_currency,
        description: artworkForm.description,
        image_url: artworkForm.image_url,
        dimensions: artworkForm.dimensions,
        year: artworkForm.year ? parseInt(artworkForm.year) : null,
        medium: artworkForm.medium,
        orientation: artworkForm.orientation,
        is_available: true,
      };

      if (editingArtwork) {
        const { error } = await (supabase
          .from('artworks' as any) as any)
          .update(artworkData)
          .eq('id', editingArtwork);

        if (error) throw error;
        setMessage(t('artworkUpdated'));
      } else {
        const { error } = await (supabase
          .from('artworks' as any) as any)
          .insert([artworkData]);

        if (error) throw error;
        setMessage(t('artworkCreated'));
      }

      setArtworkForm({
        title: '',
        artist_id: '',
        category_id: '',
        price: '',
        base_currency: 'EUR',
        description: '',
        image_url: '',
        dimensions: '',
        year: '',
        medium: '',
        orientation: 'horizontal',
      });
      setEditingArtwork(null);
      await loadData();
    } catch (error) {
      setMessage(t('errorSavingArtwork'));
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditArtwork = (artwork: any) => {
    setArtworkForm({
      title: artwork.title,
      artist_id: artwork.artist_id,
      category_id: artwork.category_id,
      price: artwork.price.toString(),
      base_currency: artwork.base_currency || 'EUR',
      description: artwork.description || '',
      image_url: artwork.image_url,
      dimensions: artwork.dimensions || '',
      year: artwork.year?.toString() || '',
      medium: artwork.medium || '',
      orientation: artwork.orientation || 'horizontal',
    });
    setEditingArtwork(artwork.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArtwork = async (id: string) => {
    if (!confirm(t('deleteArtworkConfirm'))) return;

    try {
      const { error } = await supabase
        .from('artworks' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage(t('artworkDeleted'));
      await loadData();
    } catch (error) {
      setMessage(t('errorDeletingArtwork'));
      console.error(error);
    }
  };

  const handleApproveArtist = async (app: any) => {
    setSaving(true);
    try {
      // Create artist record and link to user if they have an account
      const { data: newArtist, error: artistError } = await (supabase
        .from('artists' as any) as any)
        .insert([{
          name: `${app.name} ${app.surname}`,
          slug: `${app.name}_${app.surname}`.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          bio: app.artist_statement || 'New Artist',
          avatar_url: app.photo_url || null,
          user_id: app.user_id || null,  // Link to user account if exists
        }])
        .select();

      if (artistError) throw artistError;

      // If user exists, update their role to artist in auth metadata
      if (app.user_id && newArtist && newArtist[0]) {
        // Update user metadata to mark them as an artist
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          app.user_id,
          {
            user_metadata: {
              is_artist: true,
              artist_id: newArtist[0].id
            }
          }
        );

        if (metadataError) {
          console.warn('Could not update user metadata:', metadataError);
          // Don't throw - artist is created, just metadata update failed
        }
      }

      // Delete the application
      const { error: appError } = await (supabase
        .from('artist_applications' as any) as any)
        .delete()
        .eq('id', app.id);

      if (appError) throw appError;

      setMessage(t('artistApproved'));
      await loadData();
    } catch (error: any) {
      console.error('Approving artist error:', error);
      setMessage(`${t('errorApprovingArtist')}: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArtist = async (id: string) => {
    if (!confirm(t('deleteArtistConfirm'))) return;
    try {
      // Delete related artworks first
      const { error: artworksError } = await supabase
        .from('artworks' as any)
        .delete()
        .eq('artist_id', id);

      if (artworksError) console.warn('Error deleting artworks:', artworksError);

      // Delete related submissions
      const { error: submissionsError } = await supabase
        .from('artwork_submissions' as any)
        .delete()
        .eq('artist_id', id);

      if (submissionsError) console.warn('Error deleting submissions:', submissionsError);

      // Finally delete the artist
      const { error } = await supabase
        .from('artists' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage(t('artistDeleted'));
      await loadData();
    } catch (error: any) {
      console.error('Deleting artist error:', error);
      setMessage(`${t('errorDeletingArtist')}: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateSubmission = async (submission: any, status: 'approved' | 'rejected') => {
    if (!confirm(status === 'rejected' ? t('deleteSubmissionConfirm') : t('approveSubmissionConfirm') || "Approve this submission?")) return;

    setSaving(true);
    try {
      if (status === 'rejected') {
        // Delete record
        const { error } = await supabase
          .from('artwork_submissions')
          .delete()
          .eq('id', submission.id);
        if (error) throw error;
        setMessage(t('submissionDeleted'));
      } else {
        // Approve
        const { error } = await (supabase
          .from('artwork_submissions') as any)
          .update({ status: 'approved' })
          .eq('id', submission.id);
        if (error) throw error;
        setMessage(t('submissionApproved'));
      }
      await loadData();
    } catch (error) {
      console.error('Error updating submission:', error);
      setMessage(t('errorSavingArtwork')); // Generic error
    } finally {
      setSaving(false);
    }
  };

  const handleFixArtistSlugs = async () => {
    setSaving(true);
    setMessage('');
    let fixedCount = 0;
    try {
      for (const artist of artists) {
        const expectedSlug = artist.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!artist.slug || artist.slug !== expectedSlug) {
          const { error } = await (supabase.from('artists' as any) as any)
            .update({ slug: expectedSlug })
            .eq('id', artist.id);
          if (!error) fixedCount++;
        }
      }
      setMessage(t('repairSlugsSuccess').replace('{count}', fixedCount.toString()));
      await loadData();
    } catch (error) {
      setMessage(t('repairSlugsError'));
      console.error(error);
    }
    setSaving(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('accessDenied')}</h1>
          <p className="text-gray-600 mb-6">{t('accessDeniedDesc')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            {t('returnHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('back')}
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
            {t('adminPanel')}
          </h1>
          <p className="text-gray-600 mt-2">Manage exchange rates and artworks</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('rates')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'rates'
                  ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                {t('rates')}
              </button>
              <button
                onClick={() => setActiveTab('artworks')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'artworks'
                  ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                {t('artworks')}
              </button>
              <button
                onClick={() => setActiveTab('artists')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'artists'
                  ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                {t('artists')}
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'applications'
                  ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <ClipboardList className="w-5 h-5 inline mr-2" />
                {t('applications')}
                {applications.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-orange-600 text-white rounded-full">
                    {applications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'submissions'
                  ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <ImageIcon className="w-5 h-5 inline mr-2" />
                {t('submissions')}
                {submissions.filter(s => s.status === 'pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-orange-600 text-white rounded-full">
                    {submissions.filter(s => s.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'rates' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('manageExchangeRates')}</h2>
                <p className="text-gray-600 mb-6">
                  {t('exchangeRatesDesc')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('usdRateLabel')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={rates.USD}
                      onChange={(e) => setRates({ ...rates, USD: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">{t('baseCurrencyDesc')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EUR Rate (€)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rates.EUR}
                      onChange={(e) => setRates({ ...rates, EUR: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">1 USD = {rates.EUR} EUR</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GBP Rate (£)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rates.GBP}
                      onChange={(e) => setRates({ ...rates, GBP: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">1 USD = {rates.GBP} GBP</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TRY Rate (₺)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rates.TRY}
                      onChange={(e) => setRates({ ...rates, TRY: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">1 USD = {rates.TRY} TRY</p>
                  </div>
                </div>

                <button
                  onClick={handleSaveRates}
                  disabled={saving}
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {saving ? t('saving') : t('saveExchangeRates')}
                </button>
              </div>
            )}

            {activeTab === 'artworks' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingArtwork ? t('editArtwork') : t('addNewArtwork')}
                </h2>

                <form onSubmit={handleArtworkSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('title')} *</label>
                      <input
                        type="text"
                        value={artworkForm.title}
                        onChange={(e) => setArtworkForm({ ...artworkForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('artistLabel')} *</label>
                      <select
                        value={artworkForm.artist_id}
                        onChange={(e) => setArtworkForm({ ...artworkForm, artist_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">{t('selectArtist')}</option>
                        {artists.map((artist) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('categoryLabel')} *</label>
                      <select
                        value={artworkForm.category_id}
                        onChange={(e) => setArtworkForm({ ...artworkForm, category_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('price')} *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={artworkForm.price}
                        onChange={(e) => setArtworkForm({ ...artworkForm, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('baseCurrency')} *</label>
                      <select
                        value={artworkForm.base_currency}
                        onChange={(e) => setArtworkForm({ ...artworkForm, base_currency: e.target.value as Currency })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="TRY">TRY (₺)</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">{t('baseCurrencyLongDesc')}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('orientation')} *</label>
                      <select
                        value={artworkForm.orientation}
                        onChange={(e) => setArtworkForm({ ...artworkForm, orientation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="horizontal">{t('horizontal')}</option>
                        <option value="vertical">{t('vertical')}</option>
                        <option value="square">{t('square')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('imageURL')} *</label>
                      <input
                        type="url"
                        value={artworkForm.image_url}
                        onChange={(e) => setArtworkForm({ ...artworkForm, image_url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />

                      {submissions.some(s => s.status === 'approved') && (
                        <div className="mt-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
                          <p className="text-xs font-semibold text-orange-800 uppercase mb-2 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" />
                            {t('selectFromApproved')}
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-orange-200">
                            {submissions.filter(s => s.status === 'approved').map(sub => (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  setArtworkForm(prev => ({
                                    ...prev,
                                    image_url: sub.image_url,
                                    title: prev.title || sub.title,
                                    artist_id: prev.artist_id || sub.artist_id
                                  }));
                                }}
                                className="relative group flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-sm hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                title={`${sub.title} by ${sub.artists?.name}`}
                              >
                                <img src={sub.image_url} alt={sub.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-white text-[10px] p-1 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  {sub.title}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('dimensions')}</label>
                      <input
                        type="text"
                        value={artworkForm.dimensions}
                        onChange={(e) => setArtworkForm({ ...artworkForm, dimensions: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('dimensionsInput')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('year')}</label>
                      <input
                        type="number"
                        value={artworkForm.year}
                        onChange={(e) => setArtworkForm({ ...artworkForm, year: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('yearInput')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('medium')}</label>
                      <input
                        type="text"
                        value={artworkForm.medium}
                        onChange={(e) => setArtworkForm({ ...artworkForm, medium: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('mediumInput')}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
                      <textarea
                        value={artworkForm.description}
                        onChange={(e) => setArtworkForm({ ...artworkForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
                    >
                      {saving ? t('saving') : editingArtwork ? t('updateArtwork') : t('createArtwork')}
                    </button>
                    {editingArtwork && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArtwork(null);
                          setArtworkForm({
                            title: '',
                            artist_id: '',
                            category_id: '',
                            price: '',
                            base_currency: 'EUR',
                            description: '',
                            image_url: '',
                            dimensions: '',
                            year: '',
                            medium: '',
                            orientation: 'horizontal',
                          });
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </form>

                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('existingArtworks')}</h3>
                {loadingData ? (
                  <div className="text-center py-8 text-gray-600">{t('loadingArtworks')}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {artworks.map((artwork) => (
                      <div key={artwork.id} className="border border-gray-200 rounded-lg p-4">
                        <img
                          src={artwork.image_url}
                          alt={artwork.title}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                        <h4 className="font-semibold text-gray-900 truncate">{artwork.title}</h4>
                        <p className="text-sm text-gray-600">{artwork.artists?.name || 'Unknown Artist'}</p>
                        <p className="text-sm font-medium text-orange-600 mt-2">
                          {artwork.price} {artwork.base_currency || 'USD'}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEditArtwork(artwork)}
                            className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteArtwork(artwork.id)}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'artists' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">{t('manageArtists')}</h2>
                  <button
                    onClick={handleFixArtistSlugs}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {saving ? t('repairing') : t('repairProfileLinks')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artists.map((artist) => (
                    <div key={artist.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={artist.avatar_url || 'https://via.placeholder.com/100'}
                          alt={artist.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-100"
                        />
                        <div>
                          <h3 className="font-bold text-gray-900">{artist.name}</h3>
                          <p className="text-sm text-gray-500">{artist.instagram ? `@${artist.instagram}` : 'No Instagram'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{artist.bio}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(artist.slug ? `/${artist.slug}` : `/artist/${artist.id}`)}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {t('view')}
                        </button>
                        <button
                          onClick={() => handleDeleteArtist(artist.id)}
                          className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('artistApplications')}</h2>
                {applications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">{t('noPendingApplications')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-white border border-orange-100 rounded-xl p-6 shadow-sm border-l-4 border-l-orange-500">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0">
                            {app.photo_url ? (
                              <img
                                src={app.photo_url}
                                alt={`${app.name} ${app.surname}`}
                                className="w-24 h-24 rounded-lg object-cover border-2 border-orange-50"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                                <Camera className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{app.name} {app.surname}</h3>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full uppercase">
                                {app.artist_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1"><strong>Email:</strong> {app.email}</p>
                            <p className="text-sm text-gray-600 mb-4"><strong>Portfolio:</strong> <a href={app.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">{app.portfolio_link}</a></p>
                            {app.photo_url && (
                              <p className="text-xs text-gray-400 mb-4 truncate max-w-md"><strong>Photo URL:</strong> {app.photo_url}</p>
                            )}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-700 italic">"{app.artist_statement}"</p>
                            </div>
                          </div>
                          <div className="flex md:flex-col gap-2 justify-center">
                            <button
                              onClick={() => handleApproveArtist(app)}
                              disabled={saving}
                              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                            >
                              {t('approve')}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(t('rejectApplicationConfirm'))) {
                                  await (supabase.from('artist_applications' as any) as any).delete().eq('id', app.id);
                                  await loadData();
                                }
                              }}
                              className="px-6 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-50 transition-all"
                            >
                              {t('reject')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('submissions')}</h2>
                {submissions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('noSubmissionsYet') || "No submissions yet"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 shadow-sm">
                        <div className="w-48 h-48 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                          <img src={sub.image_url} alt={sub.title} className="w-full h-full object-cover" />
                          <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded shadow-sm
                                ${sub.status === 'approved' ? 'bg-green-500 text-white' :
                              sub.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                            {sub.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{sub.title || 'Untitled'}</h3>
                              <p className="text-sm text-gray-600 mb-4">{t('by')} <span className="font-semibold text-gray-800">{sub.artists?.name || 'Unknown Artist'}</span></p>
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Image URL</p>
                            <p className="text-xs text-blue-600 truncate font-mono">{sub.image_url}</p>
                          </div>

                          {sub.status === 'pending' && (
                            <div className="flex gap-4">
                              <button
                                onClick={() => handleUpdateSubmission(sub, 'approved')}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                {t('approve')}
                              </button>
                              <button
                                onClick={() => handleUpdateSubmission(sub, 'rejected')}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                {t('reject')}
                              </button>
                            </div>
                          )}
                          {sub.status === 'approved' && (
                            <p className="text-green-600 text-sm flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              {t('submissionApproved')} - Available in "Add Artwork"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

