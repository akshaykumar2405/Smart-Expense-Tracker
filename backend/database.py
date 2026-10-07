# backend/database.py
##database connection and tables create 
# responsibility file backend connect with database
#user-wise data manage
import sqlite3
import logging
import os

logger = logging.getLogger(__name__)

def get_db(user_id: str = None):  ## database connection  create user table
    """Get database connection for a specific user"""
    if user_id:
        # Use user-specific database
        db_path = f"data/{user_id}.db"
        os.makedirs("data", exist_ok=True)
    else:
        # Default database for auth
        db_path = "expenses.db"
    
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize databases"""
    # Main database for user management email,name create 
    main_conn = sqlite3.connect("expenses.db", check_same_thread=False)
    main_cur = main_conn.cursor()
    
    # Users table
    main_cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            picture TEXT,
            hashed_password TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    """)
    
    # User sessions table
    main_cur.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            access_token TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    """)
    
    main_conn.commit()
    main_conn.close()
    logger.info("Main database initialized")
    
    # Create data directory for user databases
    os.makedirs("data", exist_ok=True)

def init_user_db(user_id: str):  ##all user creating new database
    """Initialize database for a specific user"""
    conn = get_db(user_id)
    cur = conn.cursor()
    
    # Check if tables exist
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'")
    table_exists = cur.fetchone()
    
    if not table_exists:
        # Create tables if they don't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                is_recurring INTEGER DEFAULT 0,
                receipt_image TEXT
            )
        """)
    else:
        # Check if columns exist and add if missing
        cur.execute("PRAGMA table_info(expenses)")
        columns = [col[1] for col in cur.fetchall()]
        
        # Add missing columns
        if 'is_recurring' not in columns:
            cur.execute("ALTER TABLE expenses ADD COLUMN is_recurring INTEGER DEFAULT 0")
        if 'receipt_image' not in columns:
            cur.execute("ALTER TABLE expenses ADD COLUMN receipt_image TEXT")
    
    # New tables for new features
    cur.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            monthly_budget REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS savings_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            badge_name TEXT NOT NULL,
            badge_type TEXT NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            progress INTEGER DEFAULT 0
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS spending_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern_type TEXT NOT NULL,
            pattern_data TEXT NOT NULL,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info(f"User database initialized for {user_id}")