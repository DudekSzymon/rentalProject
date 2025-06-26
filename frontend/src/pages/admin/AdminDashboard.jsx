import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { paymentsAPI, adminAPI, equipmentAPI } from '../../utils/api'; 
import {
    LayoutDashboard,
    Package,
    Users,
    Calendar,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    Eye,
    UserCheck,
    UserX,
    Ban,
    Shield
} from 'lucide-react';

// Komponent dla zakładki Overview
const OverviewTab = ({ stats, onTabChange }) => (
    <div className="space-y-4 md:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                        Aktywne wypożyczenia
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.activeRentals}</div>
                    <p className="text-xs text-gray-400">
                        z {stats.totalRentals} wszystkich
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                        Oczekujące płatności
                    </CardTitle>
                    <Clock className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.pendingPayments}</div>
                    <p className="text-xs text-gray-400">
                        Wymagają zatwierdzenia
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                        Zarejestrowani użytkownicy
                    </CardTitle>
                    <Users className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                    <p className="text-xs text-gray-400">
                        +12% w tym miesiącu
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                        Sprzęt w bazie
                    </CardTitle>
                    <Package className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.totalEquipment || 0}</div>
                    <p className="text-xs text-gray-400">
                        Różnych pozycji
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white text-lg md:text-xl">Szybkie akcje</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Button 
                        onClick={() => onTabChange('payments')}
                        className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2 bg-orange-600 hover:bg-orange-700 text-white text-sm md:text-base"
                    >
                        <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-center leading-tight">Zatwierdź płatności</span>
                        {stats.pendingPayments > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                ({stats.pendingPayments})
                            </span>
                        )}
                    </Button>
                    <Button 
                        onClick={() => onTabChange('rentals')}
                        variant="outline"
                        className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2 border-gray-600 text-sm md:text-base"
                    >
                        <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-center leading-tight">Zarządzaj wypożyczeniami</span>
                    </Button>
                    <Button 
                        onClick={() => onTabChange('equipment')}
                        className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700 text-white text-sm md:text-base"
                    >
                        <Package className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-center leading-tight">Zarządzaj sprzętem</span>
                    </Button>
                    <Button 
                        onClick={() => onTabChange('users')}
                        variant="outline"
                        className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2 border-gray-600 text-sm md:text-base sm:col-span-2 lg:col-span-1"
                    >
                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-center leading-tight">Zarządzaj użytkownikami</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
);

