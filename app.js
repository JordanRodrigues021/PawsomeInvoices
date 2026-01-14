/**
 * PawInvoice - Cute Veterinary Invoice App
 * Uses Gemini AI for image processing
 */

// Hardcoded Gemini API Key
const GEMINI_API_KEY = 'AIzaSyC_-faY74wvN4fiGgJsoDEueoT-0SXWfRw';

// Application State
const AppState = {
    currentStep: 1,
    selectedCenter: 'SOS',
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    uploadedImages: [],
    surgeryData: [],
    deduction: 0,
    invoiceNumber: 'INV-000001',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    settingsTab: 'SOS',
    rates: JSON.parse(JSON.stringify(CONFIG.rates))
};

const elements = {};

function initApp() {
    loadSavedRates();
    cacheElements();
    setupEventListeners();
    initializeDateSelectors();
    setDefaultDates();
}

function loadSavedRates() {
    const saved = localStorage.getItem('vetInvoiceRates');
    if (saved) {
        try { AppState.rates = JSON.parse(saved); }
        catch (e) { AppState.rates = JSON.parse(JSON.stringify(CONFIG.rates)); }
    }
}

function saveRates() {
    localStorage.setItem('vetInvoiceRates', JSON.stringify(AppState.rates));
}

function cacheElements() {
    elements.uploadZone = document.getElementById('uploadZone');
    elements.fileInput = document.getElementById('fileInput');
    elements.imagePreviewContainer = document.getElementById('imagePreviewContainer');
    elements.imagePreviews = document.getElementById('imagePreviews');
    elements.addMoreImages = document.getElementById('addMoreImages');
    elements.processBtn = document.getElementById('processBtn');
    elements.manualEntryBtn = document.getElementById('manualEntryBtn');
    elements.ocrStatus = document.getElementById('ocrStatus');
    elements.ocrProgress = document.getElementById('ocrProgress');
    elements.dataTableBody = document.getElementById('dataTableBody');
    elements.grandTotal = document.getElementById('grandTotal');
    elements.addRowBtn = document.getElementById('addRowBtn');
    elements.deductionAmount = document.getElementById('deductionAmount');
    elements.invoiceMonth = document.getElementById('invoiceMonth');
    elements.invoiceYear = document.getElementById('invoiceYear');
    elements.invoiceNumber = document.getElementById('invoiceNumber');
    elements.invoiceDate = document.getElementById('invoiceDate');
    elements.dueDate = document.getElementById('dueDate');
    elements.invoicePreview = document.getElementById('invoicePreview');
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.loadingText = document.getElementById('loadingText');
    elements.settingsModal = document.getElementById('settingsModal');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    elements.rateTableEditor = document.getElementById('rateTableEditor');
    elements.rateTabs = document.querySelectorAll('.rate-tab');
    elements.newSurgeryName = document.getElementById('newSurgeryName');
    elements.newSurgeryRate = document.getElementById('newSurgeryRate');
    elements.addSurgeryTypeBtn = document.getElementById('addSurgeryTypeBtn');
    elements.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    elements.centerBtns = document.querySelectorAll('.center-btn');
    elements.backToStep1 = document.getElementById('backToStep1');
    elements.backToStep2 = document.getElementById('backToStep2');
    elements.generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    elements.downloadPdfBtn = document.getElementById('downloadPdfBtn');
    elements.printBtn = document.getElementById('printBtn');
    elements.steps = document.querySelectorAll('.step-section');
    elements.progressSteps = document.querySelectorAll('.progress-step');
    elements.progressLines = document.querySelectorAll('.progress-line');
}

