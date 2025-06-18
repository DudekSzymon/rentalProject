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
    RotateCcw,
    Sparkles
} from 'lucide-react';

const MyRentals = () => {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    // Mapowanie statusów na polskie nazwy i kolory
    const statusConfig = {
        pending: { 
            label: 'Oczekujące', 
            color: 'text-yellow-300 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30', 
            icon: Clock 
        },
        confirmed: { 
            label: 'Potwierdzone', 
            color: 'text-blue-300 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30', 
            icon: CheckCircle 
        },
        active: { 
            label: 'Aktywne', 
            color: 'text-green-300 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30', 
            icon: CheckCircle 
        },
        completed: { 
            label: 'Zakończone', 
            color: 'text-gray-300 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30', 
            icon: CheckCircle 
        },
        cancelled: { 
            label: 'Anulowane', 
            color: 'text-red-300 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30', 
            icon: XCircle 
        },
        overdue: { 
            label: 'Przeterminowane', 
            color: 'text-red-300 bg-gradient-to-r from-red-600/30 to-red-500/30 border-red-500/50', 
            icon: AlertCircle 
        }
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
                <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Pattern Overlay */}
            <div 
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            ></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    onClick={() => navigate('/')}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Strona główna
                                </Button>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                        Moje wypożyczenia
                                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent ml-2">
                                            <Sparkles className="w-8 h-8 inline-block" />
                                        </span>
                                    </h1>
                                    <p className="text-white/80">Historia i status twoich wypożyczeń</p>
                                </div>
                            </div>
                            
                            <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-white text-sm font-medium">Witaj, {user.first_name}!</p>
                                <p className="text-white/70 text-xs">Zarządzaj swoimi wypożyczeniami</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Filtry */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-3">
                            {filters.map((filterOption) => (
                                <button
                                    key={filterOption.value}
                                    onClick={() => {
                                        setFilter(filterOption.value);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm border group hover:scale-105 ${
                                        filter === filterOption.value
                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-white/30 shadow-lg shadow-purple-500/25'
                                            : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:border-white/30'
                                    }`}
                                >
                                    {filterOption.label}
                                    {filter === filterOption.value && (
                                        <span className="ml-2 inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
                                <div className="relative">
                                    <RotateCcw className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-6" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur animate-pulse"></div>
                                </div>
                                <p className="text-white text-lg font-medium">Ładowanie wypożyczeń...</p>
                                <p className="text-white/60 text-sm mt-2">Pobieramy najnowsze dane</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-3xl p-8 max-w-md mx-auto">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <h3 className="text-red-300 font-semibold text-lg mb-2">Wystąpił błąd</h3>
                                <p className="text-red-400 mb-6 text-sm">{error}</p>
                                <Button 
                                    onClick={fetchRentals} 
                                    variant="outline"
                                    className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                                >
                                    Spróbuj ponownie
                                </Button>
                            </div>
                        </div>
                    ) : rentals.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 max-w-lg mx-auto border border-white/20">
                                <div className="text-8xl mb-6 animate-bounce">📦</div>
                                <h3 className="text-2xl font-bold text-white mb-4">Brak wypożyczeń</h3>
                                <p className="text-white/70 mb-8 text-lg">
                                    {filter === 'all' 
                                        ? 'Nie masz jeszcze żadnych wypożyczeń.'
                                        : `Nie masz wypożyczeń z statusem "${filters.find(f => f.value === filter)?.label}".`
                                    }
                                </p>
                                <Button 
                                    onClick={() => navigate('/equipment')}
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
                                >
                                    <Package className="w-5 h-5 mr-2" />
                                    Przeglądaj sprzęt
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Lista wypożyczeń */}
                            <div className="space-y-6 mb-8">
                                {rentals.map((rental, index) => {
                                    const status = statusConfig[rental.status] || statusConfig.pending;
                                    const StatusIcon = status.icon;
                                    const duration = getDaysDifference(rental.start_date, rental.end_date);

                                    return (
                                        <div 
                                            key={rental.id} 
                                            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 group hover:scale-[1.02] animate-fade-in"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1">
                                                                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-1">
                                                                    {rental.equipment_name || 'Nieznany sprzęt'}
                                                                </h3>
                                                                <p className="text-white/60 text-sm">
                                                                    Wypożyczenie #{rental.id} • Utworzone {formatDateTime(rental.created_at)}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border backdrop-blur-sm ${status.color}`}>
                                                                <StatusIcon className="w-4 h-4" />
                                                                <span>{status.label}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 group-hover:bg-white/10 transition-all">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                                                                        <Calendar className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white/90"><strong>Od:</strong> {formatDate(rental.start_date)}</p>
                                                                        <p className="text-white/90"><strong>Do:</strong> {formatDate(rental.end_date)}</p>
                                                                        <p className="text-purple-300 text-xs font-medium">{duration} dni</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 group-hover:bg-white/10 transition-all">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                                                                        <Euro className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white/90"><strong>Koszt:</strong> {rental.total_price} zł</p>
                                                                        {rental.deposit_amount > 0 && (
                                                                            <p className="text-yellow-300 text-xs font-medium">
                                                                                Kaucja: {rental.deposit_amount} zł
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 group-hover:bg-white/10 transition-all">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                                                                        <Package className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white/90"><strong>Ilość:</strong> {rental.quantity || 1}</p>
                                                                        <p className="text-orange-300 text-xs font-medium">
                                                                            {rental.rental_period || 'daily'} rozliczenie
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Notatki */}
                                                        {rental.notes && (
                                                            <div className="mt-4 p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20">
                                                                <p className="text-white/90 text-sm">
                                                                    <strong className="text-purple-300">Notatki:</strong> {rental.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="ml-6 flex flex-col space-y-3">
                                                        <Button
                                                            onClick={() => handleViewDetails(rental)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-105"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Szczegóły
                                                        </Button>
                                                        
                                                        {rental.status === 'pending' && (
                                                            <Button
                                                                onClick={() => navigate(`/rent/${rental.equipment_id}`, {
                                                                    state: { rental: rental }
                                                                })}
                                                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm py-2 px-4 rounded-lg transition-all hover:scale-105"
                                                            >
                                                                Edytuj
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                                        className="border-white/30 text-white hover:bg-white/20 disabled:opacity-50 backdrop-blur-sm"
                                    >
                                        Poprzednia
                                    </Button>
                                    
                                    <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-xl border border-white/20">
                                        <span className="text-white font-medium">
                                            Strona {currentPage} z {totalPages}
                                        </span>
                                    </div>
                                    
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        variant="outline"
                                        className="border-white/30 text-white hover:bg-white/20 disabled:opacity-50 backdrop-blur-sm"
                                    >
                                        Następna
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
};

export default MyRentals;