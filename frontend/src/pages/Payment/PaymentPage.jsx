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
        createPaymentIntent(); //To się dzieje automatycznie gdy strona się ładuje
    }, []);

    const createPaymentIntent = async () => {
        try {
            //Wysyłamy  dane o wypożyczeniu do naszego backendu
            const response = await paymentsAPI.createStripeIntent({
                rental_id: rental.id,
                amount: parseFloat(rental.total_price),
                currency: 'pln'
            });
            //ODPOWIEDŹ Z BACKENDU
            const data = response.data;
            setClientSecret(data.client_secret); //zapisujemy client_secret
            setPaymentIntent({
                id: data.payment_intent_id,
                payment_id: data.payment_id
            });
            
        } catch (err) {
            setError(err.message || 'Błąd tworzenia płatności');
            onPaymentError?.(err.message);
        }
    };
    //UŻYTKOWNIK WYPEŁNIA DANE KARTY i KLIKA ZAPŁAĆ
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setLoading(true);
        setError('');

        const cardElement = elements.getElement(CardElement);

        try {
            //Frontend bezpośrednio wywołuje STRIPE API 
            const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(clientSecret, {
                // = {Dane z płatności}
                payment_method: {
                    card: cardElement, //Dane z karty formularza
                    billing_details: {
                        name: `${user.first_name} ${user.last_name}`,
                        email: user.email
                    }
                }
            });

            if (error) {
                setError(error.message);
                onPaymentError?.(error.message);
                //Informujemy backend o sukcesie
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
                color: '#111827',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
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
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-600">Przygotowywanie płatności...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Dane karty płatniczej
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full h-12 text-base font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
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
                <p className="text-xs text-gray-500">
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
                <div className="bg-green-500 rounded-full p-6">
                    <CheckCircle className="w-16 h-16 text-white" />
                </div>
            </div>
            
            <div>
                <h2 className="text-3xl font-bold text-green-600 mb-4">
                    Wypożyczenie zostało zarejestrowane pomyślnie!
                </h2>
                <p className="text-gray-600 text-lg">Twoje wypożyczenie zostało potwierdzone</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-left space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID wypożyczenia:</span>
                    <span className="text-gray-900 font-mono bg-white px-3 py-1 rounded-lg border border-gray-200">#{rental.id}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Kwota:</span>
                    <span className="text-2xl font-bold text-green-600">
                        {rental.total_price} zł
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <Button 
                    onClick={() => navigate('/equipment')} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 shadow-sm hover:shadow-md transition-all duration-200"
                >
                    Powrót do katalogu
                </Button>
                <Button 
                    onClick={() => navigate('/my-rentals')} 
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl h-12"
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
    const rental = location.state?.rental; //Dane do wypożyczenia
    const equipment = location.state?.equipment; //Dane sprzętu
    
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                {/* Subtle Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-md w-full">
                        <CardContent className="pt-8 text-center space-y-6">
                            <div className="bg-red-100 rounded-full p-4 w-fit mx-auto">
                                <AlertCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Brak danych wypożyczenia</h2>
                                <p className="text-gray-600">Nie można przetworzyć płatności</p>
                            </div>
                            <Button 
                                onClick={() => navigate('/equipment')}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
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
    //Zamienia stan na sukces
    const handlePaymentSuccess = (paymentIntent) => {
        setPaymentSuccess(true);
        setPaymentData(paymentIntent);
    };

    const handlePaymentError = (errorMsg) => {
        setError(errorMsg);
    };

    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                {/* Subtle Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
                </div>

                {/* Navigation */}
                <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <Hammer className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">SpellBudex</h1>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
                    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
            {/* Subtle Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Hammer className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">SpellBudex</h1>
                        </div>
                        <Button
                            onClick={() => navigate('/equipment')}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Powrót do katalogu
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="relative z-10 text-center px-4 py-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                    Płatność za
                    <span className="text-blue-500 block">
                        wypożyczenie
                    </span>
                </h1>
                <p className="text-gray-600 text-lg">Wybierz sposób płatności i sfinalizuj zamówienie</p>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Płatność */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-gray-900 text-xl">Sposób płatności</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Wybór metody płatności */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                                            paymentMethod === 'card'
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <CreditCard className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-gray-900 font-semibold mb-2">Karta płatnicza</div>
                                        <div className="text-gray-600 text-sm">Visa, Mastercard, BLIK</div>
                                    </button>
                                    
                                    <button
                                        onClick={() => setPaymentMethod('offline')}
                                        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                                            paymentMethod === 'offline'
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-gray-900 font-semibold mb-2">Płatność offline</div>
                                        <div className="text-gray-600 text-sm">Gotówka, przelew</div>
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
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                            <h4 className="font-semibold text-blue-700 mb-3 text-lg">💼 Płatność offline</h4>
                                            <p className="text-gray-700 mb-6">
                                                Skontaktuj się z nami aby zapłacić gotówką lub przelewem. 
                                                Administrator zatwierdzi płatność po kontakcie.
                                            </p>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center space-x-3 text-gray-600">
                                                    <span>📞</span>
                                                    <span>+48 123 456 789</span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-gray-600">
                                                    <span>✉️</span>
                                                    <span>kontakt@spellbudex.pl</span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-gray-600">
                                                    <span>🏦</span>
                                                    <span className="font-mono text-xs">PL 1234 5678 9012 3456 7890 1234</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleOfflinePayment} 
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            Potwierdzam - skontaktuję się w sprawie płatności
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                        <p className="text-gray-600">Ładowanie formularza płatności...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            <p className="text-red-600">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Podsumowanie */}
                    <div className="space-y-6">
                        {/* Informacje o sprzęcie */}
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-gray-900 flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    Wypożyczenie
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{equipment.name}</h4>
                                    <p className="text-gray-600">{equipment.brand} {equipment.model}</p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">Okres wypożyczenia</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Od:</span>
                                            <span className="text-gray-900 font-medium">
                                                {new Date(rental.start_date).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Do:</span>
                                            <span className="text-gray-900 font-medium">
                                                {new Date(rental.end_date).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Cena netto:</span>
                                        <span className="text-gray-900">{rental.total_price} zł</span>
                                    </div>
                                    {rental.deposit_amount > 0 && (
                                        <div className="flex justify-between text-yellow-600">
                                            <span>Kaucja:</span>
                                            <span>{rental.deposit_amount} zł</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-900 font-bold text-lg border-t border-gray-200 pt-3">
                                        <span>Do zapłaty:</span>
                                        <span className="text-green-600">
                                            {rental.total_price} zł
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informacje o płatności */}
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <div className="bg-green-500 w-16 h-16 rounded-xl flex items-center justify-center mx-auto">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-lg">Bezpieczne płatności</h4>
                                    <p className="text-gray-600 text-sm">
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
