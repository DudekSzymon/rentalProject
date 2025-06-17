from fastapi.middleware.cors import CORSMiddleware

def add_cors_middleware(app):
    """Dodaje CORS middleware do aplikacji"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "https://accounts.google.com",
            "https://content-autofill.googleapis.com",
            "https://googleusercontent.com",
            "*"  # Tymczasowo dla testów
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"]
    )