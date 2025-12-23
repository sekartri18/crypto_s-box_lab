// ===== GLOBAL STATE =====
let currentMatrix = null;
let currentConstant = 0x63;
let currentSBox = null;
let allSBoxes = {}; // { research: [], aes: [], custom: [] }
let allAnalysis = {}; // { research: {}, aes: {}, custom: {} }
let currentImageData = null;
let lastEncryptedImage = null;
let lastEncryptedImageCanvas = null;
let originalImageDataGray = null;
let encryptedImageDataGray = null;
let lastImageWidth = null;
let lastImageHeight = null;
let lastImageKey = null;
let lastImageSboxId = null;

// Preset matrices dari paper
const PRESET_MATRICES = {
    'K44': [
        [0, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 1, 1],
        [1, 1, 0, 1, 0, 1, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 0],
        [0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0],
        [0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0]
    ],
    'AES': [
        [1, 0, 0, 0, 1, 1, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 1],
        [1, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 1, 1, 1, 1]
    ]
};

// ===== RESEARCH PARAMETERS PANEL =====

function selectMatrixPreset(preset) {
    const buttons = document.querySelectorAll('.preset-btn');
    buttons.forEach(b => b.classList.remove('active'));
    event.target.closest('.preset-btn').classList.add('active');

    if (preset === 'paper-standard') {
        currentMatrix = PRESET_MATRICES['K44'];
        document.getElementById('summary-matrix').textContent = 'K44 (Best Performer)';
    } else if (preset === 'aes') {
        currentMatrix = PRESET_MATRICES['AES'];
        document.getElementById('summary-matrix').textContent = 'AES Standard';
    } else if (preset === 'custom') {
        currentMatrix = null;
        document.getElementById('summary-matrix').textContent = 'Custom (input manual)';
    }

    displayMatrix();
    hideError();
}

function displayMatrix() {
    const display = document.getElementById('matrix-display');
    if (!currentMatrix) {
        display.innerHTML = '<p style="color: #999; font-style: italic;">No matrix selected. Click Edit to input.</p>';
        return;
    }
    let html = '<table style="font-family: monospace; font-size: 12px; border-spacing: 4px; text-align: center;">';
    for (let i = 0; i < currentMatrix.length; i++) {
        html += '<tr>';
        for (let j = 0; j < 8; j++) {
            const val = currentMatrix[i][j];
            html += '<td style="width: 20px; padding: 2px; background: ' + (val ? '#3498db' : '#ecf0f1') + '; color: ' + (val ? 'white' : '#2c3e50') + '; border-radius: 2px;">' + val + '</td>';
        }
        html += '</tr>';
    }
    html += '</table>';
    display.innerHTML = html;
}

function toggleMatrixEdit() {
    const edit = document.getElementById('matrix-edit');
    if (edit.style.display === 'none') {
        edit.style.display = 'block';
        if (currentMatrix) {
            document.getElementById('matrix-input').value = 
                currentMatrix.map(row => row.join('')).join('\n');
        }
    } else {
        edit.style.display = 'none';
    }
}

function applyMatrixEdit() {
    try {
        hideError();
        const text = document.getElementById('matrix-input').value;
        const matrix = parseBinaryMatrix8(text);
        if (!validateBinaryMatrix8(matrix)) throw new Error('Format tidak valid');
        currentMatrix = matrix;
        document.getElementById('summary-matrix').textContent = 'Custom Matrix';
        displayMatrix();
        toggleMatrixEdit();
    } catch (err) {
        showError('Matrix error: ' + err.message);
    }
}

function setConstant(value) {
    try {
        hideError();
        let hex = value.trim();
        if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
        const num = parseInt(hex, 16);
        if (isNaN(num) || num < 0 || num > 255) throw new Error('Invalid hex value');
        currentConstant = num;
        document.getElementById('constant-value').value = '0x' + num.toString(16).toUpperCase().padStart(2, '0');
        const constDisplay = document.getElementById('constant-display');
        if (constDisplay) constDisplay.textContent = 
            `Current: 0x${num.toString(16).toUpperCase().padStart(2, '0')} (${num})`;
        const summary = document.getElementById('summary-constant');
        if (summary) summary.textContent = 
            `0x${num.toString(16).toUpperCase().padStart(2, '0')}`;
    } catch (err) {
        showError('Constant error: ' + err.message);
    }
}

function resetParameters() {
    currentMatrix = PRESET_MATRICES['K44'];
    currentConstant = 0x63;
    const btn = document.querySelectorAll('.preset-btn')[0];
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    displayMatrix();
    setConstant('0x63');
    hideError();
}

// ===== CONTROL PANEL =====

function generateAndAnalyze() {
    try {
        hideError();
        if (!currentMatrix) throw new Error('Pilih atau input matrix terlebih dahulu');

        // Generate S-Box dari matrix terpilih (Research)
        if (typeof constructSBoxFromMatrix === 'undefined') {
            throw new Error('SBox constructor not loaded');
        }
        if (typeof SBoxAnalyzer === 'undefined') {
            throw new Error('SBoxAnalyzer not loaded');
        }

        const research = constructSBoxFromMatrix(currentMatrix, currentConstant);
        if (!research) throw new Error('S-Box bukan bijective');
        console.log('Research S-Box generated:', research.length, 'values');

        // Generate dari AES matrix
        const aes = constructSBoxFromMatrix(PRESET_MATRICES['AES'], currentConstant);
        if (!aes) throw new Error('AES S-Box generation failed');
        console.log('AES S-Box generated:', aes.length, 'values');
        
        // Store all SBoxes
        allSBoxes = { research, aes, custom: research };
        
        // Analyze all with proper error handling
        const researchAnalyzer = new SBoxAnalyzer(research);
        console.log('Research analyzer created');
        const researchAnalysis = researchAnalyzer.analyze();
        console.log('Research analysis result:', researchAnalysis);
        
        const aesAnalyzer = new SBoxAnalyzer(aes);
        const aesAnalysis = aesAnalyzer.analyze();
        console.log('AES analysis result:', aesAnalysis);
        
        if (!researchAnalysis) throw new Error('Research analysis failed');
        if (!aesAnalysis) throw new Error('AES analysis failed');
        
        allAnalysis = {
            research: researchAnalysis,
            aes: aesAnalysis,
            custom: researchAnalysis
        };
        
        console.log('All analysis stored:', allAnalysis);
        displayAnalysisResults();
        document.getElementById('analysis-results').style.display = 'block';
    } catch (err) {
        showError('Generate error: ' + err.message);
        console.error('Full error:', err);
    }
}

