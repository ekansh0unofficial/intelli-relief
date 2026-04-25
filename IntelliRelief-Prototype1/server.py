#!/usr/bin/env python3
"""
IntelliRelief Server Launcher
Simple HTTP server for running the IntelliRelief prototype
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    # Change to the directory containing the server script
    os.chdir(Path(__file__).parent)
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🚨 IntelliRelief Disaster Management System")
        print("=" * 60)
        print(f"\n✓ Server running at: http://localhost:{PORT}")
        print(f"✓ Opening browser automatically...\n")
        print("Demo Credentials:")
        print("  Admin:     admin / admin123")
        print("  Operator:  operator / op123")
        print("  Responder: responder / resp123")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 60)
        
        # Auto-open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Server stopped")
            print("=" * 60)

if __name__ == "__main__":
    main()
