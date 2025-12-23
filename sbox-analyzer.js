// S-Box Analyzer
class SBoxAnalyzer {
    constructor(sbox) {
        this.sbox = sbox; // Array of 256 8-bit values
        this.n = 8; // input/output size
        this.m = 8; // output size
    }

    // Parse input and validate
    static parseSBox(input) {
        let values = [];
        
        // Remove common delimiters and split
        const cleaned = input.replace(/[,;:\s\n\r]+/g, ' ').trim();
        const parts = cleaned.split(/\s+/);
        
        for (let part of parts) {
            let num = -1;
            
            // Try hex format (0x prefix)
            if (part.toLowerCase().startsWith('0x')) {
                num = parseInt(part, 16);
            } else {
                // Try decimal
                num = parseInt(part, 10);
            }
            
            if (isNaN(num) || num < 0 || num > 255) {
                throw new Error(`Invalid value: "${part}"`);
            }
            values.push(num);
        }
        
        if (values.length !== 256) {
            throw new Error(`S-Box must have exactly 256 values. Got ${values.length}`);
        }
        
        // Check if all values 0-255 are present (permutation)
        const sorted = [...values].sort((a, b) => a - b);
        for (let i = 0; i < 256; i++) {
            if (sorted[i] !== i) {
                throw new Error('S-Box is not a valid permutation (missing or duplicate values)');
            }
        }
        
        return values;
    }

    // Hamming Weight - count number of 1 bits
    hammingWeight(x) {
        let count = 0;
        while (x) {
            count += x & 1;
            x >>= 1;
        }
        return count;
    }

    // Hamming Distance between two values
    hammingDistance(x, y) {
        return this.hammingWeight(x ^ y);
    }

    // Get bit from position
    getBit(value, position) {
        return (value >> position) & 1;
    }

    // Calculate Nonlinearity for single output bit
    calculateNonlinearityBit(outputBit) {
        // For each input, determine output bit
        const outputBits = [];
        for (let i = 0; i < 256; i++) {
            const outputValue = this.sbox[i];
            const bit = this.getBit(outputValue, outputBit);
            outputBits.push(bit);
        }
        
        // Try all linear functions: f(x) = c0*x[0] + c1*x[1] + ... + c7*x[7] + c8
        let minDistance = 256;
        
        for (let linearMask = 0; linearMask < 512; linearMask++) { // 2^9 for mask + constant
            let constant = (linearMask >> 8) & 1;
            let mask = linearMask & 0xFF;
            
            let distance = 0;
            for (let i = 0; i < 256; i++) {
                let linearOutput = (this.hammingWeight(i & mask) + constant) & 1;
                distance += outputBits[i] === linearOutput ? 0 : 1;
            }
            
            minDistance = Math.min(minDistance, distance);
        }
        
        // Nonlinearity is minimum distance
        return minDistance;
    }

    // Calculate Nonlinearity (NL) - average for all output bits
    calculateNonlinearity() {
        let totalNL = 0;
        let nlPerBit = [];
        
        for (let bit = 0; bit < 8; bit++) {
            const nl = this.calculateNonlinearityBit(bit);
            nlPerBit.push(nl);
            totalNL += nl;
        }
        
        return {
            average: totalNL / 8,
            perBit: nlPerBit
        };
    }

    // Calculate Strict Avalanche Criterion (SAC)
    calculateSAC() {
        const sacResults = [];
        
        for (let inputBit = 0; inputBit < 8; inputBit++) {
            for (let outputBit = 0; outputBit < 8; outputBit++) {
                let count = 0;
                
                // Flip each input bit and check output
                for (let i = 0; i < 256; i++) {
                    const flipped = i ^ (1 << inputBit);
                    const out1 = this.getBit(this.sbox[i], outputBit);
                    const out2 = this.getBit(this.sbox[flipped], outputBit);
                    
                    if (out1 !== out2) {
                        count++;
                    }
                }
                
                // SAC for this pair (should be close to 128 out of 256)
                const sacValue = (count / 256) * 100;
                sacResults.push({
                    inputBit: inputBit,
                    outputBit: outputBit,
                    count: count,
                    percentage: sacValue
                });
            }
        }
        
        return sacResults;
    }

