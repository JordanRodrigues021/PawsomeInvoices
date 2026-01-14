/**
 * Rate Tables and Business Configuration
 * Veterinary Invoice App - Dr. Jill Anne Rodrigues
 */

const CONFIG = {
    // Business Details
    business: {
        name: "Dr. Jill Anne Rodrigues",
        address: [
            "5th Floor DomPhil Apartments",
            "7 Veronica Road, Bandra (W)",
            "Mumbai 400050"
        ],
        phone: "",
        email: ""
    },

    // Bank Details
    bank: {
        payeeName: "Jill Anne Rodrigues",
        bankName: "Bank of Baroda",
        accountNumber: "89700100039430",
        ifscCode: "BARB0VJBAND",
        ifscNote: "(5th Character is a zero)",
        accountType: "Savings",
        panNumber: "AMSPR5570Q"
    },

    // Center Details
    centers: {
        SOS: {
            name: "SOS Foundation, Mumbai",
            address: "Mumbai, Maharashtra",
            fullName: "Save Our Strays"
        },
        AAT: {
            name: "AAT",
            address: "Mumbai, Maharashtra",
            fullName: "All About Them"
        }
    },

    // Surgery Types (order matters for table display)
    surgeryTypes: [
        "Cat Spay",
        "Cat Castration",
        "Dog Spay",
        "Dog Castration",
        "Eye Extirpation",
        "Hernia",
        "Leg Amputation",
        "Tail Amputation",
        "Digit Amputation",
        "Resuture",
        "Wound Suture",
        "Prolapse",
        "Cryptorchid",
        "Scrotal Ablation"
    ],

    // Rate Tables
    rates: {
        SOS: {
            "Cat Spay": 800,
            "Cat Castration": 400,
            "Dog Spay": 1500,
            "Dog Castration": 1200,
            "Eye Extirpation": 1500,
            "Hernia": 1500,
            "Leg Amputation": 2000,
            "Tail Amputation": 1500,
            "Digit Amputation": 500,
            "Resuture": 500,
            "Wound Suture": 500,
            "Prolapse": 500
        },
        AAT: {
            "Cat Spay": 1000,
            "Cat Castration": 400,
            "Dog Spay": 1200,
            "Dog Castration": 1000,
            "Eye Extirpation": 2000,
            "Hernia": 1000,
            "Leg Amputation": 2500,
            "Tail Amputation": 500,
            "Cryptorchid": 1000,
            "Scrotal Ablation": 1500
        }
    },

    // Column mappings for OCR parsing (matching the log sheet headers)
    columnHeaders: [
        "Date",
        "Cat Spay",
        "Cat Castration", // "Cat Castr ation" in log
        "Dog Spay",
        "Dog Castration", // "Dog Castrati on" in log
        "Eye Extirpation", // "Eye Extirpati on" in log
        "Hernia",
        "Leg Amputation", // "Leg Amputati on" in log
        "Tail Amputation", // "Tail Amputati on" in log
        "Digit Amputation", // "Digit Amputatio n" in log
        "Resuture",
        "Wound Suture",
        "Prolapse",
        "Other",
        "Other"
    ]
};

/**
 * Get rate for a surgery type at a specific center
 */
function getRate(center, surgeryType) {
    const rates = CONFIG.rates[center];
    if (rates && rates[surgeryType] !== undefined) {
        return rates[surgeryType];
    }
    return 0;
}

/**
 * Get all surgery types available for a center
 */
function getSurgeryTypesForCenter(center) {
    return Object.keys(CONFIG.rates[center] || {});
}

/**
 * Generate invoice number based on date and sequence
 */
function generateInvoiceNumber(date, sequence = 1) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const seq = String(sequence).padStart(5, '0');
    return `INV-${seq}`;
}

/**
 * Convert number to words (Indian format)
 */
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);

    let words = '';

    // Crore (10,000,000)
    if (Math.floor(num / 10000000) > 0) {
        words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }

    // Lakh (100,000)
    if (Math.floor(num / 100000) > 0) {
        words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }

    // Thousand
    if (Math.floor(num / 1000) > 0) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }

    // Hundred
    if (Math.floor(num / 100) > 0) {
        words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
        num %= 100;
    }

    if (num > 0) {
        if (words !== '') words += '';
        if (num < 20) {
            words += ones[num];
        } else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) {
                words += ' ' + ones[num % 10];
            }
        }
    }

    return words.trim();
}

/**
 * Format amount to Indian Rupee format
 */
function formatCurrency(amount) {
    return 'Rs. ' + amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format date to DD-MM-YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}
