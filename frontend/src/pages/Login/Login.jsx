import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { Hammer, Quote } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [accept, setAccept] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Inicjalizacja Google Sign-In
    useEffect(() => {
        const initializeGoogle = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: "94124651477-2h9lg8d2ammkn7402la0tm6do5850oaa.apps.googleusercontent.com",
                    callback: handleGoogleLogin,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                // Renderowanie przycisku Google z niestandardowym stylem
                const googleButton = document.getElementById("google-signin-button");
                if (googleButton) {
                    window.google.accounts.id.renderButton(googleButton, {
                        theme: "filled_black",
                        size: "large",
                        width: "100%",
                        text: "signin_with",
                        shape: "rectangular",
                        logo_alignment: "left"
                    });
                }
            } else {
                // Retry if Google script hasn't loaded yet
                setTimeout(initializeGoogle, 100);
            }
        };

        initializeGoogle();
    }, []);

    // Obsługa logowania przez Google
    const handleGoogleLogin = async (response) => {
        setLoading(true);
        setError("");
        
        try {
            const res = await fetch("http://localhost:8000/api/auth/google", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    token: response.credential 
                }),
                credentials: "include",
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Błąd logowania przez Google");
            }

            const data = await res.json();
            
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
            }

            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Standardowe logowanie emailem/hasłem
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!accept) {
            setError("Musisz zaakceptować warunki.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Błędne dane logowania");
            }

            const data = await res.json();
            
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
            }

            navigate("/landing");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Hero Section - ukryte na mobile, widoczne na desktop */}
            <div className="hidden lg:flex relative flex-1 min-h-screen overflow-hidden">
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
                <div className="relative z-10 flex flex-col justify-between h-full p-12">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Hammer className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            SpellBudex
                        </h1>
                    </div>

                    {/* Quote */}
                    <div className="max-w-lg">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                            <Quote className="w-8 h-8 text-white/60 mb-4" />
                            <blockquote className="text-white text-xl font-medium leading-relaxed mb-4">
                                "Życie jest jak budowa, bez dobrych narzędzi daleko nie zajdziesz."
                            </blockquote>
                            <cite className="text-white/80 text-sm">
                                — Paulo Coelho
                            </cite>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Form Section - pełna szerokość na mobile */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-12 bg-gray-900 min-h-screen lg:min-h-auto">
                {/* Mobile Logo - widoczne tylko na mobile */}
                <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Hammer className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        SpellBudex
                    </h1>
                </div>

                <div className="w-full max-w-sm mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                            Witamy ponownie!
                        </h2>
                        <p className="text-sm sm:text-base text-gray-400">
                            Wprowadź swój adres email i hasło
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Google Sign-In */}
                        <div className="space-y-4">
                            <div 
                                id="google-signin-button" 
                                className="w-full [&>div]:!w-full [&>div>div]:!w-full"
                                style={{ 
                                    opacity: loading ? 0.7 : 1, 
                                    pointerEvents: loading ? 'none' : 'auto'
                                }}
                            ></div>
                            
                            {/* Separator */}
                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-600"></div>
                                </div>
                                <div className="relative bg-gray-900 px-4">
                                    <span className="text-xs sm:text-sm text-gray-400">lub kontynuuj z emailem</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1">
                            <Input
                                label="Adres email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="twoj@email.com"
                                disabled={loading}
                                className="text-base sm:text-sm h-12"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1">
                            <Input
                                label="Hasło"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Wprowadź hasło"
                                disabled={loading}
                                className="text-base sm:text-sm h-12"
                            />
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5 mt-0.5">
                                <input
                                    id="accept-terms"
                                    type="checkbox"
                                    checked={accept}
                                    onChange={(e) => setAccept(e.target.checked)}
                                    disabled={loading}
                                    className="w-4 h-4 text-white bg-white/10 border border-white/20 rounded focus:ring-white/30 focus:ring-2"
                                />
                            </div>
                            <label htmlFor="accept-terms" className="text-xs sm:text-sm text-gray-300 leading-5">
                                (Wymagane) Akceptuję{" "}
                                <a href="#" className="text-white underline hover:no-underline transition-all">
                                    Warunki korzystania z usługi
                                </a>{" "}
                                oraz{" "}
                                <a href="#" className="text-white underline hover:no-underline transition-all">
                                    Politykę prywatności
                                </a>
                            </label>
                        </div>
                        
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
                                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                            </div>
                        )}
                        
                        {/* Submit Button */}
                        <Button 
                            type="submit" 
                            className="w-full h-12 text-base sm:text-sm font-medium"
                            disabled={loading}
                            loading={loading}
                        >
                            {loading ? "Logowanie..." : "Zaloguj się"}
                        </Button>
                        
                        {/* Footer Links */}
                        <div className="space-y-4 text-center pt-2">
                            <p className="text-gray-400 text-sm">
                                <a 
                                    href="#" 
                                    className="text-white hover:underline transition-all font-medium"
                                >
                                    Zapomniałeś hasła?
                                </a>
                            </p>
                            <p className="text-gray-400 text-sm">
                                Nie masz konta?{" "}
                                <Link 
                                    to="/register" 
                                    className="text-white font-medium hover:underline transition-all"
                                >
                                    Utwórz konto
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}