function setupEventListeners() {
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.uploadZone.addEventListener('dragover', e => { e.preventDefault(); elements.uploadZone.classList.add('dragover'); });
    elements.uploadZone.addEventListener('dragleave', e => { e.preventDefault(); elements.uploadZone.classList.remove('dragover'); });
    elements.uploadZone.addEventListener('drop', e => { e.preventDefault(); elements.uploadZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    elements.fileInput.addEventListener('change', e => handleFiles(e.target.files));
    elements.addMoreImages.addEventListener('click', () => elements.fileInput.click());

    elements.centerBtns.forEach(btn => btn.addEventListener('click', () => selectCenter(btn.dataset.center)));
    elements.invoiceMonth.addEventListener('change', () => { AppState.selectedMonth = parseInt(elements.invoiceMonth.value); });
    elements.invoiceYear.addEventListener('change', () => { AppState.selectedYear = parseInt(elements.invoiceYear.value); });

    elements.processBtn.addEventListener('click', processImages);
    elements.manualEntryBtn.addEventListener('click', startManualEntry);
    elements.addRowBtn.addEventListener('click', addEmptyRow);

    elements.deductionAmount.addEventListener('input', () => {
        AppState.deduction = parseFloat(elements.deductionAmount.value) || 0;
        updateGrandTotal();
    });

    elements.backToStep1.addEventListener('click', () => goToStep(1));
    elements.backToStep2.addEventListener('click', () => goToStep(2));
    elements.generateInvoiceBtn.addEventListener('click', generateInvoice);
    elements.downloadPdfBtn.addEventListener('click', downloadPDF);
    elements.printBtn.addEventListener('click', () => window.print());

    elements.invoiceNumber.addEventListener('change', e => { AppState.invoiceNumber = e.target.value; });
    elements.invoiceDate.addEventListener('change', e => { AppState.invoiceDate = e.target.value; generateInvoice(); });
    elements.dueDate.addEventListener('change', e => { AppState.dueDate = e.target.value; generateInvoice(); });

    elements.settingsBtn.addEventListener('click', () => { elements.settingsModal.classList.add('active'); renderRateTableEditor(); });
    elements.closeSettingsBtn.addEventListener('click', () => elements.settingsModal.classList.remove('active'));
    elements.settingsModal.addEventListener('click', e => { if (e.target === elements.settingsModal) elements.settingsModal.classList.remove('active'); });
    elements.rateTabs.forEach(tab => tab.addEventListener('click', () => switchRateTab(tab.dataset.tab)));
    elements.addSurgeryTypeBtn.addEventListener('click', addNewSurgeryType);
    elements.saveSettingsBtn.addEventListener('click', () => { saveRates(); elements.settingsModal.classList.remove('active'); if (AppState.currentStep === 2) populateDataTable(); });
}

function switchRateTab(tab) {
    AppState.settingsTab = tab;
    elements.rateTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderRateTableEditor();
}

function renderRateTableEditor() {
    const rates = AppState.rates[AppState.settingsTab] || {};
    elements.rateTableEditor.innerHTML = Object.entries(rates).map(([name, rate]) => `
        <div class="rate-item">
            <span class="rate-item-name">${name}</span>
            <div class="rate-item-value">
                <span>₹</span>
                <input type="number" value="${rate}" min="0" onchange="updateRateValue('${name}', this.value)">
                <button class="delete-rate-btn" onclick="deleteRateItem('${name}')">🗑️</button>
            </div>
        </div>
    `).join('') || '<p style="padding:1rem;color:#8b7355;">No surgeries defined</p>';
}

function updateRateValue(name, value) {
    if (AppState.rates[AppState.settingsTab]) AppState.rates[AppState.settingsTab][name] = parseFloat(value) || 0;
}

function deleteRateItem(name) {
    if (confirm(`Delete "${name}"?`)) {
        delete AppState.rates[AppState.settingsTab][name];
        renderRateTableEditor();
    }
}

function addNewSurgeryType() {
    const name = elements.newSurgeryName.value.trim();
    const rate = parseFloat(elements.newSurgeryRate.value) || 0;
    if (!name) return alert('Enter a surgery name');
    if (!AppState.rates[AppState.settingsTab]) AppState.rates[AppState.settingsTab] = {};
    AppState.rates[AppState.settingsTab][name] = rate;
    elements.newSurgeryName.value = '';
    elements.newSurgeryRate.value = '';
    renderRateTableEditor();
}

function initializeDateSelectors() {
    elements.invoiceMonth.value = String(AppState.selectedMonth).padStart(2, '0');
    const currentYear = new Date().getFullYear();
    // Years from 2024 to 2030
    for (let y = 2024; y <= 2030; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        elements.invoiceYear.appendChild(opt);
    }
    AppState.selectedYear = currentYear;
}

function setDefaultDates() {
    const today = new Date();
    AppState.invoiceDate = today.toISOString().split('T')[0];
    const due = new Date(today); due.setDate(due.getDate() + 30);
    AppState.dueDate = due.toISOString().split('T')[0];
    elements.invoiceDate.value = AppState.invoiceDate;
    elements.dueDate.value = AppState.dueDate;
}

function selectCenter(center) {
    AppState.selectedCenter = center;
    elements.centerBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.center === center));
}

function handleFiles(files) {
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = e => {
                AppState.uploadedImages.push({ file, dataUrl: e.target.result });
                updateImagePreviews();
            };
            reader.readAsDataURL(file);
        }
    }
}

function updateImagePreviews() {
    if (AppState.uploadedImages.length > 0) {
        elements.imagePreviewContainer.style.display = 'block';
        elements.processBtn.disabled = false;
        elements.imagePreviews.innerHTML = AppState.uploadedImages.map((img, i) => `
            <div class="preview-item">
                <img src="${img.dataUrl}" alt="Page ${i + 1}">
                <button class="remove-btn" onclick="removeImage(${i})">×</button>
            </div>
        `).join('');
    } else {
        elements.imagePreviewContainer.style.display = 'none';
        elements.processBtn.disabled = true;
    }
}

function removeImage(i) {
    AppState.uploadedImages.splice(i, 1);
    updateImagePreviews();
}

async function processImages() {
    if (AppState.uploadedImages.length === 0) return;

    goToStep(2);
    elements.ocrStatus.style.display = 'block';
    document.getElementById('dataTableContainer').style.opacity = '0.3';

    let allData = [];

    for (let i = 0; i < AppState.uploadedImages.length; i++) {
        const img = AppState.uploadedImages[i];
        document.querySelector('.status-text').textContent = `Analyzing image ${i + 1} of ${AppState.uploadedImages.length}...`;
        elements.ocrProgress.style.width = `${((i + 0.5) / AppState.uploadedImages.length) * 100}%`;

        try {
            const data = await processWithGemini(img.dataUrl);
            allData = allData.concat(data);
            elements.ocrProgress.style.width = `${((i + 1) / AppState.uploadedImages.length) * 100}%`;
        } catch (err) {
            console.error('Gemini error:', err);
        }
    }

    elements.ocrStatus.style.display = 'none';
    document.getElementById('dataTableContainer').style.opacity = '1';

    if (allData.length === 0) {
        alert('No data found. Enter manually below.');
        addEmptyRow();
    } else {
        AppState.surgeryData = allData;
        populateDataTable();
    }
}

