import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Hammer, Quote } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Inicjalizacja Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            "94124651477-2h9lg8d2ammkn7402la0tm6do5850oaa.apps.googleusercontent.com",
          callback: handleGoogleLogin, //Tutaj Google wyśle token //Ta funckja zostanie WYWOŁANA PRZEZ google
          auto_select: false,
          cancel_on_tap_outside: true,
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
            logo_alignment: "left",
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
  //GOOGLE NIE UŻYWA URL redirect! Token jest przekazywany bezpośrednio do funkcji bacllback w JavaScript object.
  //Ta funckja będzie wywołana przez GOOGLE SDK
  const handleGoogleLogin = async (response) => {
    //Przekazuje token dalej
    //Google przekazuje token w respone.credential
    //response.credential to już gotowy JWT Token!
    setLoading(true);
    setError("");

    try {
      const result = await googleLogin(response.credential);

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error);
      }
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
      const result = await login({ email, password });

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "Wystąpił błąd podczas logowania");
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
            <h1 className="text-3xl font-bold text-gray-900">SpellBudex</h1>
          </div>

          {/* Quote */}
          <div className="max-w-lg">
            <div className="bg-white shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Quote className="w-6 h-6 text-blue-500" />
              </div>
              <blockquote className="text-gray-900 text-xl font-medium leading-relaxed mb-4">
                "Życie jest jak budowa, bez dobrych narzędzi daleko nie
                zajdziesz."
              </blockquote>
              <cite className="text-gray-600 text-sm">— Paulo Coelho</cite>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Section - pełna szerokość na mobile */}
      <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-12 bg-white min-h-screen lg:min-h-auto">
        {/* Mobile Logo - widoczne tylko na mobile */}
        <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SpellBudex</h1>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Witamy ponownie!
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
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
                  pointerEvents: loading ? "none" : "auto",
                }}
              ></div>

              {/* Separator */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative bg-white px-4">
                  <span className="text-xs sm:text-sm text-gray-500">
                    lub kontynuuj z emailem
                  </span>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Adres email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Wprowadź hasło"
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
                  checked={accept}
                  onChange={(e) => setAccept(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <label
                htmlFor="accept-terms"
                className="text-xs sm:text-sm text-gray-600 leading-5"
              >
                (Wymagane) Akceptuję{" "}
                <a
                  href="#"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Warunki korzystania z usługi
                </a>{" "}
                oraz{" "}
                <a
                  href="#"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
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
              {loading ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
