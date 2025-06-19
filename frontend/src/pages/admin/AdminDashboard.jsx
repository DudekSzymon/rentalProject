import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

            <Card className="bg-gray-800 border-gray-700 sm:col-span-2 lg:col-span-1">
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
                        variant="outline"
                        className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2 border-gray-600 text-sm md:text-base"
                    >
                        <Package className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-center leading-tight">Dodaj sprzęt</span>
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
const PaymentsTab = ({ onStatsRefresh }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/payments?status=pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPayments(data.items || []);
        } catch (error) {
            console.error('Błąd pobierania płatności:', error);
        } finally {
            setLoading(false);
        }
    };

    const approvePayment = async (paymentId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/payments/offline-approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    notes: 'Zatwierdzone przez administratora'
                })
            });

            if (response.ok) {
                alert('Płatność zatwierdzona pomyślnie!');
                fetchPendingPayments();
                if (onStatsRefresh) {
                    onStatsRefresh();
                }
            }
        } catch (error) {
            alert('Błąd zatwierdzania płatności');
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
                                    </div>
                                    <Button
                                        onClick={() => approvePayment(payment.id)}
                                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px]"
                                        size="sm"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Zatwierdź
                                    </Button>
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
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUsers(data.items || []);
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserBlock = async (userId, isBlocked) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    is_blocked: !isBlocked
                })
            });

            if (response.ok) {
                alert(`Użytkownik ${!isBlocked ? 'zablokowany' : 'odblokowany'} pomyślnie!`);
                fetchUsers();
            }
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

// Główny komponent AdminDashboard
const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false); // Domyślnie zamknięty na mobile
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState({
        totalRentals: 0,
        activeRentals: 0,
        totalUsers: 0,
        pendingPayments: 0,
        monthlyRevenue: 0,
        availableEquipment: 0
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
            const token = localStorage.getItem('access_token');
            
            const [rentalsRes, usersRes, paymentsRes] = await Promise.all([
                fetch('http://localhost:8000/api/admin/rentals?page=1&size=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:8000/api/admin/users?page=1&size=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:8000/api/payments?page=1&size=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (rentalsRes.ok && usersRes.ok && paymentsRes.ok) {
                const rentalsData = await rentalsRes.json();
                const usersData = await usersRes.json();
                const paymentsData = await paymentsRes.json();

                setStats({
                    totalRentals: rentalsData.total || 0,
                    activeRentals: rentalsData.items?.filter(r => r.status === 'active').length || 0,
                    totalUsers: usersData.total || 0,
                    pendingPayments: paymentsData.items?.filter(p => p.status === 'pending').length || 0,
                    monthlyRevenue: 12500,
                    availableEquipment: 45
                });
            }
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
                    {['rentals', 'equipment', 'reports'].includes(activeTab) && (
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