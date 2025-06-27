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
    <div className="space-y-6 md:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="bg-white shadow-sm border-0 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Aktywne wypożyczenia
                    </CardTitle>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.rentals?.active || 0}</div>
                    <p className="text-sm text-gray-500">
                        z {stats.rentals?.total || 0} wszystkich
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Oczekujące płatności
                    </CardTitle>
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.payments?.pending || 0}</div>
                    <p className="text-sm text-gray-500">
                        Wymagają zatwierdzenia
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Zarejestrowani użytkownicy
                    </CardTitle>
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.users?.total || 0}</div>
                    <p className="text-sm text-gray-500">
                        +{stats.users?.new_this_month || 0} w tym miesiącu
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Sprzęt w bazie
                    </CardTitle>
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.equipment?.total || 0}</div>
                    <p className="text-sm text-gray-500">
                        {stats.equipment?.utilization_rate || 0}% wykorzystania
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
            <CardHeader className="pb-6">
                <CardTitle className="text-gray-900 text-xl font-semibold">Szybkie akcje</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Button 
                        onClick={() => onTabChange('payments')}
                        className="h-20 flex flex-col items-center justify-center space-y-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200 relative"
                    >
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium">Zatwierdź płatności</span>
                        {(stats.payments?.pending || 0) > 0 && (
                            <span className="absolute top-2 right-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                {stats.payments.pending}
                            </span>
                        )}
                    </Button>
                    <Button 
                        onClick={() => onTabChange('users')}
                        className="h-20 flex flex-col items-center justify-center space-y-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">Zarządzaj użytkownikami</span>
                    </Button>
                    <Button 
                        onClick={() => onTabChange('reports')}
                        className="h-20 flex flex-col items-center justify-center space-y-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Raporty przychodów</span>
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
            const response = await adminAPI.getPendingPayments({ page: 1, size: 50 });
            const data = response.data;
            setPayments(data.items || []);
        } catch (error) {
            console.error('Błąd pobierania płatności:', error);
            alert('Błąd pobierania płatności: ' + (error.message || 'Nieznany błąd'));
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

    return (
        <div className="space-y-6">
            <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-6">
                    <CardTitle className="text-gray-900 text-xl font-semibold">Oczekujące płatności offline</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Ładowanie...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-gray-600">Brak oczekujących płatności!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div key={payment.id} className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-100 transition-colors duration-200">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Płatność #{payment.id}
                                        </h4>
                                        <p className="text-gray-600 text-sm mb-1">
                                            {payment.user_email} • {payment.amount} zł
                                        </p>
                                        <p className="text-gray-500 text-sm mb-1">
                                            {payment.rental_equipment_name || 'Brak sprzętu'}
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                                                {payment.status}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                                {payment.payment_method}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                                        <Button
                                            onClick={() => approvePayment(payment.id)}
                                            className="bg-green-500 hover:bg-green-600 text-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200 flex-1 sm:flex-none h-11"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Zatwierdź
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
    }, [searchTerm]);

    const fetchUsers = async () => {
        try {
            const params = {
                page: 1,
                size: 50,
                ...(searchTerm && { search: searchTerm })
            };
            const response = await adminAPI.getUsers(params);
            const data = response.data;
            setUsers(data || []);
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
        } finally {
            setLoading(false);
        }
    };

    const blockUser = async (userId) => {
        if (!confirm('Czy na pewno chcesz zablokować tego użytkownika?')) return;
        
        try {
            await adminAPI.blockUser(userId);
            alert('Użytkownik zablokowany pomyślnie!');
            fetchUsers();
        } catch (error) {
            alert('Błąd blokowania użytkownika: ' + (error.message || 'Nieznany błąd'));
        }
    };

    const unblockUser = async (userId) => {
        if (!confirm('Czy na pewno chcesz odblokować tego użytkownika?')) return;
        
        try {
            await adminAPI.unblockUser(userId);
            alert('Użytkownik odblokowany pomyślnie!');
            fetchUsers();
        } catch (error) {
            alert('Błąd odblokowania użytkownika: ' + (error.message || 'Nieznany błąd'));
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-6">
                    <CardTitle className="text-gray-900 text-xl font-semibold">Zarządzanie użytkownikami</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <Input
                            type="text"
                            placeholder="Szukaj użytkowników..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-50 border-0 rounded-xl h-12 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Ładowanie...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-100 transition-colors duration-200">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold">
                                                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                                {user.first_name} {user.last_name}
                                            </h4>
                                            <p className="text-gray-600 text-sm truncate">{user.email}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                    user.role === 'admin' 
                                                        ? 'bg-red-50 text-red-700' 
                                                        : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                    user.is_blocked 
                                                        ? 'bg-red-50 text-red-700' 
                                                        : 'bg-green-50 text-green-700'
                                                }`}>
                                                    {user.is_blocked ? 'Zablokowany' : 'Aktywny'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                                        {user.role !== 'admin' && (
                                            user.is_blocked ? (
                                                <Button
                                                    onClick={() => unblockUser(user.id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto h-11"
                                                >
                                                    <UserCheck className="w-4 h-4 mr-2" />
                                                    Odblokuj
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => blockUser(user.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto h-11"
                                                >
                                                    <UserX className="w-4 h-4 mr-2" />
                                                    Zablokuj
                                                </Button>
                                            )
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

// Komponent raportów przychodów
const ReportsTab = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    }, []);

    const fetchReport = async () => {
        if (!startDate || !endDate) {
            alert('Podaj daty początkową i końcową');
            return;
        }

        setLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate + 'T00:00:00';
            if (endDate) params.end_date = endDate + 'T23:59:59';

            const response = await adminAPI.getRevenueReport(params);
            setReport(response.data);
        } catch (error) {
            console.error('Błąd pobierania raportu:', error);
            alert('Błąd pobierania raportu: ' + (error.message || 'Nieznany błąd'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filtry dat */}
            <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-6">
                    <CardTitle className="text-gray-900 text-xl font-semibold">Raport przychodów</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data od
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-gray-50 border-0 rounded-xl h-12 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data do
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-gray-50 border-0 rounded-xl h-12 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <Button
                                onClick={fetchReport}
                                disabled={loading}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200 h-12"
                            >
                                {loading ? (
                                    <>
                                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                                        Generowanie...
                                    </>
                                ) : (
                                    'Wygeneruj raport'
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wyniki raportu */}
            {report && (
                <>
                    {/* Podsumowanie */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-white shadow-sm border-0 rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                        {report.summary?.total_revenue?.toFixed(2) || 0} zł
                                    </div>
                                    <p className="text-gray-600 text-sm">Łączne przychody</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white shadow-sm border-0 rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                        {report.summary?.total_payments || 0}
                                    </div>
                                    <p className="text-gray-600 text-sm">Liczba płatności</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white shadow-sm border-0 rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">
                                        {report.summary?.average_payment?.toFixed(2) || 0} zł
                                    </div>
                                    <p className="text-gray-600 text-sm">Średnia płatność</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Metody płatności */}
                    {report.payment_methods && report.payment_methods.length > 0 && (
                        <Card className="bg-white shadow-sm border-0 rounded-2xl">
                            <CardHeader className="pb-6">
                                <CardTitle className="text-gray-900 text-lg font-semibold">Metody płatności</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {report.payment_methods.map((method, index) => (
                                        <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{method.method}</h4>
                                                <p className="text-sm text-gray-600">{method.count} płatności</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">{method.amount?.toFixed(2)} zł</div>
                                                <div className="text-sm text-gray-500">{method.percentage}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Top sprzęt */}
                    {report.top_equipment && report.top_equipment.length > 0 && (
                        <Card className="bg-white shadow-sm border-0 rounded-2xl">
                            <CardHeader className="pb-6">
                                <CardTitle className="text-gray-900 text-lg font-semibold">Najpopularniejszy sprzęt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {report.top_equipment.map((equipment, index) => (
                                        <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{equipment.name}</h4>
                                                    <p className="text-sm text-gray-600">{equipment.rental_count} wypożyczeń</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-green-600">
                                                {equipment.revenue?.toFixed(2) || 0} zł
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
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
    const [isNarrow, setIsNarrow] = useState(false);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            alert('Brak uprawnień administratora!');
            navigate('/');
            return;
        }
        fetchDashboardStats();
    }, [user, navigate]);

    useEffect(() => {
        const checkScreenSize = () => {
            const isMobileSize = window.innerWidth < 768;
            const isNarrowSize = window.innerWidth < 1200;
            setIsMobile(isMobileSize);
            setIsNarrow(isNarrowSize);
            
            if (isMobileSize) {
                setSidebarOpen(false);
            } else if (isNarrowSize) {
                setSidebarOpen(false); // Auto-chowaj sidebar na średnich ekranach
            } else {
                setSidebarOpen(true);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await adminAPI.getDashboard();
            setStats(response.data);
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
        if (isMobile || isNarrow) {
            setSidebarOpen(false);
        }
    };

    const menuItems = [
        { id: 'overview', label: 'Przegląd', icon: LayoutDashboard },
        { id: 'payments', label: 'Płatności', icon: CreditCard },
        { id: 'users', label: 'Użytkownicy', icon: Users },
        { id: 'reports', label: 'Raporty', icon: BarChart3 }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-900">Ładowanie dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex relative">
            {/* Overlay dla mobile i narrow screens */}
            {(isMobile || isNarrow) && sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                bg-white shadow-sm transition-all duration-300 z-50
                ${(isMobile || isNarrow) ? 'fixed inset-y-0 left-0' : 'relative'}
                ${sidebarOpen ? 'w-64' : (isMobile || isNarrow) ? '-translate-x-full w-64' : 'w-16'}
            `}>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        {(sidebarOpen || (!isMobile && !isNarrow)) && (
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                                {sidebarOpen && <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>}
                            </div>
                        )}
                        <Button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 border-0 rounded-lg p-2"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                <nav className="mt-8 px-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className={`w-full flex items-center space-x-3 px-3 py-3 text-left transition-all duration-200 rounded-xl mb-1 ${
                                    activeTab === item.id
                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {(sidebarOpen || (!isMobile && !isNarrow)) && <span className="text-sm">{item.label}</span>}
                                {item.id === 'payments' && (stats.payments?.pending || 0) > 0 && (sidebarOpen || (!isMobile && !isNarrow)) && (
                                    <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                        {stats.payments.pending}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-2 right-2">
                    <div className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-xl ${
                        !sidebarOpen && !isMobile && !isNarrow ? 'justify-center' : ''
                    }`}>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        {(sidebarOpen || (!isMobile && !isNarrow)) && (
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 text-sm font-medium truncate">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-gray-500 text-xs">Administrator</p>
                            </div>
                        )}
                    </div>
                    {(sidebarOpen || (!isMobile && !isNarrow)) && (
                        <Button
                            onClick={handleLogout}
                            className="w-full mt-3 text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 border-0 rounded-xl h-10"
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
                <div className="bg-white shadow-sm p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* Menu button for mobile and narrow screens */}
                            {(isMobile || isNarrow) && (
                                <Button
                                    onClick={() => setSidebarOpen(true)}
                                    className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 border-0 rounded-lg p-2"
                                >
                                    <Menu className="w-5 h-5" />
                                </Button>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                                </h2>
                                <p className="text-gray-600 text-sm hidden sm:block">
                                    Panel administracyjny wypożyczalni
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hidden sm:flex"
                        >
                            Powrót do strony głównej
                        </Button>
                        <Button
                            onClick={() => navigate('/')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl p-2 sm:hidden"
                        >
                            ←
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab stats={stats} onTabChange={setActiveTab} />
                    )}
                    {activeTab === 'payments' && <PaymentsTab onStatsRefresh={fetchDashboardStats} />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'reports' && <ReportsTab />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;