from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)  # Hash refresh tokenu
    expires_at = Column(DateTime(timezone=True), nullable=False)  # Data wygaśnięcia
    is_revoked = Column(Boolean, default=False)  # Czy token został unieważniony
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacja z użytkownikiem
    user = relationship("User", back_populates="refresh_tokens")
    
    @property
    def is_expired(self):
        """Sprawdza czy token wygasł"""
        import datetime
        return datetime.datetime.utcnow() > self.expires_at.replace(tzinfo=None)
    
    @property
    def is_valid(self):
        """Sprawdza czy token jest nadal ważny"""
        return not self.is_revoked and not self.is_expired