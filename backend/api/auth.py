# backend/api/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from backend.auth import (
    create_access_token, 
    verify_token,
    Token,
    get_password_hash,
    verify_password
)
from backend.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

class GoogleAuthRequest(BaseModel):
    token: str

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# Google auth endpoint removed - only email/password authentication available

@router.post("/signup")
async def signup(signup_request: SignupRequest):
    """Create new user with email/password"""
    try:
        if len(signup_request.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Ensure password is within bcrypt limits
        password = signup_request.password
        if len(password.encode('utf-8')) > 72:
            password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        
        conn = get_db()
        cur = conn.cursor()
        
        # Check if email already exists
        cur.execute("SELECT user_id FROM users WHERE email = ?", (signup_request.email,))
        if cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Generate user ID
        import uuid
        user_id = str(uuid.uuid4())
        
        # Hash password
        hashed_password = get_password_hash(password)
        
        # Create user
        cur.execute("""
            INSERT INTO users (user_id, email, full_name, hashed_password, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            signup_request.email,
            signup_request.full_name,
            hashed_password,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        # Create JWT token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user_id, "email": signup_request.email},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_id=user_id,
            email=signup_request.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(login_request: LoginRequest):
    """Login with email/password"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Get user
        cur.execute("""
            SELECT user_id, email, full_name, hashed_password 
            FROM users 
            WHERE email = ?
        """, (login_request.email,))
        
        user = cur.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(login_request.password, user["hashed_password"]):
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        cur.execute("""
            UPDATE users SET last_login = ? WHERE user_id = ?
        """, (datetime.now(), user["user_id"]))
        
        conn.commit()
        conn.close()
        
        # Create JWT token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user["user_id"], "email": user["email"]},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_id=user["user_id"],
            email=user["email"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_current_user(token: str = Depends(security)):
    """Get current user info"""
    try:
        credentials: HTTPAuthorizationCredentials = token
        token_data = verify_token(credentials.credentials)
        
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT user_id, email, full_name, picture, created_at, last_login
            FROM users 
            WHERE user_id = ?
        """, (token_data.user_id,))
        
        user = cur.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user["picture"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
        
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Dependency to get current user
def get_current_user_dependency(token: str = Depends(security)):
    credentials: HTTPAuthorizationCredentials = token
    token_data = verify_token(credentials.credentials)
    
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return token_data