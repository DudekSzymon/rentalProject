import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { equipmentAPI } from "../../utils/api";
import {
  Search,
  Filter,
  Calendar,
  Euro,
  Hammer,
  ArrowLeft,
  Drill,
  Wrench,
  HardHat,
  Zap,
} from "lucide-react";

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const categories = [
    {
      value: "",
      label: "Wszystkie",
      icon: Hammer,
      gradient: "from-blue-500 to-purple-500",
    },
    {
      value: "drilling",
      label: "Wiertarki",
      icon: Drill,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      value: "cutting",
      label: "Cięcie",
      icon: Wrench,
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      value: "power_tools",
      label: "Elektronarzędzia",
      icon: Zap,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      value: "hand_tools",
      label: "Narzędzia ręczne",
      icon: Wrench,
      gradient: "from-green-500 to-blue-500",
    },
    {
      value: "safety",
      label: "Bezpieczeństwo",
      icon: HardHat,
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      value: "lifting",
      label: "Podnoszenie",
      icon: Hammer,
      gradient: "from-red-500 to-pink-500",
    },
    {
      value: "concrete",
      label: "Betonowanie",
      icon: Hammer,
      gradient: "from-gray-500 to-blue-500",
    },
    {
      value: "excavation",
      label: "Kopanie",
      icon: Hammer,
      gradient: "from-amber-500 to-yellow-500",
    },
  ];

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 12,
        available_only: true,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
      };

      const response = await equipmentAPI.getAll(params);
      const data = response.data;

      setEquipment(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message || "Błąd pobierania sprzętu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }

    fetchEquipment();
  }, [currentPage, selectedCategory, searchTerm, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEquipment();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    const newParams = new URLSearchParams();
    if (category) newParams.set("category", category);
    navigate(`/equipment?${newParams.toString()}`, { replace: true });
  };

  const handleRentEquipment = (equipmentItem) => {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate(`/rent/${equipmentItem.id}`, {
      state: { equipment: equipmentItem },
    });
  };

  if (loading && equipment.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 text-lg">Ładowanie sprzętu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Strona główna
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Katalog sprzętu
                </h1>
                <p className="text-gray-600 mt-2">
                  Znajdź idealne narzędzia dla swojego projektu
                </p>
              </div>
            </div>

            {user && (
              <div className="text-right bg-white shadow-sm rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-900 text-sm font-medium">
                  Witaj, {user.first_name}!
                </p>
                <p className="text-blue-600 text-xs">Gotowy do wypożyczenia?</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12 space-y-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Szukaj sprzętu (np. wiertarka, młot, rusztowanie...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 text-base bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="px-8 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Search className="w-5 h-5 mr-2" />
              Szukaj
            </Button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
                    isSelected
                      ? "bg-blue-50 border-2 border-blue-200 scale-105 shadow-md"
                      : "bg-white border border-gray-200 hover:bg-gray-50 hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-900 text-sm font-medium">
                      {category.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <Button
              onClick={fetchEquipment}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Spróbuj ponownie
            </Button>
          </div>
        )}

        {/* Lista sprzętu */}
        {equipment.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Brak wyników
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Nie znaleźliśmy sprzętu pasującego do Twoich kryteriów.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setCurrentPage(1);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Wyczyść filtry
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {equipment.map((item) => (
                <Card
                  key={item.id}
                  className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden hover:scale-105 flex flex-col h-full"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </CardTitle>
                        <p className="text-gray-500 text-sm mt-1">
                          {item.brand} {item.model}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-xl font-bold text-green-600">
                          {item.daily_rate} zł
                        </div>
                        <div className="text-xs text-gray-500">za dzień</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4">
                      <Button
                        onClick={() => handleRentEquipment(item)}
                        disabled={item.quantity_available === 0}
                        className="w-full h-12 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                        size="lg"
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        {user ? "Wypożycz" : "Zaloguj się"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginacja */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-6">
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-xl px-6"
                >
                  Poprzednia
                </Button>

                <div className="bg-white shadow-sm rounded-xl px-6 py-3 border border-gray-200">
                  <span className="text-gray-900 font-medium">
                    Strona {currentPage} z {totalPages}
                  </span>
                </div>

                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-xl px-6"
                >
                  Następna
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading overlay */}
      {loading && equipment.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <p className="text-gray-900 text-lg">Ładowanie...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
