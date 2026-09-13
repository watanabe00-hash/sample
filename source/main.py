import http.server
import os
import socket
import sys
import threading
import time

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


class LocalWebServer:
    """バックグラウンドで動作するローカルHTTPサーバー"""

    def __init__(self, port):
        self.port = port
        self.server = None
        self.thread = None

    def start(self):
        server_address = ("127.0.0.1", self.port)
        self.server = http.server.HTTPServer(server_address, CatAppRequestHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        time.sleep(0.3)  # サーバー起動待機

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()


def launch_in_browser_gui(app_url):
    """Pythonにてインブラウザ（WebView）GUIウィンドウを起動して実行"""
    try:
        import webview

        print("==================================================")
        print(" 🐾 猫ちゃんズ Python GUI (インブラウザ) 起動中 🐾 ")
        print(f" URL: {app_url}")
        print("==================================================")

        # Python GUI ウィンドウの作成 (インブラウザ組み込み)
        window = webview.create_window(
            title="猫ちゃんズ - 自由気ままな猫たちのお部屋",
            url=app_url,
            width=1080,
            height=760,
            min_size=(640, 480),
            resizable=True,
            confirm_close=False,
            background_color="#fbf8f5",
        )

        # インブラウザGUIループ開始 (Edge Chromium WebView2 / Windows標準GUI)
        webview.start(debug=False)
        return True
    except ImportError:
        print("[Notice] pywebview is not found. Falling back to browser window.")
        return False
    except Exception as e:
        print(f"[Notice] WebView GUI launch exception: {e}. Falling back.")
        return False


def fallback_browser(app_url):
    """GUI起動が不可能な環境でのフォールバック (Edge Appモード / ブラウザ)"""
    import subprocess
    import webbrowser

    # Windows EdgeのスタンドアロンAppモード起動を試行
    try:
        edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        if os.path.exists(edge_path):
            subprocess.Popen([edge_path, f"--app={app_url}"])
            return
    except Exception:
        pass

    # 通常のブラウザ起動
    webbrowser.open(app_url)


def main():
    port = find_free_port()
    app_url = f"http://127.0.0.1:{port}/index.html"

    # 1. サーバーアプリケーションをバックグラウンド実行
    web_server = LocalWebServer(port)
    web_server.start()

    # 2. PythonにてインブラウザGUIを起動
    gui_success = launch_in_browser_gui(app_url)

    # 3. インブラウザGUIが使えない場合のフォールバック
    if not gui_success:
        fallback_browser(app_url)
        print("サーバーが実行中です。終了するには Ctrl + C を押してください。")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    # 4. 終了処理
    web_server.stop()
    print("猫ちゃんズ アプリケーションを終了しました。")


if __name__ == "__main__":
    main()
