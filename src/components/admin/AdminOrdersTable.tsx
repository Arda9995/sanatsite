import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Truck, Check } from 'lucide-react';

export default function AdminOrdersTable() {
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [trackingInfo, setTrackingInfo] = useState({ number: '', url: '' });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        artworks (title, image_url)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsViewed = async (orderId: string) => {
        try {
            const { error } = await (supabase
                .from('orders') as any)
                .update({ is_viewed_by_admin: true })
                .eq('id', orderId);

            if (error) throw error;
            loadOrders();
        } catch (error) {
            console.error('Error marking as viewed:', error);
        }
    };

    const handleSaveTracking = async () => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            const { error } = await (supabase
                .from('orders') as any)
                .update({
                    status: 'shipped',
                    tracking_number: trackingInfo.number,
                    tracking_url: trackingInfo.url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedOrder.id);

            if (error) throw error;
            setSelectedOrder(null);
            setTrackingInfo({ number: '', url: '' });
            loadOrders();
        } catch (error) {
            console.error('Error saving tracking info:', error);
        } finally {
            setUpdating(false);
        }
    };

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(o => o.status === filter);

    if (loading) {
        return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{t('allOrders')}</h2>
                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                    <option value="all">{t('all')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="processing">{t('processing2')}</option>
                    <option value="shipped">{t('shipped')}</option>
                    <option value="delivered">{t('delivered')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                </select>
            </div>

            <div className="bg-white overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">{t('orderNumber')}</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('date')}</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('total')}</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('statusLabel')}</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className={order.is_viewed_by_admin ? '' : 'bg-orange-50'}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        {order.order_number}
                                        {!order.is_viewed_by_admin && (
                                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                                                {t('newOrder')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {formatPrice(order.total_amount, order.currency)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {t(order.status)}
                                    </span>
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <div className="flex justify-end gap-3">
                                        {!order.is_viewed_by_admin && (
                                            <button
                                                onClick={() => handleMarkAsViewed(order.id)}
                                                className="text-orange-600 hover:text-orange-900"
                                                title={t('markAsViewed')}
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setTrackingInfo({
                                                    number: order.tracking_number || '',
                                                    url: order.tracking_url || ''
                                                });
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            title={t('markAsShipped')}
                                        >
                                            <Truck className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                        <h3 className="text-2xl font-bold mb-6 text-gray-900">{t('markAsShipped')}</h3>
                        <p className="text-sm text-gray-500 mb-6">Order: {selectedOrder.order_number}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('trackingNumber')}</label>
                                <input
                                    type="text"
                                    value={trackingInfo.number}
                                    onChange={(e) => setTrackingInfo({ ...trackingInfo, number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g., 1Z999AA10123456784"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('trackingURL')}</label>
                                <input
                                    type="url"
                                    value={trackingInfo.url}
                                    onChange={(e) => setTrackingInfo({ ...trackingInfo, url: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSaveTracking}
                                disabled={updating}
                                className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                                {updating ? t('processing') : t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
