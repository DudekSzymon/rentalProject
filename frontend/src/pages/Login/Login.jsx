import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [accept, setAccept] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Inicjalizacja Google Sign-In
    useEffect(() => {
        // Ładowanie Google Identity Services
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: "94124651477-2h9lg8d2ammkn7402la0tm6do5850oaa.apps.googleusercontent.com",
                callback: handleGoogleLogin,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Renderowanie przycisku Google
            window.google.accounts.id.renderButton(
                document.getElementById("google-signin-button"),
                {
                    theme: "outline",
                    size: "large",
                    width: "100%",
                    text: "signin_with",
                    shape: "rectangular"
                }
            );
        }
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
            
            // Zapisz token w localStorage (opcjonalnie)
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
            
            // Zapisz token w localStorage (opcjonalnie)
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
        <div className="flex min-h-screen">
            {/* Lewa strona: tło z overlayem */}
            <div
                className="flex-1 bg-cover bg-center bg-black/70 relative"
                style={{ backgroundImage: "url('bg.png')" }}
            >
                <div className="absolute bottom-4 left-4 text-white text-lg italic">
                    "Życie jest jak budowa, bez dobrych narzędzi daleko nie zajdziesz."
                    <br />
                    <span className="text-sm">Paulo Coelho</span>
                </div>
                <div className="absolute top-6 left-6 text-white text-2xl font-bold">
                    * SpellBudex
                </div>
            </div>

            {/* Prawa strona: formularz */}
            <div className="flex-1 flex flex-col justify-center items-center bg-black text-white">
                <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold mb-1">Witamy w SpellBudex!</h2>
                    <p className="mb-4 text-sm text-gray-300">
                        Wprowadź swój adres email i hasło
                    </p>

                    {/* Google Sign-In Button */}
                    <div className="w-full">
                        <div id="google-signin-button" className="w-full"></div>
                    </div>

                    {/* Separator */}
                    <div className="flex items-center justify-center space-x-4 my-4">
                        <div className="flex-1 h-px bg-gray-600"></div>
                        <span className="text-gray-400 text-sm">lub</span>
                        <div className="flex-1 h-px bg-gray-600"></div>
                    </div>

                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="E-mail"
                        className="bg-transparent border border-gray-700 text-white"
                        disabled={loading}
                    />
                    <Input
                        label="Hasło"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Hasło"
                        className="bg-transparent border border-gray-700 text-white"
                        disabled={loading}
                    />
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={accept}
                            onChange={e => setAccept(e.target.checked)}
                            className="mt-1"
                            disabled={loading}
                        />
                        <label className="ml-2 text-sm">
                            (Wymagane) Akceptuję Warunki korzystania z usługi oraz{" "}
                            <a href="#" className="underline">Politykę prywatności</a>
                        </label>
                    </div>
                    
                    {error && (
                        <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded p-2">
                            {error}
                        </div>
                    )}
                    
                    <Button 
                        type="submit" 
                        className="w-full bg-white text-black font-bold hover:bg-gray-200 transition"
                        disabled={loading}
                    >
                        {loading ? "Logowanie..." : "Zaloguj się"}
                    </Button>
                    
                    <div className="flex flex-col gap-1 text-sm mt-2 text-gray-300">
                        <span>
                            Nie masz konta?{" "}
                            <Link to="/register" className="underline text-white">Utwórz konto</Link>
                        </span>
                        <span>
                            <a href="#" className="underline text-white">Kliknij tutaj</a> jeśli zapomniałeś hasła
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}