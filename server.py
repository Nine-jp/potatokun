import http.server
import socketserver
import socket
import os

PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

Handler = NoCacheHandler

try:
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        local_ip = get_ip()
        print(f"\n✅ Server started at port {PORT}")
        print(f"📡 Local Access: http://localhost:{PORT}")
        print(f"📱 LAN Access:   http://{local_ip}:{PORT}")
        print("\nPress Ctrl+C to stop.\n")
        httpd.serve_forever()
except OSError as e:
    print(f"❌ Error: Could not start server on port {PORT}. It might be in use.")
    print(f"Details: {e}")
