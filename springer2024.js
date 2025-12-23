// Generic Chaotic-based S-Box and Image Encryption (Springer 2024 profile placeholder)
// NOTE: This implements a commonly used chaotic approach (generic).
// To exactly match the target paper, plug in the paper's specific chaotic map,
// parameters, and pipeline where marked.

class ChaoticUtils {
    static mod1(x) { return x - Math.floor(x); }

    // 2D logistic-sine hybrid (generic placeholder)
    // x_{n+1} = sin(pi * (a * x_n + (1-a) * y_n))
    // y_{n+1} = r * y_n * (1 - y_n)
    static iterate2D(x0 = 0.345678, y0 = 0.678901, a = 0.7, r = 3.99, n = 256 + 100) {
        let x = this.mod1(x0);
        let y = this.mod1(y0);
        const seqX = [];
        const seqY = [];
        const burnIn = 100; // discard transient
        for (let i = 0; i < n; i++) {
            const xn = Math.abs(Math.sin(Math.PI * (a * x + (1 - a) * y)));
            const yn = r * y * (1 - y);
            x = this.mod1(xn);
            y = this.mod1(yn);
            if (i >= burnIn) {
                seqX.push(x);
                seqY.push(y);
            }
        }
        return { seqX, seqY };
    }

    // Build a permutation S-Box from a chaotic sequence by rank-order
    static buildPermutationFromSequence(seq) {
        const n = 256;
        const pairs = new Array(n);
        for (let i = 0; i < n; i++) pairs[i] = { val: seq[i], idx: i };
        pairs.sort((a, b) => a.val - b.val);
        const sbox = new Array(n);
        for (let rank = 0; rank < n; rank++) {
            sbox[pairs[rank].idx] = rank;
        }
        return sbox;
    }

    static toByteSequence(seq) { // map [0,1) to [0..255]
        return seq.map(v => Math.floor(this.mod1(v) * 256) & 0xFF);
    }
}

class Springer2024SBoxBuilder {
    constructor(params = {}) {
        this.params = {
            x0: params.x0 ?? 0.345678,
            y0: params.y0 ?? 0.678901,
            a: params.a ?? 0.7,
            r: params.r ?? 3.99,
        };
    }

    // Construct a 256-entry permutation S-Box
    construct() {
        const { x0, y0, a, r } = this.params;
        const { seqX } = ChaoticUtils.iterate2D(x0, y0, a, r, 256 + 100);
        const sbox = ChaoticUtils.buildPermutationFromSequence(seqX);
        return sbox;
    }
}

class ChaoticImageEncryptor {
    constructor(params = {}) {
        this.params = {
            x0: params.x0 ?? 0.234567,
            y0: params.y0 ?? 0.789012,
            a: params.a ?? 0.7,
            r: params.r ?? 3.99,
        };
    }

    // Permutation + Diffusion using chaotic sequences (generic)
    encryptPixels(grayArray, sbox) {
        const n = grayArray.length;
        const width = Math.floor(Math.sqrt(n));
        const height = Math.ceil(n / Math.max(width, 1));

        const needed = Math.max(n, 256) + 100;
        const { seqX, seqY } = ChaoticUtils.iterate2D(this.params.x0, this.params.y0, this.params.a, this.params.r, needed);

        // Permutation indices derived from seqY
        const permPairs = new Array(n);
        for (let i = 0; i < n; i++) permPairs[i] = { val: seqY[i % seqY.length], idx: i };
        permPairs.sort((a, b) => a.val - b.val);
        const permuted = new Array(n);
        for (let newPos = 0; newPos < n; newPos++) {
            const oldPos = permPairs[newPos].idx;
            permuted[newPos] = grayArray[oldPos];
        }

        // Diffusion + S-Box substitution with seqX-derived keystream
        const ks = ChaoticUtils.toByteSequence(seqX);
        const out = new Array(n);
        let prev = 0;
        for (let i = 0; i < n; i++) {
            const p = permuted[i];
            const sub = sbox ? sbox[p] : p;
            const k = ks[i % ks.length];
            const c = (sub ^ k ^ prev) & 0xFF;
            out[i] = c;
            prev = c;
        }
        return { cipher: out, width, height };
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.Springer2024SBoxBuilder = Springer2024SBoxBuilder;
    window.ChaoticImageEncryptor = ChaoticImageEncryptor;
}

// Export untuk Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChaoticUtils,
        Springer2024SBoxBuilder,
        ChaoticImageEncryptor,
    };
}
