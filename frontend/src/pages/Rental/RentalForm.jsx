import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { equipmentAPI, rentalsAPI } from '../../utils/api';
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
            const response = await equipmentAPI.getById(equipmentId);
            setEquipment(response.data);
        } catch (error) {
            setError(error.message || 'Nie znaleziono sprzętu');
        }
    };

    const checkAvailabilityAndPricing = async () => {
        try {
            // Dodaj czas do dat
            const startDateTime = new Date(startDate + 'T12:00:00').toISOString(); // Południe
            const endDateTime = new Date(endDate + 'T12:00:00').toISOString();  

            // Sprawdź dostępność
            const availabilityParams = {
                equipment_id: equipment.id,
                start_date: startDateTime,
                end_date: endDateTime,
                quantity: quantity
            };

            const availabilityResponse = await rentalsAPI.checkAvailability(availabilityParams);
            const availabilityData = availabilityResponse.data;
            setAvailability(availabilityData);

            // Jeśli dostępne, sprawdź cenę
            if (availabilityData.available) {
                const pricingParams = {
                    equipment_id: equipment.id,
                    start_date: startDateTime,
                    end_date: endDateTime,
                    quantity: quantity,
                    rental_period: rentalPeriod
                };

                const pricingResponse = await rentalsAPI.getPricingPreview(pricingParams);
                const pricingData = pricingResponse.data;
                
                if (pricingData.success) {
                    setPricing(pricingData.pricing);
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

        if (!user) {
            navigate('/login');
            return;
        }

        // Sprawdź czy adresy są wypełnione
        if (!pickupAddress.trim()) {
            setError('Adres odbioru jest wymagany');
            setLoading(false);
            return;
        }

        if (!returnAddress.trim()) {
            setError('Adres zwrotu jest wymagany');
            setLoading(false);
            return;
        }

        try {
            const response = await rentalsAPI.create({
                equipment_id: equipment.id,
                start_date: new Date(startDate + 'T12:00:00').toISOString(),
                end_date: new Date(endDate + 'T12:00:00').toISOString(),
                quantity: quantity,
                rental_period: rentalPeriod,
                notes: notes,
                pickup_address: pickupAddress,
                return_address: returnAddress,
                delivery_required: deliveryRequired
            });

            const rentalData = response.data;
            // Przekieruj do płatności
            navigate('/payment', { 
                state: { 
                    rental: rentalData,
                    equipment: equipment 
                } 
            });
        } catch (error) {
            setError(error.message || 'Błąd tworzenia wypożyczenia');
        } finally {
            setLoading(false);
        }
    };

    // Walidacja dat
    const today = new Date().toISOString().split('T')[0];
    const isValidDateRange = startDate && endDate && new Date(startDate) < new Date(endDate);

    if (!equipment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                {/* Subtle Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-900 text-lg">Ładowanie...</p>
                    </div>
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
                    Wypożyczenie
                    <span className="text-blue-500 block">
                        sprzętu
                    </span>
                </h1>
                <p className="text-gray-600 text-lg">Wypełnij formularz aby zarezerwować sprzęt</p>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formularz */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-gray-900 text-xl flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Szczegóły wypożyczenia
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Daty */}
                                    <div>
                                        <h3 className="text-gray-900 font-semibold mb-4 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Okres wypożyczenia
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Data rozpoczęcia *
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    min={today}
                                                    required
                                                    className="h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Data zakończenia *
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    min={startDate || today}
                                                    required
                                                    className="h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ilość i okres rozliczeniowy */}
                                    <div>
                                        <h3 className="text-gray-900 font-semibold mb-4 flex items-center">
                                            <Package className="w-4 h-4 mr-2" />
                                            Parametry wypożyczenia
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ilość
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                                    min="1"
                                                    max={equipment.quantity_available}
                                                    required
                                                    className="h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Okres rozliczeniowy
                                                </label>
                                                <select
                                                    value={rentalPeriod}
                                                    onChange={(e) => setRentalPeriod(e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                                >
                                                    <option value="daily">Dzienny</option>
                                                    <option value="weekly">Tygodniowy</option>
                                                    <option value="monthly">Miesięczny</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Adresy */}
                                    <div>
                                        <h3 className="text-gray-900 font-semibold mb-4 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Lokalizacja *
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Adres odbioru *
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={pickupAddress}
                                                    onChange={(e) => setPickupAddress(e.target.value)}
                                                    placeholder="Adres gdzie odbierzesz sprzęt"
                                                    className="h-14 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Adres zwrotu *
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={returnAddress}
                                                    onChange={(e) => setReturnAddress(e.target.value)}
                                                    placeholder="Adres gdzie zwrócisz sprzęt"
                                                    className="h-14 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dostawa */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="delivery"
                                                checked={deliveryRequired}
                                                onChange={(e) => setDeliveryRequired(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="delivery" className="text-gray-900 font-medium">
                                                🚚 Potrzebuję dostawy na miejsce
                                            </label>
                                        </div>
                                    </div>

                                    {/* Notatki */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notatki (opcjonalne)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="3"
                                            placeholder="Dodatkowe informacje, uwagi specjalne..."
                                            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                                <p className="text-red-600">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <Button 
                                        type="submit" 
                                        disabled={loading || !isValidDateRange || !availability?.available}
                                        className="w-full h-12 text-lg font-semibold bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
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
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-gray-900 text-lg flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    {equipment.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Marka:</span>
                                                <span className="text-gray-900 font-medium">{equipment.brand} {equipment.model}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Kategoria:</span>
                                                <span className="text-gray-900">{equipment.category}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Dostępność:</span>
                                                <span className="text-gray-900">{equipment.quantity_available}/{equipment.quantity_total}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {equipment.daily_rate} zł
                                        </div>
                                        <div className="text-gray-500 text-sm">za dzień</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status dostępności */}
                        {availability && (
                            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                <CardContent className="pt-6">
                                    <div className={`flex items-center justify-center space-x-3 p-4 rounded-xl ${
                                        availability.available 
                                            ? 'bg-green-100 border border-green-200' 
                                            : 'bg-red-100 border border-red-200'
                                    }`}>
                                        {availability.available ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        )}
                                        <div className="text-center">
                                            <div className={`font-semibold ${
                                                availability.available ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                                {availability.available ? '✅ Dostępne' : '❌ Niedostępne'}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {availability.available ? 'w wybranym terminie' : 'w tym okresie'}
                                            </div>
                                        </div>
                                    </div>
                                    {!availability.available && availability.error && (
                                        <p className="text-red-600 text-sm mt-3 text-center">{availability.error}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Cennik */}
                        {pricing && (
                            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 text-lg flex items-center">
                                        <Euro className="w-5 h-5 mr-2" />
                                        Podsumowanie kosztów
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Cena jednostkowa:</span>
                                                <span className="text-gray-900">{pricing.unit_price} zł</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Jednostki rozliczeniowe:</span>
                                                <span className="text-gray-900">{pricing.billable_units}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Ilość:</span>
                                                <span className="text-gray-900">{pricing.quantity}</span>
                                            </div>
                                            <div className="border-t border-gray-300 pt-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-900 font-semibold">Łącznie:</span>
                                                    <span className="text-2xl font-bold text-green-600">
                                                        {pricing.total_price} zł
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-yellow-600 text-sm">
                                                    <span>Kaucja:</span>
                                                    <span>{pricing.deposit_amount} zł</span>
                                                </div>
                                            </div>
                                            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
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