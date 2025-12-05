# 📋 FILE GUIDE & QUICK REFERENCE

## 📂 Struktur File Project

```
kriptografi/
│
├─ 🎯 STARTING POINTS
│  ├─ start.html                ✨ Recommended: Welcome & Quick Start Page
│  └─ index.html                🔬 Main Analyzer Application
│
├─ 📚 DOCUMENTATION
│  ├─ PROJECT_SUMMARY.md        📄 Project overview & file guide
│  ├─ README.md                 📖 Technical documentation
│  ├─ INSTALL.md                🔧 Installation & troubleshooting
│  └─ reference.html            🎓 Theory, guide, FAQ
│
├─ 💻 CODE
│  ├─ sbox-analyzer.js          ⚙️  Core analysis algorithms
│  ├─ styles.css                🎨 UI styling & layout
│  └─ index.html                🌐 Main HTML structure
│
└─ 🚀 SERVER
   ├─ run-server.bat            🪟 Windows server launcher
   └─ run-server.sh             🐧 Linux/Mac server launcher
```

---

## 🚀 QUICK START PATHS

### Path 1: I'm in a hurry (5 min)
```
1. Open: start.html
2. Click: "🚀 Buka Analyzer"
3. Click: "Contoh (AES)"
4. Click: "Analisis S-Box"
5. View Results ✓
```

### Path 2: I want to learn (30 min)
```
1. Open: start.html
2. Read: Quick Start section
3. Open: reference.html
4. Read: Theory & Criteria
5. Try: Test with AES example
6. Understand: Results interpretation
```

### Path 3: I want to test my S-Box (15 min)
```
1. Open: index.html
2. Prepare: 256 values (hex or decimal)
3. Input: Copy-paste or upload file
4. Click: "Analisis S-Box"
5. Compare: Results vs AES benchmark
6. Interpret: Strengths & weaknesses
```

### Path 4: I'm a researcher (1 hour+)
```
1. Read: README.md (theory & formulas)
2. Read: reference.html (detailed criteria)
3. Open: index.html
4. Analyze: Multiple S-Box variants
5. Export: Results from "Detail" tab
6. Compare: Create comparison spreadsheet
7. Document: Include in research paper
```

---

## 📖 EACH FILE EXPLAINED

### 1. **start.html** 🎯 START HERE!
**Purpose**: Welcome page & quick start guide
**Contains**:
- Beautiful intro design
- 3-step quick start
- Feature overview
- Example workflows
- Tips & tricks
- Support info

**Best for**: First-time users, understanding capabilities

---

### 2. **index.html** 🔬 MAIN APPLICATION
**Purpose**: The actual S-Box analyzer tool
**Contains**:
- Input section (textarea, buttons)
- Results section (8 tabs)
- Tab content:
  - Overview: Metric cards summary
  - NL: Nonlinearity details
  - SAC: Avalanche criterion
  - BIC: Bit independence
  - LAP: Linear approximation
  - DU & AD: Differential & algebraic
  - TO & CI: Transparency & correlation
  - Detail: Full JSON output

**Best for**: Analyzing S-Boxes, viewing results

---

### 3. **sbox-analyzer.js** ⚙️ CORE ENGINE
**Purpose**: All cryptanalysis algorithms
**Contains**:
- SBoxAnalyzer class
  - Nonlinearity calculation
  - SAC calculation
  - BIC calculation
  - DU calculation
  - LAP calculation
  - AD calculation
  - TO calculation
  - CI calculation
- Utility functions
- UI display functions
- Input parsing & validation
- AES S-Box reference data

**Best for**: Understanding algorithms, customization

---

### 4. **styles.css** 🎨 VISUAL DESIGN
**Purpose**: All styling & layout
**Contains**:
- Global CSS variables (colors, fonts)
- Layout styles (flexbox, grid)
- Component styles (buttons, cards, tables)
- Tab styles
- Responsive design (mobile, tablet, desktop)
- Print styles
- Animations & transitions

**Best for**: Customizing appearance, responsive design

---