    // Calculate Bit Independence Criterion (BIC)
    calculateBIC() {
        // BIC-NL: Nonlinearity of XOR of output bit pairs
        const bicNL = [];
        for (let i = 0; i < 8; i++) {
            for (let j = i + 1; j < 8; j++) {
                // Create XOR of bits i and j
                let totalNL = 0;
                
                for (let linearMask = 0; linearMask < 512; linearMask++) {
                    let constant = (linearMask >> 8) & 1;
                    let mask = linearMask & 0xFF;
                    
                    let distance = 0;
                    for (let x = 0; x < 256; x++) {
                        const out1 = this.getBit(this.sbox[x], i);
                        const out2 = this.getBit(this.sbox[x], j);
                        const xorBit = out1 ^ out2;
                        const linearOutput = (this.hammingWeight(x & mask) + constant) & 1;
                        distance += xorBit === linearOutput ? 0 : 1;
                    }
                    
                    totalNL = Math.max(totalNL, Math.min(distance, 256 - distance));
                }
                
                bicNL.push({
                    bit1: i,
                    bit2: j,
                    nl: totalNL
                });
            }
        }
        
        // BIC-SAC: SAC of XOR of output bit pairs
        const bicSAC = [];
        for (let i = 0; i < 8; i++) {
            for (let j = i + 1; j < 8; j++) {
                for (let inputBit = 0; inputBit < 8; inputBit++) {
                    let count = 0;
                    
                    for (let x = 0; x < 256; x++) {
                        const xFlipped = x ^ (1 << inputBit);
                        const out1 = this.getBit(this.sbox[x], i) ^ this.getBit(this.sbox[x], j);
                        const out2 = this.getBit(this.sbox[xFlipped], i) ^ this.getBit(this.sbox[xFlipped], j);
                        
                        if (out1 !== out2) count++;
                    }
                    
                    bicSAC.push({
                        bit1: i,
                        bit2: j,
                        inputBit: inputBit,
                        percentage: (count / 256) * 100
                    });
                }
            }
        }
        
        return { bicNL, bicSAC };
    }

    // Calculate Differential Uniformity (DU)
    calculateDifferentialUniformity() {
        let maxDU = 0;
        const duTable = {};
        
        for (let delta = 1; delta < 256; delta++) {
            let maxCount = 0;
            
            for (let x = 0; x < 256; x++) {
                const xDelta = x ^ delta;
                const sBoxX = this.sbox[x];
                const sBoxXDelta = this.sbox[xDelta];
                const outputDelta = sBoxX ^ sBoxXDelta;
                
                // Count how many x values give same output delta
                let count = 0;
                for (let y = 0; y < 256; y++) {
                    const yDelta = y ^ delta;
                    if ((this.sbox[y] ^ this.sbox[yDelta]) === outputDelta) {
                        count++;
                    }
                }
                
                maxCount = Math.max(maxCount, count);
            }
            
            maxDU = Math.max(maxDU, maxCount);
            if (!duTable[delta]) duTable[delta] = maxCount;
        }
        
        return { maxDU, duTable };
    }

    // Calculate Linear Approximation Probability (LAP)
    calculateLAP() {
        let maxLAP = 0;
        let lapCount = 0;
        
        for (let inputMask = 1; inputMask < 256; inputMask++) {
            for (let outputMask = 1; outputMask < 256; outputMask++) {
                let count = 0;
                
                for (let x = 0; x < 256; x++) {
                    const y = this.sbox[x];
                    const xDotMask = this.hammingWeight(x & inputMask) & 1;
                    const yDotMask = this.hammingWeight(y & outputMask) & 1;
                    
                    if (xDotMask === yDotMask) count++;
                }
                
                const lap = Math.abs(count - 128) / 256;
                maxLAP = Math.max(maxLAP, lap);
                
                if (lap > 0.3) lapCount++;
            }
        }
        
        return { maxLAP, lapCount };
    }

