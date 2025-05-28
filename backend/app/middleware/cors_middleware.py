from fastapi.middleware.cors import CORSMiddleware

def add_cors_middleware(app):
    """Dodaje CORS middleware do aplikacji"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )