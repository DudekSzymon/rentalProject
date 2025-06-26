import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { equipmentAPI } from '../../utils/api';
import { 
    Search, 
    Filter, 
    Calendar, 
    Euro, 
    Hammer, 
    ArrowLeft,
    Drill,
    Wrench,
    HardHat,
    Zap
} from 'lucide-react';

const Equipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Kategorie z ikonami i gradientami
    const categories = [
        { value: '', label: 'Wszystkie', icon: Hammer, gradient: 'from-purple-500 to-blue-500' },
        { value: 'drilling', label: 'Wiertarki', icon: Drill, gradient: 'from-blue-500 to-indigo-500' },
        { value: 'cutting', label: 'Cięcie', icon: Wrench, gradient: 'from-indigo-500 to-purple-500' },
        { value: 'power_tools', label: 'Elektronarzędzia', icon: Zap, gradient: 'from-purple-500 to-pink-500' },
        { value: 'hand_tools', label: 'Narzędzia ręczne', icon: Wrench, gradient: 'from-green-500 to-blue-500' },
        { value: 'safety', label: 'Bezpieczeństwo', icon: HardHat, gradient: 'from-yellow-500 to-orange-500' },
        { value: 'lifting', label: 'Podnoszenie', icon: Hammer, gradient: 'from-red-500 to-pink-500' },
        { value: 'concrete', label: 'Betonowanie', icon: Hammer, gradient: 'from-gray-500 to-blue-500' },
        { value: 'excavation', label: 'Kopanie', icon: Hammer, gradient: 'from-brown-500 to-yellow-500' }
    ];

    // Pobierz sprzęt z API
    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 12,
                available_only: true,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedCategory && { category: selectedCategory })
            };

            const response = await equipmentAPI.getAll(params);
            const data = response.data;
            
            setEquipment(data.items || []);
            setTotalPages(data.pages || 1);
        } catch (err) {
            setError(err.message || 'Błąd pobierania sprzętu');
        } finally {
            setLoading(false);
        }
    };

    // Efekt dla pobierania danych
    useEffect(() => {
        // Sprawdź URL params
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        }
        
        fetchEquipment();
    }, [currentPage, selectedCategory, searchTerm, searchParams]);

    // Obsługa wyszukiwania
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchEquipment();
    };

    // Obsługa kategorii
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        // Aktualizuj URL
        const newParams = new URLSearchParams();
        if (category) newParams.set('category', category);
        navigate(`/equipment?${newParams.toString()}`, { replace: true });
    };

    // Rozpocznij wypożyczenie
    const handleRentEquipment = (equipmentItem) => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Przekieruj do formularza wypożyczenia
        navigate(`/rent/${equipmentItem.id}`, { 
            state: { equipment: equipmentItem } 
        });
    };

    if (loading && equipment.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                
                <div className="text-center relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">Ładowanie sprzętu...</p>
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

            {/* Header */}
            <div className="relative z-10 bg-white/10 backdrop-blur-sm border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Strona główna
                            </Button>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    Katalog sprzętu
                                </h1>
                                <p className="text-gray-300 mt-2">Znajdź idealne narzędzia dla swojego projektu</p>
                            </div>
                        </div>
                        
                        {user && (
                            <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-white text-sm font-medium">Witaj, {user.first_name}!</p>
                                <p className="text-purple-300 text-xs">Gotowy do wypożyczenia?</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Filtry i wyszukiwanie */}
                <div className="mb-12 space-y-8">
                    {/* Wyszukiwanie */}
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Szukaj sprzętu (np. wiertarka, młot, rusztowanie...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-14 text-base bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-300 rounded-2xl"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            size="lg" 
                            className="px-8 h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl"
                        >
                            <Search className="w-5 h-5 mr-2" />
                            Szukaj
                        </Button>
                    </form>

                    {/* Kategorie */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const isSelected = selectedCategory === category.value;
                            return (
                                <button
                                    key={category.value}
                                    onClick={() => handleCategoryChange(category.value)}
                                    className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                                        isSelected
                                            ? 'bg-white/20 backdrop-blur-sm border-2 border-white/40 scale-105'
                                            : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:scale-105'
                                    }`}
                                >
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white text-sm font-medium">{category.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <div className="mb-8 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
                        <p className="text-red-300 mb-4">❌ {error}</p>
                        <Button 
                            onClick={fetchEquipment}
                            variant="outline"
                            size="sm"
                            className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                        >
                            Spróbuj ponownie
                        </Button>
                    </div>
                )}

                {/* Lista sprzętu */}
                {equipment.length === 0 && !loading ? (
                    <div className="text-center py-20">
                        <div className="text-8xl mb-6">🔍</div>
                        <h3 className="text-2xl font-bold text-white mb-4">Brak wyników</h3>
                        <p className="text-gray-300 mb-8 text-lg max-w-md mx-auto">
                            Nie znaleźliśmy sprzętu pasującego do Twoich kryteriów.
                        </p>
                        <Button 
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('');
                                setCurrentPage(1);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl px-8"
                        >
                            Wyczyść filtry
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Grid sprzętu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                            {equipment.map((item) => (
                                <Card key={item.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-white text-lg leading-tight group-hover:text-purple-300 transition-colors">
                                                    {item.name}
                                                </CardTitle>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    {item.brand} {item.model}
                                                </p>
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                                    {item.daily_rate} zł
                                                </div>
                                                <div className="text-xs text-gray-400">za dzień</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        <div className="space-y-4">
                                            <p className="text-gray-300 text-sm line-clamp-2">
                                                {item.description}
                                            </p>
                                            
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">Dostępne: {item.quantity_available}/{item.quantity_total}</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    item.quantity_available > 0 
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                }`}>
                                                    {item.quantity_available > 0 ? 'Dostępne' : 'Wypożyczone'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <Button 
                                                    onClick={() => handleRentEquipment(item)}
                                                    disabled={item.quantity_available === 0}
                                                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl"
                                                    size="sm"
                                                >
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {user ? 'Wypożycz' : 'Zaloguj się'}
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/equipment/${item.id}`)}
                                                    className="border-white/30 text-white hover:bg-white/20 rounded-xl"
                                                >
                                                    Szczegóły
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Paginacja */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-6">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/20 disabled:opacity-50 rounded-xl px-6"
                                >
                                    Poprzednia
                                </Button>
                                
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                                    <span className="text-white font-medium">
                                        Strona {currentPage} z {totalPages}
                                    </span>
                                </div>
                                
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/20 disabled:opacity-50 rounded-xl px-6"
                                >
                                    Następna
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Loading overlay */}
            {loading && equipment.length > 0 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-6"></div>
                        <p className="text-white text-lg">Ładowanie...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipment;