#!/bin/bash
# Test server untuk S-Box Analyzer

# Cek apakah Python tersedia
if command -v python3 &> /dev/null; then
    echo "Menjalankan S-Box Analyzer dengan Python HTTP Server..."
    echo "Akses: http://localhost:8000"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Menjalankan S-Box Analyzer dengan Python HTTP Server..."
    echo "Akses: http://localhost:8000"
    python -m SimpleHTTPServer 8000
else
    echo "Python tidak ditemukan. Gunakan web server lain atau buka file index.html langsung di browser."
fi