    // Calculate Algebraic Degree (AD)
    calculateAlgebraicDegree() {
        let maxDegree = 0;
        const degrees = [];
        
        for (let outputBit = 0; outputBit < 8; outputBit++) {
            // Create truth table for this output bit
            const truthTable = [];
            for (let x = 0; x < 256; x++) {
                truthTable.push(this.getBit(this.sbox[x], outputBit));
            }
            
            // Calculate algebraic degree using Möbius transform
            let degree = 0;
            
            // Check each possible subset (simple approximation)
            for (let i = 1; i < 256; i++) {
                let moebius = 0;
                for (let j = 0; j < 256; j++) {
                    if ((j & i) === i) {
                        moebius ^= truthTable[j];
                    }
                }
                if (moebius) {
                    degree = Math.max(degree, this.hammingWeight(i));
                }
            }
            
            degrees.push(degree);
            maxDegree = Math.max(maxDegree, degree);
        }
        
        return { maxDegree, perBit: degrees };
    }

    // Calculate Transparency Order (TO)
    calculateTransparencyOrder() {
        let maxTO = 0;
        
        for (let bit = 0; bit < 8; bit++) {
            // Create truth table for this bit
            const truthTable = [];
            for (let x = 0; x < 256; x++) {
                truthTable.push(this.getBit(this.sbox[x], bit));
            }
            
            // Count balance properties
            let balance = 0;
            for (let i = 0; i < 256; i++) {
                balance += truthTable[i];
            }
            
            // TO approximation based on balance deviation from 128
            const to = Math.abs(balance - 128) / 256;  // Normalize to 0-1
            maxTO = Math.max(maxTO, to);
        }
        
        return maxTO;
    }

    // Calculate Correlation Immunity (CI)
    calculateCorrelationImmunity() {
        let maxCI = 0;
        
        for (let outputBit = 0; outputBit < 8; outputBit++) {
            // For each subset of input variables
            for (let subset = 1; subset < 256; subset++) {
                let isIndependent = true;
                const subsetSize = this.hammingWeight(subset);
                
                // Check if this output bit depends on this subset
                for (let x = 0; x < 256; x++) {
                    const y1 = this.sbox[x];
                    const x2 = x ^ subset;
                    const y2 = this.sbox[x2];
                    
                    if (this.getBit(y1, outputBit) !== this.getBit(y2, outputBit)) {
                        isIndependent = false;
                        break;
                    }
                }
                
                if (isIndependent && subsetSize > 0) {
                    maxCI = Math.max(maxCI, subsetSize);
                }
            }
        }
        
        return maxCI;
    }

    // Calculate Differential Algebraic Probability (DAP)
    // DAP = Differential Uniformity / 256
    calculateDAP() {
        const du = this.calculateDifferentialUniformity();
        return du.maxDU / 256;
    }

    // Calculate Max Cycle Length (MCL)
    calculateMaxCycleLength() {
        const visited = new Set();
        let maxCycleLength = 0;
        
        for (let start = 0; start < 256; start++) {
            if (visited.has(start)) continue;
            
            let current = start;
            let cycleLength = 0;
            const cycleStart = new Set();
            
            while (!cycleStart.has(current)) {
                cycleStart.add(current);
                visited.add(current);
                current = this.sbox[current];
                cycleLength++;
            }
            
            // Find where cycle actually starts
            let cycleStart2 = current;
            let realCycleLength = 1;
            current = this.sbox[current];
            
            while (current !== cycleStart2) {
                current = this.sbox[current];
                realCycleLength++;
            }
            
            maxCycleLength = Math.max(maxCycleLength, realCycleLength);
        }
        
        return maxCycleLength;  // Return as raw integer (0-256)
    }

    // Count Fixed Points
    countFixedPoints() {
        let count = 0;
        for (let x = 0; x < 256; x++) {
            if (this.sbox[x] === x) {
                count++;
            }
        }
        return count;
    }

    // Calculate Strength Value (SV)
    calculateStrengthValue() {
        // SV = sqrt(sum of all LAP probabilities squared)
        let sumSquares = 0;
        
        for (let inputMask = 0; inputMask < 256; inputMask++) {
            for (let outputMask = 0; outputMask < 256; outputMask++) {
                let count = 0;
                
                for (let x = 0; x < 256; x++) {
                    const y = this.sbox[x];
                    const xDotMask = this.hammingWeight(x & inputMask) & 1;
                    const yDotMask = this.hammingWeight(y & outputMask) & 1;
                    
                    if (xDotMask === yDotMask) count++;
                }
                
                const lap = (count - 128) / 256;
                sumSquares += lap * lap;
            }
        }
        
        return Math.sqrt(sumSquares / 65536);
    }

