# backend/main.py
import os
import sys
from pathlib import Path

# Add the parent directory to Python path so we can import backend modules  backend modules import
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv  # cspell:disable-line
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import logging
from backend.database import init_db
#This file starts the FastAPI server, initializes the database, and connects all API routes.
# Import API routers
from backend.api.auth import router as auth_router
from backend.api.expenses import router as expenses_router
from backend.api.budgets import router as budgets_router
from backend.api.goals import router as goals_router
from backend.api.receipts import router as receipts_router
from backend.api.ai import router as ai_router
from backend.api.analysis import router as analysis_router
from backend.api.achievements import router as achievements_router
from backend.api.dashboard import router as dashboard_router


load_dotenv("key.env")  # cspell:disable-line  API keys load

# Configure logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # cspell:disable-line
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

print("GROQ KEY LOADED:", bool(GROQ_API_KEY))  # cspell:disable-line
print("GOOGLE CLIENT ID LOADED:", bool(GOOGLE_CLIENT_ID))

app = FastAPI(title="Advanced Expense Tracker API")

# ---------------- CORS ---------------- Frontend (3000 port) and backend (8000 port) connect allow કરે છે.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

security = HTTPBearer()  #Bearer token authentication.

# Initialize database
init_db()

# Dependency to get current user  Token verify  logged-in user
def get_current_user(token: str = Depends(security)):
    from backend.auth import verify_token
    credentials = token
    token_data = verify_token(credentials.credentials)
    
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return token_data
 
# Include routers  conect fast api app
app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(receipts_router)
app.include_router(ai_router)
app.include_router(analysis_router)
app.include_router(achievements_router)
app.include_router(dashboard_router)

# Public endpoints (no auth required)
@app.get("/")
def read_root():
    return {"message": "Advanced Expense Tracker API", "status": "running"}

#show Server status, AI status, DB status
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Expense Tracker API",
        "database": "SQLite",
        "ai_provider": "Groq (Llama 3.1)",  # cspell:disable-line
        "ai_enabled": bool(GROQ_API_KEY),  # cspell:disable-line
        "auth_enabled": bool(GOOGLE_CLIENT_ID)
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Advanced Expense Tracker API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)