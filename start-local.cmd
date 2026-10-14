@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Mở http://127.0.0.1:4173/ trên trình duyệt sau khi máy chủ chạy.
echo Giữ cửa sổ này mở trong lúc xem thiệp. Nhấn Ctrl+C để dừng.
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py
  goto end
)
python server.py
:end
pause
