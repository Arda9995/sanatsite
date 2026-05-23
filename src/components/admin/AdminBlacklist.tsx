import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Trash2, AlertCircle, Plus } from 'lucide-react';

export default function AdminBlacklist() {
    const { t } = useLanguage();
    const [blacklist, setBlacklist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCountry, setNewCountry] = useState('');
    const [newArea, setNewArea] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadBlacklist();
    }, []);

    const loadBlacklist = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from('blacklist' as any) as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBlacklist(data || []);
        } catch (err) {
            console.error('Error loading blacklist:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCountry.trim()) return;
        
        setSaving(true);
        setError('');
        try {
            const { error } = await (supabase
                .from('blacklist' as any) as any)
                .insert([{ 
                    country: newCountry.trim(), 
                    area: newArea.trim() || null 
                }]);

            if (error) throw error;
            
            setNewCountry('');
            setNewArea('');
            loadBlacklist();
        } catch (err: any) {
            setError(err.message || 'Error adding to blacklist');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm(t('removeBlacklist') + '?')) return;
        
        try {
            const { error } = await (supabase
                .from('blacklist' as any) as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadBlacklist();
        } catch (err) {
            console.error('Error removing from blacklist:', err);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    {t('blacklistCountry')}
                </h3>
                
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('countryName')} *</label>
                        <input
                            type="text"
                            value={newCountry}
                            onChange={(e) => setNewCountry(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="e.g. Russia"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('area')} ({t('optional')})</label>
                        <input
                            type="text"
                            value={newArea}
                            onChange={(e) => setNewArea(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="e.g. Moscow"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? t('loading') : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    {t('addCountry')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('blacklistedCountries')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blacklist.map((item) => (
                        <div key={item.id} className="bg-red-50 border border-red-100 p-4 rounded-lg flex justify-between items-center group">
                            <div>
                                <h4 className="font-bold text-red-900">{item.country}</h4>
                                {item.area && <p className="text-sm text-red-700">{item.area}</p>}
                            </div>
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="p-2 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                title={t('removeBlacklist')}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {blacklist.length === 0 && (
                        <p className="text-gray-500 italic py-8 col-span-full text-center">No countries blacklisted.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
