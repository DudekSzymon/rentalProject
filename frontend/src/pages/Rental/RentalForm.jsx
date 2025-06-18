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
    Clock
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
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Ładowanie...</p>
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
                            <h1 className="text-2xl font-bold text-white">Wypożyczenie sprzętu</h1>
                            <p className="text-gray-400">Wypełnij formularz aby zarezerwować sprzęt</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formularz */}
                    <div className="lg:col-span-2">
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Szczegóły wypożyczenia</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Daty */}
                                    <div className="grid grid-cols-2 gap-4">
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
                                                className="bg-gray-700 border-gray-600"
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
                                                className="bg-gray-700 border-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Ilość i okres rozliczeniowy */}
                                    <div className="grid grid-cols-2 gap-4">
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
                                                className="bg-gray-700 border-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Okres rozliczeniowy
                                            </label>
                                            <select
                                                value={rentalPeriod}
                                                onChange={(e) => setRentalPeriod(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                            >
                                                <option value="daily">Dzienny</option>
                                                <option value="weekly">Tygodniowy</option>
                                                <option value="monthly">Miesięczny</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Adresy */}
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
                                                className="bg-gray-700 border-gray-600"
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
                                                className="bg-gray-700 border-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Dostawa */}
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="delivery"
                                            checked={deliveryRequired}
                                            onChange={(e) => setDeliveryRequired(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                                        />
                                        <label htmlFor="delivery" className="text-gray-300">
                                            Potrzebuję dostawy na miejsce
                                        </label>
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
                                            placeholder="Dodatkowe informacje..."
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="w-5 h-5 text-red-400" />
                                                <p className="text-red-400">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <Button 
                                        type="submit" 
                                        disabled={loading || !isValidDateRange || !availability?.available}
                                        className="w-full"
                                    >
                                        {loading ? (
                                            <>
                                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                Tworzenie wypożyczenia...
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-4 h-4 mr-2" />
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
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">{equipment.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm text-gray-300">
                                    <p><strong>Marka:</strong> {equipment.brand} {equipment.model}</p>
                                    <p><strong>Kategoria:</strong> {equipment.category}</p>
                                    <p><strong>Dostępność:</strong> {equipment.quantity_available}/{equipment.quantity_total}</p>
                                    <div className="pt-2 border-t border-gray-600">
                                        <p className="text-green-400 font-semibold">
                                            {equipment.daily_rate} zł za dzień
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status dostępności */}
                        {availability && (
                            <Card className="bg-gray-800 border-gray-700">
                                <CardContent className="pt-6">
                                    <div className={`flex items-center space-x-2 ${
                                        availability.available ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {availability.available ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <span className="font-medium">
                                            {availability.available ? 'Dostępne w wybranym terminie' : 'Niedostępne'}
                                        </span>
                                    </div>
                                    {!availability.available && availability.error && (
                                        <p className="text-red-400 text-sm mt-2">{availability.error}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Cennik */}
                        {pricing && (
                            <Card className="bg-gray-800 border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg">Podsumowanie kosztów</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-300">
                                            <span>Cena jednostkowa:</span>
                                            <span>{pricing.unit_price} zł</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Jednostki rozliczeniowe:</span>
                                            <span>{pricing.billable_units}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Ilość:</span>
                                            <span>{pricing.quantity}</span>
                                        </div>
                                        <div className="border-t border-gray-600 pt-2">
                                            <div className="flex justify-between text-white font-semibold">
                                                <span>Łącznie:</span>
                                                <span>{pricing.total_price} zł</span>
                                            </div>
                                            <div className="flex justify-between text-yellow-400 text-sm">
                                                <span>Kaucja:</span>
                                                <span>{pricing.deposit_amount} zł</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 pt-2">
                                            Czas wypożyczenia: {pricing.duration_days} dni
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