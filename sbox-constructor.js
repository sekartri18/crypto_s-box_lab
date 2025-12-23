// S-Box Constructor dengan Affine Matrix Modification
// Berdasarkan paper: S-box Construction on AES Algorithm using Affine Matrix Modification

// Define GaloisField FIRST (used by AESInverse)
class GaloisField {
    constructor(polynomial) {
        this.poly = polynomial;
        this.expTable = new Array(512);
        this.logTable = new Array(256);
        this.generateTables();
    }

    // Generate logarithm dan exponential tables
    generateTables() {
        const mul = (a, b) => {
            let p = 0;
            for (let i = 0; i < 8; i++) {
                if (b & 1) p ^= a;
                const hi = a & 0x80;
                a = (a << 1) & 0xFF;
                if (hi) a ^= 0x1b; // modulo x^8 + x^4 + x^3 + x + 1
                b >>= 1;
            }
            return p;
        };

        let x = 1;
        for (let i = 0; i < 256; i++) {
            this.expTable[i] = x;
            this.logTable[x] = i;
            x = mul(x, 0x03); // use generator 0x03 for full 255-cycle
        }

        for (let i = 256; i < 512; i++) {
            this.expTable[i] = this.expTable[i - 256];
        }
        this.logTable[0] = 0;
    }

    // Perkalian dalam GF(2^8)
    multiply(a, b) {
        if (a === 0 || b === 0) return 0;
        return this.expTable[this.logTable[a] + this.logTable[b]];
    }

    // Invers dalam GF(2^8)
    inverse(a) {
        if (a === 0) return 0;
        return this.expTable[255 - this.logTable[a]];
    }

    // Penjumlahan dalam GF(2^8) (XOR)
    add(a, b) {
        return a ^ b;
    }
}

// AESInverse class (uses GaloisField)
class AESInverse {
    constructor() {
        this.field = new GaloisField(0x11b); // AES irreducible polynomial
    }

    // Hitung invers multiplikatif dalam GF(2^8)
    multiplicativeInverse(x) {
        if (x === 0) return 0;
        return this.field.inverse(x);
    }

    // Generate inverse matrix S-Box
    generateInverseMatrix() {
        const sbox = new Array(256);
        for (let i = 0; i < 256; i++) {
            sbox[i] = this.multiplicativeInverse(i);
        }
        return sbox;
    }
}

class AffineTransformation {
    constructor(matrix, constant) {
        this.matrix = matrix; // 8x8 binary matrix
        this.constant = constant; // 8-bit constant
    }

    // Apply affine transformation to byte
    transform(byte) {
        let result = 0;
        
        // Apply matrix transformation
        for (let i = 0; i < 8; i++) {
            let bit = 0;
            for (let j = 0; j < 8; j++) {
                if (this.matrix[i][j] === 1) {
                    bit ^= (byte >> j) & 1;
                }
            }
            result |= (bit << i);
        }
        
        // XOR with constant
        result ^= this.constant;
        
        return result;
    }

    // Apply transformation to array
    transformArray(array) {
        return array.map(byte => this.transform(byte));
    }
}

class SBoxConstructor {
    constructor() {
        this.aesInverse = new AESInverse();
        this.gf = new GaloisField(0x11b);
        
        // Preset affine matrices dari paper penelitian
        this.affineMatrices = this.getAffineMatrices();
        this.affineConstants = [0x63, 0x64, 0x65]; // Dari paper: 8-bit additional constants
    }

    // Get preset affine matrices (3 best matrices dari paper)
    getAffineMatrices() {
        // Matrix 1 (AES standard)
        const matrix1 = [
            [1, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 1, 1, 1],
            [1, 1, 1, 0, 0, 0, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 1, 1, 1, 1, 1]
        ];

        // Matrix 2 (Modified - untuk S-box2)
        const matrix2 = [
            [1, 1, 0, 0, 0, 1, 1, 1],
            [1, 1, 1, 0, 0, 0, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 1, 1, 1]
        ];

        // Matrix 3 (Modified - untuk S-box3)
        const matrix3 = [
            [1, 1, 1, 0, 0, 0, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 1, 1, 1]
        ];

        return [matrix1, matrix2, matrix3];
    }

    // Construct single S-Box with given affine matrix and constant
    constructSBox(affineMatrixIndex, constantIndex) {
        if (affineMatrixIndex < 0 || affineMatrixIndex > 2) {
            throw new Error('Invalid affine matrix index (0-2)');
        }
        if (constantIndex < 0 || constantIndex > 2) {
            throw new Error('Invalid constant index (0-2)');
        }

        const affineMatrix = this.affineMatrices[affineMatrixIndex];
        const affineConstant = this.affineConstants[constantIndex];
        
        // Step 1: Generate inverse in GF(2^8)
        const inverseMatrix = this.aesInverse.generateInverseMatrix();
        
        // Step 2: Create affine transformation
        const affineTransform = new AffineTransformation(affineMatrix, affineConstant);
        
        // Step 3: Apply affine transformation to inverse matrix
        const sbox = affineTransform.transformArray(inverseMatrix);
        
        return sbox;
    }

    // Construct all 3 S-Boxes from paper
    constructAllSBoxes() {
        const sboxes = {
            sbox1: this.constructSBox(0, 0), // Matrix1, Constant1 (0x63 - AES default)
            sbox2: this.constructSBox(1, 1), // Matrix2, Constant2 (0x64)
            sbox3: this.constructSBox(2, 2)  // Matrix3, Constant3 (0x65)
        };
        
        return sboxes;
    }

