import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Truck, Check, Eye, X, MapPin, CreditCard, FileText, Package, User } from 'lucide-react';

export default function AdminOrdersTable() {
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    
    // Tracking update state
    const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any | null>(null);
    const [trackingInfo, setTrackingInfo] = useState({ number: '', url: '' });
    const [updating, setUpdating] = useState(false);

    // Inspector modal state
    const [inspectingOrder, setInspectingOrder] = useState<any | null>(null);

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
                    customers (
                        first_name,
                        last_name,
                        email,
                        phone
                    ),
                    order_items (
                        *,
                        artworks (
                            title,
                            image_url,
                            serial_number,
                            artists (
                                name
                            )
                        )
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

    const handleSaveTracking = async (orderIdToUpdate?: string) => {
        const targetId = orderIdToUpdate || selectedOrderForTracking?.id;
        if (!targetId) return;
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
                .eq('id', targetId);

            if (error) throw error;
            setSelectedOrderForTracking(null);
            if (inspectingOrder && inspectingOrder.id === targetId) {
                setInspectingOrder((prev: any) => prev ? {
                    ...prev,
                    status: 'shipped',
                    tracking_number: trackingInfo.number,
                    tracking_url: trackingInfo.url
                } : null);
            }
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

    const renderAddress = (addr: any) => {
        if (!addr) return <span className="text-gray-400 font-light italic">{language === 'tr' ? 'Belirtilmedi' : 'Not specified'}</span>;
        if (typeof addr === 'string') return <span className="text-gray-700">{addr}</span>;

        return (
            <div className="text-sm text-gray-700 space-y-1">
                {addr.recipient_name && <p className="font-semibold text-gray-900">{addr.recipient_name}</p>}
                {addr.company_name && <p className="font-medium text-gray-800">{addr.company_name}</p>}
                {addr.tax_number && <p className="text-xs text-gray-500">VN/TC: {addr.tax_number}</p>}
                {addr.address_line1 && <p>{addr.address_line1}</p>}
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>
                    {[addr.district, addr.city, addr.postal_code, addr.country].filter(Boolean).join(', ')}
                </p>
                {addr.phone && <p className="text-xs text-gray-500 font-mono">Tel: {addr.phone}</p>}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('allOrders')}</h2>
                    <p className="text-sm text-gray-500 mt-1 font-light">
                        {language === 'tr' ? 'Tüm siparişleri görüntüleyin, teslimat/fatura detaylarını inceleyin.' : 'Manage orders, view delivery/billing details.'}
                    </p>
                </div>
                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                >
                    <option value="all">{t('all')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="processing">{t('processing2')}</option>
                    <option value="shipped">{t('shipped')}</option>
                    <option value="delivered">{t('delivered')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                </select>
            </div>

            <div className="bg-white overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-2xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderNumber')}</th>
                            <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('date')}</th>
                            <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'tr' ? 'Müşteri' : 'Customer'}</th>
                            <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('total')}</th>
                            <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('statusLabel')}</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-sm">
                        {filteredOrders.map((order) => {
                            const customerName = order.customers 
                                ? `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim()
                                : (order.shipping_address?.recipient_name || (language === 'tr' ? 'Misafir Müşteri' : 'Guest Customer'));

                            return (
                                <tr key={order.id} className={order.is_viewed_by_admin ? 'hover:bg-gray-50' : 'bg-orange-50/60 hover:bg-orange-50'}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 font-mono font-bold text-gray-900">
                                        <div className="flex items-center gap-2">
                                            #{order.order_number}
                                            {!order.is_viewed_by_admin && (
                                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                                                    {t('newOrder')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-gray-900 font-medium">
                                        {customerName}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-gray-900 font-bold">
                                        {formatPrice(order.total_amount, order.currency)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        }`}>
                                            {t(order.status)}
                                        </span>
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* Inspector View Button */}
                                            <button
                                                onClick={() => {
                                                    setInspectingOrder(order);
                                                    if (!order.is_viewed_by_admin) {
                                                        handleMarkAsViewed(order.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title={language === 'tr' ? 'Sipariş Detaylarını İncele' : 'Inspect Order Details'}
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>

                                            {!order.is_viewed_by_admin && (
                                                <button
                                                    onClick={() => handleMarkAsViewed(order.id)}
                                                    className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-100 rounded-lg transition-colors"
                                                    title={t('markAsViewed')}
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    setSelectedOrderForTracking(order);
                                                    setTrackingInfo({
                                                        number: order.tracking_number || '',
                                                        url: order.tracking_url || ''
                                                    });
                                                }}
                                                className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title={t('markAsShipped')}
                                            >
                                                <Truck className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* FULL ORDER INSPECTOR MODAL */}
            {inspectingOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative border border-gray-100">
                        {/* Close button */}
                        <button
                            onClick={() => setInspectingOrder(null)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-6 mb-6">
                            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {language === 'tr' ? 'Sipariş Detayı' : 'Order Inspector'}
                            </span>
                            <h3 className="text-2xl font-bold font-mono text-gray-900">
                                #{inspectingOrder.order_number}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                inspectingOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                inspectingOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                inspectingOrder.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                                {t(inspectingOrder.status)}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                                {new Date(inspectingOrder.created_at).toLocaleString()}
                            </span>
                        </div>

                        {/* Customer Info & Summary Header */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">{language === 'tr' ? 'Müşteri Bilgileri' : 'Customer Info'}</p>
                                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                                        {inspectingOrder.customers 
                                            ? `${inspectingOrder.customers.first_name || ''} ${inspectingOrder.customers.last_name || ''}`.trim()
                                            : (inspectingOrder.shipping_address?.recipient_name || (language === 'tr' ? 'Misafir Müşteri' : 'Guest Customer'))}
                                    </p>
                                    <p className="text-xs text-gray-500">{inspectingOrder.customers?.email || inspectingOrder.shipping_address?.email || '-'}</p>
                                    <p className="text-xs text-gray-500 font-mono">{inspectingOrder.customers?.phone || inspectingOrder.shipping_address?.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CreditCard className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">{language === 'tr' ? 'Ödeme & Tutar' : 'Payment & Total'}</p>
                                    <p className="font-extrabold text-orange-600 text-lg mt-0.5">
                                        {formatPrice(inspectingOrder.total_amount, inspectingOrder.currency)}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase">{inspectingOrder.currency || 'EUR'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Truck className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">{language === 'tr' ? 'Kargo & Takip' : 'Shipping & Tracking'}</p>
                                    {inspectingOrder.tracking_number ? (
                                        <>
                                            <p className="font-mono text-sm font-bold text-gray-900 mt-0.5">{inspectingOrder.tracking_number}</p>
                                            {inspectingOrder.tracking_url && (
                                                <a href={inspectingOrder.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 underline font-medium">
                                                    {language === 'tr' ? 'Kargo Takip Linki ↗' : 'Track Package ↗'}
                                                </a>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic mt-1">{language === 'tr' ? 'Henüz kargo girilmedi' : 'No tracking number yet'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Addresses Section (Shipping vs Billing) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Shipping Address */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-sm">
                                    <MapPin className="w-4 h-4" />
                                    <span>{language === 'tr' ? 'Teslimat Adresi' : 'Shipping Address'}</span>
                                </div>
                                {renderAddress(inspectingOrder.shipping_address)}
                            </div>

                            {/* Billing Address */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-sm">
                                    <FileText className="w-4 h-4" />
                                    <span>{language === 'tr' ? 'Fatura Adresi' : 'Billing Address'}</span>
                                </div>
                                {renderAddress(inspectingOrder.billing_address || inspectingOrder.shipping_address)}
                            </div>
                        </div>

                        {/* Customer Notes */}
                        {inspectingOrder.customer_notes && (
                            <div className="mb-6 bg-yellow-50/80 border border-yellow-200 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">
                                    {language === 'tr' ? 'Müşteri Notu / Özel İstek' : 'Customer Note / Request'}
                                </p>
                                <p className="text-sm text-yellow-900 italic font-medium">
                                    "{inspectingOrder.customer_notes}"
                                </p>
                            </div>
                        )}

                        {/* Order Items & Variations Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-orange-600" />
                                <span>{language === 'tr' ? 'Sipariş Edilen Eserler & Varyasyonlar' : 'Ordered Artworks & Variations'}</span>
                            </h4>

                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                                        <tr>
                                            <th className="py-3 px-4">{language === 'tr' ? 'Eser' : 'Artwork'}</th>
                                            <th className="py-3 px-4">{language === 'tr' ? 'Eser No' : 'Serial No'}</th>
                                            <th className="py-3 px-4">{language === 'tr' ? 'Seçilen Varyasyonlar' : 'Variations'}</th>
                                            <th className="py-3 px-4 text-center">{language === 'tr' ? 'Adet' : 'Qty'}</th>
                                            <th className="py-3 px-4 text-right">{language === 'tr' ? 'Fiyat' : 'Price'}</th>
                                            <th className="py-3 px-4 text-right">{language === 'tr' ? 'Toplam' : 'Subtotal'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {inspectingOrder.order_items?.map((item: any) => {
                                            const serialNo = item.artworks?.serial_number || '-';
                                            const artistName = item.artworks?.artists?.name || '-';
                                            const subtotal = (item.price || 0) * (item.quantity || 1);

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    {/* Artwork Image & Title */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {item.artworks?.image_url && (
                                                                <img 
                                                                    src={item.artworks.image_url} 
                                                                    alt={item.artworks?.title} 
                                                                    className="w-12 h-12 object-cover rounded-xl border border-gray-100 shadow-sm"
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.artworks?.title || 'Eser'}</p>
                                                                <p className="text-xs text-gray-500">{artistName}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 6-Digit Serial Number */}
                                                    <td className="py-3 px-4 font-mono font-bold text-orange-600">
                                                        {serialNo}
                                                    </td>

                                                    {/* Selected Variations */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1.5 text-xs">
                                                            {item.size && (
                                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                                                                    {language === 'tr' ? 'Boyut' : 'Size'}: {item.size}
                                                                </span>
                                                            )}
                                                            {item.material && (
                                                                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-medium border border-orange-100">
                                                                    {language === 'tr' ? 'Materyal' : 'Material'}: {item.material}
                                                                </span>
                                                            )}
                                                            {item.frame && (
                                                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-100">
                                                                    {language === 'tr' ? 'Çerçeve' : 'Frame'}: {item.frame}
                                                                </span>
                                                            )}
                                                            {!item.size && !item.material && !item.frame && (
                                                                <span className="text-gray-400 italic">{language === 'tr' ? 'Standart' : 'Standard'}</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Quantity */}
                                                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                                                        {item.quantity || 1}
                                                    </td>

                                                    {/* Price */}
                                                    <td className="py-3 px-4 text-right font-medium text-gray-600">
                                                        {formatPrice(item.price, inspectingOrder.currency)}
                                                    </td>

                                                    {/* Subtotal */}
                                                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                                                        {formatPrice(subtotal, inspectingOrder.currency)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Action Bar inside Inspector */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setInspectingOrder(null)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                            >
                                {t('cancel')}
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedOrderForTracking(inspectingOrder);
                                    setTrackingInfo({
                                        number: inspectingOrder.tracking_number || '',
                                        url: inspectingOrder.tracking_url || ''
                                    });
                                }}
                                className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors text-sm flex items-center gap-2 shadow-sm shadow-orange-600/20"
                            >
                                <Truck className="w-4 h-4" />
                                <span>{language === 'tr' ? 'Kargo & Takip Bilgilerini Düzenle' : 'Edit Tracking Info'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TRACKING INFO MODAL */}
            {selectedOrderForTracking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                        <h3 className="text-2xl font-bold mb-2 text-gray-900">{t('markAsShipped')}</h3>
                        <p className="text-sm font-mono text-gray-500 mb-6">Order: #{selectedOrderForTracking.order_number}</p>
                        
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
                                onClick={() => setSelectedOrderForTracking(null)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => handleSaveTracking()}
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

