import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../utils/api";
import { Hammer, Quote } from 'lucide-react';

export default function Register() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm: "",
        accept: false
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!form.accept) {
            setError("Musisz zaakceptować warunki.");
            setLoading(false);
            return;
        }
        if (form.password !== form.confirm) {
            setError("Hasła nie są takie same.");
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.register({
                first_name: form.firstName,
                last_name: form.lastName,
                email: form.email,
                password: form.password,
            });
            
            const data = response.data;
            
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            navigate("/");
        } catch (error) {
            setError(error.message || "Rejestracja nie powiodła się");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
            {/* Hero Section - ukryte na mobile, widoczne na desktop */}
            <div className="hidden lg:flex relative flex-1 min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Subtle Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-12">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                            <Hammer className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            SpellBudex
                        </h1>
                    </div>

                    {/* Quote */}
                    <div className="max-w-lg">
                        <div className="bg-white shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow duration-200">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                                <Quote className="w-6 h-6 text-green-500" />
                            </div>
                            <blockquote className="text-gray-900 text-xl font-medium leading-relaxed mb-4">
                                "Każde wielkie dzieło zaczyna się od pierwszego kroku."
                            </blockquote>
                            <cite className="text-gray-600 text-sm">
                                — Lao Tzu
                            </cite>
                        </div>
                    </div>
                </div>
            </div>

            {/* Register Form Section - pełna szerokość na mobile */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-12 bg-white min-h-screen lg:min-h-auto">
                {/* Mobile Logo - widoczne tylko na mobile */}
                <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Hammer className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        SpellBudex
                    </h1>
                </div>

                <div className="w-full max-w-sm mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Utwórz konto
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600">
                            Dołącz do SpellBudex już dziś
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">
                                    Imię
                                </label>
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Imię"
                                    disabled={loading}
                                    className="w-full h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">
                                    Nazwisko
                                </label>
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nazwisko"
                                    disabled={loading}
                                    className="w-full h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Adres email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="twoj@email.com"
                                disabled={loading}
                                className="w-full h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Hasło
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="Wprowadź hasło"
                                disabled={loading}
                                className="w-full h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Potwierdź hasło
                            </label>
                            <input
                                type="password"
                                name="confirm"
                                value={form.confirm}
                                onChange={handleChange}
                                required
                                placeholder="Potwierdź hasło"
                                disabled={loading}
                                className="w-full h-12 px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5 mt-0.5">
                                <input
                                    id="accept-terms"
                                    type="checkbox"
                                    name="accept"
                                    checked={form.accept}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                            </div>
                            <label htmlFor="accept-terms" className="text-xs sm:text-sm text-gray-600 leading-5">
                                (Wymagane) Akceptuję{" "}
                                <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">
                                    Warunki korzystania z usługi
                                </a>{" "}
                                oraz{" "}
                                <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">
                                    Politykę prywatności
                                </a>
                            </label>
                        </div>
                        
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                                <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                            </div>
                        )}
                        
                        {/* Submit Button */}
                        <Button 
                            type="submit" 
                            className="w-full h-12 text-base sm:text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? "Rejestracja..." : "Zarejestruj się"}
                        </Button>
                        
                        {/* Footer Links */}
                        <div className="space-y-4 text-center pt-2">
                            <p className="text-gray-600 text-sm">
                                Masz już konto?{" "}
                                <Link 
                                    to="/login" 
                                    className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
                                >
                                    Zaloguj się
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}