    // Construct custom S-Box
    constructCustom(affineMatrixIndex, constantValue) {
        const affineMatrix = this.affineMatrices[affineMatrixIndex];
        const inverseMatrix = this.aesInverse.generateInverseMatrix();
        const affineTransform = new AffineTransformation(affineMatrix, constantValue);
        const sbox = affineTransform.transformArray(inverseMatrix);
        
        return sbox;
    }

    // Get affine matrix as string for display
    getAffineMatrixString(index) {
        if (index < 0 || index > 2) return '';
        const matrix = this.affineMatrices[index];
        return matrix.map(row => row.join('')).join('\n');
    }

    // Get all affine matrices
    getAllAffineMatrices() {
        return this.affineMatrices;
    }

    // Get all constants
    getAllConstants() {
        return this.affineConstants;
    }
}

// ===== Affine Exploration Utilities (Springer 2024-aligned) =====
function randomBinaryMatrix8() {
    const m = new Array(8);
    for (let i = 0; i < 8; i++) {
        m[i] = new Array(8);
        for (let j = 0; j < 8; j++) {
            m[i][j] = (Math.random() < 0.5) ? 0 : 1;
        }
    }
    return m;
}

function isInvertibleGF2(matrix) {
    // Gaussian elimination mod 2
    const a = matrix.map(row => row.slice());
    let rank = 0;
    for (let col = 0; col < 8; col++) {
        let pivot = -1;
        for (let r = rank; r < 8; r++) {
            if (a[r][col] === 1) { pivot = r; break; }
        }
        if (pivot === -1) continue;
        // swap rows
        if (pivot !== rank) {
            const tmp = a[pivot]; a[pivot] = a[rank]; a[rank] = tmp;
        }
        // eliminate other rows
        for (let r = 0; r < 8; r++) {
            if (r !== rank && a[r][col] === 1) {
                for (let c = col; c < 8; c++) a[r][c] ^= a[rank][c];
            }
        }
        rank++;
        if (rank === 8) break;
    }
    return rank === 8;
}

function applyAffineByte(matrix, constant, byte) {
    let result = 0;
    for (let i = 0; i < 8; i++) {
        let bit = 0;
        for (let j = 0; j < 8; j++) {
            if (matrix[i][j] === 1) bit ^= (byte >> j) & 1;
        }
        result |= (bit << i);
    }
    result ^= constant;
    return result & 0xFF;
}

function constructSBoxFromMatrix(matrix, constant) {
    const inv = new AESInverse().generateInverseMatrix();
    const sbox = new Array(256);
    for (let i = 0; i < 256; i++) sbox[i] = applyAffineByte(matrix, constant, inv[i]);
    // ensure permutation (bijective)
    const seen = new Array(256).fill(false);
    for (let i = 0; i < 256; i++) {
        const v = sbox[i];
        if (seen[v]) return null; // not bijective
        seen[v] = true;
    }
    return sbox;
}

function isBalancedSBox(sbox) {
    for (let bit = 0; bit < 8; bit++) {
        let ones = 0;
        for (let i = 0; i < 256; i++) ones += (sbox[i] >> bit) & 1;
        if (ones !== 128) return false;
    }
    return true;
}

// Parse 8x8 binary matrix from textarea input
function parseBinaryMatrix8(text) {
    if (!text) throw new Error('Matrix text kosong');
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length !== 8) throw new Error('Harus 8 baris');
    const matrix = [];
    for (let i = 0; i < 8; i++) {
        let line = lines[i].trim();
        // allow spaces between bits or compact 8 chars
        const bits = line.replace(/[^01]/g, '');
        if (bits.length !== 8) throw new Error(`Baris ${i + 1} harus 8 bit 0/1`);
        matrix.push(bits.split('').map(c => c === '1' ? 1 : 0));
    }
    return matrix;
}

function validateBinaryMatrix8(matrix) {
    if (!Array.isArray(matrix) || matrix.length !== 8) return false;
    for (let i = 0; i < 8; i++) {
        if (!Array.isArray(matrix[i]) || matrix[i].length !== 8) return false;
        for (let j = 0; j < 8; j++) {
            const v = matrix[i][j];
            if (!(v === 0 || v === 1)) return false;
        }
    }
    return true;
}

if (typeof window !== 'undefined') {
    window.randomBinaryMatrix8 = randomBinaryMatrix8;
    window.isInvertibleGF2 = isInvertibleGF2;
    window.constructSBoxFromMatrix = constructSBoxFromMatrix;
    window.isBalancedSBox = isBalancedSBox;
    window.parseBinaryMatrix8 = parseBinaryMatrix8;
    window.validateBinaryMatrix8 = validateBinaryMatrix8;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.randomBinaryMatrix8 = randomBinaryMatrix8;
    module.exports.isInvertibleGF2 = isInvertibleGF2;
    module.exports.constructSBoxFromMatrix = constructSBoxFromMatrix;
    module.exports.isBalancedSBox = isBalancedSBox;
    module.exports.parseBinaryMatrix8 = parseBinaryMatrix8;
    module.exports.validateBinaryMatrix8 = validateBinaryMatrix8;
}
// Export untuk Node.js jika digunakan di backend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SBoxConstructor,
        AESInverse,
        GaloisField,
        AffineTransformation
    };
}
