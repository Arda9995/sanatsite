import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { CornerFrame, AbstractBrush, CirclePattern, Sparkle, FloatingShapes, PaintSplatter } from '../components/DecorativeElements';
import { Upload, Clock, CheckCircle, XCircle, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import type { Artist } from '../lib/database.types';
import CustomerDeliveryCalendar from '../components/customer/CustomerDeliveryCalendar';

export default function ArtistDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Submission State
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [submissionTitle, setSubmissionTitle] = useState('');
    const [submissionOrientation, setSubmissionOrientation] = useState('horizontal');
    const [submitting, setSubmitting] = useState(false);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        website: '',
        instagram: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            loadArtistProfile();
        }
    }, [user]);

    const loadArtistProfile = async () => {
        try {
            // Find artist record linked to this user
            // Note: We'll search by user_id first, if that fails we might need a way to link them
            // For now assuming user_id is the link or we create one

            let { data, error } = await supabase
                .from('artists')
                .select('*')
                .eq('user_id', user!.id) // Assuming user_id column exists based on previous exploration
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Explicitly cast if inference fails, but usually it works with generated types.
                // If data is 'never', it means typescript thinks this query returns nothing.
                // We'll cast it to Artist to be sure.
                const artistData = data as Artist;
                setArtist(artistData);
                setFormData({
                    name: artistData.name,
                    bio: artistData.bio,
                    website: artistData.website || '',
                    instagram: artistData.instagram || '',
                    avatar_url: artistData.avatar_url || ''
                });
            } else {
                // If no artist profile found but user is logged in, maybe they want to become one?
                // Or access is denied. For this task, let's assume if they are here they might be an artist.
                // But for safety, we should prob just show "No profile found". 
                // We'll handle "Create" logic if needed, but usually admin creates artists.
            }
        } catch (error) {
            console.error('Error loading artist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!artist) return;

        setSaving(true);
        setMessage('');

        try {
            const updates = {
                name: formData.name,
                bio: formData.bio,
                website: formData.website || null,
                instagram: formData.instagram || null,
                avatar_url: formData.avatar_url || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await (supabase
                .from('artists') as any)
                .update(updates)
                .eq('id', artist.id);

            if (error) throw error;
            setMessage(t('profileUpdated'));

            // Update local state
            setArtist({ ...artist, ...updates });

        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage(t('profileUpdateError'));
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (artist) {
            loadSubmissions();
        }
    }, [artist]);

    const loadSubmissions = async () => {
        if (!artist) return;
        const { data } = await supabase
            .from('artwork_submissions')
            .select('*')
            .eq('artist_id', artist.id)
            .order('created_at', { ascending: false });

        if (data) setSubmissions(data);
    };

    const handleSubmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!artist || !submissionFile) return;

        setSubmitting(true);
        try {
            // 1. Upload Image
            const fileExt = submissionFile.name.split('.').pop();
            const fileName = `${artist.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, submissionFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            // 3. Create Submission Record
            const { error: dbError } = await (supabase
                .from('artwork_submissions') as any)
                .insert([{
                    artist_id: artist.id,
                    image_url: publicUrl,
                    title: submissionTitle || 'Untitled',
                    orientation: submissionOrientation,
                    status: 'pending'
                }]);

            if (dbError) throw dbError;

            // Reset and Reload
            setMessage(t('submissionSent'));
            setSubmissionFile(null);
            setSubmissionTitle('');
            setSubmissionOrientation('horizontal');
            setShowSubmissionForm(false);
            loadSubmissions();

        } catch (error) {
            console.error('Submission error:', error);
            setMessage(t('errorSendingSubmission'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl text-gray-600">{t('loading')}</div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent mb-4">
                        {t('profileNotFound')}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {t('profileNotFoundDesc')}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t('returnHome')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 relative overflow-hidden">
            {/* Decorative background elements similar to other pages but subtler for admin feel */}
            <CornerFrame position="top-right" className="opacity-10" />
            <AbstractBrush className="bottom-20 left-10 opacity-10" />
            <CirclePattern className="top-40 right-10 opacity-10" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                            {t('artistDashboardTitle')}
                        </h1>
                        <p className="text-gray-600 mt-2">{t('customizeProfileDesc')}</p>
                    </div>
                    <button
                        onClick={() => navigate(artist.slug ? `/${artist.slug}` : `/artist/${artist.id}`)} // View public page
                        className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
                    >
                        <Sparkle className="w-4 h-4" />
                        {t('viewPublicPage')}
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
                    <FloatingShapes className="top-0 right-0 opacity-50" />

                    <div className="p-8">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message === t('profileUpdateError') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {message === t('profileUpdateError') ? null : <CheckCircle className="w-5 h-5" />}
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Avatar & Basic Info */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('profileImageURL')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                value={formData.avatar_url}
                                                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                                placeholder="https://..."
                                            />
                                            {/* Preview */}
                                            {formData.avatar_url && (
                                                <div className="mt-4 flex justify-center">
                                                    <div className="relative w-32 h-32">
                                                        <img
                                                            src={formData.avatar_url}
                                                            alt={language === 'tr' ? 'Önizleme' : 'Preview'}
                                                            className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                                                        />
                                                        <PaintSplatter className="absolute -bottom-2 -right-2 w-10 h-10" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {t('profileDescription')}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('displayName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Bio & Social */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('biography')}
                                        </label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows={6}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                                            placeholder={t('tellYourStory')}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('website')}
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                                placeholder="https://yourportfolio.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('instagramUsername')}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                                <input
                                                    type="text"
                                                    value={formData.instagram}
                                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                                    placeholder="username"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => loadArtistProfile()} // Reset form
                                    className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                                >
                                    {t('discardChanges')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {saving ? t('saving') : t('saveChanges')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Submissions Section */}
                <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{t('submissions')}</h2>
                            <button
                                onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                {showSubmissionForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {showSubmissionForm ? t('cancel') : t('submitArtwork')}
                            </button>
                        </div>

                        {showSubmissionForm && (
                            <form onSubmit={handleSubmission} className="mb-8 bg-orange-50 p-6 rounded-xl border border-orange-100 animate-fade-in">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('uploadArtworkImage')}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('title')}</label>
                                        <input
                                            type="text"
                                            value={submissionTitle}
                                            onChange={(e) => setSubmissionTitle(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            placeholder={t('artworkTitlePlaceholder') || (language === 'tr' ? 'Eser Başlığı' : 'Artwork Title')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('orientation')}</label>
                                        <select
                                            value={submissionOrientation}
                                            onChange={(e) => setSubmissionOrientation(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="horizontal">{t('horizontal')}</option>
                                            <option value="vertical">{t('vertical')}</option>
                                            <option value="square">{t('square')}</option>
                                        </select>
                                    </div>

                                    <div className="border-2 border-dashed border-orange-200 rounded-lg p-8 text-center bg-white transition-colors hover:border-orange-400">
                                        <input
                                            type="file"
                                            id="submission-file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="submission-file" className="cursor-pointer flex flex-col items-center">
                                            {submissionFile ? (
                                                <>
                                                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                                                    <span className="text-green-700 font-medium">{submissionFile.name}</span>
                                                    <span className="text-sm text-gray-500 mt-1">{t('clickToChange')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-12 h-12 text-orange-400 mb-2" />
                                                    <span className="text-gray-600 font-medium">{t('uploadArtworkImage')}</span>
                                                    <span className="text-sm text-gray-400 mt-1">{t('fileLimits')}</span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={submitting || !submissionFile}
                                            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {submitting && <Clock className="w-4 h-4 animate-spin" />}
                                            {t('createSubmission')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Submission List */}
                        <div className="space-y-4">
                            {submissions.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">{t('noSubmissionsYet') || (language === 'tr' ? 'Henüz gönderi yok. İlk eserinizin görselini yükleyin!' : 'No submissions yet. Upload your first artwork!')}</p>
                            ) : (
                                submissions.map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                                        <img src={sub.image_url} alt={language === 'tr' ? 'Gönderi' : 'Submission'} className="w-16 h-16 object-cover rounded-md bg-gray-200" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{sub.title || (language === 'tr' ? 'İsimsiz' : 'Untitled')}</h4>
                                            <p className="text-xs text-gray-500">{new Date(sub.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                                            ${sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                sub.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {sub.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                                                sub.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {t(`submission${sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}`)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Delivery Calendar Section */}
                <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <CalendarIcon className="w-6 h-6 text-orange-600" />
                            <h2 className="text-2xl font-bold text-gray-900">{t('deliveryCalendar')}</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            {language === 'tr'
                                ? 'Eserlerinizi içeren siparişlerin teslimat tarihlerini görüntüleyin. Müşteriler teslimat tarihi değişikliği talep edebilir ve yöneticiler bunları inceleyebilir.'
                                : 'View delivery dates for orders containing your artworks. Customers can request delivery date changes which admins will review.'}
                        </p>
                        <CustomerDeliveryCalendar userId={user!.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}