function displayAnalysisResults() {
    try {
        // Display K44 S-Box hex
        const research = allSBoxes.research;
        const k44Hex = research.map(v => '0x' + v.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const k44HexElement = document.getElementById('k44-sbox-hex');
        if (k44HexElement) k44HexElement.textContent = k44Hex;

        // Display AES S-Box hex
        const aesHex = AES_SBOX.map(v => '0x' + v.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const aesHexElement = document.getElementById('aes-sbox-hex');
        if (aesHexElement) aesHexElement.textContent = aesHex;

        // Display K44 metrics
        displayK44Metrics(allAnalysis.research);

        // Display AES metrics
        displayAESMetrics(allAnalysis.aes);

        // Display comparison table
        displayComparisonTable();

        // Display step-by-step summary
        renderStepsTab();
    } catch (err) {
        showError('Display results error: ' + err.message);
    }
}

function displayK44Metrics(analysis) {
    try {
        const container = document.getElementById('k44-metrics-grid');
        if (!container) return;
        
        container.innerHTML = buildMetricsHTML(analysis);
        console.log('K44 metrics displayed');
    } catch (err) {
        console.error('displayK44Metrics error:', err);
        showError('K44 metrics error: ' + err.message);
    }
}

function displayAESMetrics(analysis) {
    try {
        const container = document.getElementById('aes-metrics-grid');
        if (!container) return;
        
        container.innerHTML = buildMetricsHTML(analysis);
        console.log('AES metrics displayed');
    } catch (err) {
        console.error('displayAESMetrics error:', err);
        showError('AES metrics error: ' + err.message);
    }
}

function buildMetricsHTML(analysis) {
    // Safe getter with default fallback to 0
    const safeVal = (val, precision = 5) => {
        if (val === null || val === undefined || val === 'N/A') return '0.00000';
        if (typeof val === 'number') return val.toFixed(precision);
        return String(val);
    };

    // Get SAC stats
    const getSACStats = () => {
        try {
            if (!analysis.sac || !Array.isArray(analysis.sac) || analysis.sac.length === 0) {
                return { avg: '0.00000', std: '0.00000', min: '0.00000', max: '0.00000' };
            }
            const values = analysis.sac.map(x => x.percentage || 0);
            const avg = values.reduce((s, v) => s + v, 0) / values.length;
            const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
            const std = Math.sqrt(variance);
            const min = Math.min(...values);
            const max = Math.max(...values);
            return { avg: avg.toFixed(5), std: std.toFixed(5), min: min.toFixed(5), max: max.toFixed(5) };
        } catch (e) {
            return { avg: '0.00000', std: '0.00000', min: '0.00000', max: '0.00000' };
        }
    };

    // Get BIC-NL stats
    const getBICNLStats = () => {
        try {
            if (!analysis.bic || !analysis.bic.bicNL || !Array.isArray(analysis.bic.bicNL) || analysis.bic.bicNL.length === 0) {
                return { avg: '0.00000', min: '0.00000', max: '0.00000' };
            }
            const values = analysis.bic.bicNL.map(x => x.percentage || 0);
            const avg = values.reduce((s, v) => s + v, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            return { avg: avg.toFixed(5), min: min.toFixed(5), max: max.toFixed(5) };
        } catch (e) {
            return { avg: '0.00000', min: '0.00000', max: '0.00000' };
        }
    };

    // Get BIC-SAC stats
    const getBICSACStats = () => {
        try {
            if (!analysis.bic || !analysis.bic.bicSAC || !Array.isArray(analysis.bic.bicSAC) || analysis.bic.bicSAC.length === 0) {
                return { avg: '0.00000', min: '0.00000', max: '0.00000' };
            }
            const values = analysis.bic.bicSAC.map(x => x.percentage || 0);
            const avg = values.reduce((s, v) => s + v, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            return { avg: avg.toFixed(5), min: min.toFixed(5), max: max.toFixed(5) };
        } catch (e) {
            return { avg: '0.00000', min: '0.00000', max: '0.00000' };
        }
    };

    const sac = getSACStats();
    const bicnl = getBICNLStats();
    const bicsac = getBICSACStats();
    const nl = analysis.nonlinearity || {};
    const lap = analysis.lap || {};
    const du = analysis.du || {};
    const ad = analysis.ad || {};
    const to = analysis.to || {};
    const ci = analysis.ci || {};

    let html = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">`;

    // Nonlinearity
    html += `<div class="metric-card metric-good">
        <h4>🔢 Nonlinearity (NL)</h4>
        <table class="metric-table">
            <tr><td><strong>Average:</strong></td><td>${safeVal(nl.average)}</td><td style="color: #666;">Higher ↑</td></tr>
            <tr><td><strong>Minimum:</strong></td><td>${safeVal(nl.min)}</td><td></td></tr>
            <tr><td><strong>Maximum:</strong></td><td>${safeVal(nl.max)}</td><td></td></tr>
        </table>
    </div>`;

    // SAC
    html += `<div class="metric-card metric-good">
        <h4>🎲 SAC (Strict Avalanche)</h4>
        <table class="metric-table">
            <tr><td><strong>Average:</strong></td><td>${sac.avg}</td><td style="color: #666;">~0.5 ideal</td></tr>
            <tr><td><strong>Std Dev:</strong></td><td>${sac.std}</td><td style="color: #666;">Lower ↓</td></tr>
            <tr><td><strong>Min:</strong></td><td>${sac.min}</td><td></td></tr>
            <tr><td><strong>Max:</strong></td><td>${sac.max}</td><td></td></tr>
        </table>
    </div>`;

    // BIC-NL
    html += `<div class="metric-card metric-good">
        <h4>🔍 BIC-NL (Bit Independence)</h4>
        <table class="metric-table">
            <tr><td><strong>Average:</strong></td><td>${bicnl.avg}</td><td style="color: #666;">Higher ↑</td></tr>
            <tr><td><strong>Min:</strong></td><td>${bicnl.min}</td><td></td></tr>
            <tr><td><strong>Max:</strong></td><td>${bicnl.max}</td><td></td></tr>
        </table>
    </div>`;

    // BIC-SAC
    html += `<div class="metric-card metric-good">
        <h4>🔄 BIC-SAC (Bit Dep. SAC)</h4>
        <table class="metric-table">
            <tr><td><strong>Average:</strong></td><td>${bicsac.avg}</td><td style="color: #666;">~0.5 ideal</td></tr>
            <tr><td><strong>Min:</strong></td><td>${bicsac.min}</td><td></td></tr>
            <tr><td><strong>Max:</strong></td><td>${bicsac.max}</td><td></td></tr>
        </table>
    </div>`;

    // LAP
    html += `<div class="metric-card metric-fair">
        <h4>📐 LAP (Linear Approx. Prob.)</h4>
        <table class="metric-table">
            <tr><td><strong>Max LAP:</strong></td><td>${safeVal(lap.maxLAP)}</td><td style="color: #666;">Lower ↓</td></tr>
            <tr><td><strong>Max Bias:</strong></td><td>${safeVal(lap.maxBias)}</td><td></td></tr>
            <tr><td><strong>Avg Bias:</strong></td><td>${safeVal(lap.avgBias)}</td><td></td></tr>
        </table>
    </div>`;

    // DU
    html += `<div class="metric-card metric-fair">
        <h4>🔀 DU (Differential Uniformity)</h4>
        <table class="metric-table">
            <tr><td><strong>Max DU:</strong></td><td>${safeVal(du.maxDU, 0)}</td><td style="color: #666;">Ideal = 4</td></tr>
            <tr><td><strong>Average:</strong></td><td>${safeVal(du.avgDU)}</td><td></td></tr>
        </table>
    </div>`;

    // AD
    html += `<div class="metric-card metric-fair">
        <h4>📊 AD (Algebraic Degree)</h4>
        <table class="metric-table">
            <tr><td><strong>Max Degree:</strong></td><td>${safeVal(ad.maxDegree, 0)}</td><td style="color: #666;">Ideal = 7</td></tr>
            <tr><td><strong>Min Degree:</strong></td><td>${safeVal(ad.minDegree, 0)}</td><td></td></tr>
            <tr><td><strong>Average:</strong></td><td>${safeVal(ad.avgDegree)}</td><td></td></tr>
        </table>
    </div>`;

    // TO
    html += `<div class="metric-card metric-info">
        <h4>🛡️ TO (Transparency Order)</h4>
        <table class="metric-table">
            <tr><td><strong>Min TO:</strong></td><td>${safeVal(to.minTO)}</td><td style="color: #666;">Lower ↓</td></tr>
            <tr><td><strong>Max Corr:</strong></td><td>${safeVal(to.maxCorrelation)}</td><td></td></tr>
            <tr><td><strong>Min Corr:</strong></td><td>${safeVal(to.minCorrelation)}</td><td></td></tr>
        </table>
    </div>`;

    // CI
    html += `<div class="metric-card metric-info">
        <h4>✓ CI (Correlation Immunity)</h4>
        <table class="metric-table">
            <tr><td><strong>Max Order:</strong></td><td>${safeVal(ci.maxCI, 0)}</td><td style="color: #666;">Higher ↑</td></tr>
            <tr><td><strong>Min Order:</strong></td><td>${safeVal(ci.minCI, 0)}</td><td></td></tr>
            <tr><td><strong>Average:</strong></td><td>${safeVal(ci.avgCI)}</td><td></td></tr>
        </table>
    </div>`;

    html += `</div>`;
    return html;
}



function displayComparisonTable() {
    try {
        const container = document.getElementById('comparison-table-container');
        if (!container) {
            console.error('comparison-table-container not found');
            return;
        }

        // Verify we have analysis data
        if (!allAnalysis || !allAnalysis.research || !allAnalysis.aes) {
            console.error('Missing analysis data:', allAnalysis);
            showError('No analysis data available');
            return;
        }

        const research = allAnalysis.research;
        const aes = allAnalysis.aes;

        console.log('Building comparison table with:', { research, aes });

        // Helper to safely get value
        const safeGet = (obj, path) => {
            try {
                if (path === 'sac-avg') {
                    if (!obj.sac || !Array.isArray(obj.sac)) return null;
                    const avg = obj.sac.reduce((s, x) => s + (x.percentage || 0), 0) / obj.sac.length;
                    return avg / 100;  // Convert percentage to 0-1
                }
                if (path === 'sac-std') {
                    if (!obj.sac || !Array.isArray(obj.sac) || obj.sac.length === 0) return null;
                    const avg = obj.sac.reduce((s, x) => s + (x.percentage || 0), 0) / obj.sac.length;
                    const variance = obj.sac.reduce((s, x) => s + Math.pow((x.percentage || 0) - avg, 2), 0) / obj.sac.length;
                    return Math.sqrt(variance) / 100;  // Convert to 0-1 scale
                }
                if (path === 'bic-nl') {
                    if (!obj.bic || !obj.bic.bicNL || !Array.isArray(obj.bic.bicNL)) return null;
                    const avg = obj.bic.bicNL.reduce((s, x) => s + (x.nl || 0), 0) / obj.bic.bicNL.length;
                    return avg;
                }
                if (path === 'bic-sac') {
                    if (!obj.bic || !obj.bic.bicSAC || !Array.isArray(obj.bic.bicSAC)) return null;
                    const avg = obj.bic.bicSAC.reduce((s, x) => s + (x.percentage || 0), 0) / obj.bic.bicSAC.length;
                    return avg / 100;  // Convert to 0-1 scale
                }
                if (path === 'nonlinearity.min') {
                    if (!obj.nonlinearity || !obj.nonlinearity.perBit || !Array.isArray(obj.nonlinearity.perBit)) return null;
                    return Math.min(...obj.nonlinearity.perBit);
                }
                if (path === 'nonlinearity.max') {
                    if (!obj.nonlinearity || !obj.nonlinearity.perBit || !Array.isArray(obj.nonlinearity.perBit)) return null;
                    return Math.max(...obj.nonlinearity.perBit);
                }
                if (path === 'lap.maxBias') {
                    if (!obj.lap) return null;
                    // LAP Max Bias = LAP itself (already 0-1)
                    return obj.lap.maxLAP;
                }
                
                const keys = path.split('.');
                let val = obj;
                for (let key of keys) {
                    val = val[key];
                    if (val === null || val === undefined) return null;
                }
                return val;
            } catch (e) {
                console.warn('safeGet error for', path, ':', e);
                return null;
            }
        };

        // All metrics with clear winner rules
        const metrics = [
            { name: 'Nonlinearity (Avg)', rKey: 'nonlinearity.average', aKey: 'nonlinearity.average', target: '112', rule: 'equal' },
            { name: 'Nonlinearity (Min)', rKey: 'nonlinearity.min', aKey: 'nonlinearity.min', target: '112', rule: 'equal' },
            { name: 'Nonlinearity (Max)', rKey: 'nonlinearity.max', aKey: 'nonlinearity.max', target: '112', rule: 'equal' },
            { name: 'SAC (Average)', rKey: 'sac-avg', aKey: 'sac-avg', target: '~0.5', rule: 'close-to-0.5' },
            { name: 'SAC (Std Dev)', rKey: 'sac-std', aKey: 'sac-std', target: 'Lower', rule: 'lower' },
            { name: 'BIC-NL (Average)', rKey: 'bic-nl', aKey: 'bic-nl', target: 'Higher', rule: 'higher' },
            { name: 'BIC-SAC (Average)', rKey: 'bic-sac', aKey: 'bic-sac', target: '~0.5', rule: 'close-to-0.5' },
            { name: 'LAP (Max)', rKey: 'lap.maxLAP', aKey: 'lap.maxLAP', target: 'Lower', rule: 'lower' },
            { name: 'LAP (Max Bias)', rKey: 'lap.maxBias', aKey: 'lap.maxBias', target: 'Lower', rule: 'lower' },
            { name: 'DAP (Max)', rKey: 'dap', aKey: 'dap', target: 'Lower', rule: 'lower' },
            { name: 'Differential Uniformity (Max)', rKey: 'du.maxDU', aKey: 'du.maxDU', target: '4 (AES)', rule: 'equal' },
            { name: 'Algebraic Degree (Max)', rKey: 'ad.maxDegree', aKey: 'ad.maxDegree', target: '7 (AES)', rule: 'equal' },
            { name: 'Transparency Order', rKey: 'to', aKey: 'to', target: 'Lower', rule: 'lower' },
            { name: 'Correlation Immunity (Max)', rKey: 'ci', aKey: 'ci', target: 'Higher', rule: 'higher' },
            { name: 'Max Cycle Length', rKey: 'maxCycleLength', aKey: 'maxCycleLength', target: 'Higher', rule: 'higher' },
            { name: 'Fixed Points', rKey: 'fixedPoints', aKey: 'fixedPoints', target: '0', rule: 'equal' },
            { name: 'SV (Strength Value)', rKey: 'strengthValue', aKey: 'strengthValue', target: 'Lower', rule: 'lower' }
        ];

        // Build table
        let html = `<h3>📊 Side-by-Side Comparison: K44 vs AES</h3>
            <table class="comparison-table">
            <thead><tr>
                <th>Metric</th>
                <th>Research (K44)</th>
                <th>AES S-box</th>
                <th>Target</th>
                <th>Winner</th>
            </tr></thead>
            <tbody>`;

        let k44Wins = 0, aesWins = 0;
        const k44WinList = [], aesWinList = [];

        metrics.forEach(m => {
            const rVal = safeGet(research, m.rKey);
            const aVal = safeGet(aes, m.aKey);
            
            // Debug log for TO and Fixed Points
            if (m.name === 'Transparency Order' || m.name === 'Fixed Points') {
                console.log(`${m.name}: K44=${rVal}, AES=${aVal}, rule=${m.rule}`);
            }
            
            // Format display values
            const rDisplay = rVal === null ? 'N/A' : (typeof rVal === 'number' ? rVal.toFixed(5) : rVal);
            const aDisplay = aVal === null ? 'N/A' : (typeof aVal === 'number' ? aVal.toFixed(5) : aVal);

            let winner = '—';

            // Determine winner based on rule
            if (rVal !== null && aVal !== null) {
                const rNum = parseFloat(rVal);
                const aNum = parseFloat(aVal);

                if (m.rule === 'higher') {
                    // Winner: higher value wins
                    if (rNum > aNum) {
                        winner = 'K44';
                        k44Wins++;
                        k44WinList.push(m.name);
                    } else if (aNum > rNum) {
                        winner = 'AES';
                        aesWins++;
                        aesWinList.push(m.name);
                    }
                } else if (m.rule === 'lower') {
                    // Winner: lower value wins
                    if (rNum < aNum) {
                        winner = 'K44';
                        k44Wins++;
                        k44WinList.push(m.name);
                    } else if (aNum < rNum) {
                        winner = 'AES';
                        aesWins++;
                        aesWinList.push(m.name);
                    }
                } else if (m.rule === 'close-to-0.5') {
                    // Winner: closest to 0.5
                    const rDist = Math.abs(rNum - 0.5);
                    const aDist = Math.abs(aNum - 0.5);
                    const diff = Math.abs(rDist - aDist);
                    
                    if (diff > 0.00001) {  // Only count as win if significantly different
                        if (rDist < aDist) {
                            winner = 'K44';
                            k44Wins++;
                            k44WinList.push(m.name);
                        } else {
                            winner = 'AES';
                            aesWins++;
                            aesWinList.push(m.name);
                        }
                    }
                } else if (m.rule === 'equal') {
                    // Winner: closest to target value (112, 4, 7, or 0)
                    let target = 112;
                    if (m.target === '4') target = 4;
                    else if (m.target === '7') target = 7;
                    else if (m.target === '0') target = 0;
                    
                    const rDist = Math.abs(rNum - target);
                    const aDist = Math.abs(aNum - target);
                    const diff = Math.abs(rDist - aDist);
                    
                    if (diff > 0.00001) {  // Only count as win if significantly different
                        if (rDist < aDist) {
                            winner = 'K44';
                            k44Wins++;
                            k44WinList.push(m.name);
                        } else {
                            winner = 'AES';
                            aesWins++;
                            aesWinList.push(m.name);
                        }
                    }
                }
            }

            html += `<tr>
                <td><strong>${m.name}</strong></td>
                <td class="value-normal">${rDisplay}</td>
                <td class="value-normal">${aDisplay}</td>
                <td style="font-size: 0.9em; color: #666;">${m.target}</td>
                <td class="winner-cell">${winner}</td>
            </tr>`;
        });

        html += `</tbody></table>`;

        // Add ranking boxes
        html += `<h3>🏆 Global Ranking</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 5px solid #4caf50;">
                    <h4 style="margin-top: 0; color: #2e7d32;">🥇 Research S-box (K44)</h4>
                    <p style="font-size: 2.2em; font-weight: bold; color: #4caf50; margin: 15px 0;">Top Score: ${k44Wins} wins</p>
                    ${k44WinList.length > 0 ? '<ul style="margin: 0; padding-left: 20px; font-size: 0.95em; line-height: 1.8;">' + k44WinList.map(w => `<li>${w}</li>`).join('') + '</ul>' : '<p style="margin: 0; color: #999;">No dominant metrics in this comparison</p>'}
                </div>
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 5px solid #2196f3;">
                    <h4 style="margin-top: 0; color: #1565c0;">🥈 AES Standard</h4>
                    <p style="font-size: 2.2em; font-weight: bold; color: #2196f3; margin: 15px 0;">${aesWins} wins</p>
                    ${aesWinList.length > 0 ? '<ul style="margin: 0; padding-left: 20px; font-size: 0.95em; line-height: 1.8;">' + aesWinList.map(w => `<li>${w}</li>`).join('') + '</ul>' : '<p style="margin: 0; color: #999;">No dominant metrics in this comparison</p>'}
                </div>
            </div>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #e65100;"><strong>💡 Note:</strong> Metrics marked with "—" have equivalent performance (no clear winner). Skor dihitung dari jumlah metrik yang dimenangkan berdasarkan rule terbaik untuk setiap parameter.</p>
            </div>`;

        container.innerHTML = html;
        console.log('Comparison table rendered:', { k44Wins, aesWins, totalMetrics: metrics.length });
    } catch (err) {
        console.error('displayComparisonTable error:', err);
        showError('Comparison table error: ' + err.message);
    }
}

function switchAnalysisTab(tab) {
    document.querySelectorAll('#analysis-results .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#analysis-results .tab-btn').forEach(b => b.classList.remove('active'));
    const tabEl = document.getElementById(tab);
    if (tabEl) {
        tabEl.classList.add('active');
        tabEl.style.display = 'block';
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Render step-by-step analysis inside Steps tab
function renderStepsTab() {
    if (!allAnalysis || !allAnalysis.research) return;
    const stepsContainer = document.getElementById('steps-container');
    if (!stepsContainer) return;

    const analysis = allAnalysis.research;
    const nl = analysis.nonlinearity || {};
    const sac = analysis.sac || [];
    const du = analysis.du || {};
    const ad = analysis.ad || {};
    const lap = analysis.lap || {};
    const ci = analysis.ci;

    const sacAvg = sac.length ? (sac.map(s => s.percentage || 0).reduce((a, b) => a + b, 0) / sac.length) : 0;
    const nlQuality = nl.average > 110 ? 'Excellent' : nl.average > 100 ? 'Good' : 'Needs Improvement';
    const sacQuality = Math.abs(sacAvg - 50) < 10 ? 'Good' : 'Needs Improvement';
    const duQuality = du.maxDU <= 4 ? 'Excellent' : du.maxDU <= 6 ? 'Good' : 'Needs Improvement';
    const adQuality = ad.maxDegree >= 6 ? 'Good' : 'Needs Improvement';

    stepsContainer.innerHTML = `
        <div class="step-box">
            <div class="step-number">1️⃣</div>
            <div class="step-title">Step 1: Input Validation & Affine Matrix Exploration</div>
            <div class="step-description">Validasi 256 entri, rentang 0-255, dan permutasi unik sebelum analisis.</div>
            <div class="step-details">
                <strong>Checklist:</strong>
                <ul>
                    <li>Count: 256 ✓</li>
                    <li>Range: 0-255 ✓</li>
                    <li>Permutation: Valid ✓</li>
                </ul>
            </div>
            <div class="step-result"><strong>Status:</strong> Input siap dianalisis</div>
        </div>

        <div class="step-box">
            <div class="step-number">2️⃣</div>
            <div class="step-title">Step 2: Candidate S-box Construction & Cryptanalysis Testing</div>
            <div class="step-description">Evaluasi inti terhadap metrik kriptografi utama.</div>
            <div class="step-details">
                <strong>Cryptanalysis Metrics:</strong>
                <ul>
                    <li>Nonlinearity: ${ (nl.average || 0).toFixed(2) } (${nlQuality})</li>
                    <li>SAC Avg: ${ sacAvg.toFixed(2) }% (${sacQuality})</li>
                    <li>DU Max: ${ du.maxDU ?? 'N/A' } (${duQuality})</li>
                    <li>Algebraic Degree: ${ ad.maxDegree ?? 'N/A' } (${adQuality})</li>
                    <li>LAP Max: ${ (lap.maxLAP || 0).toFixed(4) }</li>
                    <li>Correlation Immunity: ${ ci ?? 'N/A' }</li>
                </ul>
            </div>
            <div class="step-result"><strong>Result:</strong> Metrik kriptografi terhitung</div>
        </div>

        <div class="step-box">
            <div class="step-number">3️⃣</div>
            <div class="step-title">Step 3: S-box Candidate Testing & Quality Evaluation</div>
            <div class="step-description">Bandingkan hasil dengan benchmark AES untuk menilai kualitas.</div>
            <div class="step-details">
                <strong>Highlights:</strong>
                <ul>
                    <li>NL vs AES (~112): ${ (nl.average || 0).toFixed(2) }</li>
                    <li>SAC deviasi dari 50%: ${ Math.abs(sacAvg - 50).toFixed(2) }%</li>
                    <li>DU status: ${ duQuality }</li>
                    <li>AD status: ${ adQuality }</li>
                </ul>
            </div>
            <div class="step-result"><strong>Assessment:</strong> ${ summarizeQuality(nl.average, sacAvg, du.maxDU, ad.maxDegree) }</div>
        </div>

        <div class="step-box">
            <div class="step-number">4️⃣</div>
            <div class="step-title">Step 4: Final S-box Modification & Recommendations</div>
            <div class="step-description">Rekomendasi peningkatan berdasarkan metrik yang kurang optimal.</div>
            <div class="step-details">
                <strong>Recommendations:</strong>
                <ul>
                    ${ buildRecommendations(nl.average, sacAvg, du.maxDU, ad.maxDegree, lap.maxLAP).map(r => `<li>${r}</li>`).join('') }
                </ul>
            </div>
            <div class="step-warning"><strong>⚠️ Note:</strong> Pastikan semua metrik memenuhi standar produksi.</div>
        </div>
    `;
}

function summarizeQuality(nl, sacAvg, du, ad) {
    let score = 0;
    if (nl > 110) score += 3; else if (nl > 100) score += 2; else score += 1;
    const sacDev = Math.abs((sacAvg || 0) - 50);
    if (sacDev < 5) score += 3; else if (sacDev < 10) score += 2; else score += 1;
    if (du <= 4) score += 3; else if (du <= 6) score += 2; else score += 1;
    if (ad >= 7) score += 3; else if (ad >= 6) score += 2; else score += 1;

    const labels = ['Poor', 'Fair', 'Good', 'Excellent'];
    const idx = Math.min(labels.length - 1, Math.floor(score / 3));
    return labels[idx];
}

function buildRecommendations(nl, sacAvg, du, ad, lapMax) {
    const recs = [];
    if (nl < 110) recs.push('Tingkatkan nonlinearity; coba variasi constant vector atau tweak affine matrix');
    const sacDev = Math.abs((sacAvg || 0) - 50);
    if (sacDev >= 10) recs.push('Optimalkan SAC dengan menyesuaikan baris/kolom matrix untuk difusi lebih merata');
    if (du > 4) recs.push('Turunkan DU dengan mengevaluasi perbedaan input-output dan menyesuaikan entri matrix');
    if (ad < 6) recs.push('Naikkan algebraic degree dengan memvariasikan kombinasi bit pada matrix');
    if (lapMax && lapMax > 0.1) recs.push('Kurangi LAP (bias linear) dengan mencari pola affine yang lebih acak');
    if (!recs.length) recs.push('Semua metrik sudah baik; dokumentasikan dan lanjutkan uji implementasi');
    return recs;
}

function clearAnalysis() {
    allSBoxes = {};
    allAnalysis = {};
    currentSBox = null;
    document.getElementById('analysis-results').style.display = 'none';
    hideError();
}

// ===== ENCRYPTION & DECRYPTION =====

function encryptText() {
    try {
        hideError();
        const plaintext = document.getElementById('plaintext').value;
        const key = document.getElementById('encryption-key').value;
        const sboxSelect = document.getElementById('text-sbox-select').value;

        if (!plaintext) throw new Error('Plaintext kosong');
        if (!key) throw new Error('Key kosong');

        // Get the selected S-Box
        let sbox = null;
        if (sboxSelect === 'aes') {
            sbox = AES_SBOX;
        } else if (sboxSelect === 'custom' && allSBoxes && allSBoxes.custom) {
            sbox = allSBoxes.custom;
        } else if (allSBoxes && allSBoxes.research) {
            sbox = allSBoxes.research;  // Default to K44 if available
        } else {
            sbox = AES_SBOX;  // Fallback to AES if nothing else available
        }

        if (!sbox || !Array.isArray(sbox)) {
            throw new Error('S-Box not available. Generate S-Box first');
        }

        // Simple XOR-based encryption using S-box
        // Convert plaintext to bytes
        const plaintextBytes = [];
        for (let i = 0; i < plaintext.length; i++) {
            plaintextBytes.push(plaintext.charCodeAt(i));
        }

        // Pad or truncate key to 16 bytes
        const keyBytes = [];
        for (let i = 0; i < 16; i++) {
            if (i < key.length) {
                keyBytes.push(key.charCodeAt(i));
            } else {
                keyBytes.push(0);  // Pad dengan 0
            }
        }

        // Encrypt: XOR plaintext with S-box substituted key
        const cipherBytes = [];
        for (let i = 0; i < plaintextBytes.length; i++) {
            const keyByte = keyBytes[i % 16];
            const sboxIndex = keyByte % 256;
            
            if (sboxIndex >= sbox.length) {
                throw new Error(`S-Box index ${sboxIndex} out of bounds (S-Box length: ${sbox.length})`);
            }
            
            const sboxValue = sbox[sboxIndex];
            const cipherByte = plaintextBytes[i] ^ sboxValue;
            cipherBytes.push(cipherByte);
        }

        // Convert to base64
        const binaryString = String.fromCharCode(...cipherBytes);
        const base64Encrypted = btoa(binaryString);

        // Display result
        document.getElementById('text-output').value = base64Encrypted;
        document.getElementById('text-result').style.display = 'block';
        
        console.log('Text encrypted successfully');
        console.log('Plaintext:', plaintext);
        console.log('Plaintext length:', plaintextBytes.length);
        console.log('S-Box used:', sboxSelect);
        console.log('Ciphertext (base64):', base64Encrypted);
    } catch (err) {
        showError('Encrypt error: ' + err.message);
        console.error('Encrypt error:', err);
    }
}

function decryptText() {
    try {
        hideError();
        const cipherBox = document.getElementById('decrypt-ciphertext');
        let ciphertext = cipherBox ? cipherBox.value : document.getElementById('text-output').value;
        const keyInput = document.getElementById('decrypt-key');
        const key = keyInput ? keyInput.value : document.getElementById('encryption-key').value;
        const sboxSelect = document.getElementById('text-sbox-select-decrypt') ? document.getElementById('text-sbox-select-decrypt').value : document.getElementById('text-sbox-select').value;
        
        if (!ciphertext) throw new Error('Ciphertext kosong');
        if (!key) throw new Error('Key kosong');

        // Normalize ciphertext: trim and attempt to strip label prefixes if user pasted old stub text
        ciphertext = ciphertext.trim();
        if (ciphertext.includes(':')) {
            const parts = ciphertext.split(':');
            ciphertext = parts[parts.length - 1].trim();
        }

        // Get the selected S-Box
        let sbox = null;
        if (sboxSelect === 'aes') {
            sbox = AES_SBOX;
        } else if (sboxSelect === 'custom' && allSBoxes && allSBoxes.custom) {
            sbox = allSBoxes.custom;
        } else if (allSBoxes && allSBoxes.research) {
            sbox = allSBoxes.research;  // Default to K44 if available
        } else {
            sbox = AES_SBOX;  // Fallback to AES if nothing else available
        }

        if (!sbox || !Array.isArray(sbox)) {
            throw new Error('S-Box not available. Generate S-Box first');
        }

        // Decode from base64
        let binaryString = '';
        try {
            binaryString = atob(ciphertext);
        } catch (decodeErr) {
            throw new Error('Ciphertext tidak valid (harus base64). Jalankan Encrypt dulu.');
        }
        const cipherBytes = [];
        for (let i = 0; i < binaryString.length; i++) {
            cipherBytes.push(binaryString.charCodeAt(i));
        }

        // Pad or truncate key to 16 bytes
        const keyBytes = [];
        for (let i = 0; i < 16; i++) {
            if (i < key.length) {
                keyBytes.push(key.charCodeAt(i));
            } else {
                keyBytes.push(0);
            }
        }

        // Decrypt: XOR ciphertext with S-box substituted key (same as encryption since XOR is symmetric)
        const plaintextBytes = [];
        for (let i = 0; i < cipherBytes.length; i++) {
            const keyByte = keyBytes[i % 16];
            const sboxIndex = keyByte % 256;
            
            if (sboxIndex >= sbox.length) {
                throw new Error(`S-Box index ${sboxIndex} out of bounds (S-Box length: ${sbox.length})`);
            }
            
            const sboxValue = sbox[sboxIndex];
            const plaintextByte = cipherBytes[i] ^ sboxValue;
            plaintextBytes.push(plaintextByte);
        }

        // Convert back to string
        const decryptedText = String.fromCharCode(...plaintextBytes);
        const plainOut = document.getElementById('decrypt-plaintext');
        if (plainOut) plainOut.value = decryptedText;
        // Keep original plaintext box in sync for convenience
        document.getElementById('plaintext').value = decryptedText;
        // Also reflect ciphertext box to ensure it's preserved
        if (cipherBox) cipherBox.value = ciphertext;
        // Show result panel
        const decryptResult = document.getElementById('text-decrypt-result');
        if (decryptResult) decryptResult.style.display = 'block';
        
        console.log('Text decrypted successfully');
        console.log('Ciphertext (base64):', ciphertext);
        console.log('Decrypted plaintext:', decryptedText);
    } catch (err) {
        showError('Decrypt error: ' + err.message);
        console.error('Decrypt error:', err);
    }
}

function clearTextEncryption() {
    document.getElementById('plaintext').value = '';
    document.getElementById('encryption-key').value = '';
    document.getElementById('text-output').value = '';
    document.getElementById('text-result').style.display = 'none';
    hideError();
}

function clearTextDecryption() {
    const cipherBox = document.getElementById('decrypt-ciphertext');
    if (cipherBox) cipherBox.value = '';
    const keyBox = document.getElementById('decrypt-key');
    if (keyBox) keyBox.value = '';
    const plainOut = document.getElementById('decrypt-plaintext');
    if (plainOut) plainOut.value = '';
    const decryptResult = document.getElementById('text-decrypt-result');
    if (decryptResult) decryptResult.style.display = 'none';
    hideError();
}

function encryptImage() {
    try {
        hideError();
        const fileInput = document.getElementById('image-upload');
        const key = document.getElementById('image-key').value;
        const sboxSelect = document.getElementById('image-sbox-select').value;

        if (!fileInput.files.length) throw new Error('Select an image');
        if (!key) throw new Error('Key kosong');

        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = Math.min(img.width, 512);
                canvas.height = Math.min(img.height, 512);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Display original
                const origCanvas = document.getElementById('original-image');
                origCanvas.width = canvas.width;
                origCanvas.height = canvas.height;
                origCanvas.getContext('2d').drawImage(canvas, 0, 0);

                // Prepare image data
                const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let sbox = null;
                if (sboxSelect === 'aes') {
                    sbox = AES_SBOX;
                } else if (sboxSelect === 'custom' && allSBoxes && allSBoxes.custom) {
                    sbox = allSBoxes.custom;
                } else if (allSBoxes && allSBoxes.research) {
                    sbox = allSBoxes.research;
                } else {
                    sbox = AES_SBOX;
                }

                const encryptedData = ImageCipher.encryptImageData(originalData, sbox, key);

                // Display encrypted
                const encCanvas = document.getElementById('encrypted-image');
                encCanvas.width = canvas.width;
                encCanvas.height = canvas.height;
                encCanvas.getContext('2d').putImageData(encryptedData, 0, 0);
                lastEncryptedImage = encCanvas.toDataURL();
                lastEncryptedImageCanvas = encryptedData; // Store for decryption
                lastImageKey = key;
                lastImageSboxId = sboxSelect;

                // Store grayscale arrays for analysis
                originalImageDataGray = ImageProcessor.toGrayscaleArray(originalData);
                encryptedImageDataGray = ImageProcessor.toGrayscaleArray(encryptedData);
                lastImageWidth = canvas.width;
                lastImageHeight = canvas.height;

                // Run image security metrics
                try {
                    const metrics = SecurityMetrics.analyzeEncryptionQuality(
                        originalImageDataGray,
                        encryptedImageDataGray,
                        canvas.width,
                        canvas.height
                    );
                    displayImageAnalysis(metrics);
                } catch (metricErr) {
                    console.warn('Image analysis failed:', metricErr);
                    displayImageAnalysis(null, metricErr);
                }

                document.getElementById('image-result').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } catch (err) {
        showError('Image encrypt error: ' + err.message);
    }
}

function decryptImage() {
    try {
        hideError();
        if (!lastEncryptedImageCanvas) throw new Error('No encrypted image data');
        const key = document.getElementById('image-key').value;
        const sboxSelect = document.getElementById('image-sbox-select').value;
        if (!key) throw new Error('Key kosong');
        if (lastImageKey !== null && (key !== lastImageKey || sboxSelect !== lastImageSboxId)) {
            throw new Error('Key atau S-Box telah berubah sejak enkripsi. Gunakan nilai yang sama untuk dekripsi.');
        }

        let sbox = null;
        if (sboxSelect === 'aes') {
            sbox = AES_SBOX;
        } else if (sboxSelect === 'custom' && allSBoxes && allSBoxes.custom) {
            sbox = allSBoxes.custom;
        } else if (allSBoxes && allSBoxes.research) {
            sbox = allSBoxes.research;
        } else {
            sbox = AES_SBOX;
        }
        const decrypted = ImageCipher.decryptImageData(lastEncryptedImageCanvas, sbox, key);
        
        // Show in decrypted canvas
        const decCanvas = document.getElementById('decrypted-canvas');
        if (decCanvas) {
            decCanvas.width = decrypted.width;
            decCanvas.height = decrypted.height;
            decCanvas.getContext('2d').putImageData(decrypted, 0, 0);
        }
        // Removed success notification per user request
    } catch (err) {
        showError('Image decrypt error: ' + err.message);
    }
}

function showDecryptPreview() {
    try {
        hideError();
        if (!lastEncryptedImageCanvas) throw new Error('No encrypted image to preview');
        const key = document.getElementById('image-key').value;
        const sboxSelect = document.getElementById('image-sbox-select').value;
        if (!key) throw new Error('Key kosong');
        if (lastImageKey !== null && (key !== lastImageKey || sboxSelect !== lastImageSboxId)) {
            throw new Error('Key atau S-Box telah berubah sejak enkripsi. Gunakan nilai yang sama untuk preview dekripsi.');
        }
        let sbox = null;
        if (sboxSelect === 'aes') {
            sbox = AES_SBOX;
        } else if (sboxSelect === 'custom' && allSBoxes && allSBoxes.custom) {
            sbox = allSBoxes.custom;
        } else if (allSBoxes && allSBoxes.research) {
            sbox = allSBoxes.research;
        } else {
            sbox = AES_SBOX;
        }
        const decrypted = ImageCipher.decryptImageData(lastEncryptedImageCanvas, sbox, key);
        
        // Display in decrypted canvas
        const previewCanvas = document.getElementById('decrypted-canvas');
        if (!previewCanvas) {
            // Fallback: create temporary canvas if not in HTML
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = decrypted.width;
            tempCanvas.height = decrypted.height;
            tempCanvas.getContext('2d').putImageData(decrypted, 0, 0);
            console.log('Preview generated (fallback canvas):', tempCanvas.toDataURL().substring(0, 50) + '...');
            return;
        }
        
        previewCanvas.width = decrypted.width;
        previewCanvas.height = decrypted.height;
        previewCanvas.getContext('2d').putImageData(decrypted, 0, 0);
        console.log('✓ Decrypt preview displayed on decrypted-canvas');
    } catch (err) {
        showError('Preview error: ' + err.message);
    }
}

function displayImageAnalysis(metrics, error = null) {
    const container = document.getElementById('image-analysis');
    const histContainer = document.getElementById('image-histograms');
    if (!container) return;

    if (histContainer) histContainer.innerHTML = '';

    if (error || !metrics) {
        container.innerHTML = `<div class="metric-card metric-fair">Gagal menghitung metrik gambar: ${error ? error.message : 'unknown error'}</div>`;
        return;
    }

    const fmt = (v, p = 4) => (v === null || v === undefined || Number.isNaN(v) ? '0.0000' : Number(v).toFixed(p));

    container.innerHTML = `
        <div class="metric-card metric-good">
            <div class="metric-title">Entropy</div>
            <div class="metric-value">${fmt(metrics.entropy.value, 4)}</div>
            <div class="metric-sub">Ideal ≈ 8.0 • Status: ${metrics.entropy.status}</div>
        </div>
        <div class="metric-card metric-good">
            <div class="metric-title">NPCR (%)</div>
            <div class="metric-value">${fmt(metrics.npcr.value, 3)}</div>
            <div class="metric-sub">Ideal ≈ 99.6% • Status: ${metrics.npcr.status}</div>
        </div>
        <div class="metric-card metric-good">
            <div class="metric-title">UACI (%)</div>
            <div class="metric-value">${fmt(metrics.uaci.value, 3)}</div>
            <div class="metric-sub">Ideal ≈ 33.4% • Status: ${metrics.uaci.status}</div>
        </div>
        <div class="metric-card metric-info">
            <div class="metric-title">Correlation</div>
            <div class="metric-value">Orig ${fmt(metrics.correlation.original, 4)} → Enc ${fmt(metrics.correlation.encrypted, 4)}</div>
            <div class="metric-sub">Reduction: ${fmt(metrics.correlation.reduction, 4)} • Status: ${metrics.correlation.status}</div>
        </div>
        <div class="metric-card metric-info">
            <div class="metric-title">Directional Corr (Enc)</div>
            <div class="metric-value">H ${fmt(metrics.directionalCorrelation.horizontal, 4)} | V ${fmt(metrics.directionalCorrelation.vertical, 4)} | D ${fmt(metrics.directionalCorrelation.diagonal, 4)}</div>
            <div class="metric-sub">Lebih dekat ke 0 lebih baik</div>
        </div>
    `;

    if (histContainer && metrics.histogram) {
        histContainer.innerHTML = `
            <div class="metric-card metric-info" style="padding: 12px;">
                <div class="metric-title">Histogram (Original)</div>
                <canvas id="hist-original" width="320" height="140"></canvas>
            </div>
            <div class="metric-card metric-info" style="padding: 12px;">
                <div class="metric-title">Histogram (Encrypted)</div>
                <canvas id="hist-encrypted" width="320" height="140"></canvas>
            </div>
        `;
        renderHistogram('hist-original', metrics.histogram.original, '#4caf50');
        renderHistogram('hist-encrypted', metrics.histogram.encrypted, '#2196f3');
    }
}

function renderHistogram(canvasId, histogram, color = '#2196f3') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !histogram) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...histogram);
    const barWidth = w / 256;
    ctx.fillStyle = color;
    for (let i = 0; i < 256; i++) {
        const val = histogram[i] || 0;
        const barHeight = maxVal === 0 ? 0 : (val / maxVal) * (h - 10);
        ctx.fillRect(i * barWidth, h - barHeight, barWidth, barHeight);
    }
}

function downloadEncryptedImage() {
    try {
        if (!lastEncryptedImage) throw new Error('No encrypted image to download');
        const a = document.createElement('a');
        a.href = lastEncryptedImage;
        a.download = 'encrypted-image-' + Date.now() + '.png';
        a.click();
    } catch (err) {
        showError('Download error: ' + err.message);
    }
}

function clearImageEncryption() {
    document.getElementById('image-upload').value = '';
    document.getElementById('image-key').value = '';
    document.getElementById('image-result').style.display = 'none';
    lastEncryptedImage = null;
    lastEncryptedImageCanvas = null;
    originalImageDataGray = null;
    encryptedImageDataGray = null;
    lastImageWidth = null;
    lastImageHeight = null;
    const analysis = document.getElementById('image-analysis');
    if (analysis) analysis.innerHTML = '';
    hideError();
}

// ===== ERROR HANDLING =====

function showError(message) {
    const section = document.getElementById('error-section');
    if (section) {
        document.getElementById('error-message').textContent = message;
        section.style.display = 'block';
    }
}

function hideError() {
    const section = document.getElementById('error-section');
    if (section) section.style.display = 'none';
}

// ===== S-BOX FILE UPLOAD =====

function triggerSBoxFileUpload() {
    const fileInput = document.getElementById('sbox-file-upload');
    fileInput.click();
}

function handleSBoxFileUpload(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        // Determine file type
        const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
        
        if (isXlsx) {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                showError('Excel library belum ter-load. Coba refresh halaman atau gunakan file .txt/.csv');
                document.getElementById('sbox-file-status').textContent = '❌ Excel library not available';
                document.getElementById('sbox-file-status').style.color = '#e74c3c';
                return;
            }
            
            // Handle Excel file
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Extract values from sheet
                    const sbox = extractSBoxFromSheet(worksheet);
                    
                    // Validate S-Box
                    if (!validateSBox(sbox)) {
                        throw new Error('S-Box tidak valid: harus berisi 256 nilai unik 0-255');
                    }
                    
                    processSBoxSuccess(sbox, file);
                } catch (err) {
                    showError('S-Box file error: ' + err.message);
                    console.error('S-Box parsing error:', err);
                    document.getElementById('sbox-file-status').textContent = '❌ ' + err.message;
                    document.getElementById('sbox-file-status').style.color = '#e74c3c';
                }
            };
            
            reader.onerror = () => {
                showError('Gagal membaca file');
                document.getElementById('sbox-file-status').textContent = '❌ Gagal membaca file';
                document.getElementById('sbox-file-status').style.color = '#e74c3c';
            };
            
            reader.readAsArrayBuffer(file);
        } else {
            // Handle text-based files (.txt, .csv)
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fileContent = e.target.result;
                    const sbox = parseSBoxFromFile(fileContent);
                    
                    // Validate S-Box
                    if (!validateSBox(sbox)) {
                        throw new Error('S-Box tidak valid: harus berisi 256 nilai unik 0-255');
                    }
                    
                    processSBoxSuccess(sbox, file);
                } catch (err) {
                    showError('S-Box file error: ' + err.message);
                    console.error('S-Box parsing error:', err);
                    document.getElementById('sbox-file-status').textContent = '❌ ' + err.message;
                    document.getElementById('sbox-file-status').style.color = '#e74c3c';
                }
            };
            
            reader.onerror = () => {
                showError('Gagal membaca file');
                document.getElementById('sbox-file-status').textContent = '❌ Gagal membaca file';
                document.getElementById('sbox-file-status').style.color = '#e74c3c';
            };
            
            reader.readAsText(file);
        }
    } catch (err) {
        showError('File upload error: ' + err.message);
        console.error('Full error:', err);
    }
}