### 5. **reference.html** 📚 THEORY & GUIDE
**Purpose**: Educational reference material
**Contains**:
- Standard S-Boxes overview
- Detailed criteria explanation:
  - Nonlinearity
  - SAC & BIC
  - LAP & DAP
  - DU
  - AD
  - TO
  - CI
- Design guidelines
- Testing methodology
- Benchmark comparison table
- FAQ
- Learning resources

**Best for**: Learning theory, understanding criteria, Q&A

---

### 6. **README.md** 📖 TECHNICAL DOCS
**Purpose**: Comprehensive technical documentation
**Contains**:
- Feature descriptions (all 10 criteria)
- Usage guide
- Result interpretation table
- Implementation details
- Mathematical formulas
- References & citations

**Best for**: Understanding technical details, formulas, references

---

### 7. **INSTALL.md** 🔧 SETUP GUIDE
**Purpose**: Installation, usage, troubleshooting
**Contains**:
- System requirements
- Installation steps (Option A & B)
- Usage guide
- Tab-by-tab explanation
- Troubleshooting section
- Backup & export
- Security notes
- Version history

**Best for**: First-time setup, solving problems, export help

---

### 8. **PROJECT_SUMMARY.md** ✨ PROJECT OVERVIEW
**Purpose**: Complete project summary
**Contains**:
- Project completion status
- File listing & description
- 9 criteria overview
- Feature list
- Usage guide
- Technical details
- Performance metrics
- Educational use cases
- Project status checklist

**Best for**: Project overview, getting started, reference

---

### 9. **run-server.bat** 🪟 WINDOWS LAUNCHER
**Purpose**: Easy server start for Windows
**How to use**:
```powershell
# Double-click in file explorer
# Or run in PowerShell:
cd c:\Users\LENOVO\kriptografi
.\run-server.bat

# Opens at: http://localhost:8000
```

**Best for**: Windows users who want local server

---

### 10. **run-server.sh** 🐧 UNIX LAUNCHER
**Purpose**: Easy server start for Linux/Mac
**How to use**:
```bash
cd ~/kriptografi
chmod +x run-server.sh
./run-server.sh

# Opens at: http://localhost:8000
```

**Best for**: Linux/Mac users who want local server

---

## 🎯 DECISION TREE: WHICH FILE TO OPEN?

```
Start Here?
│
├─ "I don't know where to start"
│  └─ → Open: start.html ✨
│
├─ "I want to analyze S-Box NOW"
│  └─ → Open: index.html 🔬
│
├─ "I want to learn the theory"
│  └─ → Open: reference.html 📚
│
├─ "I have installation issues"
│  └─ → Read: INSTALL.md 🔧
│
├─ "I want technical details"
│  └─ → Read: README.md 📖
│
├─ "I want to run local server"
│  └─ → Run: run-server.bat (Windows) or run-server.sh (Unix)
│
└─ "I want project overview"
   └─ → Read: PROJECT_SUMMARY.md ✨
```

---

## 📊 TAB NAVIGATION IN ANALYZER

When you open `index.html`, click these tabs:

| Tab | For | View |
|-----|-----|------|
| **Ringkasan** | Quick overview | Metric cards + summary text |
| **Nonlinearity** | NL details | Per-bit NL values |
| **SAC** | Avalanche criterion | 64-row table |
| **BIC** | Bit independence | BIC-NL + BIC-SAC tables |
| **LAP & DAP** | Linear approximation | LAP values + count |
| **DU & AD** | Differential & algebraic | DU max + AD per bit |
| **TO & CI** | Transparency & correlation | TO + CI values |
| **Detail** | Full data | Complete JSON |

---

## 🔧 INPUT FORMATS REFERENCE

### Format Examples You Can Use:

**Hexadecimal:**
```
0x63 0x7c 0x77 0x7b 0xf2 0x6b 0x6f 0xc5
```

**Decimal:**
```
99 124 119 123 242 107 111 197
```

**With Commas:**
```
0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5
```

**Multi-line (file format):**
```
63 7c 77 7b f2 6b 6f c5
30 01 67 2b fe d7 ab 76
ca 82 c9 7d fa 59 47 f0
...
```

**All formats = Auto-detected ✓**

---

## ✅ VERIFICATION CHECKLIST

Before using, verify you have:

