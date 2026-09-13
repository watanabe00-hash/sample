import http.server
import os
import socket
import sys
import threading
import time
import webbrowser

# 自作モジュールのインポート
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from server.api_handler import CatAppRequestHandler


def find_free_port(start_port=8000, max_port=8100):
    """利用可能な空きポートを探す"""
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return 8000


def run_server(port):
    """HTTPサーバーを起動"""
    server_address = ("127.0.0.1", port)
    httpd = http.server.HTTPServer(server_address, CatAppRequestHandler)
    print(f"==================================================")
    print(f" 🐾 猫ちゃんズ アプリケーションが起動しました！ 🐾 ")
    print(f" URL: http://127.0.0.1:{port}")
    print(f" 終了するには Ctrl + C を押してください。")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しています...")
        httpd.shutdown()


def open_browser_delayed(url, delay=0.8):
    """ブラウザを少し遅延させて自動で開く"""
    time.sleep(delay)
    webbrowser.open(url)


def main():
    port = find_free_port()
    app_url = f"http://127.0.0.1:{port}/index.html"

    # ブラウザオープン用スレッド
    browser_thread = threading.Thread(target=open_browser_delayed, args=(app_url,), daemon=True)
    browser_thread.start()

    # サーバーメインループ実行
    run_server(port)


if __name__ == "__main__":
    main()
