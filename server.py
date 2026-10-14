"""Máy chủ local: thiệp, danh sách khách, RSVP và lời chúc. Python 3.10+."""
import argparse
import csv
import io
import json
import mimetypes
import os
import re
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=4173)
parser.add_argument('--root', type=Path, default=Path(__file__).parent / 'dist')
parser.add_argument('--data-dir', type=Path, default=Path(__file__).parent / 'data')
args = parser.parse_args()
ROOT = args.root.resolve()
DATA = args.data_dir.resolve()
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / 'wedding.sqlite3'
GUEST_LOCK = threading.Lock()
ALLOWED_HOSTS = {f'localhost:{args.port}', f'127.0.0.1:{args.port}'}
ALLOWED_ORIGINS = {f'http://{host}' for host in ALLOWED_HOSTS}
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('image/svg+xml', '.svg')

def connect():
    connection = sqlite3.connect(DB, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection

with connect() as connection:
    connection.execute('PRAGMA journal_mode=WAL')
    connection.execute('''CREATE TABLE IF NOT EXISTS rsvps (
      client_id TEXT PRIMARY KEY, guest_code TEXT NOT NULL, name TEXT NOT NULL,
      attendance TEXT NOT NULL, party_size INTEGER NOT NULL, wish TEXT NOT NULL,
      publish INTEGER NOT NULL, updated_at TEXT NOT NULL)''')

def read_guests():
    path = ROOT / 'guest-map.json'
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}

def text_field(payload, key, limit, required=False):
    value = payload.get(key, '')
    if not isinstance(value, str):
        raise ValueError(f'{key}: cần nhập văn bản.')
    value = value.strip()
    if len(value) > limit or (required and not value):
        raise ValueError(f'{key}: vui lòng nhập từ 1 đến {limit} ký tự.' if required else f'{key}: tối đa {limit} ký tự.')
    if any(ord(c) < 32 and c not in '\n\r\t' for c in value):
        raise ValueError('Nội dung có ký tự không hợp lệ.')
    return value

