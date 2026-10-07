#!/usr/bin/env python3
"""
Startup script for the expense tracker backend server
"""
import os
import sys
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Set environment variables
os.environ.setdefault('PYTHONPATH', str(current_dir))

def main():
    """Start the FastAPI server"""
    try:
        print("🚀 Starting Expense Tracker Backend Server...")
        print(f"📁 Working directory: {current_dir}")
        print(f"🐍 Python path: {sys.path[0]}")
        
        # Import and run the server
        from backend.main import app
        import uvicorn
        
        print("✅ Backend modules loaded successfully!")
        print("🌐 Starting server on http://127.0.0.1:8000")
        print("📖 API docs available at http://127.0.0.1:8000/docs")
        print("🛑 Press Ctrl+C to stop the server")
        print("-" * 50)
        
        # Start the server
        uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("💡 Make sure you're in the correct directory and all dependencies are installed.")
        print("📦 Try running: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()