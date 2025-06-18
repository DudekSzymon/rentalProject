import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
    CheckCircle, 
    ArrowLeft, 
    Package, 
    Calendar, 
    CreditCard,
    AlertCircle,
    Loader2,
    Euro,
    Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Komponent formularza płatności Stripe
const StripePaymentForm = ({ rental, equipment, onPaymentSuccess, onPaymentError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntent, setPaymentIntent] = useState(null);
    const [error, setError] = useState('');

    // Tworzenie Payment Intent przy montowaniu komponentu
    useEffect(() => {
        createPaymentIntent();
    }, []);

    const createPaymentIntent = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            const response = await fetch('http://localhost:8000/api/payments/stripe/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rental_id: rental.id,
                    amount: parseFloat(rental.total_price),
                    currency: 'pln'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Błąd tworzenia płatności');
            }

            const data = await response.json();
            setClientSecret(data.client_secret);
            setPaymentIntent({
                id: data.payment_intent_id,
                payment_id: data.payment_id
            });
            
        } catch (err) {
            setError(err.message);
            onPaymentError?.(err.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setLoading(true);
        setError('');

        const cardElement = elements.getElement(CardElement);

        try {
            const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: `${user.first_name} ${user.last_name}`,
                        email: user.email
                    }
                }
            });

            if (error) {
                setError(error.message);
                onPaymentError?.(error.message);
            } else if (confirmedPayment.status === 'succeeded') {
                // Płatność udana - sprawdź status w backendzie
                await confirmPaymentInBackend(confirmedPayment.id);
                onPaymentSuccess?.(confirmedPayment);
            }
        } catch (err) {
            setError(err.message);
            onPaymentError?.(err.message);
        }

        setLoading(false);
    };

    const confirmPaymentInBackend = async (paymentIntentId) => {
        try {
            const token = localStorage.getItem('access_token');
            
            const response = await fetch(`http://localhost:8000/api/payments/stripe/confirm/${paymentIntentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn('Błąd potwierdzania w backendzie, ale płatność przeszła');
            }
        } catch (err) {
            console.warn('Błąd potwierdzania w backendzie:', err);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                '::placeholder': {
                    color: '#6b7280',
                },
                backgroundColor: 'transparent',
            },
            invalid: {
                color: '#ef4444',
                iconColor: '#ef4444'
            }
        },
        hidePostalCode: true
    };

    if (!clientSecret) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
                <span className="text-gray-300">Przygotowywanie płatności...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Dane karty płatniczej
                </label>
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 focus-within:border-blue-500 transition-colors">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full h-12 text-base font-semibold"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Przetwarzanie płatności...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Zapłać {rental.total_price} zł
                    </>
                )}
            </Button>

            <div className="text-center">
                <p className="text-xs text-gray-400">
                    Płatność jest bezpieczna i szyfrowana przez Stripe
                </p>
            </div>
        </form>
    );
};

// Komponent strony sukcesu płatności
const PaymentSuccess = ({ rental, equipment, paymentIntent }) => {
    const navigate = useNavigate();

    return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="bg-green-500/20 rounded-full p-4">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Płatność zakończona pomyślnie!</h2>
                <p className="text-gray-300">Twoje wypożyczenie zostało potwierdzone</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-6 text-left space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">ID wypożyczenia:</span>
                    <span className="text-white font-mono">#{rental.id}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">ID płatności:</span>
                    <span className="text-white font-mono text-sm">{paymentIntent?.id?.slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Kwota:</span>
                    <span className="text-white font-semibold">{rental.total_price} zł</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                        Opłacone
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <Button onClick={() => navigate('/equipment')} className="w-full">
                    Powrót do katalogu
                </Button>
                <Button 
                    onClick={() => navigate('/my-rentals')} 
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300"
                >
                    Moje wypożyczenia
                </Button>
            </div>
        </div>
    );
};

// Główny komponent strony płatności
const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const rental = location.state?.rental;
    const equipment = location.state?.equipment;
    
    const [stripePromise, setStripePromise] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' lub 'offline'
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [error, setError] = useState('');

    // Ładowanie Stripe
    useEffect(() => {
        const initStripe = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/payments/stripe/config');
                if (response.ok) {
                    const config = await response.json();
                    setStripePromise(loadStripe(config.publishable_key));
                }
            } catch (err) {
                console.error('Błąd ładowania Stripe:', err);
            }
        };

        initStripe();
    }, []);

    // Sprawdzenie czy mamy dane wypożyczenia
    if (!rental || !equipment) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Brak danych wypożyczenia</h2>
                            <p className="text-gray-400">Nie można przetworzyć płatności</p>
                        </div>
                        <Button onClick={() => navigate('/equipment')}>
                            Powrót do katalogu
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleOfflinePayment = () => {
        setPaymentSuccess(true);
        setPaymentData({ offline: true });
    };

    const handlePaymentSuccess = (paymentIntent) => {
        setPaymentSuccess(true);
        setPaymentData(paymentIntent);
    };

    const handlePaymentError = (errorMsg) => {
        setError(errorMsg);
    };

    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="bg-gray-800 border-b border-gray-700">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        <h1 className="text-2xl font-bold text-white">Płatność zakończona</h1>
                    </div>
                </div>
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                            <PaymentSuccess 
                                rental={rental} 
                                equipment={equipment} 
                                paymentIntent={paymentData} 
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={() => navigate('/equipment')}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Powrót do katalogu
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Płatność za wypożyczenie</h1>
                            <p className="text-gray-400">Wybierz sposób płatności</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Płatność */}
                    <div className="lg:col-span-2">
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Sposób płatności</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Wybór metody płatności */}
                                <div className="flex space-x-4 mb-6">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                                            paymentMethod === 'card'
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-gray-600 bg-gray-700/50'
                                        }`}
                                    >
                                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-white" />
                                        <div className="text-white font-medium">Karta płatnicza</div>
                                        <div className="text-gray-400 text-sm">Visa, Mastercard, BLIK</div>
                                    </button>
                                    
                                    <button
                                        onClick={() => setPaymentMethod('offline')}
                                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                                            paymentMethod === 'offline'
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-gray-600 bg-gray-700/50'
                                        }`}
                                    >
                                        <Clock className="w-6 h-6 mx-auto mb-2 text-white" />
                                        <div className="text-white font-medium">Płatność offline</div>
                                        <div className="text-gray-400 text-sm">Gotówka, przelew</div>
                                    </button>
                                </div>

                                {/* Formularz płatności */}
                                {paymentMethod === 'card' && stripePromise ? (
                                    <Elements stripe={stripePromise}>
                                        <StripePaymentForm
                                            rental={rental}
                                            equipment={equipment}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={handlePaymentError}
                                        />
                                    </Elements>
                                ) : paymentMethod === 'offline' ? (
                                    <div className="space-y-6">
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-400 mb-2">Płatność offline</h4>
                                            <p className="text-gray-300 text-sm mb-4">
                                                Skontaktuj się z nami aby zapłacić gotówką lub przelewem. 
                                                Administrator zatwierdzi płatność.
                                            </p>
                                            <div className="space-y-2 text-sm text-gray-400">
                                                <p>📞 +48 123 456 789</p>
                                                <p>✉️ kontakt@spellbudex.pl</p>
                                                <p>🏦 PL 1234 5678 9012 3456 7890 1234</p>
                                            </div>
                                        </div>

                                        <Button onClick={handleOfflinePayment} className="w-full">
                                            Potwierdzam - skontaktuję się w sprawie płatności
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                                        <p className="text-gray-300">Ładowanie formularza płatności...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <p className="text-red-400">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Podsumowanie */}
                    <div className="space-y-6">
                        {/* Informacje o sprzęcie */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    Wypożyczenie
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-white">{equipment.name}</h4>
                                    <p className="text-sm text-gray-400">{equipment.brand} {equipment.model}</p>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-300">
                                    <Calendar className="w-4 h-4" />
                                    <div>
                                        <p><strong>Od:</strong> {new Date(rental.start_date).toLocaleDateString('pl-PL')}</p>
                                        <p><strong>Do:</strong> {new Date(rental.end_date).toLocaleDateString('pl-PL')}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-600 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-300">
                                        <span>Cena netto:</span>
                                        <span>{rental.total_price} zł</span>
                                    </div>
                                    {rental.deposit_amount > 0 && (
                                        <div className="flex justify-between text-sm text-yellow-400">
                                            <span>Kaucja:</span>
                                            <span>{rental.deposit_amount} zł</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-white font-semibold border-t border-gray-600 pt-2">
                                        <span>Do zapłaty:</span>
                                        <span>{rental.total_price} zł</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informacje o płatności */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-2">
                                    <div className="text-3xl">🔒</div>
                                    <h4 className="font-semibold text-white">Bezpieczne płatności</h4>
                                    <p className="text-sm text-gray-400">
                                        Twoje dane są chronione przez SSL i Stripe
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;