    // Perform complete analysis
    analyze() {
        return {
            nonlinearity: this.calculateNonlinearity(),
            sac: this.calculateSAC(),
            bic: this.calculateBIC(),
            du: this.calculateDifferentialUniformity(),
            lap: this.calculateLAP(),
            ad: this.calculateAlgebraicDegree(),
            to: this.calculateTransparencyOrder(),
            ci: this.calculateCorrelationImmunity(),
            dap: this.calculateDAP(),
            maxCycleLength: this.calculateMaxCycleLength(),
            fixedPoints: this.countFixedPoints(),
            strengthValue: this.calculateStrengthValue()
        };
    }
}

// AES S-Box reference
const AES_SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5e, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xd7, 0x4b, 0x55, 0xcf, 0x34, 0xc5, 0x84,
    0xcb, 0xb9, 0xd0, 0xf7, 0x8f, 0xe3, 0xe6, 0xc3, 0x9f, 0xd1, 0x95, 0x76, 0xa4, 0xc2, 0xe7, 0x3d,
    0xd8, 0xfb, 0x05, 0xd9, 0x0e, 0xfe, 0xd3, 0xd4, 0xd2, 0xf5, 0x9b, 0x0f, 0x3b, 0x0d, 0x52, 0xa5,
    0xdf, 0xb5, 0x0f, 0xee, 0xbc, 0x1b, 0x68, 0xa6, 0xc6, 0x63, 0xfb, 0xd9, 0xf0, 0xd4, 0x1f, 0xd9
];

// Global variable to store analysis results
let currentAnalysis = null;

