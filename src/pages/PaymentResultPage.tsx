import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Using the supabase client that includes functions
import { useCart } from '../contexts/CartContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function PaymentResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying payment...');

    const verificationStarted = useState(false); // Using state actually causes re-renders, better to use Ref for this specific pattern or move logic outside effect?
    // Actually, useRef is the standard way to prevent strict mode double-firing for specialized init logic.
    const runOnce = useRef(false);

    useEffect(() => {
        const statusParam = searchParams.get('status');
        const messageParam = searchParams.get('message');
        const token = searchParams.get('token');

        // Handle explicit failure from backend redirect
        if (statusParam === 'failure') {
            setStatus('error');
            setMessage(messageParam || 'Payment failed.');
            return;
        }

        if (!token) {
            setStatus('error');
            setMessage('No payment token found.');
            return;
        }

        // Prevent double invocation
        if (runOnce.current) return;
        runOnce.current = true;

        verifyPayment(token);
    }, [searchParams]);

    const verifyPayment = async (token: string) => {
        try {
            // Call Supabase Edge Function to verify payment with Iyzico
            // This ensures the token is valid and payment is actually successful (serverside check)
            const { data, error } = await supabase.functions.invoke('iyzico-check', {
                body: { token },
            });

            if (error) throw error;

            if (data.status === 'success') {
                setStatus('success');
                setMessage('Payment successful! Your order has been created.');
                await clearCart();
            } else {
                throw new Error(data.errorMessage || 'Payment verification failed.');
            }

        } catch (err: any) {
            console.error('Payment Verification Error:', err);
            setStatus('error');
            setMessage(err.message || 'An error occurred while verifying the payment.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-transform hover:-translate-y-0.5"
                        >
                            View My Orders
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
