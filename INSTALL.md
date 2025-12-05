# S-Box Cryptanalysis Tool - Installation & Usage Guide

## 🚀 Instalasi Cepat

### Persyaratan Sistem
- Web Browser modern (Chrome, Firefox, Safari, Edge)
- Optional: Python 3.x (untuk menjalankan local server)

### Langkah 1: File Setup
Pastikan semua file sudah ada:
```
kriptografi/
├── index.html          (Main analyzer interface)
├── styles.css          (Styling)
├── sbox-analyzer.js    (Core logic)
├── reference.html      (Guide & reference)
├── README.md           (Documentation)
├── run-server.bat      (Windows server launcher)
├── run-server.sh       (Linux/Mac server launcher)
└── INSTALL.md          (File ini)
```

### Langkah 2: Menjalankan Aplikasi

#### Option A: Direct Browser (Recommended untuk testing)
1. Buka file explorer
2. Navigate ke folder `kriptografi`
3. Double-click `index.html`
4. Browser akan membuka aplikasi secara otomatis

#### Option B: Local Server (Recommended untuk production)

**Windows:**
```powershell
# Navigate ke folder
cd c:\Users\LENOVO\kriptografi

# Run server
python -m http.server 8000

# Akses: http://localhost:8000
```

**Linux/Mac:**
```bash
cd ~/kriptografi

# Option 1: Python 3
python3 -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000

# Akses: http://localhost:8000
```

Atau gunakan script yang sudah disediakan:
```bash
# Linux/Mac
./run-server.sh

# Windows
run-server.bat
```

## 📖 Panduan Penggunaan

### Dashboard Utama

#### 1. Input S-Box
```
┌─────────────────────────────────────┐
│  Masukkan nilai S-Box (0-255)      │
├─────────────────────────────────────┤
│  [Textarea untuk input values]      │
├─────────────────────────────────────┤
│ [Analyze] [Example] [Clear] [Upload]│
└─────────────────────────────────────┘
```

**Format yang didukung:**
- Hexadecimal: `0x63 0x7c 0x77 0x7b ...`
- Decimal: `99 124 119 123 ...`
- Dengan koma: `0x63, 0x7c, 0x77, ...`
- File upload: Text file dengan values

**Contoh Input:**
```
0x63 0x7c 0x77 0x7b 0xf2 0x6b 0x6f 0xc5
```

#### 2. Validasi
Aplikasi akan otomatis:
- ✓ Cek jumlah nilai (harus 256)
- ✓ Cek range (0-255)
- ✓ Cek permutation validity
- ✓ Report error jika invalid

#### 3. Analisis
Klik tombol "Analisis S-Box":
- Proses akan berjalan (3-10 detik tergantung CPU)
- Hasil ditampilkan di tab-tab
- Dapat diklik untuk melihat detail

### Tab-Tab Hasil

#### Tab 1: Ringkasan
- Overview semua kriteria
- Visual metric cards
- Summary analysis text
- Quick assessment (✓ Good / ✗ Need Improvement)

#### Tab 2: Nonlinearity (NL)
- Rata-rata NL
- NL per output bit
- Interpretasi

#### Tab 3: SAC
- Tabel SAC lengkap (64 entries untuk preview)
- Input/Output bit pairs
- Persentase perubahan
- Status (good/bad)

#### Tab 4: BIC-NL & BIC-SAC
- Bit Independence Criterion untuk semua pasangan
- NL values per pair
- SAC average per bit pair
- Status indicators

#### Tab 5: LAP & DAP
- Maximum Linear Approximation Probability
- Count of high LAP values
- Interpretasi

#### Tab 6: DU & AD
- Differential Uniformity (max)
- Algebraic Degree (per bit)
- Table format
- Good/Bad indicator

#### Tab 7: TO & CI
- Transparency Order
- Correlation Immunity Order
- Interpretasi dan resistance assessment

#### Tab 8: Detail
- Full JSON output dari semua analisis
- Untuk debugging atau export

### Tombol Utility

| Tombol | Fungsi |
|--------|--------|
| Analisis S-Box | Jalankan analisis lengkap |
| Contoh (AES) | Load standard AES S-Box |
| Clear | Hapus input dan reset |
| Upload File | Load S-Box dari file text |

## 📊 Interpretasi Hasil

### Quick Reference Table

| Kriteria | Bad | Acceptable | Good | Excellent |
|----------|-----|-----------|------|-----------|
| **NL** | < 90 | 90-110 | 110-115 | > 115 |
| **SAC** | > 20% dev | 15-20% dev | 10-15% dev | < 10% dev |
| **DU** | > 8 | 6-8 | 4-6 | 2-4 |
| **AD** | < 4 | 4-6 | 6-7 | 7-8 |
| **LAP** | > 0.5 | 0.3-0.5 | 0.2-0.3 | < 0.2 |
| **CI** | 0 | 0-1 | 1-2 | > 2 |

