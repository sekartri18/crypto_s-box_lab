# 🎯 QUICK REFERENCE: Step-by-Step Feature

## Apa yang Baru?

Tab baru **"📋 Steps"** yang menampilkan proses analisis S-Box dalam 4 tahapan terstruktur.

---

## 📋 4 TAHAPAN ANALISIS

### Step 1️⃣: Input Validation & Affine Matrix Exploration
```
┌─────────────────────────────────────────────┐
│ 1️⃣ Input Validation & Affine Matrix       │
├─────────────────────────────────────────────┤
│ Validasi input S-Box dan eksplorasi matriks │
│                                             │
│ ✓ Validasi Completed:                      │
│   • S-Box Values: 256 ✓                    │
│   • Range Check (0-255): ✓                 │
│   • Permutation Validity: ✓                │
│   • Format Detection: Success              │
│                                             │
│ Status: Input validation passed ✓         │
└─────────────────────────────────────────────┘
```

**Apa yang dilakukan:**
- Verifikasi 256 values ada
- Cek range 0-255
- Validasi permutation
- Detect format input

---

### Step 2️⃣: Candidate S-box Construction & Cryptanalysis Testing
```
┌─────────────────────────────────────────────┐
│ 2️⃣ Cryptanalysis Testing (Pink Gradient)   │
├─────────────────────────────────────────────┤
│ Menguji S-Box terhadap 9+ kriteria         │
│                                             │
│ Cryptanalysis Metrics Calculated:          │
│ • Nonlinearity (NL): 112.00 - Excellent  │
│ • SAC: 50.25% - Good                     │
│ • DU: 4 - Optimal                        │
│ • AD: 7 - Good                           │
│ • LAP: 0.0625                            │
│ • CI: Order 1                            │
│                                             │
│ Result: All criteria evaluated ✓          │
└─────────────────────────────────────────────┘
```

**Apa yang dilakukan:**
- Hitung Nonlinearity
- Analisis SAC
- Hitung DU
- Kalkulasi AD
- Evaluasi LAP
- Assess CI

---

### Step 3️⃣: S-box Candidate Testing & Quality Evaluation
```
┌─────────────────────────────────────────────┐
│ 3️⃣ Quality Evaluation (Blue Gradient)      │
├─────────────────────────────────────────────┤
│ Penilaian menyeluruh kualitas S-Box        │
│                                             │
│ Nonlinearity Analysis:                     │
│ • Average NL: 112.00 (Benchmark: 112)    │
│ • Status: ✓ Meets AES standard           │
│                                             │
│ Avalanche Properties:                      │
│ • SAC Average: 50.25% (Target: 50%)      │
│ • Deviation: 0.25% (Acceptable: <10%)    │
│ • Status: ✓ Excellent diffusion          │
│                                             │
│ Differential Resistance:                   │
│ • Max DU: 4 (Ideal: ≤4)                 │
│ • Status: ✓ Optimal                      │
│                                             │
│ Algebraic Properties:                      │
│ • Degree: 7/8 (Minimum: 6)              │
│ • Status: ✓ Good resistance              │
│                                             │
│ Quality Badge: ✅ EXCELLENT (99/100)     │
│   ✓ Excellent NL, ✓ Excellent SAC,      │
│   ✓ Optimal DU, ✓ Excellent AD          │
└─────────────────────────────────────────────┘
```

**Apa yang dilakukan:**
- Detail per-criteria assessment
- Bandingkan dengan AES
- Quality scoring (0-100)
- Breakdown per metric

---

### Step 4️⃣: Final S-box Modification & Recommendations
```
┌─────────────────────────────────────────────┐
│ 4️⃣ Recommendations (Green Gradient)        │
├─────────────────────────────────────────────┤
│ Rekomendasi improvement & optimization     │
│                                             │
│ Recommendations:                           │
│ ✓ Excellent Quality: S-Box Anda sudah     │
│   memenuhi semua kriteria standar industri│
│                                             │
│ Conclusion:                                │
│ S-Box Anda memiliki kualitas yang SANGAT  │
│ BAIK dan siap untuk pertimbangan penggunaan│
│ dalam cipher design. Hasil analisis        │
│ menunjukkan resistance yang kuat terhadap  │
│ linear dan differential cryptanalysis.    │
│                                             │
│ ⚠️ Note: Konsultasikan dengan cryptography│
│    expert untuk implementasi final.        │
└─────────────────────────────────────────────┘
```

