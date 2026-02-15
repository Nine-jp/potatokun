import http.server
import socketserver
import os

PORT = 8081
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()
except OSError as e:
    print(f"Error starting server: {e}")
except KeyboardInterrupt:
    print("Server stopped.")
