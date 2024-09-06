'''
このスクリプトから実行ボタン押してもサーバーが建つ
npm管理しているので $npm start で建たせるのが通常
'''
import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Ctr + C によって終了させたときの長文ログ回避
except KeyboardInterrupt:
    print("\nServer stopped.")
