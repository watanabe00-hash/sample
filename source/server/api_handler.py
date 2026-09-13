import http.server
import json
import os
import urllib.parse

# 保存先パス: accounts/save_data.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ACCOUNTS_DIR = os.path.join(BASE_DIR, "accounts")
SAVE_FILE_PATH = os.path.join(ACCOUNTS_DIR, "save_data.json")
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")


class CatAppRequestHandler(http.server.SimpleHTTPRequestHandler):
    """猫ちゃんズの静的ファイル配信およびJSON Save/Load APIハンドラー"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/load":
            self.handle_load()
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/save":
            self.handle_save()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_load(self):
        """保存データをJSONで返却"""
        try:
            if os.path.exists(SAVE_FILE_PATH):
                with open(SAVE_FILE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = {"cats": [], "version": "1.0", "saved_at": None}

            response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            self.send_json_error(500, f"Error loading save data: {str(e)}")

    def handle_save(self):
        """クライアントから送信された猫データをJSONファイルに永続化"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            data = json.loads(post_body.decode("utf-8"))

            os.makedirs(ACCOUNTS_DIR, exist_ok=True)
            with open(SAVE_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            response = {"status": "success", "message": "Save completed successfully."}
            response_bytes = json.dumps(response, ensure_ascii=False).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            self.send_json_error(500, f"Error saving data: {str(e)}")

    def send_json_error(self, code, message):
        response_bytes = json.dumps({"status": "error", "message": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)
