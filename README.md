# S-Box Cryptanalysis Tool

Alat web interaktif untuk analisis dan pengujian kualitas kriptografi S-Box (Substitution Box) dengan menggunakan 9 kriteria pengujian.

## 🎯 Fitur Utama

### 1. **Nonlinearity (NL)**
Mengukur jarak minimum antara fungsi Boolean output dan semua fungsi linear affine.
- Nilai yang lebih tinggi menunjukkan resistansi lebih baik terhadap serangan linear
- Untuk setiap output bit, dihitung jarak Hamming ke fungsi linear terdekat
- Nilai ideal: > 100 untuk 8-bit S-Box

### 2. **Strict Avalanche Criterion (SAC)**
Mengukur apakah mengubah satu bit input menyebabkan perubahan ~50% bit output.
- Untuk setiap kombinasi input bit dan output bit
- Menghitung persentase perubahan output
- Nilai ideal: 50% (tolerance ±10%)

### 3. **Bit Independence Criterion - Nonlinearity (BIC-NL)**
Nonlinearity dari XOR dua output bits.
- Mengukur independensi antar output bits
- Setiap pasangan output bits dianalisis
- Nilai yang lebih tinggi menunjukkan independensi lebih baik

### 4. **Bit Independence Criterion - SAC (BIC-SAC)**
SAC dari XOR dua output bits.
- Mengukur avalanche properties dari XOR output bits
- Nilai ideal tetap 50%
- Menunjukkan kualitas independensi bit

### 5. **Linear Approximation Probability (LAP)**
Probabilitas aproksimasi linear terbaik.
- Mengukur ketahanan terhadap linear cryptanalysis
- Mencari kombinasi input/output mask dengan probabilitas tertinggi
- Nilai yang lebih kecil lebih baik (ideal < 0.3)

### 6. **Differential Approximation Probability (DAP)**
Mengukur probabilitas aproksimasi diferensial.
- Berkaitan dengan differential cryptanalysis
- Dihitung dari differential uniformity

### 7. **Differential Uniformity (DU)**
Maximum output difference frequency untuk input difference.
- Mengukur ketahanan terhadap differential cryptanalysis
- Untuk setiap input difference, hitung output difference distribution
- Nilai ideal: DU ≤ 4 untuk 8-bit S-Box

### 8. **Algebraic Degree (AD)**
Derajat aljabar fungsi Boolean output.
- Menggunakan Möbius transform
- Nilai yang lebih tinggi memberikan resistansi lebih baik
- Nilai maksimal untuk 8-bit: 8

### 9. **Transparency Order (TO)**
Mengukur transparansi fungsi Boolean.
- Berdasarkan balancing properties
- Nilai yang lebih rendah lebih baik
- TO = 0 berarti perfect balanced function

### 10. **Correlation Immunity (CI)**
Mengukur resistansi terhadap serangan korelasi.
- Order correlation immunity yang lebih tinggi lebih baik
- Menunjukkan independensi terhadap subset variabel input
- Ideal: Order ≥ 1

## 📋 Cara Penggunaan

### 1. **Input S-Box**
Anda dapat memasukkan S-Box dengan beberapa format:
- **Hexadecimal dengan prefix 0x**: `0x63 0x7c 0x77 0x7b ...`
- **Decimal**: `99 124 119 123 ...`
- **Dengan pemisah koma/titik koma**: `99,124,119,123,...`
- **Upload file**: File text dengan nilai S-Box

### 2. **Validasi**
- S-Box harus memiliki 256 nilai (0-255)
- S-Box harus merupakan permutasi valid (semua nilai 0-255 harus ada)

### 3. **Analisis**
Klik tombol "Analisis S-Box" untuk memulai analisis lengkap

### 4. **Hasil**
Hasil ditampilkan dalam tab-tab:
- **Ringkasan**: Overview hasil analisis
- **Nonlinearity**: Detail NL per output bit
- **SAC**: Tabel SAC lengkap
- **BIC-NL & BIC-SAC**: Independensi bit
- **LAP & DAP**: Linear dan differential approximation
- **DU & AD**: Differential uniformity dan algebraic degree
- **TO & CI**: Transparency order dan correlation immunity
- **Detail**: JSON lengkap semua hasil

## 📊 Contoh: AES S-Box

Website menyediakan tombol "Contoh (AES)" untuk memuat standard AES S-Box sebagai referensi:

```
63 7c 77 7b f2 6b 6f c5 30 01 67 2b fe d7 ab 76
ca 82 c9 7d fa 59 47 f0 ad d4 a2 af 9c a4 72 c0
...
```

## 🔐 Interpretasi Hasil Kriptografi

### Untuk S-Box yang Baik:
- **NL**: > 100 (rata-rata per output bit)
- **SAC**: 45-55% (tolerance dari 50%)
- **BIC-NL**: Nilai tinggi untuk semua pasangan bit
- **BIC-SAC**: Mendekati 50% untuk semua kombinasi
- **LAP**: Maksimal < 0.3
- **DU**: ≤ 4 (ideal)
- **AD**: ≥ 6 (semakin tinggi semakin baik)
- **TO**: Rendah (< 50)
- **CI**: ≥ 1 (order correlation immunity)

## 🛠️ Implementasi Teknis

### File-File:
- `index.html` - Struktur HTML dan UI
- `styles.css` - Styling dan responsive design
- `sbox-analyzer.js` - Logika analisis dan perhitungan

### Bahasa:
- HTML5
- CSS3 (dengan responsive design)
- JavaScript ES6+

### Browser Support:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## 📐 Formula dan Teori

### Nonlinearity:
```
NL = min distance dari output bit ke semua fungsi linear affine
    = min(Hamming distance(f, L) untuk semua L linear affine)
```

### SAC:
```
SAC(i,j) = Σ |f(x) ⊕ f(x ⊕ e_i) bit j| / 256
          untuk i=bit input, j=bit output
```

### Algebraic Degree:
Menggunakan Möbius transform:
```
M[S] = ⊕{x: x⊆S} f(x)
Degree = max{|S|: M[S] ≠ 0}
```

### Differential Uniformity:
```
δ_f(a,b) = #{x: f(x) ⊕ f(x⊕a) = b}
DU = max δ_f(a,b) untuk a,b ≠ 0
```

## 📚 Referensi

1. **NIST FIPS 197** - Advanced Encryption Standard (AES)
2. **SAC** - Seberry, Pieprzyk (1989)
3. **BIC** - Webster, Tavares (1985)
4. **Differential Cryptanalysis** - Biham, Shamir (1990)
5. **Linear Cryptanalysis** - Matsui (1993)
6. **Correlation Immunity** - Siegenthaler (1984)

## 🔬 Catatan Penelitian

Alat ini dirancang untuk:
- Analisis kualitas S-Box dalam desain cipher
- Penelitian cryptography dan cryptanalysis
- Pendidikan cryptography
- Verifikasi implementasi S-Box baru

## ⚠️ Disclaimer

Alat ini untuk tujuan pendidikan dan penelitian. Pastikan implementasi cipher Anda mempertimbangkan semua aspek keamanan, bukan hanya S-Box.

## 👤 Author

Created for Cryptography Research and Education

---

**Catatan**: Untuk analisis real-time yang lebih cepat dengan dataset besar, pertimbangkan penggunaan bahasa yang lebih cepat seperti C/C++ atau Python dengan optimization.
