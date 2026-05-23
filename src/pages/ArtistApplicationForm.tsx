import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ArtistApplicationForm() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: user?.email || '',
        phone: '',
        artistType: '',
        portfolioLink: '',
        artistStatement: '',
        photo_url: '',
        portfolioFileUrl: ''
    });
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await (supabase
                .from('artist_applications' as any) as any)
                .insert([{
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    phone: formData.phone,
                    artist_type: formData.artistType,
                    portfolio_link: formData.portfolioLink || null,
                    portfolio_file_url: formData.portfolioFileUrl || null,
                    artist_statement: formData.artistStatement,
                    photo_url: formData.photo_url || null,
                    user_id: user?.id || null,
                    status: 'pending'
                }]);

            if (error) throw error;

            setMessage(t('applicationSuccess'));
            setFormData({
                name: '',
                surname: '',
                email: user?.email || '',
                phone: '',
                artistType: '',
                portfolioLink: '',
                artistStatement: '',
                photo_url: '',
                portfolioFileUrl: ''
            });
            setPreviewUrl(null);
        } catch (error: any) {
            setMessage(`${t('error')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePortfolioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `portfolios/${fileName}`;

            const { error: uploadError } = await (supabase.storage
                .from('profimages' as any) as any)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = (supabase.storage
                .from('profimages' as any) as any)
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, portfolioFileUrl: publicUrl }));
            setMessage(t('fileUploaded'));
        } catch (error: any) {
            console.error('Error uploading portfolio:', error);
            setMessage(`${t('error')}: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setUploading(true);
        setMessage('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `applications/${fileName}`;

            const { error: uploadError } = await (supabase.storage
                .from('profimages' as any) as any)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = (supabase.storage
                .from('profimages' as any) as any)
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo_url: publicUrl }));
            setMessage(t('photoUploadSuccess'));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setMessage(`${t('error')}: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 py-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/artists')}
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t('backToArtists')}
                    </button>

                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                        {t('joinCommunity')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                        {t('artistApplicationDesc')}
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('firstName')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('lastName')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('emailAddress')} *
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
                            {t('phoneNumber')} *
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('artistType')} *
                        </label>
                        <select
                            required
                            value={formData.artistType}
                            onChange={(e) => setFormData({ ...formData, artistType: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="">{t('selectType')}</option>
                            <option value="painter">{t('painter')}</option>
                            <option value="photographer">{t('photographer')}</option>
                            <option value="digital-artist">{t('digitalArtist')}</option>
                            <option value="hobbyist">{t('hobbyist')}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('portfolioLink')}
                            </label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={formData.portfolioLink}
                                onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('portfolioFile')}
                            </label>
                            <input
                                type="file"
                                onChange={handlePortfolioFileChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            />
                            {formData.portfolioFileUrl && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {t('fileUploaded')}
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('portfolioDescription')}
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profilePhoto')} *
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors bg-gray-50">
                            <div className="space-y-1 text-center">
                                {previewUrl ? (
                                    <div className="relative inline-block">
                                        <img src={previewUrl} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-full border-4 border-white shadow-lg" />
                                        {formData.photo_url && (
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                )}
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                                        <span>{uploading ? t('uploadingPhoto') : t('uploadFile')}</span>
                                        <input
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                    </label>
                                    <p className="pl-1">{t('orDragDrop')}</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {t('fileLimits')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('artistStatement')} *
                        </label>
                        <textarea
                            required
                            rows={6}
                            value={formData.artistStatement}
                            onChange={(e) => setFormData({ ...formData, artistStatement: e.target.value })}
                            placeholder={t('artistStatementPlaceholder')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="flex-1 px-8 py-4 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-medium text-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('submitting') : uploading ? t('uploadingPhoto') : t('submitApplication')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/artists')}
                            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-full font-medium text-lg hover:bg-gray-200 transition-all"
                        >
                            {t('continueShopping')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
