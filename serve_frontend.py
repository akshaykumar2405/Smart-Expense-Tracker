#!/usr/bin/env python3
"""
Simple HTTP server to serve the frontend files
This fixes CORS issues when accessing the API from frontend
"""
import http.server
import socketserver
import os
import webbrowser
import threading
import time

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="frontend", **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow API access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging to reduce noise
        if len(args) > 0 and isinstance(args[0], str):
            if "favicon.ico" not in args[0] and ".well-known" not in args[0]:
                super().log_message(format, *args)

def start_server():
    PORT = 3000
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print("🌐 Frontend server starting on http://localhost:{}".format(PORT))
            print("📁 Serving files from: {}".format(os.path.abspath('frontend')))
            print("🔗 Login page: http://localhost:{}/login.html".format(PORT))
            print("🔗 Signup page: http://localhost:{}/signup.html".format(PORT))
            print("🔗 Dashboard: http://localhost:{}/index.html".format(PORT))
            print("🧪 Test page: http://localhost:{}/test-connection.html".format(PORT))
            print("🛑 Press Ctrl+C to stop")
            print("-" * 50)
            
            # Open browser after a short delay
            def open_browser():
                time.sleep(2)
                webbrowser.open('http://localhost:{}/login.html'.format(PORT))
            
            threading.Thread(target=open_browser, daemon=True).start()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except OSError as e:
        if "Address already in use" in str(e):
            print("❌ Port {} is already in use. Please stop other servers or use a different port.".format(PORT))
        else:
            print("❌ Error starting server: {}".format(e))

if __name__ == "__main__":
    start_server()