async function processWithGemini(imageDataUrl, retries = 3) {
    const base64 = imageDataUrl.split(',')[1];
    const mime = imageDataUrl.split(';')[0].split(':')[1];
    const surgeryTypes = Object.keys(AppState.rates[AppState.selectedCenter]);

    const prompt = `Analyze this veterinary surgery log sheet. Extract ALL surgery data.

Known surgery types: ${surgeryTypes.join(', ')}

Return ONLY a JSON array:
[{"date": "DD/MM/YYYY", "surgeryType": "Name", "quantity": number}, ...]

Only include surgeries with count > 0. Use exact surgery names from the list.`;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
                })
            });

            if (res.status === 429) {
                const waitTime = (attempt + 1) * 5000;
                document.querySelector('.status-text').textContent = `Rate limited, waiting ${waitTime / 1000}s...`;
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
                return JSON.parse(match[0]).map(item => ({
                    date: normalizeDate(item.date),
                    surgeryType: item.surgeryType,
                    quantity: parseInt(item.quantity) || 1,
                    rate: getRate(AppState.selectedCenter, item.surgeryType)
                }));
            }
            return [];
        } catch (err) {
            if (attempt === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    return [];
}

function normalizeDate(d) {
    if (!d) return '';
    const p = d.split(/[\/-]/);
    if (p.length === 3) {
        let [day, month, year] = p;
        if (year.length === 2) year = '20' + year;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return d;
}

function getRate(center, type) {
    return AppState.rates[center]?.[type] || 0;
}

function getSurgeryTypes(center) {
    return Object.keys(AppState.rates[center] || {});
}

function startManualEntry() {
    goToStep(2);
    AppState.surgeryData = [];
    addEmptyRow();
}

function populateDataTable() {
    elements.dataTableBody.innerHTML = '';
    if (AppState.surgeryData.length === 0) { addEmptyRow(); return; }
    AppState.surgeryData.forEach((row, i) => addDataRow(row, i));
    updateGrandTotal();
}

function addDataRow(row, i) {
    const opts = getSurgeryTypes(AppState.selectedCenter).map(t => `<option value="${t}">${t}</option>`).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" value="${row.date}" onchange="updateRow(${i},'date',this.value)"></td>
        <td><input type="text" list="sl${i}" value="${row.surgeryType || ''}" onchange="updateSurgeryType(${i},this.value)"><datalist id="sl${i}">${opts}</datalist></td>
        <td><input type="number" value="${row.quantity}" min="1" onchange="updateRow(${i},'quantity',parseInt(this.value));updateRowAmount()"></td>
        <td class="rate-cell"><input type="number" value="${row.rate}" min="0" onchange="updateRow(${i},'rate',parseFloat(this.value));updateRowAmount()"></td>
        <td class="amount-cell">${formatCurrency(row.rate * row.quantity)}</td>
        <td><button class="delete-row-btn" onclick="deleteRow(${i})">🗑️</button></td>
    `;
    elements.dataTableBody.appendChild(tr);
}

function addEmptyRow() {
    const types = getSurgeryTypes(AppState.selectedCenter);
    const type = types[0] || '';
    AppState.surgeryData.push({
        date: `${AppState.selectedYear}-${String(AppState.selectedMonth).padStart(2, '0')}-01`,
        surgeryType: type,
        quantity: 1,
        rate: getRate(AppState.selectedCenter, type)
    });
    populateDataTable();
}

function updateRow(i, field, val) {
    if (AppState.surgeryData[i]) AppState.surgeryData[i][field] = val;
}

function updateSurgeryType(i, val) {
    if (AppState.surgeryData[i]) {
        AppState.surgeryData[i].surgeryType = val;
        const rate = getRate(AppState.selectedCenter, val);
        if (rate > 0) AppState.surgeryData[i].rate = rate;
        populateDataTable();
    }
}

function updateRowAmount() { populateDataTable(); }
function deleteRow(i) { AppState.surgeryData.splice(i, 1); populateDataTable(); }

function updateGrandTotal() {
    const sub = AppState.surgeryData.reduce((s, r) => s + (r.rate * r.quantity), 0);
    elements.grandTotal.textContent = formatCurrency(sub - AppState.deduction);
}

function goToStep(n) {
    AppState.currentStep = n;
    elements.steps.forEach((s, i) => s.dataset.active = (i + 1 === n).toString());
    elements.progressSteps.forEach((s, i) => {
        s.classList.remove('active', 'completed');
        if (i + 1 === n) s.classList.add('active');
        else if (i + 1 < n) s.classList.add('completed');
    });
    elements.progressLines.forEach((l, i) => l.classList.toggle('completed', i < n - 1));
}

function generateInvoice() {
    AppState.invoiceNumber = elements.invoiceNumber.value;
    AppState.invoiceDate = elements.invoiceDate.value;
    AppState.dueDate = elements.dueDate.value;

    goToStep(3);

    const center = CONFIG.centers[AppState.selectedCenter];
    const sub = AppState.surgeryData.reduce((s, r) => s + (r.rate * r.quantity), 0);
    const total = sub - AppState.deduction;

    const grouped = {};
    AppState.surgeryData.forEach(r => {
        const k = `${r.date}_${r.surgeryType}`;
        if (grouped[k]) grouped[k].quantity += r.quantity;
        else grouped[k] = { ...r };
    });

    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

    let rows = '';
    sorted.forEach((r, i) => {
        rows += `<tr>
            <td>${i + 1}</td>
            <td>${formatDate(r.date)}</td>
            <td>${r.surgeryType}</td>
            <td style="text-align:center">${r.quantity}</td>
            <td class="amount">${formatCurrency(r.rate)}</td>
            <td class="amount">${formatCurrency(r.rate * r.quantity)}</td>
        </tr>`;
    });

    if (AppState.deduction > 0) {
        rows += `<tr>
            <td>${sorted.length + 1}</td><td></td><td>Deduction</td><td style="text-align:center">1</td><td></td>
            <td class="amount" style="color:#ef4444">-${formatCurrency(AppState.deduction)}</td>
        </tr>`;
    }

    elements.invoicePreview.innerHTML = `
        <div class="invoice-html">
            <div class="inv-header">
                <h1>🐾 ${CONFIG.business.name}</h1>
                ${CONFIG.business.address.map(l => `<p>${l}</p>`).join('')}
            </div>
            
            <div class="inv-title">
                <span class="inv-paw">🐾</span>INVOICE<span class="inv-paw">🐾</span>
            </div>
            
            <div class="inv-meta">
                <div class="inv-meta-item"><strong>Invoice #</strong>${AppState.invoiceNumber}</div>
                <div class="inv-meta-item"><strong>Date</strong>${formatDate(AppState.invoiceDate)}</div>
                <div class="inv-meta-item"><strong>Due</strong>${formatDate(AppState.dueDate)}</div>
            </div>
            
            <div class="inv-bill-to">
                <p style="font-size:9px;color:#8b7355">Bill To</p>
                <h3>🏥 ${center.name}</h3>
                <p>${center.address}</p>
            </div>
            
            <table class="inv-table">
                <thead><tr><th>#</th><th>Date</th><th>Surgery</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr class="inv-total"><td colspan="5" style="text-align:right;padding-right:10px"><strong>🎉 Grand Total</strong></td><td class="amount"><strong>${formatCurrency(total)}</strong></td></tr></tfoot>
            </table>
            
            <div class="inv-words"><strong>Amount in Words:</strong> Rupees ${numberToWords(Math.round(total))} Only</div>
            
            <div class="inv-bank">
                <h4>💳 Bank Details</h4>
                <div class="inv-bank-row"><span class="inv-bank-label">Payee</span><span>${CONFIG.bank.payeeName}</span></div>
                <div class="inv-bank-row"><span class="inv-bank-label">Bank</span><span>${CONFIG.bank.bankName}</span></div>
                <div class="inv-bank-row"><span class="inv-bank-label">Account No.</span><span>${CONFIG.bank.accountNumber}</span></div>
                <div class="inv-bank-row"><span class="inv-bank-label">IFSC</span><span>${CONFIG.bank.ifscCode}</span></div>
                <div class="inv-bank-row"><span class="inv-bank-label">Account Type</span><span>${CONFIG.bank.accountType}</span></div>
                <div class="inv-bank-row"><span class="inv-bank-label">PAN</span><span>${CONFIG.bank.panNumber}</span></div>
            </div>
        </div>
    `;
}

async function downloadPDF() {
    showLoading('Creating your invoice...');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = doc.internal.pageSize.getWidth();
        const m = 15;
        const cw = pw - m * 2;
        let y = m;

        // Header
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, pw, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(CONFIG.business.name, pw / 2, 18, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        CONFIG.business.address.forEach((l, i) => doc.text(l, pw / 2, 26 + i * 4, { align: 'center' }));

        y = 50;

        // Invoice title
        doc.setFillColor(236, 72, 153);
        doc.roundedRect(m, y, cw, 12, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', pw / 2, y + 8, { align: 'center' });

        y += 20;

        // Meta
        doc.setFontSize(9);
        doc.setTextColor(139, 115, 85);
        const meta = [['Invoice #:', AppState.invoiceNumber], ['Date:', formatDate(AppState.invoiceDate)], ['Due:', formatDate(AppState.dueDate)]];
        meta.forEach(([l, v]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(l, m, y);
            doc.setFont('helvetica', 'normal');
            doc.text(v, m + 25, y);
            y += 5;
        });

        y += 5;

        // Bill To
        const center = CONFIG.centers[AppState.selectedCenter];
        doc.setFillColor(237, 233, 254);
        doc.roundedRect(m, y, cw, 20, 3, 3, 'F');
        doc.setTextColor(124, 58, 237);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(center.name, pw / 2, y + 9, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(139, 115, 85);
        doc.text(center.address, pw / 2, y + 15, { align: 'center' });

        y += 28;

        // Table
        const cols = [12, 24, 55, 15, 30, 30];
        const heads = ['#', 'Date', 'Surgery', 'Qty', 'Rate', 'Amount'];

        doc.setFillColor(124, 58, 237);
        doc.rect(m, y, cw, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        let x = m;
        heads.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += cols[i]; });
        y += 8;

        // Group data
        const grouped = {};
        AppState.surgeryData.forEach(r => {
            const k = `${r.date}_${r.surgeryType}`;
            if (grouped[k]) grouped[k].quantity += r.quantity;
            else grouped[k] = { ...r };
        });
        const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

        doc.setTextColor(74, 55, 40);
        doc.setFont('helvetica', 'normal');

        sorted.forEach((r, i) => {
            if (y > 265) { doc.addPage(); y = m; }
            if (i % 2 === 0) { doc.setFillColor(254, 247, 240); doc.rect(m, y, cw, 6, 'F'); }

            x = m;
            const cells = [String(i + 1), formatDate(r.date), r.surgeryType, String(r.quantity), formatCurrency(r.rate), formatCurrency(r.rate * r.quantity)];
            cells.forEach((c, j) => { doc.text(c, x + 2, y + 4); x += cols[j]; });
            y += 6;
        });

        if (AppState.deduction > 0) {
            doc.setTextColor(239, 68, 68);
            x = m;
            const cells = [String(sorted.length + 1), '', 'Deduction', '1', '', '-' + formatCurrency(AppState.deduction)];
            cells.forEach((c, j) => { doc.text(c, x + 2, y + 4); x += cols[j]; });
            y += 6;
        }

        // Total
        const sub = AppState.surgeryData.reduce((s, r) => s + r.rate * r.quantity, 0);
        const total = sub - AppState.deduction;

        doc.setFillColor(236, 72, 153);
        doc.rect(m, y, cw, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total:', m + cols[0] + cols[1] + cols[2] + cols[3] + 2, y + 5);
        doc.text(formatCurrency(total), m + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + 2, y + 5);

        y += 15;

        // Amount in words
        doc.setFillColor(254, 247, 240);
        doc.roundedRect(m, y, cw, 10, 2, 2, 'F');
        doc.setTextColor(74, 55, 40);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Amount in Words:', m + 3, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(`Rupees ${numberToWords(Math.round(total))} Only`, m + 38, y + 6);

        y += 18;

        // Bank
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(124, 58, 237);
        doc.text('Bank Details', m, y);
        y += 6;

        doc.setFontSize(8);
        const bank = [
            ['Payee:', CONFIG.bank.payeeName],
            ['Bank:', CONFIG.bank.bankName],
            ['Account:', CONFIG.bank.accountNumber],
            ['IFSC:', CONFIG.bank.ifscCode],
            ['Type:', CONFIG.bank.accountType],
            ['PAN:', CONFIG.bank.panNumber]
        ];

        bank.forEach(([l, v]) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(139, 115, 85);
            doc.text(l, m, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(74, 55, 40);
            doc.text(v, m + 25, y);
            y += 5;
        });

        // Save with proper filename
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const filename = `PawInvoice_${AppState.selectedCenter}_${months[AppState.selectedMonth - 1]}_${AppState.selectedYear}.pdf`;

        // Method 1: Try direct save first
        try {
            doc.save(filename);
        } catch (saveErr) {
            // Method 2: Fallback to blob approach
            const pdfBlob = doc.output('blob');
            const blobUrl = window.URL.createObjectURL(pdfBlob);
            const tempLink = document.createElement('a');
            tempLink.style.display = 'none';
            tempLink.href = blobUrl;
            tempLink.setAttribute('download', filename);
            tempLink.setAttribute('target', '_blank');
            document.body.appendChild(tempLink);
            tempLink.click();
            setTimeout(() => {
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(blobUrl);
            }, 200);
        }

        hideLoading();

    } catch (err) {
        console.error('PDF Error:', err);
        hideLoading();
        alert('Error creating PDF. Please try again.');
    }
}

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', initApp);
