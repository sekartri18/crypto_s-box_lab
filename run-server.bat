@echo off
REM S-Box Analyzer Test Server untuk Windows
REM Menjalankan Python HTTP Server

echo Menjalankan S-Box Analyzer...
echo.
echo Akses aplikasi di: http://localhost:8000
echo Tekan Ctrl+C untuk menghentikan server
echo.

REM Cek Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python tidak ditemukan.
    echo.
    echo Silakan install Python dari https://www.python.org/
    echo atau buka index.html langsung di browser Anda.
    pause
    exit /b 1
)

REM Jalankan HTTP server
python -m http.server 8000
