const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

// JSON Server API URL
const API_URL = 'http://localhost:3000/customers';

// Error log file
const ERROR_LOG = 'error_report.csv';

// Function to validate and transform data
function validateAndTransform(row) {
    const errors = [];

    // Age: Convert float to int, invalid => empty string
    if (row.age) {
        const age = parseFloat(row.age);
        if (!isNaN(age) && age >= 0) {
            row.age = Math.floor(age);
        } else {
            row.age = '';
            errors.push('Invalid age');
        }
    }

    // Email: Convert to lowercase, validate format
    if (row.email) {
        row.email = row.email.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            row.email = '';
            errors.push('Invalid email format');
        }
    }

    // Gender: Only "M" or "F", else empty string
    if (row.gender && !['M', 'F'].includes(row.gender.toUpperCase())) {
        row.gender = '';
        errors.push('Invalid gender');
    }

    // Phone: Remove non-numeric chars, ensure 10 digits
    if (row.phone) {
        row.phone = row.phone.replace(/\D/g, '');
        if (row.phone.length < 10) {
            row.phone = '';
            errors.push('Phone number too short');
        }
    }

    // Membership: Normalize values
    if (row.membership) {
        row.membership = row.membership.toLowerCase();
        const membershipMap = { basic: 'bronze', silver: 'silver', gold: 'gold' };
        row.membership = membershipMap[row.membership] || '';
        if (!row.membership) {
            errors.push('Invalid membership');
        }
    }

    // Dates: Convert to YYYY-MM-DD, validate range and order
    const validateDate = (dateStr, fieldName) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            errors.push(`Invalid ${fieldName}`);
            return '';
        }
        const year = date.getFullYear();
        if (year < 2000 || year > 2025) {
            errors.push(`${fieldName} out of range`);
            return '';
        }
        return date.toISOString().split('T')[0];
    };

    row.joinedAt = validateDate(row.joinedAt, 'join date');
    row.lastPurchase = validateDate(row.lastPurchase, 'last purchase date');

    if (row.joinedAt && row.lastPurchase && row.lastPurchase < row.joinedAt) {
        errors.push('Last purchase date earlier than join date');
        row.lastPurchase = '';
    }

    // Preferred Category: Replace invalid values with empty string
    if (['Unknown', 'TBD', 'To Be Determined', 'N/A'].includes(row.preferredCategory)) {
        row.preferredCategory = '';
    }

    // Churned: Convert to boolean or empty string
    if (row.churned) {
        const churnedMap = { Y: true, yes: true, 1: true, N: false, no: false, 0: false };
        row.churned = churnedMap[row.churned.toLowerCase()] || '';
        if (row.churned === '') {
            errors.push('Invalid churned value');
        }
    }

    return { row, errors };
}

// Function to log errors
function logErrors(rowNumber, errors) {
    if (errors.length > 0) {
        const errorLog = errors.map(err => `${rowNumber},${err}`).join('\n');
        fs.appendFileSync(ERROR_LOG, errorLog + '\n');
    }
}

// Function to upload data to JSON Server
async function uploadData(data) {
    try {
        await axios.post(API_URL, data);
        console.log(`Uploaded customer: ${data.firstName} ${data.lastName}`);
    } catch (error) {
        console.error(`Error uploading customer: ${data.firstName} ${data.lastName}`, error.message);
    }
}

// Main function to process the CSV file
function processCSV(filePath) {
    let rowNumber = 0;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            rowNumber++;
            const { row: cleanedRow, errors } = validateAndTransform(row);
            logErrors(rowNumber, errors);
            uploadData(cleanedRow);
        })
        .on('end', () => {
            console.log('CSV file processing completed.');
        });
}

// Run the script
processCSV('customers.csv');