**Apa yang dilakukan:**
- Generate personalized recommendations
- Provide optimization tips
- Final assessment
- Production readiness check

---

## 🎨 VISUAL DESIGN

Setiap step memiliki:

```
┌─────────────────────────────────────────┐
│ 🎨 Gradient Background                  │
│    (Warna berbeda per step)             │
│                                         │
│ 1️⃣-4️⃣ Number Circle                   │
│    (Posisi: top-left)                  │
│                                         │
│ 📝 Title & Description                 │
│    (Jelas dan informatif)              │
│                                         │
│ 📊 Details Section                     │
│    (Metrics & values)                  │
│                                         │
│ ✓ Result/Status                        │
│    (Green box dengan hasil)             │
│                                         │
│ ⚠️ Warning (jika perlu)                 │
│    (Yellow box dengan info penting)     │
└─────────────────────────────────────────┘
```

---

## 🎯 HOW TO USE

### Langkah 1: Analyze S-Box
```
1. Buka index.html
2. Input atau upload S-Box
3. Klik "Analisis S-Box"
4. Tunggu hasil
```

### Langkah 2: Lihat Steps
```
1. Klik tab "📋 Steps" (urutan ke-2)
2. Scroll down untuk lihat 4 step
3. Baca setiap step dengan detail
```

### Langkah 3: Interpretasi Hasil
```
Step 1: ✓ Input valid?
Step 2: ✓ Metrics dihitung?
Step 3: ✓ Kualitas sesuai standar?
Step 4: ✓ Apa rekomendasi?
```

### Langkah 4: Implementasi
```
1. Baca rekomendasi di Step 4
2. Implementasikan suggestions
3. Re-analyze untuk verify
4. Repeat sampai hasil memuaskan
```

---

## 📊 QUALITY SCORING (0-100)

```
Nonlinearity (0-25 pts):
  > 110 → 25 pts (Excellent)
  > 100 → 15 pts (Good)
  ≤ 100 → 5 pts (Poor)

SAC Deviation (0-25 pts):
  |50%-SAC| < 5% → 25 pts (Excellent)
  |50%-SAC| < 10% → 15 pts (Good)
  |50%-SAC| ≥ 10% → 5 pts (Poor)

Differential Uniformity (0-25 pts):
  ≤ 4 → 25 pts (Optimal)
  ≤ 6 → 15 pts (Good)
  > 6 → 5 pts (Poor)

Algebraic Degree (0-25 pts):
  ≥ 7 → 25 pts (Excellent)
  ≥ 6 → 15 pts (Good)
  < 6 → 5 pts (Poor)

TOTAL RATING:
  90-100: ✅ EXCELLENT
  70-89:  ✓ GOOD
  50-69:  ~ ACCEPTABLE
  <50:    ✗ POOR
```

---

## 💡 CONTOH HASIL

### AES S-Box
```
Step 1: ✓ Valid input
Step 2: All metrics calculated
Step 3: Quality: EXCELLENT (99/100)
Step 4: Ready for production use
```

### Poor S-Box
```
Step 1: ✓ Valid input
Step 2: All metrics calculated
Step 3: Quality: POOR (35/100)
Step 4: Recommendations:
  - Improve Nonlinearity
  - Optimize Avalanche
  - Reduce Differential Uniformity
  - Increase Algebraic Degree
```

---

## 🎯 KEY FEATURES

✅ **Structured** - 4 tahapan yang jelas
✅ **Comprehensive** - Semua criteria tercakup
✅ **Actionable** - Rekomendasi konkret
✅ **Automatic** - Quality scoring otomatis
✅ **Beautiful** - Visual yang menarik
✅ **Professional** - Production-ready output

---

## 📚 DOKUMENTASI

- **STEP_BY_STEP_GUIDE.md** - Full documentation
- **UPDATE_SUMMARY.md** - Technical details
- **start.html** - Info about feature
- **This file** - Quick reference

---

## 🚀 READY TO USE!

Tab "📋 Steps" sekarang tersedia setelah setiap analisis.
Gunakan untuk mendapatkan panduan lengkap 4 tahapan 
pengujian S-Box Anda dengan rekomendasi improvement! 🔐

---

**Enjoy analyzing! ✨**