class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def host_allowed(self):
        if self.headers.get('Host', '') not in ALLOWED_HOSTS:
            self.send_json(403, {'error': 'Máy chủ này chỉ phục vụ bản local.'})
            return False
        return True

    def send_bytes(self, status, data, content_type, extra=None):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def send_json(self, status, payload):
        self.send_bytes(status, json.dumps(payload, ensure_ascii=False).encode('utf-8'), 'application/json; charset=utf-8')

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        if not self.host_allowed():
            return
        pathname = urlsplit(self.path).path
        try:
            if pathname == '/api/status':
                self.send_json(200, {'ok': True, 'storage': 'local'})
            elif pathname == '/api/wishes':
                with connect() as connection:
                    rows = connection.execute('SELECT name,wish,updated_at FROM rsvps WHERE publish=1 AND wish<>\'\' ORDER BY updated_at DESC LIMIT 60').fetchall()
                self.send_json(200, {'items': [{'name': row['name'], 'wish': row['wish'], 'updatedAt': row['updated_at']} for row in rows]})
            elif pathname == '/api/guests':
                self.send_json(200, {'guests': read_guests()})
            elif pathname == '/api/rsvps':
                with connect() as connection:
                    rows = connection.execute('SELECT * FROM rsvps ORDER BY updated_at DESC').fetchall()
                self.send_json(200, {'items': [dict(row) for row in rows]})
            elif pathname == '/api/rsvps.csv':
                with connect() as connection:
                    rows = connection.execute('SELECT guest_code,name,attendance,party_size,wish,publish,updated_at FROM rsvps ORDER BY updated_at DESC').fetchall()
                stream = io.StringIO(newline='')
                writer = csv.writer(stream)
                writer.writerow(['Mã khách', 'Tên', 'Tham dự', 'Số người', 'Lời chúc', 'Hiện lời chúc', 'Cập nhật UTC'])
                for row in rows:
                    # Ngăn văn bản người dùng thành công thức khi mở CSV bằng Excel.
                    values = ["'" + value if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@')) else value for value in row]
                    writer.writerow(values)
                self.send_bytes(200, ('\ufeff' + stream.getvalue()).encode('utf-8'), 'text/csv; charset=utf-8', {'Content-Disposition': 'attachment; filename="xac-nhan-tham-du.csv"'})
            elif pathname.startswith('/api/'):
                self.send_json(404, {'error': 'Không tìm thấy chức năng này.'})
            else:
                self.serve_file(pathname)
        except (ConnectionError, BrokenPipeError):
            # Người xem đổi trang hoặc tạm dừng video; không gửi lỗi sau headers.
            return
        except (OSError, sqlite3.Error, json.JSONDecodeError):
            self.send_json(500, {'error': 'Chưa đọc được dữ liệu. Vui lòng thử lại.'})

    def do_POST(self):
        if not self.host_allowed():
            return
        if self.headers.get('Origin') not in ALLOWED_ORIGINS:
            self.send_json(403, {'error': 'Hãy gửi từ trang thiệp đang chạy local.'})
            return
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            self.send_json(415, {'error': 'Cần nội dung JSON.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 1 or length > 500000:
                raise ValueError('Nội dung gửi quá lớn hoặc trống.')
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError('Nội dung không hợp lệ.')
            pathname = urlsplit(self.path).path
            if pathname == '/api/rsvp':
                self.save_rsvp(payload)
            elif pathname == '/api/guests':
                self.save_guests(payload)
            else:
                self.send_json(404, {'error': 'Không tìm thấy chức năng này.'})
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self.send_json(400, {'error': str(error) if isinstance(error, ValueError) else 'Nội dung không hợp lệ.'})
        except (ConnectionError, BrokenPipeError):
            return
        except (sqlite3.Error, OSError):
            self.send_json(500, {'error': 'Chưa lưu được trên máy. Vui lòng thử lại.'})

    def save_rsvp(self, payload):
        client_id = str(uuid.UUID(text_field(payload, 'clientId', 40, True)))
        name = text_field(payload, 'name', 100, True)
        code = text_field(payload, 'guestCode', 100)
        wish = text_field(payload, 'wish', 600)
        attendance = payload.get('attendance')
        if attendance not in ('yes', 'maybe', 'no'):
            raise ValueError('Vui lòng chọn tình trạng tham dự.')
        size = payload.get('partySize')
        if type(size) is not int or not (1 <= size <= 10 if attendance == 'yes' else size == 0):
            raise ValueError('Số người tham dự phải từ 1 đến 10; người vắng/báo sau dùng 0.')
        publish = payload.get('publish', False)
        if type(publish) is not bool:
            raise ValueError('Lựa chọn hiện lời chúc không hợp lệ.')
        updated = datetime.now(timezone.utc).isoformat()
        with connect() as connection:
            connection.execute('''INSERT INTO rsvps VALUES (?,?,?,?,?,?,?,?)
              ON CONFLICT(client_id) DO UPDATE SET guest_code=excluded.guest_code,name=excluded.name,
              attendance=excluded.attendance,party_size=excluded.party_size,wish=excluded.wish,
              publish=excluded.publish,updated_at=excluded.updated_at''', (client_id, code, name, attendance, size, wish, int(publish and bool(wish)), updated))
        self.send_json(200, {'ok': True, 'receipt': client_id})

    def save_guests(self, payload):
        guests = payload.get('guests')
        if not isinstance(guests, dict) or len(guests) > 3000:
            raise ValueError('Danh sách tối đa 3000 khách.')
        cleaned = {}
        for code, name in guests.items():
            if not isinstance(code, str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,79}', code) or code in ('constructor', 'prototype'):
                raise ValueError('Mã khách dùng chữ thường không dấu, số và dấu gạch nối.')
            if not isinstance(name, str) or not name.strip() or len(name.strip()) > 100:
                raise ValueError('Tên khách cần từ 1 đến 100 ký tự.')
            cleaned[code] = name.strip()
        with GUEST_LOCK:
            merged = read_guests()
            merged.update(cleaned)
            if len(merged) > 3000:
                raise ValueError('Danh sách tối đa 3000 khách.')
            encoded = json.dumps(merged, ensure_ascii=False, indent=2)
            js = 'window.WEDDING_GUESTS = ' + encoded.replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029') + ';\n'
            for filename, content in [('guest-map.json', encoded), ('guest-map.js', js)]:
                destination = ROOT / filename
                temporary = destination.with_suffix(destination.suffix + '.tmp')
                temporary.write_text(content, encoding='utf-8')
                os.replace(temporary, destination)
        self.send_json(200, {'ok': True, 'guests': merged})

    def serve_file(self, pathname):
        file = (ROOT / unquote(pathname).lstrip('/')).resolve()
        if file.is_dir():
            file = file / 'index.html'
        if not file.is_relative_to(ROOT) or not file.is_file():
            self.send_bytes(404, b'Not found', 'text/plain; charset=utf-8')
            return
        size = file.stat().st_size
        start, end = 0, size - 1
        range_header = self.headers.get('Range')
        if range_header:
            match = re.fullmatch(r'bytes=(\d+)-(\d*)', range_header)
            if not match:
                self.send_bytes(416, b'', 'text/plain', {'Content-Range': f'bytes */{size}'})
                return
            start = int(match[1])
            end = min(int(match[2]) if match[2] else end, end)
            if start > end or start >= size:
                self.send_bytes(416, b'', 'text/plain', {'Content-Range': f'bytes */{size}'})
                return
        self.send_response(206 if range_header else 200)
        self.send_header('Content-Type', mimetypes.guess_type(file)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(max(0, end - start + 1)))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if range_header:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        if self.command == 'HEAD':
            return
        with file.open('rb') as source:
            source.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                chunk = source.read(min(65536, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)

    def log_message(self, format, *values):
        # Nhật ký chỉ gồm phương thức và đường dẫn, không tên hay lời chúc.
        print(f'{self.command} {urlsplit(self.path).path}', flush=True)

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Thiep: http://127.0.0.1:{args.port}/', flush=True)
    print(f'Cong cu khach moi: http://127.0.0.1:{args.port}/guests.html', flush=True)
    print('Du lieu RSVP duoc luu tren may. Nhan Ctrl+C de dung.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
