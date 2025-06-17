from fastapi import FastAPI, Request, Response
from .database import init_db
from .config import settings
from .middleware.cors_middleware import add_cors_middleware
from fastapi.middleware.cors import CORSMiddleware
# Import wszystkich controllerów
from .controllers import (
    auth_controller,
    equipment_controller,
    rental_controller,
    payment_controller,
    admin_controller
)

# Tworzenie aplikacji FastAPI
app = FastAPI(
    title="Wypożyczalnia Sprzętu Budowlanego",
    version="1.0.0",
    description="System wypożyczalni z Google OAuth i płatnościami Stripe"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Middleware dla Google OAuth CORS
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    return response

# Dodanie CORS
add_cors_middleware(app)

# Rejestracja routerów (CONTROLLERS w MVC)
app.include_router(auth_controller.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(equipment_controller.router, prefix="/api/equipment", tags=["Equipment"])
app.include_router(rental_controller.router, prefix="/api/rentals", tags=["Rentals"])
app.include_router(payment_controller.router, prefix="/api/payments", tags=["Payments"])
app.include_router(admin_controller.router, prefix="/api/admin", tags=["Admin"])

@app.on_event("startup")
async def startup_event():
    """Inicjalizacja bazy danych przy starcie"""
    init_db()
    print("🚀 Baza danych zainicjalizowana!")
    print("📖 Dokumentacja API: http://localhost:8000/docs")
    print("🌐 Frontend URL: http://localhost:5173")

@app.get("/")
def read_root():
    return {
        "message": "Wypożyczalnia Sprzętu Budowlanego", 
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "sqlite"}