### Contoh: AES S-Box Analysis

Jika Anda analyze AES S-Box, hasil akan seperti:
```
┌────────────────────────────────────┐
│ Nonlinearity (NL)     │   112.00   │
│ SAC - Min             │   45.50%   │
│ SAC - Max             │   54.50%   │
│ Differential Uniformity │   4       │
│ Algebraic Degree      │   7        │
│ Correlation Immunity  │   1        │
└────────────────────────────────────┘

✓ NL: Good (> 110)
✓ SAC: Excellent (±5% dari 50%)
✓ DU: Excellent (= 4)
✓ AD: Good (= 7)
✓ CI: Good (= 1)

Kesimpulan: AES S-Box memiliki kualitas kriptografi yang sangat baik
```

## 🔧 Troubleshooting

### Problem: Browser tidak bisa buka index.html
**Solusi:**
1. Pastikan file ada di folder yang benar
2. Coba refresh browser (Ctrl+F5)
3. Coba buka di browser berbeda
4. Clear browser cache

### Problem: Upload file tidak berfungsi
**Solusi:**
1. Pastikan file adalah text plain (.txt)
2. Pastikan format values benar
3. Cek browser console (F12) untuk error
4. Copy-paste values langsung jika upload bermasalah

### Problem: Analisis berjalan lambat
**Solusi:**
1. Normal untuk S-Box size besar
2. Close background programs untuk free RAM
3. Gunakan browser modern (Chrome/Firefox)
4. Jika tetap lambat, gunakan Python script alternative

### Problem: Error "S-Box is not a valid permutation"
**Penyebab & Solusi:**
- ❌ Ada nilai yang duplicate → Check input
- ❌ Ada nilai di luar range 0-255 → Fix values
- ❌ Tidak ada 256 values → Add missing values
- ❌ Format input salah → Ubah format

**Debugging:**
1. Buka Browser Console (F12 → Console tab)
2. Lihat error message lengkap
3. Copy-paste tepat dari referensi
4. Gunakan AES contoh untuk verify setup

## 📚 Recursos Tambahan

### File Guide & Reference
File `reference.html` berisi:
- Standard S-Boxes (AES, DES, SERPENT, dll)
- Teori lengkap setiap kriteria
- Cara membuat S-Box berkualitas
- Testing methodology
- FAQ & troubleshooting

Akses dengan buka file di browser atau klik link dari main page.

### Learning Resources
1. **NIST FIPS 197** - AES Standard
   - Definisi AES S-Box
   - Mathematical properties
   - Implementation notes

2. **Cryptography Books**
   - "Handbook of Cryptography" - Menezes et al.
   - "The Block Cipher Companion" - Knudsen & Robshaw

3. **Research Papers**
   - SAC & BIC papers (1985)
   - Linear Cryptanalysis (1993)
   - Differential Cryptanalysis (1990)

## 💾 Backup & Export

### Export Hasil
1. Analyze S-Box
2. Klik tab "Detail"
3. Copy JSON output
4. Simpan ke file dengan nama `analysis_sbox_name.json`

### Backup Data
Untuk backup konfigurasi atau hasil:
```bash
# Compress semua files
zip -r sbox-analyzer-backup.zip kriptografi/

# Extract later
unzip sbox-analyzer-backup.zip
```

## 🔐 Security Notes

- Tool ini **tidak menyimpan data** apapun
- Semua proses terjadi **local di browser**
- Tidak ada koneksi internet diperlukan
- Safe untuk data sensitif

## 📞 Support & Contact

Jika ada pertanyaan atau issue:
1. Check FAQ di reference.html
2. Review console errors (F12)
3. Verify input format dengan AES example
4. Check README.md untuk teori

## 📝 Version History

**v1.0.0** (2025-12-05)
- ✓ Initial release
- ✓ All 10 criteria implemented
- ✓ Full UI with 8 tabs
- ✓ AES S-Box example
- ✓ Comprehensive documentation

## 🎓 Educational Use

Tool ini dirancang untuk:
- ✓ Cryptography students
- ✓ Security researchers
- ✓ S-Box designers
- ✓ Cipher analysis
- ✓ Educational research

Gunakan untuk pembelajaran dan riset, bukan untuk mendukung aktivitas illegal.

---

**Selamat menggunakan S-Box Cryptanalysis Tool! 🔐**
