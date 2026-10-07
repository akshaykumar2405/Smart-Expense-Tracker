#!/usr/bin/env python3
"""
Simple server runner - alternative to start_server.py
"""
import sys
import os
import socket
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def find_free_port(start_port=8000):
    """Find a free port starting from start_port"""
    for port in range(start_port, start_port + 10):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

if __name__ == "__main__":
    # Set environment
    os.environ['PYTHONPATH'] = str(Path(__file__).parent)
    
    # Find available port
    port = find_free_port(8000)
    if not port:
        print("❌ No available ports found between 8000-8009")
        sys.exit(1)
    
    # Import after path setup
    try:
        import uvicorn
        print(f"🚀 Starting server on http://127.0.0.1:{port}")
        print("📖 API docs will be available at http://127.0.0.1:{}/docs".format(port))
        print("🛑 Press Ctrl+C to stop")
        print("-" * 50)
        
        # Run with module string to avoid reload issues
        uvicorn.run("backend.main:app", host="127.0.0.1", port=port, reload=False)
        
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("💡 Please install requirements: pip install -r requirements.txt")
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
    except Exception as e:
        print(f"❌ Error: {e}")