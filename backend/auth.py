# backend/auth.py  login, password security and  token system handle
import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import jwt
from pydantic import BaseModel
# Load environment variables from .env file
from dotenv import load_dotenv  # cspell:disable-line

from google.auth.exceptions import GoogleAuthError

load_dotenv()  # cspell:disable-line

# =========================
# PASSWORD HASHING (ONLY ONCE)
# =========================

def get_password_hash(password: str) -> str:
    """Simple password hashing for testing"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return salt + password_hash.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        salt = hashed_password[:32]
        stored_hash = hashed_password[32:]
        password_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return password_hash.hex() == stored_hash
    except Exception:
        return False

# =========================
# JWT CONFIG
# =========================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# =========================
# MODELS
# =========================
class Token(BaseModel):  ####return kate jwt
    access_token: str
    token_type: str
    user_id: str
    email: str

class TokenData(BaseModel):   ###verify
    user_id: Optional[str] = None
    email: Optional[str] = None

class User(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    picture: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

# =========================
# JWT FUNCTIONS ##login success
# =========================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))  ##expire token
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            return None

        return TokenData(user_id=user_id, email=email)
    except jwt.PyJWTError:
        return None

# =========================
# GOOGLE AUTH (SIMPLIFIED FOR DEMO)
# ========================= 
def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """Simplified Google token verification for demo purposes"""
    try:
        # In production, you would verify the actual Google JWT token
        # For demo, we'll accept any token and return mock user data
        
        if token == "demo_google_token":
            return {
                "user_id": "google_demo_user",
                "email": "user@gmail.com",
                "full_name": "Google Demo User",
                "picture": "https://via.placeholder.com/100",
                "email_verified": True
            }
        
        # For real implementation, uncomment below:
        """
        import google.oauth2.id_token
        import google.auth.transport.requests
        
        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not CLIENT_ID:
            raise ValueError("GOOGLE_CLIENT_ID not set")

        id_info = google.oauth2.id_token.verify_oauth2_token(
            token,
            google.auth.transport.requests.Request(),
            CLIENT_ID
        )

        if id_info["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Wrong issuer")

        return {
            "user_id": id_info["sub"],
            "email": id_info["email"],
            "full_name": id_info.get("name"),
            "picture": id_info.get("picture"),
            "email_verified": id_info.get("email_verified", False)
        }
        """
        
        return None

    except (ValueError, GoogleAuthError) as e:
        print("Google token error:", e)
        return None
