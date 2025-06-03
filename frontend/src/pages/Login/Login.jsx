import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [accept, setAccept] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!accept) {
            setError("Musisz zaakceptowac warunki.");
            return;
        }
        try {
            const res = await fetch("http://localhost:8000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Bledne dane logowania");
            navigate("/landing");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Lewa strona: tlo z overlayem */}
            <div
                className="flex-1 bg-cover bg-center bg-black/70 relative"
                style={{ backgroundImage: "url('bg.png')" }}
            >
                <div className="absolute bottom-4 left-4 text-white text-lg italic">
                    "Zycie jest jak budowa, bez dobrych narzedzi daleko nie zajdziesz."
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
                        Wprowadz swoj adres email i haslo
                    </p>
                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="E-mail"
                        className="bg-transparent border border-gray-700 text-white"
                    />
                    <Input
                        label="Haslo"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Haslo"
                        className="bg-transparent border border-gray-700 text-white"
                    />
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={accept}
                            onChange={e => setAccept(e.target.checked)}
                            className="mt-1"
                        />
                        <label className="ml-2 text-sm">
                            (Wymagane) Akceptuje Warunki korzystania z uslugi oraz{" "}
                            <a href="#" className="underline">Polityke prywatnosci</a>
                        </label>
                    </div>
                    {error && <div className="text-red-500">{error}</div>}
                    <Button type="submit" className="w-full bg-white text-black font-bold hover:bg-gray-200 transition">
                        Zaloguj sie
                    </Button>
                    <div className="flex flex-col gap-1 text-sm mt-2 text-gray-300">
                        <span>
                            Nie masz konta?{" "}
                            <Link to="/register" className="underline text-white">Utworz konto</Link>
                        </span>
                        <span>
                            <a href="#" className="underline text-white">Kliknij tutaj</a> jesli zapomniales hasla
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}
