import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate, Link } from "react-router-dom";

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
    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.accept) {
            setError("Musisz zaakceptowac warunki.");
            return;
        }
        if (form.password !== form.confirm) {
            setError("Hasla nie sa takie same.");
            return;
        }
        try {
            const res = await fetch("http://localhost:8000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: form.firstName,
                    last_name: form.lastName,
                    email: form.email,
                    password: form.password,
                }),
            });
            if (!res.ok) throw new Error("Rejestracja nie powiodla sie");
            navigate("/");
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
                    <h2 className="text-2xl font-bold mb-1">Zarejestruj sie w SpellBudex!</h2>
                    <div className="flex space-x-2">
                        <Input
                            label="Imie"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                            placeholder="Imie"
                            className="bg-transparent border border-gray-700 text-white"
                        />
                        <Input
                            label="Nazwisko"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                            placeholder="Nazwisko"
                            className="bg-transparent border border-gray-700 text-white"
                        />
                    </div>
                    <Input
                        label="E-mail"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="E-mail"
                        className="bg-transparent border border-gray-700 text-white"
                    />
                    <Input
                        label="Haslo"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Haslo"
                        className="bg-transparent border border-gray-700 text-white"
                    />
                    <Input
                        label="Potwierdz haslo"
                        type="password"
                        name="confirm"
                        value={form.confirm}
                        onChange={handleChange}
                        required
                        placeholder="Potwierdz haslo"
                        className="bg-transparent border border-gray-700 text-white"
                    />
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            name="accept"
                            checked={form.accept}
                            onChange={handleChange}
                            className="mt-1"
                        />
                        <label className="ml-2 text-sm">
                            (Wymagane) Akceptuje Warunki korzystania z uslugi oraz{" "}
                            <a href="#" className="underline">Polityke prywatnosci</a>
                        </label>
                    </div>
                    {error && <div className="text-red-500">{error}</div>}
                    <Button type="submit" className="w-full bg-white text-black font-bold hover:bg-gray-200 transition">
                        Zarejestruj sie
                    </Button>
                    <div className="flex flex-col gap-1 text-sm mt-2 text-gray-300">
                        <span>
                            Masz juz konto?{" "}
                            <Link to="/" className="underline text-white">Zaloguj sie</Link>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}
