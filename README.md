# 🏗️ SpellBudex - Wypożyczalnia Sprzętu Budowlanego

<div align="center">

![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-00a393.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)

</div>

## 🎯 Opis projektu

SpellBudex to kompleksowy system zarządzania wypożyczalnią sprzętu budowlanego, składający się z nowoczesnego frontendu w React i wydajnego backendu w FastAPI. System umożliwia zarządzanie katalogiem sprzętu, procesem wypożyczeń, płatnościami online oraz zapewnia zaawansowany panel administracyjny.

### ✨ Kluczowe cechy

- 🔐 **Bezpieczna autoryzacja** - JWT + Google OAuth
- 💳 **Płatności online** - Integracja ze Stripe + płatności offline
- 📱 **Responsive design** - Optimized dla wszystkich urządzeń
- 🛡️ **Panel administratora** - Pełne zarządzanie systemem
- 🧪 **Wysokie pokrycie testami** - Unit + Integration testy
- 🚀 **Wydajność** - FastAPI + SQLAlchemy + React

## 🚀 Funkcjonalności

### 👤 System użytkowników
- ✅ Rejestracja i logowanie (email/hasło + Google OAuth)
- ✅ Zarządzanie profilem użytkownika
- ✅ Historia wypożyczeń
- ✅ System ról (Admin/Customer)

### 🛠️ Katalog sprzętu
- ✅ Przeglądanie sprzętu z filtrami i wyszukiwaniem
- ✅ Kategorie: wiertarki, narzędzia ręczne, bezpieczeństwo, itp.
- ✅ Szczegółowe informacje o sprzęcie
- ✅ Sprawdzanie dostępności w czasie rzeczywistym
- ✅ Podgląd cen dla różnych okresów wypożyczenia

### 📅 System wypożyczeń
- ✅ Rezerwacja sprzętu z wyborem dat
- ✅ Różne okresy rozliczeniowe (dzienny/tygodniowy/miesięczny)
- ✅ System kaucji
- ✅ Automatyczne sprawdzanie konfliktów terminów
- ✅ Statusy wypożyczeń (pending, active, completed, etc.)

### 💰 Płatności
- ✅ Płatności online przez Stripe (karty, BLIK)
- ✅ Płatności offline zatwierdzane przez admina
- ✅ Automatyczne naliczanie opłat za opóźnienia
- ✅ Historia transakcji

### 🔧 Panel administracyjny
- ✅ Dashboard z kluczowymi metrykami
- ✅ Zarządzanie sprzętem (CRUD operations)
- ✅ Zarządzanie użytkownikami
- ✅ Zarządzanie wypożyczeniami
- ✅ Zatwierdzanie płatności offline
- ✅ Responsive mobile interface

## 🛠️ Technologie

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit i ORM
- **Pydantic** - Data validation using Python type hints
- **SQLite/PostgreSQL** - Database
- **JWT** - JSON Web Tokens dla autoryzacji
- **Stripe API** - Payment processing
- **Google OAuth** - Social authentication
- **pytest** - Testing framework

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **React Router** - Client-side routing
- **Context API** - State management
- **Vitest** - Testing framework

### DevOps & Tools
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD (planowane)

## ⚙️ Wymagania

### Backend
- Python 3.9+
- pip (Python package manager)

### Frontend
- Node.js 18+
- npm lub yarn

### Opcjonalne
- Docker (planowane)
- PostgreSQL (dla produkcji)

## 📦 Instalacja

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/your-username/spellbudex.git
cd spellbudex
```

### 2. Instalacja backendu

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Instalacja frontendu

```bash
cd frontend
npm install
```

## 🔧 Konfiguracja


```bash
cd backend
cp .env.example .env
```

### 2. Inicjalizacja bazy danych

```bash
cd backend
python -c "from app.database import init_db; init_db()"
```

### 3. Dodanie przykładowych danych

```bash
# Dodanie przykładowego sprzętu
python seed_equipment.py

# Utworzenie konta administratora
python create_admin_bcrypt.py
```

Domyślne dane logowania administratora:
- **Email:** admin@projekt.pl
- **Hasło:** admin123

## 🚀 Uruchomienie

### Development mode

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Dostęp do aplikacji

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Alternative API Docs:** http://localhost:8000/redoc

## 📚 Dokumentacja API

### Główne endpointy

#### Autoryzacja
```
POST /api/auth/register     - Rejestracja użytkownika
POST /api/auth/login        - Logowanie
POST /api/auth/google       - Logowanie przez Google
GET  /api/auth/me          - Pobranie danych użytkownika
```

#### Sprzęt
```
GET    /api/equipment           - Lista sprzętu
GET    /api/equipment/{id}      - Szczegóły sprzętu
POST   /api/equipment           - Dodanie sprzętu (admin)
PUT    /api/equipment/{id}      - Edycja sprzętu (admin)
DELETE /api/equipment/{id}      - Usunięcie sprzętu (admin)
```

#### Wypożyczenia
```
GET  /api/rentals                    - Lista wypożyczeń użytkownika
POST /api/rentals                    - Utworzenie wypożyczenia
GET  /api/rentals/check-availability - Sprawdzenie dostępności
GET  /api/rentals/pricing-preview    - Podgląd ceny
```

#### Płatności
```
GET  /api/payments                        - Lista płatności
POST /api/payments/stripe/create-payment-intent - Utworzenie płatności Stripe
POST /api/payments/offline-approve        - Zatwierdzenie płatności offline (admin)
```

#### Administracja
```
GET /api/admin/users     - Lista użytkowników (admin)
PUT /api/admin/users/{id} - Edycja użytkownika (admin)
GET /api/admin/dashboard - Dane dashboard (admin)
```

### Przykłady użycia

**Logowanie:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@projekt.pl", "password": "admin123"}'
```

**Pobranie listy sprzętu:**
```bash
curl -X GET "http://localhost:8000/api/equipment?page=1&size=10&available_only=true"
```

**Utworzenie wypożyczenia:**
```bash
curl -X POST "http://localhost:8000/api/rentals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "equipment_id": 1,
    "start_date": "2024-07-01T12:00:00",
    "end_date": "2024-07-08T12:00:00",
    "quantity": 1,
    "rental_period": "daily"
  }'
```

## 🧪 Testy

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

Uruchomienie testów z coverage:
```bash
pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test
```

Uruchomienie testów z coverage:
```bash
npm run test:coverage
```

### Struktura testów

```
tests/
├── unit/           # Testy jednostkowe
├── functional/     # Testy funkcjonalne
└── integration/    # Testy integracyjne

tests_front/
├── unit/           # Testy jednostkowe React
├── helpers/        # Pomocnicze funkcje testowe
└── setup.js        # Konfiguracja testów
```

## 📁 Struktura projektu

```
spellbudex/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── controllers/        # API endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── services/          # Business logic
│   │   ├── views/             # Pydantic schemas
│   │   ├── middleware/        # Custom middleware
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Backend tests
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment config template
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   ├── assets/           # Static assets
│   │   └── styles/           # CSS files
│   ├── tests_front/          # Frontend tests
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
├── docs/                     # Project documentation
├── README.md                 # Project readme
└── LICENSE                   # Project license
```




</div>
