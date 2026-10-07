#!/usr/bin/env python3  backend file work perfectly or not
"""
Simple test script to verify backend functionality
"""
import sys
sys.path.append('.')

def test_imports():
    """Test if all backend modules can be imported"""
    try:
        print("Testing backend imports...")
        
        # Test main imports
        from backend.main import app  # noqa: F401
        print("✓ Main app imported successfully")
        
        from backend.database import init_db, get_db  # noqa: F401
        print("✓ Database module imported successfully")
        
        from backend.auth import create_access_token, verify_token  # noqa: F401
        print("✓ Auth module imported successfully")
        
        # Test API imports
        from backend.api import auth, expenses, budgets, goals, ai, analysis, achievements, dashboard, receipts  # noqa: F401
        print("✓ All API modules imported successfully")
        
        # Test models
        from backend.models import Expense, Budget, SavingsGoal  # noqa: F401
        print("✓ Models imported successfully")
        
        # Test utils
        from backend.utils import calculate_spending_score, detect_behavioral_patterns  # noqa: F401
        print("✓ Utils imported successfully")
        
        print("\n🎉 All imports successful! Backend is ready.")
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_database():
    """Test database initialization"""
    try:
        print("\nTesting database initialization...")
        from backend.database import init_db
        init_db()
        print(" Database initialized successfully")
        return True
    except Exception as e:
        print(f" Database error: {e}")
        return False

def test_auth():
    """Test authentication functions"""
    try:
        print("\nTesting authentication...")
        from backend.auth import get_password_hash, verify_password, create_access_token
        
        # Test password hashing
        password = "test123"
        hashed = get_password_hash(password)
        if verify_password(password, hashed):
            print(" Password hashing works")
        else:
            print(" Password hashing failed")
            return False
        
        # Test JWT token creation
        token = create_access_token({"sub": "test_user", "email": "test@example.com"})
        if token:
            print(" JWT token creation works")
        else:
            print(" JWT token creation failed")
            return False
        
        return True
    except Exception as e:
        print(f" Auth error: {e}")
        return False

if __name__ == "__main__":
    print(" Starting backend tests...\n")
    
    success = True
    success &= test_imports()
    success &= test_database()
    success &= test_auth()
    
    if success:
        print("\n✅ All tests passed! Backend is working correctly.")
        print("\nTo start the server, run:")
        print("python backend/main.py")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)