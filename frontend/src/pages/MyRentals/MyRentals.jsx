import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { rentalsAPI } from "../../utils/api";
import {
  ArrowLeft,
  Package,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { user, isLoading: authLoading, checkAndRefreshAuth } = useAuth();
  const navigate = useNavigate();

  // Mapowanie statusów na polskie nazwy i kolory
  const statusConfig = {
    pending: {
      label: "Oczekujące",
      color: "text-yellow-700 bg-yellow-100 border-yellow-200",
      icon: Clock,
    },
    confirmed: {
      label: "Potwierdzone",
      color: "text-blue-700 bg-blue-100 border-blue-200",
      icon: CheckCircle,
    },
    active: {
      label: "Aktywne",
      color: "text-green-700 bg-green-100 border-green-200",
      icon: CheckCircle,
    },
    completed: {
      label: "Zakończone",
      color: "text-gray-700 bg-gray-100 border-gray-200",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Anulowane",
      color: "text-red-700 bg-red-100 border-red-200",
      icon: XCircle,
    },
    overdue: {
      label: "Przeterminowane",
      color: "text-red-800 bg-red-200 border-red-300",
      icon: AlertCircle,
    },
  };

  // Sprawdzanie uwierzytelnienia z obsługą refresh token
  useEffect(() => {
    const initializeAuth = async () => {
      setIsInitializing(true);

      try {
        // Sprawdź czy jest refresh token w localStorage
        const refreshToken =
          localStorage.getItem("refresh_token") ||
          sessionStorage.getItem("refresh_token");

        if (refreshToken && !user && !authLoading) {
          // Spróbuj odświeżyć token jeśli funkcja istnieje
          if (checkAndRefreshAuth) {
            await checkAndRefreshAuth();
          }
        }

        // Poczekaj chwilę na zakończenie procesu uwierzytelnienia
        setTimeout(() => {
          setAuthChecked(true);
          setIsInitializing(false);

          // Jeśli nadal nie ma użytkownika i nie ma refresh token, przekieruj na login
          if (!user && !refreshToken && !authLoading) {
            navigate("/login");
          }
        }, 500); // Zwiększone opóźnienie dla pewności
      } catch (error) {
        console.error("Błąd podczas inicjalizacji uwierzytelnienia:", error);
        setAuthChecked(true);
        setIsInitializing(false);

        // Jeśli błąd, sprawdź czy jest refresh token
        const refreshToken =
          localStorage.getItem("refresh_token") ||
          sessionStorage.getItem("refresh_token");
        if (!refreshToken) {
          navigate("/login");
        }
      }
    };

    initializeAuth();
  }, [user, authLoading, navigate, checkAndRefreshAuth]);

  // Pobieranie danych tylko gdy użytkownik jest zalogowany
  useEffect(() => {
    if (user && authChecked && !isInitializing) {
      fetchRentals();
    }
  }, [user, filter, currentPage, authChecked, isInitializing]);

  const fetchRentals = async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        size: 10,
        ...(filter !== "all" && { status: filter }),
      };

      const response = await rentalsAPI.getAll(params);
      const data = response.data;

      setRentals(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      // Jeśli błąd 401 (Unauthorized), spróbuj odświeżyć token
      if (err.status === 401 && checkAndRefreshAuth) {
        try {
          await checkAndRefreshAuth();
          // Spróbuj ponownie po odświeżeniu tokenu
          const response = await rentalsAPI.getAll(params);
          const data = response.data;
          setRentals(data.items || []);
          setTotalPages(data.pages || 1);
        } catch (refreshError) {
          console.error("Błąd odświeżania tokenu:", refreshError);
          setError("Sesja wygasła. Zaloguj się ponownie.");
          navigate("/login");
        }
      } else {
        setError(err.message || "Błąd pobierania wypożyczeń");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filters = [
    { value: "all", label: "Wszystkie" },
    { value: "pending", label: "Oczekujące" },
    { value: "confirmed", label: "Potwierdzone" },
    { value: "active", label: "Aktywne" },
    { value: "completed", label: "Zakończone" },
    { value: "cancelled", label: "Anulowane" },
  ];

  // Pokazuj loading podczas sprawdzania uwierzytelnienia lub ładowania AuthContext
  if (isInitializing || authLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white rounded-2xl p-12 border border-gray-200 shadow-sm">
          <div className="relative">
            <RotateCcw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-6" />
          </div>
          <p className="text-gray-900 text-lg font-medium">
            {authLoading
              ? "Sprawdzanie uwierzytelnienia..."
              : "Inicjalizacja..."}
          </p>
          <p className="text-gray-600 text-sm mt-2">Proszę czekać</p>
        </div>
      </div>
    );
  }

  // Jeśli użytkownik nie jest zalogowany po sprawdzeniu, nie renderuj komponentu
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
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
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    Moje wypożyczenia
                    <Sparkles className="w-8 h-8 ml-2 text-blue-500" />
                  </h1>
                  <p className="text-gray-600">
                    Historia i status twoich wypożyczeń
                  </p>
                </div>
              </div>

              <div className="text-right bg-white shadow-sm rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-900 text-sm font-medium">
                  Witaj, {user.first_name}!
                </p>
                <p className="text-gray-600 text-xs">
                  Zarządzaj swoimi wypożyczeniami
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filtry */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {filters.map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => {
                    setFilter(filterOption.value);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 border group hover:scale-105 ${
                    filter === filterOption.value
                      ? "bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/25"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {filterOption.label}
                  {filter === filterOption.value && (
                    <span className="ml-2 inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center bg-white rounded-2xl p-12 border border-gray-200 shadow-sm">
                <div className="relative">
                  <RotateCcw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-6" />
                </div>
                <p className="text-gray-900 text-lg font-medium">
                  Ładowanie wypożyczeń...
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Pobieramy najnowsze dane
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-red-700 font-semibold text-lg mb-2">
                  Wystąpił błąd
                </h3>
                <p className="text-red-600 mb-6 text-sm">{error}</p>
                <Button
                  onClick={fetchRentals}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Spróbuj ponownie
                </Button>
              </div>
            </div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white rounded-2xl p-12 max-w-lg mx-auto border border-gray-200 shadow-sm">
                <div className="text-8xl mb-6 animate-bounce">📦</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Brak wypożyczeń
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {filter === "all"
                    ? "Nie masz jeszcze żadnych wypożyczeń."
                    : `Nie masz wypożyczeń z statusem "${
                        filters.find((f) => f.value === filter)?.label
                      }".`}
                </p>
                <Button
                  onClick={() => navigate("/equipment")}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Przeglądaj sprzęt
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Lista wypożyczeń */}
              <div className="space-y-6 mb-8">
                {rentals.map((rental, index) => {
                  const status =
                    statusConfig[rental.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const duration = getDaysDifference(
                    rental.start_date,
                    rental.end_date
                  );

                  return (
                    <div
                      key={rental.id}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-500 hover:shadow-lg group hover:scale-[1.02] animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {rental.equipment_name || "Nieznany sprzęt"}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                  Wypożyczenie #{rental.id} • Utworzone{" "}
                                  {formatDateTime(rental.created_at)}
                                </p>
                              </div>

                              <div
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border ${status.color}`}
                              >
                                <StatusIcon className="w-4 h-4" />
                                <span>{status.label}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 group-hover:bg-blue-100 transition-all">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-500 p-2.5 rounded-lg">
                                    <Calendar className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-gray-900">
                                      <strong>Od:</strong>{" "}
                                      {formatDate(rental.start_date)}
                                    </p>
                                    <p className="text-gray-900">
                                      <strong>Do:</strong>{" "}
                                      {formatDate(rental.end_date)}
                                    </p>
                                    <p className="text-blue-600 text-xs font-medium">
                                      {duration} dni
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-green-50 rounded-xl p-4 border border-green-100 group-hover:bg-green-100 transition-all">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-green-500 p-2.5 rounded-lg">
                                    <Euro className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-gray-900">
                                      <strong>Koszt:</strong>{" "}
                                      {rental.total_price} zł
                                    </p>
                                    {rental.deposit_amount > 0 && (
                                      <p className="text-yellow-600 text-xs font-medium">
                                        Kaucja: {rental.deposit_amount} zł
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 group-hover:bg-orange-100 transition-all">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-orange-500 p-2.5 rounded-lg">
                                    <Package className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-gray-900">
                                      <strong>Ilość:</strong>{" "}
                                      {rental.quantity || 1}
                                    </p>
                                    <p className="text-orange-600 text-xs font-medium">
                                      dzienny rozliczenie
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Notatki */}
                            {rental.notes && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-gray-900 text-sm">
                                  <strong className="text-blue-600">
                                    Notatki:
                                  </strong>{" "}
                                  {rental.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          {/* USUNIĘTO CAŁĄ SEKCJĘ Z PRZYCISKIEM EDYTUJ */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginacja */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4">
                  <Button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Poprzednia
                  </Button>

                  <div className="bg-white px-6 py-2 rounded-xl border border-gray-200">
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Następna
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default MyRentals;