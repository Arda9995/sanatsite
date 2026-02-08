import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../lib/supabase';
import { getDeliverySettings } from '../lib/deliveryCalculator';
import { CornerFrame, AbstractBrush, CirclePattern } from '../components/DecorativeElements';
import { Package, Heart, Users, Bell, User, ShoppingBag, Check, Eye, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import CustomerDeliveryCalendar from '../components/customer/CustomerDeliveryCalendar';

interface Customer {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    created_at: string;
}

interface Order {
    id: string;
    order_number: string;
    order_status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    delivery_date: string | null;
    payment_status: string;
}

interface Favorite {
    id: string;
    artwork_id: string;
    created_at: string;
    artworks: {
        id: string;
        title: string;
        image_url: string;
        price: number;
        base_currency: string;
        artist_id: string;
        artists: {
            name: string;
        };
    };
}

interface FollowedArtist {
    id: string;
    artist_id: string;
    created_at: string;
    artists: {
        id: string;
        name: string;
        avatar_url: string | null;
        slug: string | null;
    };
}

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    related_artwork_id: string | null;
    related_artist_id: string | null;
}

type TabType = 'overview' | 'orders' | 'delivery' | 'favorites' | 'following' | 'notifications' | 'profile';

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalFavorites: 0,
        followingCount: 0,
        unreadNotifications: 0
    });

    // Profile editing
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            loadCustomerData();
        } else {
            navigate('/');
        }
    }, [user]);

    const loadCustomerData = async () => {
        try {
            // Use Supabase Auth user data instead of customers table
            if (user) {
                const mockCustomer: Customer = {
                    id: user.id,
                    email: user.email || '',
                    first_name: user.user_metadata?.first_name || '',
                    last_name: user.user_metadata?.last_name || '',
                    phone: user.user_metadata?.phone || null,
                    created_at: user.created_at || new Date().toISOString()
                };

                setCustomer(mockCustomer);
                setProfileForm({
                    first_name: mockCustomer.first_name,
                    last_name: mockCustomer.last_name,
                    phone: mockCustomer.phone || ''
                });
            }

            // Load all data in parallel
            await Promise.all([
                loadOrders(),
                loadFavorites(),
                loadFollowedArtists(),
                loadNotifications()
            ]);

        } catch (error) {
            console.error('Error loading customer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const [deliverySettings, setDeliverySettings] = useState({ standard_delivery_days: 3 });

    useEffect(() => {
        if (user) {
            loadCustomerData();
            loadOrders();
            loadFavorites();
            loadFollowedArtists();
            loadNotifications();
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        const settings = await getDeliverySettings();
        if (settings) setDeliverySettings(settings);
    };

    const calculateEstimate = (orderCreatedAt: string) => {
        const orderDate = new Date(orderCreatedAt);
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(deliveryDate.getDate() + (deliverySettings.standard_delivery_days || 3));
        return deliveryDate;
    };

    const loadOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });

        if (data) {
            setOrders(data as any);
            setStats(prev => ({ ...prev, totalOrders: data.length }));
        }
    };

    const loadFavorites = async () => {
        const { data } = await supabase
            .from('favorites')
            .select(`
                *,
                artworks (
                    id,
                    title,
                    image_url,
                    price,
                    base_currency,
                    artist_id,
                    is_deleted,
                    artists (name)
                )
            `)
            .eq('user_id', user!.id)
            .eq('artworks.is_deleted', false)
            .order('created_at', { ascending: false });

        if (data) {
            // Defensive filtering to ensure artwork exists and is not deleted
            const validFavorites = (data as any[]).filter(f => f && f.artworks && !f.artworks.is_deleted);
            setFavorites(validFavorites);
            setStats(prev => ({ ...prev, totalFavorites: validFavorites.length }));
        }
    };

    const loadFollowedArtists = async () => {
        const { data } = await supabase
            .from('artist_follows')
            .select(`
                *,
                artists (
                    id,
                    name,
                    avatar_url,
                    slug
                )
            `)
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });

        if (data) {
            // Defensive filtering to ensure artist exists
            const validFollows = (data as any[]).filter(f => f && f.artists);
            setFollowedArtists(validFollows);
            setStats(prev => ({ ...prev, followingCount: validFollows.length }));
        }
    };

    const loadNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });

        if (data) {
            setNotifications(data as any);
            const unread = (data as any[]).filter((n: any) => !n.is_read).length;
            setStats(prev => ({ ...prev, unreadNotifications: unread }));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Update Supabase Auth user metadata
            const { error } = await supabase.auth.updateUser({
                data: {
                    first_name: profileForm.first_name,
                    last_name: profileForm.last_name,
                    phone: profileForm.phone
                }
            });

            if (error) throw error;

            // Update local state
            if (customer) {
                setCustomer({
                    ...customer,
                    first_name: profileForm.first_name,
                    last_name: profileForm.last_name,
                    phone: profileForm.phone
                });
            }

            setEditingProfile(false);
            alert(t('profileUpdatedSuccess'));
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        }
    };

    const handleRemoveFavorite = async (favoriteId: string) => {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId);

        if (!error) {
            loadFavorites();
        }
    };

    const handleUnfollowArtist = async (followId: string) => {
        const { error } = await supabase
            .from('artist_follows')
            .delete()
            .eq('id', followId);

        if (!error) {
            loadFollowedArtists();
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        await (supabase
            .from('notifications') as any)
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId);

        loadNotifications();
    };

    const handleMarkAllAsRead = async () => {
        await (supabase
            .from('notifications') as any)
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', user!.id)
            .eq('is_read', false);

        loadNotifications();
    };



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl text-gray-600">{t('loading')}</div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('error')}</h1>
                    <p className="text-gray-600">{t('profileNotFound')}</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview' as TabType, label: t('dashboardOverview'), icon: ShoppingBag },
        { id: 'orders' as TabType, label: t('myOrders'), icon: Package },
        { id: 'delivery' as TabType, label: 'Delivery Calendar', icon: CalendarIcon },
        { id: 'favorites' as TabType, label: t('myFavorites'), icon: Heart },
        { id: 'following' as TabType, label: t('followedArtists'), icon: Users },
        { id: 'notifications' as TabType, label: t('notifications'), icon: Bell },
        { id: 'profile' as TabType, label: t('myProfile'), icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 relative overflow-hidden">
            <CornerFrame position="top-right" className="opacity-10" />
            <AbstractBrush className="bottom-20 left-10 opacity-10" />
            <CirclePattern className="top-40 right-10 opacity-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                        {t('customerDashboard')}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {t('welcomeBack')}, {customer.first_name}!
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="border-b border-gray-200 overflow-x-auto">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2
                                            ${activeTab === tab.id
                                                ? 'border-orange-500 text-orange-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                        {tab.id === 'notifications' && stats.unreadNotifications > 0 && (
                                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                                {stats.unreadNotifications}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-8">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                        <Package className="w-8 h-8 text-blue-600 mb-2" />
                                        <div className="text-3xl font-bold text-blue-900">{stats.totalOrders}</div>
                                        <div className="text-sm text-blue-700">{t('totalOrders')}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                                        <Heart className="w-8 h-8 text-pink-600 mb-2" />
                                        <div className="text-3xl font-bold text-pink-900">{stats.totalFavorites}</div>
                                        <div className="text-sm text-pink-700">{t('totalFavorites')}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                        <Users className="w-8 h-8 text-purple-600 mb-2" />
                                        <div className="text-3xl font-bold text-purple-900">{stats.followingCount}</div>
                                        <div className="text-sm text-purple-700">{t('artistsFollowing')}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                        <Bell className="w-8 h-8 text-orange-600 mb-2" />
                                        <div className="text-3xl font-bold text-orange-900">{stats.unreadNotifications}</div>
                                        <div className="text-sm text-orange-700">{t('unreadNotifications')}</div>
                                    </div>
                                </div>

                                {/* Recent Orders */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('myOrdersLabel')}</h3>
                                    {orders.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">{t('noOrders')}</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.slice(0, 3).map((order) => (
                                                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{order.order_number}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-900">
                                                            {formatPrice(order.total_amount, order.currency as any)}
                                                        </div>
                                                        <div className={`text-sm px-2 py-1 rounded-full inline-block ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                                order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {t(order.order_status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900">{t('myOrdersLabel')}</h2>
                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">{t('noOrders')}</p>
                                        <button
                                            onClick={() => navigate('/artworks')}
                                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-medium"
                                        >
                                            {t('startShopping')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="font-bold text-lg text-gray-900">{order.order_number}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-xl text-gray-900">
                                                            {formatPrice(order.total_amount, order.currency as any)}
                                                        </div>
                                                        <div className={`text-sm px-3 py-1 rounded-full inline-block mt-1 ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                                order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {t(order.order_status)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600">{t('paymentStatus')}:</span>
                                                        <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' :
                                                            order.payment_status === 'failed' ? 'text-red-600' :
                                                                'text-yellow-600'
                                                            }`}>
                                                            {t(order.payment_status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600">{t('deliveryLabel')}:</span>
                                                        {order.delivery_date ? (
                                                            <span className="text-green-600 font-medium">
                                                                {new Date(order.delivery_date).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-600 font-medium italic">
                                                                {t('estimatedDelivery') || 'Estimated'}: {calculateEstimate(order.created_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Delivery Tab */}
                        {activeTab === 'delivery' && (
                            <div>
                                <CustomerDeliveryCalendar userId={user!.id} />
                            </div>
                        )}

                        {/* Favorites Tab */}
                        {activeTab === 'favorites' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900">{t('myFavorites')}</h2>
                                {favorites.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">{t('noFavoritesYet')}</p>
                                        <button
                                            onClick={() => navigate('/artworks')}
                                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-medium"
                                        >
                                            {t('startBrowsing')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {favorites.map((fav) => (
                                            <div key={fav.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                                <div className="aspect-square overflow-hidden">
                                                    <img
                                                        src={fav.artworks?.image_url}
                                                        alt={fav.artworks?.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-gray-900 mb-1">{fav.artworks?.title}</h3>
                                                    <p className="text-sm text-gray-600 mb-2">{fav.artworks?.artists?.name || t('unknownArtist')}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-orange-600">
                                                            {formatPrice(fav.artworks?.price || 0, (fav.artworks?.base_currency as any) || 'EUR')}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => navigate(`/artwork/${fav.artworks?.id}`)}
                                                                className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
                                                                title={t('viewArtwork')}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveFavorite(fav.id)}
                                                                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                                                                title={t('removeFromFavorites')}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Following Tab */}
                        {activeTab === 'following' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900">{t('followedArtists')}</h2>
                                {followedArtists.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">{t('noFollowedArtists')}</p>
                                        <button
                                            onClick={() => navigate('/artists')}
                                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-medium"
                                        >
                                            {t('discoverTalentedArtists')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {followedArtists.map((follow) => (
                                            <div key={follow.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                                                <img
                                                    src={follow.artists?.avatar_url || 'https://via.placeholder.com/80'}
                                                    alt={follow.artists?.name}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{follow.artists?.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {t('following')} {t('since')} {new Date(follow.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/${follow.artists?.slug || follow.artists?.id}`)}
                                                        className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                                                    >
                                                        {t('viewProfile')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUnfollowArtist(follow.id)}
                                                        className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        {t('unfollowArtist')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900">{t('notifications')}</h2>
                                    {stats.unreadNotifications > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            {t('markAllAsRead')}
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">{t('noNotifications')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`p-4 rounded-lg border ${notif.is_read
                                                    ? 'bg-white border-gray-200'
                                                    : 'bg-orange-50 border-orange-200'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                                                            {!notif.is_read && (
                                                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(notif.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {!notif.is_read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notif.id)}
                                                            className="ml-4 p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                                            title={t('markAsRead')}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900">{t('myProfile')}</h2>
                                    {!editingProfile && (
                                        <button
                                            onClick={() => setEditingProfile(true)}
                                            className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                                        >
                                            {t('editProfile')}
                                        </button>
                                    )}
                                </div>

                                {editingProfile ? (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t('firstName')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileForm.first_name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t('lastName')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileForm.last_name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('phoneNumber')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('email')}
                                            </label>
                                            <input
                                                type="email"
                                                value={customer.email}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                                            >
                                                {t('updateProfile')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingProfile(false);
                                                    setProfileForm({
                                                        first_name: customer.first_name,
                                                        last_name: customer.last_name,
                                                        phone: customer.phone || ''
                                                    });
                                                }}
                                                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                {t('cancel')}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-600">{t('fullName')}</label>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {customer.first_name} {customer.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600">{t('email')}</label>
                                            <p className="text-lg font-semibold text-gray-900">{customer.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600">{t('phoneNumber')}</label>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {customer.phone || t('notProvided')}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600">{t('memberSince')}</label>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {new Date(customer.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
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
