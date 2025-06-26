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
import { paymentsAPI } from '../../utils/api';
import { 
    CheckCircle, 
    ArrowLeft, 
    Package, 
    Calendar, 
    CreditCard,
    AlertCircle,
    Loader2,
    Euro,
    Clock,
    Hammer
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
            const response = await paymentsAPI.createStripeIntent({
                rental_id: rental.id,
                amount: parseFloat(rental.total_price),
                currency: 'pln'
            });

            const data = response.data;
            setClientSecret(data.client_secret);
            setPaymentIntent({
                id: data.payment_intent_id,
                payment_id: data.payment_id
            });
            
        } catch (err) {
            setError(err.message || 'Błąd tworzenia płatności');
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
            await paymentsAPI.confirmStripe(paymentIntentId);
        } catch (err) {
            console.warn('Błąd potwierdzania w backendzie:', err);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                '::placeholder': {
                    color: '#9ca3af',
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
                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
                <span className="text-gray-300">Przygotowywanie płatności...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-white mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Dane karty płatniczej
                </label>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 focus-within:border-purple-500 transition-colors">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl"
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
                    🔒 Płatność jest bezpieczna i szyfrowana przez Stripe
                </p>
            </div>
        </form>
    );
};

// Komponent strony sukcesu płatności
const PaymentSuccess = ({ rental, equipment, paymentIntent }) => {
    const navigate = useNavigate();

    return (
        <div className="text-center space-y-8">
            <div className="flex justify-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-6">
                    <CheckCircle className="w-16 h-16 text-white" />
                </div>
            </div>
            
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                    Płatność zakończona pomyślnie!
                </h2>
                <p className="text-gray-300 text-lg">Twoje wypożyczenie zostało potwierdzone</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-left space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">ID wypożyczenia:</span>
                    <span className="text-white font-mono bg-white/10 px-3 py-1 rounded-lg">#{rental.id}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">ID płatności:</span>
                    <span className="text-white font-mono text-sm bg-white/10 px-3 py-1 rounded-lg">
                        {paymentIntent?.id?.slice(-8)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Kwota:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {rental.total_price} zł
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
                        ✅ Opłacone
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <Button 
                    onClick={() => navigate('/equipment')} 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl h-12"
                >
                    Powrót do katalogu
                </Button>
                <Button 
                    onClick={() => navigate('/my-rentals')} 
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/20 rounded-xl h-12"
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
                const response = await paymentsAPI.getStripeConfig();
                const config = response.data;
                setStripePromise(loadStripe(config.publishable_key));
            } catch (err) {
                console.error('Błąd ładowania Stripe:', err);
            }
        };

        initStripe();
    }, []);

    // Sprawdzenie czy mamy dane wypożyczenia
    if (!rental || !equipment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl max-w-md w-full">
                        <CardContent className="pt-8 text-center space-y-6">
                            <div className="bg-red-500/20 rounded-full p-4 w-fit mx-auto">
                                <AlertCircle className="w-12 h-12 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Brak danych wypożyczenia</h2>
                                <p className="text-gray-300">Nie można przetworzyć płatności</p>
                            </div>
                            <Button 
                                onClick={() => navigate('/equipment')}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl"
                            >
                                Powrót do katalogu
                            </Button>
                        </CardContent>
                    </Card>
                </div>
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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {/* Pattern Overlay */}
                <div 
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        opacity: 0.3
                    }}
                ></div>

                {/* Navigation */}
                <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                    <Hammer className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-white">SpellBudex</h1>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                        <CardContent className="pt-8">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Pattern Overlay */}
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    opacity: 0.3
                }}
            ></div>

            {/* Navigation */}
            <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Hammer className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">SpellBudex</h1>
                        </div>
                        <Button
                            onClick={() => navigate('/equipment')}
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/20"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Powrót do katalogu
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="relative z-10 text-center px-4 py-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    Płatność za
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
                        wypożyczenie
                    </span>
                </h1>
                <p className="text-gray-300 text-lg">Wybierz sposób płatności i sfinalizuj zamówienie</p>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Płatność */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white text-xl">Sposób płatności</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Wybór metody płatności */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                                            paymentMethod === 'card'
                                                ? 'border-purple-500 bg-purple-500/20 backdrop-blur-sm'
                                                : 'border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <CreditCard className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-white font-semibold mb-2">Karta płatnicza</div>
                                        <div className="text-gray-300 text-sm">Visa, Mastercard, BLIK</div>
                                    </button>
                                    
                                    <button
                                        onClick={() => setPaymentMethod('offline')}
                                        className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                                            paymentMethod === 'offline'
                                                ? 'border-purple-500 bg-purple-500/20 backdrop-blur-sm'
                                                : 'border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-white font-semibold mb-2">Płatność offline</div>
                                        <div className="text-gray-300 text-sm">Gotówka, przelew</div>
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
                                        <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
                                            <h4 className="font-semibold text-blue-300 mb-3 text-lg">💼 Płatność offline</h4>
                                            <p className="text-gray-300 mb-6">
                                                Skontaktuj się z nami aby zapłacić gotówką lub przelewem. 
                                                Administrator zatwierdzi płatność po kontakcie.
                                            </p>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center space-x-3 text-gray-300">
                                                    <span>📞</span>
                                                    <span>+48 123 456 789</span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-gray-300">
                                                    <span>✉️</span>
                                                    <span>kontakt@spellbudex.pl</span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-gray-300">
                                                    <span>🏦</span>
                                                    <span className="font-mono text-xs">PL 1234 5678 9012 3456 7890 1234</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleOfflinePayment} 
                                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl h-12"
                                        >
                                            Potwierdzam - skontaktuję się w sprawie płatności
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                                        <p className="text-gray-300">Ładowanie formularza płatności...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <p className="text-red-300">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Podsumowanie */}
                    <div className="space-y-6">
                        {/* Informacje o sprzęcie */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    Wypożyczenie
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{equipment.name}</h4>
                                    <p className="text-gray-300">{equipment.brand} {equipment.model}</p>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center space-x-2 text-gray-300 mb-3">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">Okres wypożyczenia</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Od:</span>
                                            <span className="text-white font-medium">
                                                {new Date(rental.start_date).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Do:</span>
                                            <span className="text-white font-medium">
                                                {new Date(rental.end_date).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/20 pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Cena netto:</span>
                                        <span className="text-white">{rental.total_price} zł</span>
                                    </div>
                                    {rental.deposit_amount > 0 && (
                                        <div className="flex justify-between text-yellow-400">
                                            <span>Kaucja:</span>
                                            <span>{rental.deposit_amount} zł</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-white font-bold text-lg border-t border-white/20 pt-3">
                                        <span>Do zapłaty:</span>
                                        <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                            {rental.total_price} zł
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informacje o płatności */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <h4 className="font-semibold text-white text-lg">Bezpieczne płatności</h4>
                                    <p className="text-gray-300 text-sm">
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