import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
    ArrowLeft, 
    Package, 
    Calendar, 
    Euro, 
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    RotateCcw
} from 'lucide-react';

const MyRentals = () => {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, active, completed, cancelled
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    // Mapowanie statusów na polskie nazwy i kolory
    const statusConfig = {
        pending: { label: 'Oczekujące', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
        confirmed: { label: 'Potwierdzone', color: 'text-blue-400 bg-blue-400/10', icon: CheckCircle },
        active: { label: 'Aktywne', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
        completed: { label: 'Zakończone', color: 'text-gray-400 bg-gray-400/10', icon: CheckCircle },
        cancelled: { label: 'Anulowane', color: 'text-red-400 bg-red-400/10', icon: XCircle },
        overdue: { label: 'Przeterminowane', color: 'text-red-400 bg-red-400/20', icon: AlertCircle }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchRentals();
    }, [user, filter, currentPage]);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({
                page: currentPage,
                size: 10,
                ...(filter !== 'all' && { status: filter })
            });

            const response = await fetch(`http://localhost:8000/api/rentals?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Błąd pobierania wypożyczeń');
            }

            const data = await response.json();
            setRentals(data.items);
            setTotalPages(data.pages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysDifference = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleViewDetails = (rental) => {
        // TODO: Implementacja szczegółów wypożyczenia
        console.log('View rental details:', rental);
    };

    const filters = [
        { value: 'all', label: 'Wszystkie' },
        { value: 'pending', label: 'Oczekujące' },
        { value: 'confirmed', label: 'Potwierdzone' },
        { value: 'active', label: 'Aktywne' },
        { value: 'completed', label: 'Zakończone' },
        { value: 'cancelled', label: 'Anulowane' }
    ];

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                size="sm"
                                className="border-gray-600 text-gray-300 hover:bg-white/10"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Strona główna
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Moje wypożyczenia</h1>
                                <p className="text-gray-400">Historia i status twoich wypożyczeń</p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-white text-sm">Witaj, {user.first_name}!</p>
                            <p className="text-gray-400 text-xs">Zarządzaj swoimi wypożyczeniami</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Filtry */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {filters.map((filterOption) => (
                            <button
                                key={filterOption.value}
                                onClick={() => {
                                    setFilter(filterOption.value);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === filterOption.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {filterOption.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <RotateCcw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                            <p className="text-white">Ładowanie wypożyczeń...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
                            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                            <p className="text-red-400 mb-4">{error}</p>
                            <Button onClick={fetchRentals} variant="outline">
                                Spróbuj ponownie
                            </Button>
                        </div>
                    </div>
                ) : rentals.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-white mb-2">Brak wypożyczeń</h3>
                        <p className="text-gray-400 mb-6">
                            {filter === 'all' 
                                ? 'Nie masz jeszcze żadnych wypożyczeń.'
                                : `Nie masz wypożyczeń z statusem "${filters.find(f => f.value === filter)?.label}".`
                            }
                        </p>
                        <Button onClick={() => navigate('/equipment')}>
                            <Package className="w-4 h-4 mr-2" />
                            Przeglądaj sprzęt
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Lista wypożyczeń */}
                        <div className="space-y-4 mb-8">
                            {rentals.map((rental) => {
                                const status = statusConfig[rental.status] || statusConfig.pending;
                                const StatusIcon = status.icon;
                                const duration = getDaysDifference(rental.start_date, rental.end_date);

                                return (
                                    <Card key={rental.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-4 mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-white">
                                                                {rental.equipment_name || 'Nieznany sprzęt'}
                                                            </h3>
                                                            <p className="text-sm text-gray-400">
                                                                Wypożyczenie #{rental.id} • Utworzone {formatDateTime(rental.created_at)}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                                            <StatusIcon className="w-4 h-4" />
                                                            <span>{status.label}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <Calendar className="w-4 h-4" />
                                                            <div>
                                                                <p><strong>Od:</strong> {formatDate(rental.start_date)}</p>
                                                                <p><strong>Do:</strong> {formatDate(rental.end_date)}</p>
                                                                <p className="text-xs text-gray-400">{duration} dni</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <Euro className="w-4 h-4" />
                                                            <div>
                                                                <p><strong>Koszt:</strong> {rental.total_price} zł</p>
                                                                {rental.deposit_amount > 0 && (
                                                                    <p className="text-xs text-yellow-400">
                                                                        Kaucja: {rental.deposit_amount} zł
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <Package className="w-4 h-4" />
                                                            <div>
                                                                <p><strong>Ilość:</strong> {rental.quantity || 1}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {rental.rental_period || 'daily'} rozliczenie
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Notatki */}
                                                    {rental.notes && (
                                                        <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                                                            <p className="text-sm text-gray-300">
                                                                <strong>Notatki:</strong> {rental.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="ml-6 flex flex-col space-y-2">
                                                    <Button
                                                        onClick={() => handleViewDetails(rental)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-gray-600 text-gray-300 hover:bg-white/10"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Szczegóły
                                                    </Button>
                                                    
                                                    {rental.status === 'pending' && (
                                                        <Button
                                                            onClick={() => navigate(`/rent/${rental.equipment_id}`, {
                                                                state: { rental: rental }
                                                            })}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-yellow-600 text-yellow-400 hover:bg-yellow-400/10"
                                                        >
                                                            Edytuj
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Paginacja */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-4">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-600"
                                >
                                    Poprzednia
                                </Button>
                                
                                <span className="text-gray-300">
                                    Strona {currentPage} z {totalPages}
                                </span>
                                
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-600"
                                >
                                    Następna
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyRentals;