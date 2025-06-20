import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
    ArrowLeft, 
    Calendar, 
    Euro, 
    MapPin, 
    AlertCircle,
    CheckCircle,
    Clock,
    Hammer,
    Package
} from 'lucide-react';

const RentalForm = () => {
    const { equipmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Stan formularza
    const [equipment, setEquipment] = useState(location.state?.equipment || null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [rentalPeriod, setRentalPeriod] = useState('daily');
    const [notes, setNotes] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [returnAddress, setReturnAddress] = useState('');
    const [deliveryRequired, setDeliveryRequired] = useState(false);

    // Stan UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pricing, setPricing] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [step, setStep] = useState(1); // 1: formularz, 2: podsumowanie, 3: płatność

    // Pobierz dane sprzętu jeśli nie ma w state
    useEffect(() => {
        if (!equipment && equipmentId) {
            fetchEquipment();
        }
    }, [equipmentId]);

    // Sprawdź dostępność i cenę gdy zmienią się daty
    useEffect(() => {
        if (equipment && startDate && endDate && quantity) {
            checkAvailabilityAndPricing();
        }
    }, [equipment, startDate, endDate, quantity, rentalPeriod]);

    const fetchEquipment = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/equipment/${equipmentId}`);
            if (response.ok) {
                const data = await response.json();
                setEquipment(data);
            } else {
                setError('Nie znaleziono sprzętu');
            }
        } catch (err) {
            setError('Błąd pobierania danych sprzętu');
        }
    };

    const checkAvailabilityAndPricing = async () => {
        try {
            // ZMIANA: Dodaj czas do dat
            const startDateTime = new Date(startDate + 'T12:00:00').toISOString(); // Południe
            const endDateTime = new Date(endDate + 'T12:00:00').toISOString();  
            
            const token = localStorage.getItem('access_token'); // <- DODANE

            // Sprawdź dostępność
            const availabilityParams = new URLSearchParams({
                equipment_id: equipment.id,
                start_date: startDateTime,  // <- ZMIENIONE
                end_date: endDateTime,      // <- ZMIENIONE
                quantity: quantity
            });

            const availabilityResponse = await fetch(
                `http://localhost:8000/api/rentals/check-availability?${availabilityParams}`,
                { 
                    method: 'GET',
                    headers: {                           // <- DODANE
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                }
            );
            
            if (availabilityResponse.ok) {
                const availabilityData = await availabilityResponse.json();
                setAvailability(availabilityData);

                // Jeśli dostępne, sprawdź cenę
                if (availabilityData.available) {
                    const pricingParams = new URLSearchParams({
                        equipment_id: equipment.id,
                        start_date: startDateTime,    // <- ZMIENIONE (było startDate)
                        end_date: endDateTime,        // <- ZMIENIONE (było endDate)
                        quantity: quantity,
                        rental_period: rentalPeriod
                    });

                    const pricingResponse = await fetch(
                        `http://localhost:8000/api/rentals/pricing-preview?${pricingParams}`,
                        { 
                            method: 'GET',
                            headers: {                   // <- DODANE
                                ...(token && { 'Authorization': `Bearer ${token}` })
                            }
                        }
                    );

                    if (pricingResponse.ok) {
                        const pricingData = await pricingResponse.json();
                        if (pricingData.success) {
                            setPricing(pricingData.pricing);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Błąd sprawdzania dostępności:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/rentals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
               body: JSON.stringify({
                    equipment_id: equipment.id,
                    start_date: new Date(startDate + 'T12:00:00').toISOString(),
                    end_date: new Date(endDate + 'T12:00:00').toISOString(),
                    quantity: quantity,
                    rental_period: rentalPeriod,
                    notes: notes,
                    pickup_address: pickupAddress,
                    return_address: returnAddress,
                    delivery_required: deliveryRequired
                })
            });

            if (response.ok) {
                const rentalData = await response.json();
                // Przekieruj do płatności
                navigate('/payment', { 
                    state: { 
                        rental: rentalData,
                        equipment: equipment 
                    } 
                });
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Błąd tworzenia wypożyczenia');
            }
        } catch (err) {
            setError('Błąd sieciowy. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };

    // Walidacja dat
    const today = new Date().toISOString().split('T')[0];
    const isValidDateRange = startDate && endDate && new Date(startDate) < new Date(endDate);

    if (!equipment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white text-lg">Ładowanie...</p>
                    </div>
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
                    Wypożyczenie
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
                        sprzętu
                    </span>
                </h1>
                <p className="text-gray-300 text-lg">Wypełnij formularz aby zarezerwować sprzęt</p>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formularz */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white text-xl flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Szczegóły wypożyczenia
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Daty */}
                                    <div>
                                        <h3 className="text-white font-semibold mb-4 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Okres wypożyczenia
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Data rozpoczęcia *
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    min={today}
                                                    required
                                                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Data zakończenia *
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    min={startDate || today}
                                                    required
                                                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ilość i okres rozliczeniowy */}
                                    <div>
                                        <h3 className="text-white font-semibold mb-4 flex items-center">
                                            <Package className="w-4 h-4 mr-2" />
                                            Parametry wypożyczenia
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Ilość
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                                    min="1"
                                                    max={equipment.quantity_available}
                                                    required
                                                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Okres rozliczeniowy
                                                </label>
                                                <select
                                                    value={rentalPeriod}
                                                    onChange={(e) => setRentalPeriod(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value="daily" className="bg-gray-800">Dzienny</option>
                                                    <option value="weekly" className="bg-gray-800">Tygodniowy</option>
                                                    <option value="monthly" className="bg-gray-800">Miesięczny</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Adresy */}
                                    <div>
                                        <h3 className="text-white font-semibold mb-4 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Lokalizacja
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Adres odbioru
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={pickupAddress}
                                                    onChange={(e) => setPickupAddress(e.target.value)}
                                                    placeholder="Adres gdzie odbierzesz sprzęt"
                                                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Adres zwrotu
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={returnAddress}
                                                    onChange={(e) => setReturnAddress(e.target.value)}
                                                    placeholder="Adres gdzie zwrócisz sprzęt"
                                                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dostawa */}
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="delivery"
                                                checked={deliveryRequired}
                                                onChange={(e) => setDeliveryRequired(e.target.checked)}
                                                className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                                            />
                                            <label htmlFor="delivery" className="text-gray-300 font-medium">
                                                🚚 Potrzebuję dostawy na miejsce
                                            </label>
                                        </div>
                                    </div>

                                    {/* Notatki */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Notatki (opcjonalne)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="3"
                                            placeholder="Dodatkowe informacje, uwagi specjalne..."
                                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="w-5 h-5 text-red-400" />
                                                <p className="text-red-300">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <Button 
                                        type="submit" 
                                        disabled={loading || !isValidDateRange || !availability?.available}
                                        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl"
                                    >
                                        {loading ? (
                                            <>
                                                <Clock className="w-5 h-5 mr-2 animate-spin" />
                                                Tworzenie wypożyczenia...
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-5 h-5 mr-2" />
                                                Przejdź do płatności
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Podsumowanie */}
                    <div className="space-y-6">
                        {/* Informacje o sprzęcie */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white text-lg flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    {equipment.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Marka:</span>
                                                <span className="text-white font-medium">{equipment.brand} {equipment.model}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Kategoria:</span>
                                                <span className="text-white">{equipment.category}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Dostępność:</span>
                                                <span className="text-white">{equipment.quantity_available}/{equipment.quantity_total}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                            {equipment.daily_rate} zł
                                        </div>
                                        <div className="text-gray-300 text-sm">za dzień</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status dostępności */}
                        {availability && (
                            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                                <CardContent className="pt-6">
                                    <div className={`flex items-center justify-center space-x-3 p-4 rounded-xl ${
                                        availability.available 
                                            ? 'bg-green-500/20 border border-green-500/30' 
                                            : 'bg-red-500/20 border border-red-500/30'
                                    }`}>
                                        {availability.available ? (
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-red-400" />
                                        )}
                                        <div className="text-center">
                                            <div className={`font-semibold ${
                                                availability.available ? 'text-green-300' : 'text-red-300'
                                            }`}>
                                                {availability.available ? '✅ Dostępne' : '❌ Niedostępne'}
                                            </div>
                                            <div className="text-sm text-gray-300">
                                                {availability.available ? 'w wybranym terminie' : 'w tym okresie'}
                                            </div>
                                        </div>
                                    </div>
                                    {!availability.available && availability.error && (
                                        <p className="text-red-300 text-sm mt-3 text-center">{availability.error}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Cennik */}
                        {pricing && (
                            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg flex items-center">
                                        <Euro className="w-5 h-5 mr-2" />
                                        Podsumowanie kosztów
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between text-gray-300">
                                                <span>Cena jednostkowa:</span>
                                                <span className="text-white">{pricing.unit_price} zł</span>
                                            </div>
                                            <div className="flex justify-between text-gray-300">
                                                <span>Jednostki rozliczeniowe:</span>
                                                <span className="text-white">{pricing.billable_units}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-300">
                                                <span>Ilość:</span>
                                                <span className="text-white">{pricing.quantity}</span>
                                            </div>
                                            <div className="border-t border-white/20 pt-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-white font-semibold">Łącznie:</span>
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                                        {pricing.total_price} zł
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-yellow-400 text-sm">
                                                    <span>Kaucja:</span>
                                                    <span>{pricing.deposit_amount} zł</span>
                                                </div>
                                            </div>
                                            <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/10">
                                                ⏰ Czas wypożyczenia: {pricing.duration_days} dni
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalForm;