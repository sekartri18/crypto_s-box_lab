# 🔐 Crypto S-Box Lab — All-in-One README

Single-page web app to construct, analyze, and test S-Boxes (AES-style affine matrices) and try text/image encryption, with clear security metrics.

## **Highlights**
- **S-Box Generation:** Affine matrix + constant over GF(2^8), with AES and K44 presets.
- **Cryptanalysis:** NL, SAC, BIC-NL/BIC-SAC, DU, AD, LAP, TO, CI with quick status.
- **Image Lab:** Encrypt/decrypt images using selected S-Box + key; entropy/NPCR/UACI/correlation.
- **Comparison:** Side-by-side K44 vs AES metrics and winner counts.

## **Setup**
- **Direct:** Open [index.html](index.html) in a modern browser.
- **Local server (Windows):**
```powershell
cd c:\Users\LENOVO\kriptografi
python -m http.server 8000
# Open: http://localhost:8000/index.html
```
- **Local server (Linux/Mac):**
```bash
cd ~/kriptografi
python3 -m http.server 8000
# Open: http://localhost:8000/index.html
```

## **Quick Start**
- Open [index.html](index.html), go to Control Panel.
- Click “Generate & Analyze” to build K44 and AES S-Boxes and see metrics.
- In Text Lab, enter plaintext + key, choose S-Box, click Encrypt/Decrypt.
- In Image Lab, upload image, choose S-Box, enter key, click Encrypt; then Decrypt.

## **Usage Notes**
- **S-Box Input:** 256 unique values, 0–255; hex `0x..` or decimals acceptable.
- **Affine Formula:** S(x) = M × x⁻¹ ⊕ C over GF(2^8) with irreducible polynomial 0x11b.
- **Image Cipher:** Key-mixed substitution with a key-derived permutation; must use the same key and S-Box for decryption.

## **Tabs & Outputs**
- **Generated S-Boxes:** Hex tables for K44 and AES.
- **Metrics:**
    - **NL:** Higher is better; AES ≈ 112.
    - **SAC/BIC:** Target ≈ 0.5; lower deviation is better.
    - **DU:** Ideal = 4; **AD:** ideal ≈ 7.
    - **LAP/TO/CI:** Lower LAP/TO, higher CI preferred.
- **Steps:** Guided summary and recommendations.
- **Comparison:** Winner tallies per metric for K44 vs AES.

## **Image Metrics Expectations**
- **Entropy:** ≈ 8.0 (excellent).
- **NPCR:** > 99% (near total pixel changes).
- **UACI:** ≈ 33.4% (uniform intensity changes).
- **Correlation (enc):** < 0.05 (low adjacency correlation).

## **Troubleshooting**
- **Decrypt looks corrupted:** Ensure the same key and S-Box used for encryption; the app enforces this and shows guidance.
- **S-Box errors:** Must be a 256-length permutation in [0,255].
- **Server issues:** Use Python HTTP server or open directly.

## **File Map**
- **Core UI:** [index.html](index.html), [styles.css](styles.css).
- **S-Box math:** [sbox-constructor.js](sbox-constructor.js) (GF(2^8), affine transform).
- **Analysis:** [sbox-analyzer.js](sbox-analyzer.js) (metrics computation).
- **Image:** [image-encryption.js](image-encryption.js) (cipher + metrics), [ui-extension.js](ui-extension.js) (wiring & UX).
- **Helpers:** [run-server.bat](run-server.bat), [run-server.sh](run-server.sh).

## **References**
- NIST FIPS 197 (AES). Daemen & Rijmen, “The Design of Rijndael.”
- Avalanche, BIC, Differential/Linear Cryptanalysis literature.
- Springer 2024 exploration of affine matrices for AES S-Box.

## **Notes**
- All processing is client-side; no data leaves your machine.
- Educational and research use; not hardened for production.
