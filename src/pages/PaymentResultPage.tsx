import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { queueOrderConfirmationEmail } from '../lib/emailService';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function PaymentResultPage() {
    const { language } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(language === 'tr' ? 'Ödeme doğrulanıyor...' : 'Verifying payment...');

    const runOnce = useRef(false);

    useEffect(() => {
        const statusParam = searchParams.get('status');
        const messageParam = searchParams.get('message');
        const token = searchParams.get('token');

        if (statusParam === 'failure') {
            setStatus('error');
            setMessage(messageParam || (language === 'tr' ? 'Ödeme başarısız oldu.' : 'Payment failed.'));
            return;
        }

        if (!token) {
            setStatus('error');
            setMessage(language === 'tr' ? 'Ödeme doğrulaması için jeton bulunamadı.' : 'No payment token found.');
            return;
        }

        if (runOnce.current) return;
        runOnce.current = true;

        verifyPayment(token);
    }, [searchParams]);

    const verifyPayment = async (token: string) => {
        try {
            const { data, error } = await supabase.functions.invoke('iyzico-check', {
                body: { token },
            });

            if (error) throw error;

            if (data.status === 'success') {
                setStatus('success');
                setMessage(language === 'tr' ? 'Ödeme başarılı! Siparişiniz oluşturuldu.' : 'Payment successful! Your order has been created.');

                // Trigger Order Confirmation Email Queue with full details (addresses, notes, variations)
                const orderId = data.orderId || data.order_id;
                if (orderId) {
                    try {
                        const { data: orderDetails } = await supabase
                            .from('orders')
                            .select(`
                                *,
                                order_items (
                                    id, price, quantity, size, material, frame,
                                    artworks (title, image_url, serial_number, artists (name))
                                )
                            `)
                            .eq('id', orderId)
                            .maybeSingle();

                        if (orderDetails && (orderDetails.shipping_address?.email || orderDetails.email)) {
                            await queueOrderConfirmationEmail({
                                orderId: orderDetails.id,
                                orderNumber: orderDetails.order_number,
                                customerEmail: orderDetails.shipping_address?.email || orderDetails.email || '',
                                totalAmount: orderDetails.total_amount,
                                currency: orderDetails.currency || 'EUR',
                                shippingAddress: orderDetails.shipping_address,
                                billingAddress: orderDetails.billing_address,
                                customerNotes: orderDetails.customer_notes,
                                items: (orderDetails.order_items || []).map((item: any) => ({
                                    title: item.artworks?.title || 'Eser',
                                    artistName: item.artworks?.artists?.name,
                                    serialNumber: item.artworks?.serial_number,
                                    imageUrl: item.artworks?.image_url,
                                    quantity: item.quantity || 1,
                                    price: item.price || 0,
                                    size: item.size,
                                    material: item.material,
                                    frame: item.frame
                                })),
                                lang: language === 'tr' ? 'tr' : 'en'
                            });
                        }
                    } catch (eErr) {
                        console.warn('Could not queue order confirmation email:', eErr);
                    }
                }

                await clearCart();
            } else {
                throw new Error(data.errorMessage || (language === 'tr' ? 'Ödeme doğrulanamadı.' : 'Payment verification failed.'));
            }

        } catch (err: any) {
            console.error('Payment Verification Error:', err);
            setStatus('error');
            setMessage(err.message || (language === 'tr' ? 'Ödeme doğrulanırken bir hata oluştu.' : 'An error occurred while verifying the payment.'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{language === 'tr' ? 'Ödeme İşleniyor' : 'Processing Payment'}</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{language === 'tr' ? 'Sipariş Onaylandı!' : 'Order Confirmed!'}</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-transform hover:-translate-y-0.5"
                        >
                            {language === 'tr' ? 'Siparişlerimi Görüntüle' : 'View My Orders'}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{language === 'tr' ? 'Ödeme Başarısız' : 'Payment Failed'}</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                        >
                            {language === 'tr' ? 'Tekrar Deneyin' : 'Try Again'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
