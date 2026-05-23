import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Trash2, Percent } from 'lucide-react';

export default function AdminMetrics() {
    const { t } = useLanguage();
    const [rates, setRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newMetric, setNewMetric] = useState({ name: '', multiplier: '1.0' });

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from('metric_rates' as any) as any)
                .select('*')
                .order('metric_name');

            if (error) throw error;
            setRates(data || []);
        } catch (err) {
            console.error('Error loading metric rates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMetric = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMetric.name.trim()) return;

        setSaving(true);
        try {
            const { error } = await (supabase
                .from('metric_rates' as any) as any)
                .insert([{
                    metric_name: newMetric.name.trim(),
                    multiplier: parseFloat(newMetric.multiplier)
                }]);

            if (error) throw error;
            setNewMetric({ name: '', multiplier: '1.0' });
            loadRates();
        } catch (err) {
            console.error('Error adding metric:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMultiplier = async (id: string, multiplier: string) => {
        try {
            const { error } = await (supabase
                .from('metric_rates' as any) as any)
                .update({ multiplier: parseFloat(multiplier), updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            loadRates();
        } catch (err) {
            console.error('Error updating multiplier:', err);
        }
    };

    const handleDeleteMetric = async (id: string) => {
        if (!confirm(t('deleteMetricConfirm') || 'Delete this metric rate?')) return;

        try {
            const { error } = await (supabase
                .from('metric_rates' as any) as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadRates();
        } catch (err) {
            console.error('Error deleting metric:', err);
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Percent className="w-6 h-6 text-orange-500" />
                    {t('manageMetricRates') || 'Manage Metric Rates'}
                </h3>

                <form onSubmit={handleAddMetric} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('metricName') || 'Metric Name'}</label>
                        <input
                            type="text"
                            value={newMetric.name}
                            onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="e.g. Extra Gloss"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('multiplier') || 'Multiplier'}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newMetric.multiplier}
                            onChange={(e) => setNewMetric({ ...newMetric, multiplier: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {t('addMetric') || 'Add Metric'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900">{t('metricName') || 'Metric Name'}</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900">{t('multiplier') || 'Multiplier'}</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rates.map((rate) => (
                            <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{rate.metric_name}</td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={rate.multiplier}
                                        onBlur={(e) => handleUpdateMultiplier(rate.id, e.target.value)}
                                        className="w-24 px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                    />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteMetric(rate.id)}
                                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rates.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                                    No metric rates defined.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