// Main analyze function
function analyzeSBox() {
    try {
        // Get input and clear errors
        const input = document.getElementById('sbox-input').value;
        hideError();
        
        if (!input.trim()) {
            showError('Mohon masukkan nilai S-Box');
            return;
        }
        
        // Parse S-Box
        const sbox = SBoxAnalyzer.parseSBox(input);
        
        // Create analyzer and analyze
        const analyzer = new SBoxAnalyzer(sbox);
        currentAnalysis = analyzer.analyze();
        
        // Display results
        displayResults();
        document.getElementById('results-section').style.display = 'block';
        
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

// Display results in UI
function displayResults() {
    if (!currentAnalysis) return;
    
    displayOverview();
    displayNL();
    displaySAC();
    displayBIC();
    displayLAP();
    displayDU();
    displayTO();
    displayDetails();
    generateSteps();
}

function displayOverview() {
    const nl = currentAnalysis.nonlinearity;
    const sac = currentAnalysis.sac;
    const bic = currentAnalysis.bic;
    const du = currentAnalysis.du;
    const ad = currentAnalysis.ad;
    const ci = currentAnalysis.ci;
    const lap = currentAnalysis.lap;
    
    document.getElementById('nl-avg').textContent = nl.average.toFixed(2);
    
    const sacValues = sac.map(s => s.percentage);
    document.getElementById('sac-min').textContent = Math.min(...sacValues).toFixed(2);
    document.getElementById('sac-max').textContent = Math.max(...sacValues).toFixed(2);
    
    document.getElementById('du-value').textContent = du.maxDU;
    document.getElementById('ad-value').textContent = ad.maxDegree;
    document.getElementById('ci-value').textContent = ci;
    
    let summaryHTML = '<h4>Analisis Ringkas:</h4>';
    summaryHTML += `<p><strong>Nonlinearity:</strong> Rata-rata ${nl.average.toFixed(2)} per output bit. `;
    summaryHTML += nl.average > 100 ? '✓ Baik' : '✗ Perlu ditingkatkan';
    summaryHTML += `</p>`;
    
    summaryHTML += `<p><strong>SAC:</strong> Minimum ${Math.min(...sacValues).toFixed(2)}%, Maximum ${Math.max(...sacValues).toFixed(2)}%. `;
    const sacGood = sacValues.every(v => Math.abs(v - 50) < 10);
    summaryHTML += sacGood ? '✓ Baik - Mendekati 50%' : '✗ Ada yang menyimpang dari 50%';
    summaryHTML += `</p>`;
    
    summaryHTML += `<p><strong>Differential Uniformity:</strong> ${du.maxDU}. `;
    summaryHTML += du.maxDU <= 4 ? '✓ Baik' : '✗ Kurang optimal';
    summaryHTML += `</p>`;
    
    summaryHTML += `<p><strong>Algebraic Degree:</strong> ${ad.maxDegree}. `;
    summaryHTML += ad.maxDegree >= 6 ? '✓ Baik' : '✗ Terlalu rendah';
    summaryHTML += `</p>`;
    
    summaryHTML += `<p><strong>Correlation Immunity:</strong> Order ${ci}. `;
    summaryHTML += ci >= 1 ? '✓ Ada resistansi' : '✗ Tidak ada resistansi';
    summaryHTML += `</p>`;
    
    document.getElementById('summary-text').innerHTML = summaryHTML;
}

function displayNL() {
    const nl = currentAnalysis.nonlinearity;
    let html = `<p><strong>Nonlinearity (Rata-rata):</strong> ${nl.average.toFixed(2)}</p>`;
    html += '<p><strong>Nonlinearity per Output Bit:</strong></p>';
    html += '<table class="metrics-table"><thead><tr><th>Output Bit</th><th>Nonlinearity</th></tr></thead><tbody>';
    nl.perBit.forEach((value, index) => {
        html += `<tr><td>Bit ${index}</td><td>${value}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('nl-results').innerHTML = html;
}

function displaySAC() {
    const sac = currentAnalysis.sac;
    let html = '<p><strong>SAC Values (% output bits yang berubah):</strong></p>';
    html += '<table class="metrics-table"><thead><tr><th>Input Bit</th><th>Output Bit</th><th>Perubahan</th><th>Persentase</th></tr></thead><tbody>';
    
    sac.slice(0, 64).forEach(s => {
        const status = Math.abs(s.percentage - 50) < 10 ? '✓' : '✗';
        html += `<tr><td>Bit ${s.inputBit}</td><td>Bit ${s.outputBit}</td><td>${s.count}/256</td><td>${s.percentage.toFixed(2)}% ${status}</td></tr>`;
    });
    
    html += '</tbody></table>';
    if (sac.length > 64) {
        html += `<p>... dan ${sac.length - 64} baris lainnya</p>`;
    }
    
    document.getElementById('sac-results').innerHTML = html;
}

function displayBIC() {
    const bic = currentAnalysis.bic;
    let html = '<h4>BIC-NL (Nonlinearity of XOR pairs):</h4>';
    html += '<table class="metrics-table"><thead><tr><th>Bit 1</th><th>Bit 2</th><th>NL</th></tr></thead><tbody>';
    
    bic.bicNL.forEach(item => {
        html += `<tr><td>${item.bit1}</td><td>${item.bit2}</td><td>${item.nl}</td></tr>`;
    });
    
    html += '</tbody></table>';
    html += '<h4>BIC-SAC Summary (Rata-rata per Input Bit Pair):</h4>';
    
    // Calculate average SAC for each bit pair
    const bicSACMap = {};
    bic.bicSAC.forEach(item => {
        const key = `${item.bit1}-${item.bit2}`;
        if (!bicSACMap[key]) bicSACMap[key] = [];
        bicSACMap[key].push(item.percentage);
    });
    
    html += '<table class="metrics-table"><thead><tr><th>Bit Pair</th><th>Rata-rata SAC</th></tr></thead><tbody>';
    Object.entries(bicSACMap).forEach(([pair, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const status = Math.abs(avg - 50) < 10 ? '✓' : '✗';
        html += `<tr><td>${pair}</td><td>${avg.toFixed(2)}% ${status}</td></tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('bic-results').innerHTML = html;
}

function displayLAP() {
    const lap = currentAnalysis.lap;
    let html = `<p><strong>Maximum LAP:</strong> ${lap.maxLAP.toFixed(4)}</p>`;
    html += `<p><strong>Jumlah kombinasi dengan LAP > 0.3:</strong> ${lap.lapCount}</p>`;
    html += '<p><strong>Interpretasi:</strong> Nilai LAP yang lebih kecil (mendekati 0) menunjukkan resistansi lebih baik terhadap serangan linear approximation.</p>';
    document.getElementById('lap-results').innerHTML = html;
}

function displayDU() {
    const du = currentAnalysis.du;
    const ad = currentAnalysis.ad;
    let html = `<p><strong>Differential Uniformity (Max):</strong> ${du.maxDU}</p>`;
    html += `<p><strong>Algebraic Degree (Max):</strong> ${ad.maxDegree}</p>`;
    html += '<p><strong>Algebraic Degree per Output Bit:</strong></p>';
    html += '<table class="metrics-table"><thead><tr><th>Output Bit</th><th>Degree</th></tr></thead><tbody>';
    
    ad.perBit.forEach((degree, index) => {
        html += `<tr><td>Bit ${index}</td><td>${degree}</td></tr>`;
    });
    
    html += '</tbody></table>';
    html += '<p><strong>Interpretasi DU:</strong> Nilai yang lebih kecil lebih baik. Ideal untuk 8-bit S-Box adalah DU ≤ 4.</p>';
    html += '<p><strong>Interpretasi AD:</strong> Nilai yang lebih tinggi lebih baik. Untuk 8-bit S-Box, nilai maksimal yang mungkin adalah 8.</p>';
    
    document.getElementById('du-results').innerHTML = html;
}

function displayTO() {
    const to = currentAnalysis.to;
    const ci = currentAnalysis.ci;
    let html = `<p><strong>Transparency Order (Max):</strong> ${to}</p>`;
    html += `<p><strong>Correlation Immunity Order:</strong> ${ci}</p>`;
    html += '<p><strong>Interpretasi TO:</strong> Nilai yang lebih rendah lebih baik. TO = 0 berarti fungsi Boolean perfect balanced.</p>';
    html += '<p><strong>Interpretasi CI:</strong> Order yang lebih tinggi menunjukkan resistansi lebih baik terhadap serangan korelasi. Ideal minimal order 1.</p>';
    document.getElementById('to-results').innerHTML = html;
}

function displayDetails() {
    const analysis = currentAnalysis;
    let html = '<h4>Detail Lengkap Analisis:</h4>';
    html += '<pre>' + JSON.stringify(analysis, null, 2) + '</pre>';
    document.getElementById('details-results').innerHTML = html;
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Load example (AES S-Box)
function loadExample() {
    const aesStr = AES_SBOX.map(v => '0x' + v.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    document.getElementById('sbox-input').value = aesStr;
}

// Clear input
function clearInput() {
    document.getElementById('sbox-input').value = '';
    document.getElementById('results-section').style.display = 'none';
    hideError();
}

// Error handling
function showError(message) {
    const errorSection = document.getElementById('error-section');
    document.getElementById('error-message').textContent = message;
    errorSection.style.display = 'block';
}

function hideError() {
    document.getElementById('error-section').style.display = 'none';
}

// Generate Step-by-Step Analysis
function generateSteps() {
    if (!currentAnalysis) return;
    
    const stepsContainer = document.getElementById('steps-container');
    const nl = currentAnalysis.nonlinearity;
    const sac = currentAnalysis.sac;
    const du = currentAnalysis.du;
    const ad = currentAnalysis.ad;
    const lap = currentAnalysis.lap;
    const ci = currentAnalysis.ci;
    
    // Hitung nilai evaluasi
    const nlQuality = nl.average > 110 ? 'Excellent' : nl.average > 100 ? 'Good' : 'Poor';
    const sacAvg = sac.map(s => s.percentage).reduce((a, b) => a + b) / sac.length;
    const sacQuality = Math.abs(sacAvg - 50) < 10 ? 'Good' : 'Needs Improvement';
    const duQuality = du.maxDU <= 4 ? 'Excellent' : du.maxDU <= 6 ? 'Good' : 'Poor';
    const adQuality = ad.maxDegree >= 6 ? 'Good' : 'Poor';
    
    const stepsHTML = `
        <!-- Step 1: Input Validation & Initial Assessment -->
        <div class="step-box">
            <div class="step-number">1️⃣</div>
            <div class="step-title">Step 1: Input Validation & Affine Matrix Exploration</div>
            <div class="step-description">
                Tahap pertama melibatkan validasi input S-Box dan eksplorasi matriks affine untuk memahami struktur dasar S-Box Anda.
            </div>
            <div class="step-details">
                <strong>✓ Validasi Completed:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <li>S-Box Values: 256 ✓</li>
                    <li>Range Check (0-255): ✓</li>
                    <li>Permutation Validity: ✓</li>
                    <li>Format Detection: Success</li>
                </ul>
            </div>
            <div class="step-result">
                <strong>Status:</strong> Input validation passed - S-Box is valid and ready for analysis
            </div>
        </div>

        <!-- Step 2: Cryptanalysis Criteria Evaluation -->
        <div class="step-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <div class="step-number">2️⃣</div>
            <div class="step-title">Step 2: Candidate S-box Construction & Cryptanalysis Testing</div>
            <div class="step-description">
                Tahap kedua menguji S-Box Anda terhadap berbagai kriteria kriptografi untuk mengevaluasi kualitasnya sebagai kandidat cipher component.
            </div>
            <div class="step-details">
                <strong>Cryptanalysis Metrics Calculated:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <li>Nonlinearity (NL): ${nl.average.toFixed(2)} - <span style="color: #ffd700;">${nlQuality}</span></li>
                    <li>Strict Avalanche Criterion: ${sacAvg.toFixed(2)}% - <span style="color: #ffd700;">${sacQuality}</span></li>
                    <li>Differential Uniformity: ${du.maxDU} - <span style="color: #ffd700;">${duQuality}</span></li>
                    <li>Algebraic Degree: ${ad.maxDegree} - <span style="color: #ffd700;">${adQuality}</span></li>
                    <li>Linear Approximation Probability: ${lap.maxLAP.toFixed(4)}</li>
                    <li>Correlation Immunity: Order ${ci}</li>
                </ul>
            </div>
            <div class="step-result">
                <strong>Result:</strong> All cryptanalysis criteria have been evaluated successfully
            </div>
        </div>

        <!-- Step 3: S-box Quality Assessment -->
        <div class="step-box" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <div class="step-number">3️⃣</div>
            <div class="step-title">Step 3: S-box Candidate Testing & Quality Evaluation</div>
            <div class="step-description">
                Tahap ketiga melakukan penilaian menyeluruh terhadap kualitas S-Box Anda dengan membandingkan hasil dengan standar industri (AES S-Box).
            </div>
            <div class="step-details">
                <strong>Detailed Test Results:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <li><strong>Nonlinearity Analysis:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            <li>Average NL: ${nl.average.toFixed(2)} (Benchmark AES: ~112)</li>
                            <li>Status: ${nl.average > 110 ? '✓ Meets AES standard' : nl.average > 100 ? '✓ Good resistance' : '✗ Needs improvement'}</li>
                        </ul>
                    </li>
                    <li><strong>Avalanche Properties:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            <li>SAC Average: ${sacAvg.toFixed(2)}% (Target: 50%)</li>
                            <li>Deviation: ${Math.abs(sacAvg - 50).toFixed(2)}% (Acceptable: &lt;10%)</li>
                            <li>Status: ${Math.abs(sacAvg - 50) < 10 ? '✓ Excellent diffusion' : '⚠ Needs optimization'}</li>
                        </ul>
                    </li>
                    <li><strong>Differential Resistance:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            <li>Maximum Differential Uniformity: ${du.maxDU} (Ideal: ≤4)</li>
                            <li>Status: ${du.maxDU <= 4 ? '✓ Optimal' : du.maxDU <= 6 ? '✓ Good' : '✗ Poor'}</li>
                        </ul>
                    </li>
                    <li><strong>Algebraic Properties:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            <li>Algebraic Degree: ${ad.maxDegree}/8 (Minimum: 6)</li>
                            <li>Status: ${ad.maxDegree >= 6 ? '✓ Good resistance to algebraic attacks' : '✗ Vulnerable to algebraic attacks'}</li>
                        </ul>
                    </li>
                </ul>
            </div>
            <div class="step-result">
                <strong>Quality Assessment:</strong> ${generateQualityBadge(nl.average, sacAvg, du.maxDU, ad.maxDegree)}
            </div>
        </div>

        <!-- Step 4: Recommendations & Final Report -->
        <div class="step-box" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <div class="step-number">4️⃣</div>
            <div class="step-title">Step 4: Final S-box Modification & Recommendations</div>
            <div class="step-description">
                Tahap final memberikan rekomendasi untuk meningkatkan kualitas S-Box dan langkah-langkah optimisasi untuk penggunaan pada cipher production.
            </div>
            <div class="step-details">
                <strong>Recommendations:</strong>
                ${generateRecommendations(nl.average, sacAvg, du.maxDU, ad.maxDegree, lap.maxLAP)}
            </div>
            <div class="step-result">
                <strong>Conclusion:</strong> ${generateConclusion(nl.average, sacAvg, du.maxDU, ad.maxDegree)}
            </div>
            <div class="step-warning">
                <strong>⚠️ Note:</strong> Untuk penggunaan production cipher, semua criteria harus memenuhi standar industri. Konsultasikan dengan cryptography expert untuk implementasi final.
            </div>
        </div>
    `;
    
    stepsContainer.innerHTML = stepsHTML;
}

// Generate Quality Badge
function generateQualityBadge(nl, sac, du, ad) {
    let score = 0;
    let badges = [];
    
    // NL Score
    if (nl > 110) { score += 25; badges.push('✓ Excellent NL'); }
    else if (nl > 100) { score += 15; badges.push('✓ Good NL'); }
    else { score += 5; badges.push('⚠ Weak NL'); }
    
    // SAC Score
    if (Math.abs(sac - 50) < 5) { score += 25; badges.push('✓ Excellent SAC'); }
    else if (Math.abs(sac - 50) < 10) { score += 15; badges.push('✓ Good SAC'); }
    else { score += 5; badges.push('⚠ Weak SAC'); }
    
    // DU Score
    if (du <= 4) { score += 25; badges.push('✓ Optimal DU'); }
    else if (du <= 6) { score += 15; badges.push('✓ Good DU'); }
    else { score += 5; badges.push('⚠ High DU'); }
    
    // AD Score
    if (ad >= 7) { score += 25; badges.push('✓ Excellent AD'); }
    else if (ad >= 6) { score += 15; badges.push('✓ Good AD'); }
    else { score += 5; badges.push('⚠ Low AD'); }
    
    const quality = score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'ACCEPTABLE' : 'POOR';
    const color = score >= 90 ? '#27ae60' : score >= 70 ? '#f39c12' : '#e74c3c';
    
    return `<span style="background: ${color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">
            ${quality} (Score: ${score}/100) - ${badges.join(', ')}
            </span>`;
}

// Generate Recommendations
function generateRecommendations(nl, sac, du, ad, lap) {
    let recommendations = [];
    
    if (nl < 110) {
        recommendations.push('<li>🔧 <strong>Improve Nonlinearity:</strong> Apply additional affine transformations atau gunakan substitution patterns yang lebih complex</li>');
    }
    if (Math.abs(sac - 50) > 10) {
        recommendations.push('<li>🔧 <strong>Optimize Avalanche Properties:</strong> Adjust S-Box entries untuk mencapai SAC lebih dekat ke 50%</li>');
    }
    if (du > 4) {
        recommendations.push('<li>🔧 <strong>Reduce Differential Uniformity:</strong> Revise S-Box mapping untuk decrease differential characteristics</li>');
    }
    if (ad < 6) {
        recommendations.push('<li>🔧 <strong>Increase Algebraic Degree:</strong> Gunakan higher-degree Boolean functions dalam construction</li>');
    }
    if (lap > 0.3) {
        recommendations.push('<li>🔧 <strong>Improve Linear Approximation Resistance:</strong> Enhance nonlinear properties melalui better affine transformation</li>');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('<li>✓ <strong>Excellent Quality:</strong> S-Box Anda sudah memenuhi semua kriteria standar industri!</li>');
    }
    
    return '<ul style="margin: 10px 0 0 20px;">' + recommendations.join('') + '</ul>';
}

// Generate Conclusion
function generateConclusion(nl, sac, du, ad) {
    if (nl > 110 && Math.abs(sac - 50) < 10 && du <= 4 && ad >= 6) {
        return 'S-Box Anda memiliki kualitas cryptographic yang SANGAT BAIK dan siap untuk pertimbangan penggunaan dalam cipher design. Hasil analisis menunjukkan resistance yang kuat terhadap linear dan differential cryptanalysis.';
    } else if (nl > 100 && Math.abs(sac - 50) < 15 && du <= 6 && ad >= 5) {
        return 'S-Box Anda memiliki kualitas BAIK dengan resistance yang acceptable. Pertimbangkan untuk optimization pada areas tertentu sebelum production use.';
    } else {
        return 'S-Box Anda memerlukan IMPROVEMENT. Implementasikan rekomendasi di atas untuk meningkatkan security properties sebelum production deployment.';
    }
}

// File upload handling
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('sbox-input').value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
});
