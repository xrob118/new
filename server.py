#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def guess_type(self, path):
        mimetype = super().guess_type(path)
        if mimetype == 'text/html' or mimetype == 'text/css' or mimetype == 'application/javascript':
            mimetype += '; charset=utf-8'
        return mimetype

if __name__ == '__main__':
    os.chdir('/workspace')
    server_address = ('', 3000)
    httpd = HTTPServer(server_address, MyHTTPRequestHandler)
    print(f"Server running at http://localhost:3000")
    httpd.serve_forever()