function extractSBoxFromSheet(worksheet) {
    const values = [];
    
    // Try to extract values from the worksheet
    // First, get all cell references
    for (const cell in worksheet) {
        if (cell[0] === '!') continue; // Skip metadata
        
        const cellValue = worksheet[cell].v;
        if (cellValue !== undefined && cellValue !== null) {
            const num = parseInt(cellValue, 10);
            if (!isNaN(num)) {
                values.push(num);
            }
        }
    }
    
    // If we found values, validate count
    if (values.length > 0) {
        if (values.length !== 256) {
            throw new Error(`Expected 256 values, found ${values.length} in Excel file`);
        }
        return values;
    }
    
    throw new Error('No values found in Excel file');
}

function processSBoxSuccess(sbox, file) {
    // Store custom S-Box
    allSBoxes.custom = sbox;
    
    // Generate analysis for custom S-box if SBoxAnalyzer is available
    if (typeof SBoxAnalyzer !== 'undefined') {
        try {
            const customAnalyzer = new SBoxAnalyzer(sbox);
            const customAnalysis = customAnalyzer.analyze();
            if (customAnalysis) {
                allAnalysis.custom = customAnalysis;
            }
        } catch (analysisErr) {
            console.warn('Could not analyze custom S-Box:', analysisErr);
        }
    }
    
    // Select custom preset
    const buttons = document.querySelectorAll('.preset-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    // Find and activate custom button
    for (let btn of buttons) {
        if (btn.textContent.includes('Custom')) {
            btn.classList.add('active');
            break;
        }
    }
    
    // Update matrix summary
    document.getElementById('summary-matrix').textContent = `Custom (${file.name})`;
    
    // Update file status
    const statusEl = document.getElementById('sbox-file-status');
    statusEl.textContent = `✓ Loaded: ${file.name} (256 values)`;
    statusEl.style.color = '#27ae60';
    
    hideError();
}

function parseSBoxFromFile(fileContent) {
    // Try different parsing formats
    
    // Format 1: Space or comma separated hex/decimal values
    let values = [];
    
    // Try parsing as hex with 0x prefix (e.g., "0x00 0x01 0x02...")
    let hexMatches = fileContent.match(/0x[0-9a-fA-F]{1,2}/g);
    if (hexMatches && hexMatches.length === 256) {
        values = hexMatches.map(h => parseInt(h, 16));
    }
    
    // Try parsing as decimal separated by spaces, commas, or newlines
    if (values.length === 0) {
        const tokens = fileContent.replace(/[,;\s\r\n]+/g, ' ').trim().split(' ').filter(t => t);
        const parsed = tokens.map(t => {
            const num = parseInt(t, 10);
            if (isNaN(num) || num < 0 || num > 255) {
                throw new Error(`Invalid value: ${t} (must be 0-255)`);
            }
            return num;
        });
        
        if (parsed.length === 256) {
            values = parsed;
        }
    }
    
    // Try parsing as space-separated decimal without checking count first
    if (values.length === 0) {
        const tokens = fileContent.replace(/[\r\n]+/g, ' ').trim().split(/\s+/).filter(t => t);
        const parsed = tokens.map(t => {
            const num = parseInt(t, 10);
            if (isNaN(num) || num < 0 || num > 255) {
                throw new Error(`Invalid value: ${t} (must be 0-255)`);
            }
            return num;
        });
        values = parsed;
    }
    
    // Check length
    if (values.length !== 256) {
        throw new Error(`Expected 256 values, found ${values.length}`);
    }
    
    return values;
}

function validateSBox(sbox) {
    // Check if it's an array of 256 unique values from 0-255
    if (!Array.isArray(sbox) || sbox.length !== 256) return false;
    
    const seen = new Set();
    for (let i = 0; i < 256; i++) {
        const val = sbox[i];
        if (!Number.isInteger(val) || val < 0 || val > 255) return false;
        if (seen.has(val)) return false; // Not a permutation
        seen.add(val);
    }
    
    return true;
}

// ===== MATRIX UTILITIES (from sbox-constructor) =====

function parseBinaryMatrix8(text) {
    if (!text) throw new Error('Matrix text kosong');
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length !== 8) throw new Error('Harus 8 baris');
    const matrix = [];
    for (let i = 0; i < 8; i++) {
        let line = lines[i].trim();
        const bits = line.replace(/[^01]/g, '');
        if (bits.length !== 8) throw new Error(`Baris ${i + 1} harus 8 bit`);
        matrix.push(bits.split('').map(c => c === '1' ? 1 : 0));
    }
    return matrix;
}

function validateBinaryMatrix8(matrix) {
    if (!Array.isArray(matrix) || matrix.length !== 8) return false;
    for (let i = 0; i < 8; i++) {
        if (!Array.isArray(matrix[i]) || matrix[i].length !== 8) return false;
        for (let j = 0; j < 8; j++) {
            if (!(matrix[i][j] === 0 || matrix[i][j] === 1)) return false;
        }
    }
    return true;
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
    resetParameters();
    
    // Setup S-Box file upload handler
    const fileInput = document.getElementById('sbox-file-upload');
    if (fileInput) {
        fileInput.addEventListener('change', handleSBoxFileUpload);
    }
});
