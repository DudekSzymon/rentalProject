import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
    Hammer, 
    Search, 
    Calendar, 
    CreditCard, 
    ShoppingCart, 
    Star, 
    MapPin, 
    Phone, 
    Mail,
    Menu,
    X,
    Drill,
    Wrench,
    HardHat,
    Truck
} from 'lucide-react';

export default function Landing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, logout: authLogout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        authLogout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Navigation */}
            <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Hammer className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">
                                SpellBudex
                            </h1>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#katalog" className="text-gray-300 hover:text-white transition-colors">
                                Katalog
                            </a>
                            <a href="#jak-dziala" className="text-gray-300 hover:text-white transition-colors">
                                Jak działa
                            </a>
                            <a href="#kontakt" className="text-gray-300 hover:text-white transition-colors">
                                Kontakt
                            </a>
                            {user?.isAdmin && (
                                <button 
                                    onClick={() => navigate("/admin")}
                                    className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
                                >
                                    🔧 Admin Panel
                                </button>
                            )}
                        </div>

                        {/* User Menu / Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        {user.auth_provider === 'google' && (
                                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                G
                                            </div>
                                        )}
                                        <span className="text-white text-sm">
                                            Witaj, {user.first_name || user.email}!
                                        </span>
                                    </div>
                                    <Button 
                                        onClick={handleLogout}
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-600 text-gray-300 hover:bg-white/10"
                                    >
                                        Wyloguj
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <Button 
                                        onClick={() => navigate("/login")}
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-600 text-gray-300 hover:bg-white/10"
                                    >
                                        Zaloguj się
                                    </Button>
                                    <Button 
                                        onClick={() => navigate("/register")}
                                        size="sm"
                                    >
                                        Zarejestruj się
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-300 hover:text-white p-2"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-800 py-4">
                            <div className="flex flex-col space-y-4">
                                <a href="#katalog" className="text-gray-300 hover:text-white transition-colors px-2">
                                    Katalog
                                </a>
                                <a href="#jak-dziala" className="text-gray-300 hover:text-white transition-colors px-2">
                                    Jak działa
                                </a>
                                <a href="#kontakt" className="text-gray-300 hover:text-white transition-colors px-2">
                                    Kontakt
                                </a>
                                {user?.isAdmin && (
                                    <button 
                                        onClick={() => navigate("/admin")}
                                        className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium px-2 text-left"
                                    >
                                        🔧 Admin Panel
                                    </button>
                                )}
                                <div className="border-t border-gray-800 pt-4">
                                    {user ? (
                                        <div className="flex flex-col space-y-2 px-2">
                                            <div className="flex items-center space-x-2">
                                                {user.auth_provider === 'google' && (
                                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                        G
                                                    </div>
                                                )}
                                                <span className="text-white text-sm">
                                                    Witaj, {user.first_name || user.email}!
                                                </span>
                                            </div>
                                            <Button 
                                                onClick={handleLogout}
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 text-gray-300 hover:bg-white/10 w-full"
                                            >
                                                Wyloguj
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col space-y-2 px-2">
                                            <Button 
                                                onClick={() => navigate("/login")}
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 text-gray-300 hover:bg-white/10 w-full"
                                            >
                                                Zaloguj się
                                            </Button>
                                            <Button 
                                                onClick={() => navigate("/register")}
                                                size="sm"
                                                className="w-full"
                                            >
                                                Zarejestruj się
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
                
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

                {/* Content */}
                <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                        Wypożycz profesjonalne
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
                            narzędzia budowlane
                        </span>
                    </h1>
                    
                    <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Szybko, wygodnie i bezpiecznie. Thousands profesjonalnych narzędzi 
                        dostępnych online z dostawą na budowę.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <Button 
                            size="lg"
                            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
                            onClick={() => navigate("/equipment")}
                        >
                            <Search className="w-5 h-5 mr-2" />
                            Przeglądaj katalog
                        </Button>
                        <Button 
                            variant="outline"
                            size="lg" 
                            className="w-full sm:w-auto px-8 py-4 text-lg border-gray-600 text-gray-300 hover:bg-white/10"
                            onClick={() => user ? navigate("/equipment") : navigate("/login")}
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            Zarezerwuj teraz
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">500+</div>
                            <div className="text-xs sm:text-sm text-gray-300">Narzędzi</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">24h</div>
                            <div className="text-xs sm:text-sm text-gray-300">Dostawa</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">1000+</div>
                            <div className="text-xs sm:text-sm text-gray-300">Klientów</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">4.9</div>
                            <div className="text-xs sm:text-sm text-gray-300">Ocena</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works Section */}
            <section id="jak-dziala" className="py-16 sm:py-24 bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Jak to działa?
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                            Wypożyczenie narzędzi nigdy nie było tak proste
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group">
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Search className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">1. Wybierz narzędzie</h3>
                            <p className="text-gray-300">
                                Przeglądaj nasz szeroki katalog profesjonalnych narzędzi
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">2. Wybierz termin</h3>
                            <p className="text-gray-300">
                                Ustaw datę rozpoczęcia i zakończenia wypożyczenia
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">3. Zapłać online</h3>
                            <p className="text-gray-300">
                                Bezpieczna płatność kartą lub przelewem
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Truck className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">4. Odbierz lub dostawa</h3>
                            <p className="text-gray-300">
                                Odbierz osobiście lub zamów dostawę na budowę
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section id="katalog" className="py-16 sm:py-24 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Popularne kategorie
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                            Znajdź narzędzia których potrzebujesz
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div 
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                            onClick={() => navigate("/equipment?category=drilling")}
                        >
                            <div className="text-center">
                                <Drill className="w-12 h-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-2">Wiertarki</h3>
                                <p className="text-gray-400 text-sm">50+ modeli</p>
                            </div>
                        </div>

                        <div 
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                            onClick={() => navigate("/equipment?category=hand_tools")}
                        >
                            <div className="text-center">
                                <Wrench className="w-12 h-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-2">Narzędzia ręczne</h3>
                                <p className="text-gray-400 text-sm">200+ sztuk</p>
                            </div>
                        </div>

                        <div 
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                            onClick={() => navigate("/equipment?category=safety")}
                        >
                            <div className="text-center">
                                <HardHat className="w-12 h-12 text-yellow-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-2">Bezpieczeństwo</h3>
                                <p className="text-gray-400 text-sm">100+ produktów</p>
                            </div>
                        </div>

                        <div 
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                            onClick={() => navigate("/equipment?category=power_tools")}
                        >
                            <div className="text-center">
                                <Hammer className="w-12 h-12 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-2">Elektronarzędzia</h3>
                                <p className="text-gray-400 text-sm">150+ modeli</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="kontakt" className="py-16 sm:py-24 bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Skontaktuj się z nami
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                            Masz pytania? Chętnie pomożemy!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MapPin className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Adres</h3>
                            <p className="text-gray-300">
                                ul. Budowlana 123<br />
                                00-001 Warszawa
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Phone className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Telefon</h3>
                            <p className="text-gray-300">
                                +48 123 456 789<br />
                                Pon-Pt: 8:00-18:00
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Email</h3>
                            <p className="text-gray-300">
                                kontakt@spellbudex.pl<br />
                                pomoc@spellbudex.pl
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Hammer className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">
                                SpellBudex
                            </h1>
                        </div>
                        
                        <div className="text-center md:text-right">
                            <p className="text-gray-400 text-sm">
                                © 2024 SpellBudex. Wszelkie prawa zastrzeżone.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-end space-x-6 mt-2">
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Polityka prywatności
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Regulamin
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Kontakt
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}