```
✓ index.html           - Main application
✓ sbox-analyzer.js     - Core algorithms
✓ styles.css           - Styling
✓ start.html           - Welcome page
✓ reference.html       - Guide & theory
✓ README.md            - Documentation
✓ INSTALL.md           - Setup guide
✓ PROJECT_SUMMARY.md   - Overview
✓ run-server.bat       - Windows launcher (optional)
✓ run-server.sh        - Unix launcher (optional)
```

If all files present → Ready to use! 🎉

---

## 🚀 USAGE COMMANDS REFERENCE

### Direct Browser (Easiest)
```
Just double-click: index.html
```

### Windows Command Line
```powershell
cd c:\Users\LENOVO\kriptografi
python -m http.server 8000
# Then open: http://localhost:8000/index.html
```

### Linux/Mac Terminal
```bash
cd ~/kriptografi
python3 -m http.server 8000
# Or: ./run-server.sh
# Then open: http://localhost:8000/index.html
```

---

## 📈 EXPECTED RESULTS

### For AES S-Box:
```
✓ NL:  ~112
✓ SAC: 45-54% (good)
✓ DU:  4 (optimal)
✓ AD:  7 (good)
✓ LAP: 0.0625 (good)
✓ CI:  1 (good)
```

### For Poor S-Box:
```
✗ NL:  < 100
✗ SAC: > 60% or < 40%
✗ DU:  > 8
✗ AD:  < 4
✗ LAP: > 0.3
✗ CI:  0
```

---

## 🎓 LEARNING PROGRESSION

### Beginner Level
1. Read: `start.html` introduction
2. Do: Test with AES example
3. Learn: Basic criteria definition
4. Time: 10-15 minutes

### Intermediate Level
1. Read: `reference.html` theory
2. Try: Test custom S-Box
3. Compare: Results with AES
4. Understand: Why certain values are good/bad
5. Time: 30-45 minutes

### Advanced Level
1. Study: `README.md` formulas
2. Analyze: Multiple S-Box variants
3. Research: Original papers (citations in reference)
4. Design: Your own S-Box using findings
5. Time: 2-4 hours+

---

## 💡 TIPS & TRICKS

**Tip 1**: Use "Contoh (AES)" button to test application quickly

**Tip 2**: If analyzing is slow, close other browser tabs

**Tip 3**: Screenshot result or use Ctrl+P to print

**Tip 4**: Copy JSON from "Detail" tab for further analysis

**Tip 5**: Use F12 DevTools to debug or inspect code

**Tip 6**: Bookmark start.html for quick access

**Tip 7**: Save reference.html offline for learning

**Tip 8**: Share results with others using JSON export

---

## 🔐 SECURITY & PRIVACY

✅ **All processing is LOCAL** - Nothing sent to server
✅ **No data collection** - Complete privacy
✅ **Offline capable** - Works without internet
✅ **Open source logic** - All code is visible/auditable
✅ **Safe for research** - Perfect for cryptography work

---

## 📞 TROUBLESHOOTING QUICK FIX

| Problem | Solution |
|---------|----------|
| File won't open | Use Python server instead |
| Slow analysis | Close browser tabs, wait |
| Format error | Use AES example as template |
| Button not work | Reload page (Ctrl+R) |
| Results hidden | Click tabs to view |
| Export not work | Copy-paste from Detail tab |
| Layout broken | Clear cache (Ctrl+Shift+Del) |

---

## 📚 FILE DEPENDENCY MAP

```
start.html
    ↓
    └─→ index.html (main)
            ├─→ sbox-analyzer.js (algorithms)
            └─→ styles.css (styling)
    ├─→ reference.html (learning)
    ├─→ README.md (theory)
    └─→ INSTALL.md (help)

Server (optional):
    run-server.bat or run-server.sh
    └─→ serves all HTML/CSS/JS files
```

---

## ✨ YOU'RE ALL SET!

**Everything is ready to use.** 

### Next Step:
1. Open `start.html` for guided introduction
2. Or jump straight to `index.html` to analyze

**Enjoy analyzing S-Boxes! 🔐**

---

*Created: December 5, 2025*
*For Cryptography Education & Research*