// Komponent dla zatwierdzania płatności
// Poprawiony komponent PaymentsTab
const PaymentsTab = ({ onStatsRefresh }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            // Możesz użyć adminAPI.getPendingPayments lub paymentsAPI.getAll z filtrem
            const response = await adminAPI.getPendingPayments({ page: 1, size: 50 });
            const data = response.data;
            setPayments(data.items || []);
        } catch (error) {
            console.error('Błąd pobierania płatności:', error);
            // Fallback - spróbuj z ogólnym endpointem
            try {
                const response = await paymentsAPI.getAll({ status: 'pending', page: 1, size: 50 });
                const data = response.data;
                setPayments(data.items || []);
            } catch (fallbackError) {
                console.error('Błąd fallback pobierania płatności:', fallbackError);
                alert('Błąd pobierania płatności: ' + (fallbackError.message || 'Nieznany błąd'));
            }
        } finally {
            setLoading(false);
        }
    };

    const approvePayment = async (paymentId) => {
        try {
            await paymentsAPI.approveOffline({
                payment_id: paymentId,
                notes: 'Zatwierdzone przez administratora'
            });

            alert('Płatność zatwierdzona pomyślnie!');
            fetchPendingPayments();
            if (onStatsRefresh) {
                onStatsRefresh();
            }
        } catch (error) {
            console.error('Błąd zatwierdzania płatności:', error);
            alert('Błąd zatwierdzania płatności: ' + (error.message || 'Nieznany błąd'));
        }
    };

    const cancelPayment = async (paymentId) => {
        if (!confirm('Czy na pewno chcesz anulować tę płatność?')) return;

        try {
            // Używamy poprawnej metody cancel
            await adminAPI.cancelPayment(paymentId);
            alert('Płatność anulowana pomyślnie!');
            fetchPendingPayments();
            if (onStatsRefresh) {
                onStatsRefresh();
            }
        } catch (error) {
            console.error('Błąd anulowania płatności:', error);
            alert('Błąd anulowania płatności: ' + (error.message || 'Nieznany błąd'));
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white text-lg md:text-xl">Oczekujące płatności offline</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Ładowanie...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <p className="text-gray-400">Brak oczekujących płatności!</p>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {payments.map((payment) => (
                                <div key={payment.id} className="bg-gray-700 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white text-sm md:text-base">
                                            Płatność #{payment.id}
                                        </h4>
                                        <p className="text-gray-400 text-sm">
                                            {payment.user_email} • {payment.amount} zł
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-500">
                                            {payment.rental_equipment_name || 'Brak sprzętu'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Status: {payment.status} • Metoda: {payment.payment_method}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                                        <Button
                                            onClick={() => approvePayment(payment.id)}
                                            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none min-h-[44px]"
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Zatwierdź
                                        </Button>
                                        <Button
                                            onClick={() => cancelPayment(payment.id)}
                                            variant="outline"
                                            className="border-red-600 text-red-400 hover:bg-red-600/20 flex-1 sm:flex-none min-h-[44px]"
                                            size="sm"
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Anuluj</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// Komponent dla zarządzania użytkownikami
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getUsers();
            const data = response.data;
            setUsers(data.items || []);
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserBlock = async (userId, isBlocked) => {
        try {
            await adminAPI.updateUser(userId, {
                is_blocked: !isBlocked
            });

            alert(`Użytkownik ${!isBlocked ? 'zablokowany' : 'odblokowany'} pomyślnie!`);
            fetchUsers();
        } catch (error) {
            alert('Błąd zmiany statusu użytkownika');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white text-lg md:text-xl">Zarządzanie użytkownikami</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4 md:mb-6">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Szukaj użytkowników..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Ładowanie...</p>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="bg-gray-700 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-sm md:text-base">
                                                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-white text-sm md:text-base truncate">
                                                {user.first_name} {user.last_name}
                                            </h4>
                                            <p className="text-gray-400 text-sm truncate">{user.email}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm mt-1">
                                                <span className={`px-2 py-1 rounded ${
                                                    user.role === 'admin' 
                                                        ? 'bg-red-500/20 text-red-400' 
                                                        : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                                                </span>
                                                <span className={`px-2 py-1 rounded ${
                                                    user.is_blocked 
                                                        ? 'bg-red-500/20 text-red-400' 
                                                        : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                    {user.is_blocked ? 'Zablokowany' : 'Aktywny'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                                        {user.role !== 'admin' && (
                                            <Button
                                                onClick={() => toggleUserBlock(user.id, user.is_blocked)}
                                                variant="outline"
                                                size="sm"
                                                className={`${user.is_blocked ? 'border-green-600 text-green-400' : 'border-red-600 text-red-400'} w-full sm:w-auto min-h-[44px]`}
                                            >
                                                {user.is_blocked ? (
                                                    <>
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        <span className="hidden xs:inline">Odblokuj</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserX className="w-4 h-4 mr-1" />
                                                        <span className="hidden xs:inline">Zablokuj</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// Komponent zarządzania sprzętem
const EquipmentTab = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Kategorie sprzętu
    const categories = [
        { value: '', label: 'Wszystkie kategorie' },
        { value: 'drilling', label: 'Wiertarki' },
        { value: 'cutting', label: 'Cięcie' },
        { value: 'excavation', label: 'Kopanie' },
        { value: 'concrete', label: 'Betonowanie' },
        { value: 'lifting', label: 'Podnoszenie' },
        { value: 'power_tools', label: 'Elektronarzędzia' },
        { value: 'hand_tools', label: 'Narzędzia ręczne' },
        { value: 'safety', label: 'Bezpieczeństwo' }
    ];

    useEffect(() => {
        fetchEquipment();
    }, [currentPage, searchTerm, selectedCategory]);

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedCategory && { category: selectedCategory })
            };

            const response = await equipmentAPI.getAll(params);
            const data = response.data;
            setEquipment(data.items || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error('Błąd pobierania sprzętu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEquipment = async (equipmentId) => {
        if (!confirm('Czy na pewno chcesz usunąć ten sprzęt?')) return;

        try {
            await equipmentAPI.delete(equipmentId);
            alert('Sprzęt został usunięty!');
            fetchEquipment();
        } catch (error) {
            alert('Błąd usuwania sprzętu');
        }
    };

    const formatPrice = (price) => {
        return price ? `${price} zł` : '-';
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'available': { label: 'Dostępny', color: 'bg-green-500/20 text-green-400' },
            'rented': { label: 'Wypożyczony', color: 'bg-blue-500/20 text-blue-400' },
            'maintenance': { label: 'Konserwacja', color: 'bg-yellow-500/20 text-yellow-400' },
            'damaged': { label: 'Uszkodzony', color: 'bg-red-500/20 text-red-400' },
            'retired': { label: 'Wycofany', color: 'bg-gray-500/20 text-gray-400' }
        };
        
        const statusInfo = statusMap[status] || statusMap['available'];
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header z przyciskiem dodawania */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h3 className="text-lg md:text-xl font-semibold text-white">Zarządzanie sprzętem</h3>
                    <p className="text-gray-400 text-sm">Dodawaj, edytuj i usuwaj sprzęt z wypożyczalni</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingEquipment(null);
                        setShowAddModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px]"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj nowy sprzęt
                </Button>
            </div>

            {/* Filtry */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                type="text"
                                placeholder="Szukaj sprzętu..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                            />
                        </div>
                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white min-h-[44px]"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista sprzętu */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Ładowanie...</p>
                        </div>
                    ) : equipment.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">Brak sprzętu do wyświetlenia</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Nazwa</th>
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Kategoria</th>
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Cena/dzień</th>
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Dostępność</th>
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipment.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                <td className="py-3 px-2">
                                                    <div>
                                                        <div className="font-medium text-white">{item.name}</div>
                                                        <div className="text-sm text-gray-400">
                                                            {item.brand} {item.model}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="text-gray-300 capitalize">
                                                        {categories.find(c => c.value === item.category)?.label || item.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-green-400 font-medium">
                                                    {formatPrice(item.daily_rate)}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="text-white text-sm">
                                                        {item.quantity_available}/{item.quantity_total}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            onClick={() => {
                                                                setEditingEquipment(item);
                                                                setShowAddModal(true);
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-gray-600 text-gray-300 min-h-[36px] min-w-[36px]"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteEquipment(item.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-600 text-red-400 hover:bg-red-600/20 min-h-[36px] min-w-[36px]"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {equipment.map((item) => (
                                    <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white">{item.name}</h4>
                                                <p className="text-sm text-gray-400">{item.brand} {item.model}</p>
                                            </div>
                                            {getStatusBadge(item.status)}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div>
                                                <span className="text-gray-400">Kategoria:</span>
                                                <p className="text-white capitalize">
                                                    {categories.find(c => c.value === item.category)?.label || item.category}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Cena/dzień:</span>
                                                <p className="text-green-400 font-medium">{formatPrice(item.daily_rate)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Dostępność:</span>
                                                <p className="text-white">{item.quantity_available}/{item.quantity_total}</p>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => {
                                                    setEditingEquipment(item);
                                                    setShowAddModal(true);
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-gray-600 text-gray-300 min-h-[44px]"
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edytuj
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteEquipment(item.id)}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-red-600 text-red-400 hover:bg-red-600/20 min-h-[44px]"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Usuń
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Paginacja */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-4 mt-6">
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        className="border-gray-600 text-gray-300 min-h-[44px]"
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
                                        className="border-gray-600 text-gray-300 min-h-[44px]"
                                    >
                                        Następna
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal dodawania/edycji */}
            {showAddModal && (
                <EquipmentModal
                    equipment={editingEquipment}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingEquipment(null);
                    }}
                    onSuccess={() => {
                        setShowAddModal(false);
                        setEditingEquipment(null);
                        fetchEquipment();
                    }}
                    categories={categories}
                />
            )}
        </div>
    );
};

// Modal do dodawania/edycji sprzętu
const EquipmentModal = ({ equipment, onClose, onSuccess, categories }) => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: '',
        brand: '',
        model: '',
        daily_rate: '',
        weekly_rate: '',
        monthly_rate: '',
        weight: '',
        dimensions: '',
        power_consumption: '',
        quantity_total: 1,
        requires_license: false,
        min_age: 18
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (equipment) {
            setForm({
                name: equipment.name || '',
                description: equipment.description || '',
                category: equipment.category || '',
                brand: equipment.brand || '',
                model: equipment.model || '',
                daily_rate: equipment.daily_rate || '',
                weekly_rate: equipment.weekly_rate || '',
                monthly_rate: equipment.monthly_rate || '',
                weight: equipment.weight || '',
                dimensions: equipment.dimensions || '',
                power_consumption: equipment.power_consumption || '',
                quantity_total: equipment.quantity_total || 1,
                requires_license: equipment.requires_license || false,
                min_age: equipment.min_age || 18
            });
        }
    }, [equipment]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Przygotowanie danych
            const submitData = {
                ...form,
                daily_rate: parseFloat(form.daily_rate) || 0,
                weekly_rate: form.weekly_rate ? parseFloat(form.weekly_rate) : null,
                monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
                weight: form.weight ? parseFloat(form.weight) : null,
                quantity_total: parseInt(form.quantity_total) || 1,
                min_age: parseInt(form.min_age) || 18
            };

            if (equipment) {
                await equipmentAPI.update(equipment.id, submitData);
            } else {
                await equipmentAPI.create(submitData);
            }

            alert(`Sprzęt ${equipment ? 'zaktualizowany' : 'dodany'} pomyślnie!`);
            onSuccess();
        } catch (error) {
            setError(error.message || 'Błąd podczas zapisywania');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-white">
                            {equipment ? 'Edytuj sprzęt' : 'Dodaj nowy sprzęt'}
                        </h3>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Podstawowe informacje */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nazwa sprzętu *
                                </label>
                                <Input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                    placeholder="np. Wiertarka udarowa"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Kategoria *
                                </label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white min-h-[44px]"
                                >
                                    <option value="">Wybierz kategorię</option>
                                    {categories.slice(1).map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Marka
                                </label>
                                <Input
                                    name="brand"
                                    value={form.brand}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                    placeholder="np. Bosch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Model
                                </label>
                                <Input
                                    name="model"
                                    value={form.model}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                    placeholder="np. GSB 13 RE"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Opis
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                                placeholder="Opis sprzętu..."
                            />
                        </div>

                        {/* Ceny */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cena dzienna (zł) *
                                </label>
                                <Input
                                    name="daily_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.daily_rate}
                                    onChange={handleChange}
                                    required
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cena tygodniowa (zł)
                                </label>
                                <Input
                                    name="weekly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.weekly_rate}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cena miesięczna (zł)
                                </label>
                                <Input
                                    name="monthly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.monthly_rate}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                />
                            </div>
                        </div>

                        {/* Szczegóły techniczne */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Waga (kg)
                                </label>
                                <Input
                                    name="weight"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={form.weight}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Wymiary
                                </label>
                                <Input
                                    name="dimensions"
                                    value={form.dimensions}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                    placeholder="np. 300x200x150mm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Pobór mocy
                                </label>
                                <Input
                                    name="power_consumption"
                                    value={form.power_consumption}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                    placeholder="np. 1200W"
                                />
                            </div>
                        </div>

                        {/* Ilość i wymagania */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Ilość sztuk *
                                </label>
                                <Input
                                    name="quantity_total"
                                    type="number"
                                    min="1"
                                    value={form.quantity_total}
                                    onChange={handleChange}
                                    required
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Minimalny wiek
                                </label>
                                <Input
                                    name="min_age"
                                    type="number"
                                    min="16"
                                    max="99"
                                    value={form.min_age}
                                    onChange={handleChange}
                                    className="bg-gray-700 border-gray-600 text-white min-h-[44px]"
                                />
                            </div>
                            <div className="flex items-center mt-8">
                                <input
                                    name="requires_license"
                                    type="checkbox"
                                    checked={form.requires_license}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-300">
                                    Wymaga uprawnień
                                </label>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 border-gray-600 text-gray-300 min-h-[44px]"
                            >
                                Anuluj
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                            >
                                {loading ? (
                                    <>
                                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                                        {equipment ? 'Aktualizuję...' : 'Dodaję...'}
                                    </>
                                ) : (
                                    <>
                                        {equipment ? 'Zaktualizuj' : 'Dodaj sprzęt'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Główny komponent AdminDashboard
const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState({
        totalRentals: 0,
        activeRentals: 0,
        totalUsers: 0,
        pendingPayments: 0,
        monthlyRevenue: 0,
        totalEquipment: 0
    });
    const [loading, setLoading] = useState(true);

    // Sprawdź czy użytkownik to admin
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            alert('Brak uprawnień administratora!');
            navigate('/');
            return;
        }
        fetchDashboardStats();
    }, [user, navigate]);

    // Sprawdź rozmiar ekranu
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Odśwież statystyki co 30 sekund
    useEffect(() => {
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Pobieranie statystyk dashboard
    const fetchDashboardStats = async () => {
        try {
            const [rentalsRes, usersRes, paymentsRes, equipmentRes] = await Promise.all([
                adminAPI.getRentals({ page: 1, size: 100 }),
                adminAPI.getUsers({ page: 1, size: 1 }),
                paymentsAPI.getAll({ page: 1, size: 100 }),
                equipmentAPI.getAll({ page: 1, size: 1 })
            ]);

            const rentalsData = rentalsRes.data;
            const usersData = usersRes.data;
            const paymentsData = paymentsRes.data;
            const equipmentData = equipmentRes.data;

            setStats({
                totalRentals: rentalsData.total || 0,
                activeRentals: rentalsData.items?.filter(r => r.status === 'active').length || 0,
                totalUsers: usersData.total || 0,
                pendingPayments: paymentsData.items?.filter(p => p.status === 'pending').length || 0,
                monthlyRevenue: 12500,
                totalEquipment: equipmentData.total || 0
            });
        } catch (error) {
            console.error('Błąd pobierania statystyk:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const menuItems = [
        { id: 'overview', label: 'Przegląd', icon: LayoutDashboard },
        { id: 'payments', label: 'Płatności', icon: CreditCard },
        { id: 'users', label: 'Użytkownicy', icon: Users },
        { id: 'rentals', label: 'Wypożyczenia', icon: Calendar },
        { id: 'equipment', label: 'Sprzęt', icon: Package },
        { id: 'reports', label: 'Raporty', icon: BarChart3 }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white">Ładowanie dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex relative">
            {/* Overlay dla mobile */}
            {isMobile && sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                bg-gray-800 border-r border-gray-700 transition-all duration-300 z-50
                ${isMobile ? 'fixed inset-y-0 left-0' : 'relative'}
                ${sidebarOpen ? 'w-64' : isMobile ? '-translate-x-full w-64' : 'w-16'}
            `}>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        {(sidebarOpen || !isMobile) && (
                            <div className="flex items-center space-x-2">
                                <Shield className="w-6 h-6 text-red-400" />
                                {sidebarOpen && <h1 className="text-lg md:text-xl font-bold text-white">Admin Panel</h1>}
                            </div>
                        )}
                        <Button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                <nav className="mt-4 md:mt-8">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors min-h-[44px] ${
                                    activeTab === item.id
                                        ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {(sidebarOpen || !isMobile) && <span className="text-sm md:text-base">{item.label}</span>}
                                {item.id === 'payments' && stats.pendingPayments > 0 && (sidebarOpen || !isMobile) && (
                                    <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                        {stats.pendingPayments}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className={`flex items-center space-x-3 p-3 bg-gray-700 rounded-lg ${
                        !sidebarOpen && !isMobile ? 'justify-center' : ''
                    }`}>
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        {(sidebarOpen || !isMobile) && (
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-gray-400 text-xs">Administrator</p>
                            </div>
                        )}
                    </div>
                    {(sidebarOpen || !isMobile) && (
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-gray-400 hover:text-white min-h-[44px]"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Wyloguj
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Header */}
                <div className="bg-gray-800 border-b border-gray-700 p-4 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* Mobile menu button */}
                            {isMobile && (
                                <Button
                                    onClick={() => setSidebarOpen(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px] md:hidden"
                                >
                                    <Menu className="w-5 h-5" />
                                </Button>
                            )}
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white">
                                    {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                                </h2>
                                <p className="text-gray-400 text-sm md:text-base hidden sm:block">
                                    Panel administracyjny wypożyczalni
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm md:text-base min-h-[44px] hidden sm:flex"
                        >
                            Powrót do strony głównej
                        </Button>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 min-h-[44px] min-w-[44px] sm:hidden"
                        >
                            ←
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab stats={stats} onTabChange={setActiveTab} />
                    )}
                    {activeTab === 'payments' && <PaymentsTab onStatsRefresh={fetchDashboardStats} />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'equipment' && <EquipmentTab />}
                    {['rentals', 'reports'].includes(activeTab) && (
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="p-8 md:p-12 text-center">
                                <div className="text-4xl md:text-6xl mb-4">🚧</div>
                                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                                    {menuItems.find(item => item.id === activeTab)?.label}
                                </h3>
                                <p className="text-gray-400 text-sm md:text-base">
                                    Ta sekcja jest w trakcie budowy. Wkrótce zostanie dodana!
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;