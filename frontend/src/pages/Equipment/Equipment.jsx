import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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

    // Kategorie z ikonami
    const categories = [
        { value: '', label: 'Wszystkie', icon: Hammer },
        { value: 'drilling', label: 'Wiertarki', icon: Drill },
        { value: 'cutting', label: 'Cięcie', icon: Wrench },
        { value: 'power_tools', label: 'Elektronarzędzia', icon: Zap },
        { value: 'hand_tools', label: 'Narzędzia ręczne', icon: Wrench },
        { value: 'safety', label: 'Bezpieczeństwo', icon: HardHat },
        { value: 'lifting', label: 'Podnoszenie', icon: Hammer },
        { value: 'concrete', label: 'Betonowanie', icon: Hammer },
        { value: 'excavation', label: 'Kopanie', icon: Hammer }
    ];

    // Pobierz sprzęt z API
    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                size: 12,
                available_only: true,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedCategory && { category: selectedCategory })
            });

            const response = await fetch(`http://localhost:8000/api/equipment?${params}`);
            
            if (!response.ok) {
                throw new Error('Błąd pobierania sprzętu');
            }

            const data = await response.json();
            setEquipment(data.items);
            setTotalPages(data.pages);
        } catch (err) {
            setError(err.message);
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
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Ładowanie sprzętu...</p>
                </div>
            </div>
        );
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
                                <h1 className="text-3xl font-bold text-white">Katalog sprzętu</h1>
                                <p className="text-gray-400">Znajdź idealne narzędzia dla swojego projektu</p>
                            </div>
                        </div>
                        
                        {user && (
                            <div className="text-right">
                                <p className="text-white text-sm">Witaj, {user.first_name}!</p>
                                <p className="text-gray-400 text-xs">Gotowy do wypożyczenia?</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Filtry i wyszukiwanie */}
                <div className="mb-8 space-y-6">
                    {/* Wyszukiwanie */}
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Szukaj sprzętu (np. wiertarka, młot, rusztowanie...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 text-base"
                            />
                        </div>
                        <Button type="submit" size="lg" className="px-8">
                            <Search className="w-5 h-5 mr-2" />
                            Szukaj
                        </Button>
                    </form>

                    {/* Kategorie */}
                    <div className="flex flex-wrap gap-3">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.value}
                                    onClick={() => handleCategoryChange(category.value)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        selectedCategory === category.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm">{category.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-400">❌ {error}</p>
                        <Button 
                            onClick={fetchEquipment}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                        >
                            Spróbuj ponownie
                        </Button>
                    </div>
                )}

                {/* Lista sprzętu */}
                {equipment.length === 0 && !loading ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-white mb-2">Brak wyników</h3>
                        <p className="text-gray-400 mb-6">
                            Nie znaleźliśmy sprzętu pasującego do Twoich kryteriów.
                        </p>
                        <Button 
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('');
                                setCurrentPage(1);
                            }}
                            variant="outline"
                        >
                            Wyczyść filtry
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Grid sprzętu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {equipment.map((item) => (
                                <Card key={item.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-white text-lg leading-tight">
                                                    {item.name}
                                                </CardTitle>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    {item.brand} {item.model}
                                                </p>
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="text-lg font-bold text-green-400">
                                                    {item.daily_rate} zł
                                                </div>
                                                <div className="text-xs text-gray-400">za dzień</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        <div className="space-y-3">
                                            <p className="text-gray-300 text-sm line-clamp-2">
                                                {item.description}
                                            </p>
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>Dostępne: {item.quantity_available}/{item.quantity_total}</span>
                                                <span className={`px-2 py-1 rounded ${
                                                    item.quantity_available > 0 
                                                        ? 'bg-green-500/20 text-green-400' 
                                                        : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {item.quantity_available > 0 ? 'Dostępne' : 'Wypożyczone'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <Button 
                                                    onClick={() => handleRentEquipment(item)}
                                                    disabled={item.quantity_available === 0}
                                                    className="flex-1"
                                                    size="sm"
                                                >
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {user ? 'Wypożycz' : 'Zaloguj się'}
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/equipment/${item.id}`)}
                                                    className="border-gray-600"
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
                            <div className="flex justify-center items-center space-x-4">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    size="sm"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white">Ładowanie...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipment;