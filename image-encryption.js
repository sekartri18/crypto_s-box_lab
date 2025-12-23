// Image Encryption dan Security Metrics
// Entropy dan NPCR (Number of Pixel Change Rate)

class ImageProcessor {
    // Load image dari file
    static async loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    resolve(imageData);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // Convert image data to grayscale array
    static toGrayscaleArray(imageData) {
        const data = imageData.data;
        const gray = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const grayValue = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            gray.push(grayValue);
        }
        return gray;
    }

    // Extract channel dari image
    static getChannel(imageData, channel) {
        const data = imageData.data;
        const result = [];
        for (let i = channel; i < data.length; i += 4) {
            result.push(data[i]);
        }
        return result;
    }

    // Decrypt image menggunakan S-Box
    static encryptImage(imageArray, sbox) {
        if (!Array.isArray(sbox) || sbox.length !== 256) {
            throw new Error('Invalid S-Box');
        }
        return imageArray.map(pixel => sbox[pixel % 256]);
    }

    // Invert S-Box untuk decryption
    static invertSBox(sbox) {
        const inverted = new Array(256);
        for (let i = 0; i < 256; i++) {
            inverted[sbox[i]] = i;
        }
        return inverted;
    }

    // Decrypt image menggunakan inverted S-Box
    static decryptImage(imageArray, sbox) {
        const invertedSBox = this.invertSBox(sbox);
        return imageArray.map(pixel => invertedSBox[pixel % 256]);
    }
}

// Stream cipher for image RGB using S-box + key + permutation
class ImageCipher {
    static fnv1a32(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h >>> 0) * 0x01000193;
        }
        return h >>> 0;
    }

    static xorshift32(seed) {
        let x = seed >>> 0;
        return () => {
            x ^= x << 13; x >>>= 0;
            x ^= x >>> 17; x >>>= 0;
            x ^= x << 5; x >>>= 0;
            return x >>> 0;
        };
    }

    static deriveKeyBytes(key, length = 16) {
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = i < key.length ? key.charCodeAt(i) & 0xFF : 0;
        }
        return bytes;
    }

    static generatePermutation(n, seed) {
        const perm = new Uint32Array(n);
        for (let i = 0; i < n; i++) perm[i] = i;
        const rnd = this.xorshift32(seed);
        for (let i = n - 1; i > 0; i--) {
            const j = rnd() % (i + 1);
            const t = perm[i];
            perm[i] = perm[j];
            perm[j] = t;
        }
        return perm;
    }

    static encryptRGB(rgb, sbox, keyBytes, seed) {
        const n = rgb.length;
        const perm = this.generatePermutation(n, seed);
        const out = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            const k = keyBytes[i % keyBytes.length];
            const v = rgb[i] ^ k;
            out[perm[i]] = sbox[v & 0xFF];
        }
        return out;
    }

    static decryptRGB(rgbEnc, invSbox, keyBytes, seed) {
        const n = rgbEnc.length;
        const perm = this.generatePermutation(n, seed);
        const out = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            const k = keyBytes[i % keyBytes.length];
            const encVal = rgbEnc[perm[i]];
            const v = invSbox[encVal & 0xFF] ^ k;
            out[i] = v & 0xFF;
        }
        return out;
    }

    static encryptImageData(imageData, sbox, key) {
        if (!Array.isArray(sbox) || sbox.length !== 256) throw new Error('Invalid S-Box');
        const invCanvasAlpha = false;
        const keyBytes = this.deriveKeyBytes(key);
        const seed = this.fnv1a32(key + ':' + imageData.width + 'x' + imageData.height);
        const src = imageData.data;
        const rgb = new Uint8Array((src.length / 4) * 3);
        for (let i = 0, j = 0; i < src.length; i += 4) {
            rgb[j++] = src[i];
            rgb[j++] = src[i + 1];
            rgb[j++] = src[i + 2];
        }
        const encRGB = this.encryptRGB(rgb, sbox, keyBytes, seed);
        const out = new Uint8ClampedArray(src.length);
        for (let i = 0, j = 0; i < src.length; i += 4) {
            out[i] = encRGB[j++];
            out[i + 1] = encRGB[j++];
            out[i + 2] = encRGB[j++];
            out[i + 3] = invCanvasAlpha ? (src[i + 3] ^ 0x00) : src[i + 3];
        }
        return new ImageData(out, imageData.width, imageData.height);
    }

    static decryptImageData(imageDataEnc, sbox, key) {
        if (!Array.isArray(sbox) || sbox.length !== 256) throw new Error('Invalid S-Box');
        const invSbox = ImageProcessor.invertSBox(sbox);
        const keyBytes = this.deriveKeyBytes(key);
        const seed = this.fnv1a32(key + ':' + imageDataEnc.width + 'x' + imageDataEnc.height);
        const src = imageDataEnc.data;
        const rgbEnc = new Uint8Array((src.length / 4) * 3);
        for (let i = 0, j = 0; i < src.length; i += 4) {
            rgbEnc[j++] = src[i];
            rgbEnc[j++] = src[i + 1];
            rgbEnc[j++] = src[i + 2];
        }
        const decRGB = this.decryptRGB(rgbEnc, invSbox, keyBytes, seed);
        const out = new Uint8ClampedArray(src.length);
        for (let i = 0, j = 0; i < src.length; i += 4) {
            out[i] = decRGB[j++];
            out[i + 1] = decRGB[j++];
            out[i + 2] = decRGB[j++];
            out[i + 3] = src[i + 3];
        }
        return new ImageData(out, imageDataEnc.width, imageDataEnc.height);
    }
}

class SecurityMetrics {
    // Calculate Information Entropy
    // Entropy ideal = 8 untuk 8-bit image (fully random)
    static calculateEntropy(imageArray) {
        const histogram = new Array(256).fill(0);
        
        // Build histogram
        for (let pixel of imageArray) {
            histogram[pixel]++;
        }
        
        const N = imageArray.length;
        let entropy = 0;
        
        for (let freq of histogram) {
            if (freq > 0) {
                const p = freq / N;
                entropy -= p * Math.log2(p);
            }
        }
        
        return entropy;
    }

    // Calculate NPCR (Number of Pixel Change Rate)
    // Mengukur perubahan pixel antara original dan encrypted
    // NPCR ideal = 99.6% (hampir semua pixel berubah)
    static calculateNPCR(originalArray, encryptedArray) {
        if (originalArray.length !== encryptedArray.length) {
            throw new Error('Arrays must have same length');
        }
        
        let changedPixels = 0;
        for (let i = 0; i < originalArray.length; i++) {
            if (originalArray[i] !== encryptedArray[i]) {
                changedPixels++;
            }
        }
        
        const npcr = (changedPixels / originalArray.length) * 100;
        return npcr;
    }

    // Calculate UACI (Unified Average Changing Intensity)
    // Mengukur rata-rata intensitas perubahan pixel
    // UACI ideal ≈ 33.4% (untuk 8-bit)
    static calculateUACI(originalArray, encryptedArray) {
        if (originalArray.length !== encryptedArray.length) {
            throw new Error('Arrays must have same length');
        }
        
        let sumDiff = 0;
        for (let i = 0; i < originalArray.length; i++) {
            sumDiff += Math.abs(originalArray[i] - encryptedArray[i]);
        }
        
        const uaci = (sumDiff / (originalArray.length * 255)) * 100;
        return uaci;
    }

    // Calculate Pixel Change Rate (simplified NPCR for single-bit changes)
    static calculatePixelChangeRate(array1, array2) {
        return this.calculateNPCR(array1, array2);
    }

    // Calculate correlation coefficient antar pixel
    static calculateCorrelation(imageArray) {
        if (imageArray.length < 2) return 0;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        const n = imageArray.length - 1;
        
        for (let i = 0; i < n; i++) {
            const x = imageArray[i];
            const y = imageArray[i + 1];
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
            sumY2 += y * y;
        }
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        if (denominator === 0) return 0;
        return numerator / denominator;
    }

    static calculateDirectionalCorrelation(imageArray, width, height, dx = 1, dy = 0) {
        if (!width || !height || width * height !== imageArray.length) {
            return this.calculateCorrelation(imageArray);
        }
        let pairs = 0;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= width || ny >= height) continue;
                const idx = y * width + x;
                const nIdx = ny * width + nx;
                const a = imageArray[idx];
                const b = imageArray[nIdx];
                sumX += a;
                sumY += b;
                sumXY += a * b;
                sumX2 += a * a;
                sumY2 += b * b;
                pairs++;
            }
        }
        if (pairs === 0) return 0;
        const numerator = pairs * sumXY - sumX * sumY;
        const denominator = Math.sqrt((pairs * sumX2 - sumX * sumX) * (pairs * sumY2 - sumY * sumY));
        if (denominator === 0) return 0;
        return numerator / denominator;
    }

    static calculateHistogram(imageArray) {
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < imageArray.length; i++) {
            histogram[imageArray[i]]++;
        }
        return histogram;
    }

    static calculateDifferenceMap(originalArray, encryptedArray) {
        if (originalArray.length !== encryptedArray.length) {
            throw new Error('Arrays must have same length');
        }
        const diff = new Array(originalArray.length);
        for (let i = 0; i < originalArray.length; i++) {
            diff[i] = Math.abs(originalArray[i] - encryptedArray[i]);
        }
        return diff;
    }

    // Analyze encryption quality
    static analyzeEncryptionQuality(originalArray, encryptedArray, width = null, height = null) {
        const entropy = this.calculateEntropy(encryptedArray);
        const npcr = this.calculateNPCR(originalArray, encryptedArray);
        const uaci = this.calculateUACI(originalArray, encryptedArray);
        const originalCorr = this.calculateCorrelation(originalArray);
        const encryptedCorr = this.calculateCorrelation(encryptedArray);
        const corrH = this.calculateDirectionalCorrelation(encryptedArray, width, height, 1, 0);
        const corrV = this.calculateDirectionalCorrelation(encryptedArray, width, height, 0, 1);
        const corrD = this.calculateDirectionalCorrelation(encryptedArray, width, height, 1, 1);
        
        return {
            entropy: {
                value: entropy,
                ideal: 8.0,
                status: entropy > 7.99 ? 'Excellent' : entropy > 7.90 ? 'Good' : entropy > 7.50 ? 'Acceptable' : 'Poor'
            },
            npcr: {
                value: npcr,
                ideal: 99.6,
                status: npcr > 99.5 ? 'Excellent' : npcr > 99.0 ? 'Good' : npcr > 95.0 ? 'Acceptable' : 'Poor'
            },
            uaci: {
                value: uaci,
                ideal: 33.4,
                status: Math.abs(uaci - 33.4) < 1.0 ? 'Excellent' : Math.abs(uaci - 33.4) < 3.0 ? 'Good' : 'Acceptable'
            },
            correlation: {
                original: originalCorr,
                encrypted: encryptedCorr,
                reduction: originalCorr - encryptedCorr,
                status: encryptedCorr < 0.05 ? 'Excellent' : encryptedCorr < 0.10 ? 'Good' : 'Needs improvement'
            },
            directionalCorrelation: {
                horizontal: corrH,
                vertical: corrV,
                diagonal: corrD
            },
            histogram: {
                original: this.calculateHistogram(originalArray),
                encrypted: this.calculateHistogram(encryptedArray)
            }
        };
    }
}

// Test image generation untuk demo
class TestImageGenerator {
    // Generate simple test image (grayscale)
    static generateTestImage(width = 256, height = 256) {
        const image = new Array(width * height);
        for (let i = 0; i < image.length; i++) {
            image[i] = i % 256;
        }
        return image;
    }

    // Generate gradient test image
    static generateGradient(width = 256, height = 256) {
        const image = new Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                image[idx] = (x + y) % 256;
            }
        }
        return image;
    }

    // Generate checkerboard pattern
    static generateCheckerboard(width = 256, height = 256, squareSize = 16) {
        const image = new Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const squareX = Math.floor(x / squareSize);
                const squareY = Math.floor(y / squareSize);
                image[idx] = ((squareX + squareY) % 2) * 255;
            }
        }
        return image;
    }
}

// Export untuk Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ImageProcessor,
        SecurityMetrics,
        TestImageGenerator
    };
}
