const fs = require('fs');
const path = require('path');
const { fetchURL, parseCSV } = require('./fetch-menu-data');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeetU-sTKeodCrslGkzITvyC7Ob4ayTf5HdLDqcEEueZfHw4QqzAxbapHBdWq0TYhR6fbvNuL8lqLT/pub?gid=1648383971&single=true&output=csv';

// Accepts DD/MM/YYYY (also with - or . as separator) and returns YYYY-MM-DD.
function parseDate(text) {
    const match = text.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (!match) throw new Error(`Invalid date "${text}" - expected DD/MM/YYYY`);

    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error(`Date "${text}" does not exist`);
    }
    return date.toISOString().slice(0, 10);
}

// Columns: first bookable date | last bookable date (optional) | closed days, one per row.
function parseReservationDates(rows) {
    const firstRow = rows[1] || [];
    if (!(firstRow[0] || '').trim()) throw new Error('The first bookable date is missing');

    const open = parseDate(firstRow[0]);
    const close = (firstRow[1] || '').trim() ? parseDate(firstRow[1]) : null;
    if (close && close < open) throw new Error('The last bookable date is before the first one');

    const closedDays = rows.slice(1)
        .map(row => (row[2] || '').trim())
        .filter(Boolean)
        .map(parseDate);

    return { open, close, closedDays };
}

async function main() {
    const csv = await fetchURL(SHEET_URL);
    const dates = parseReservationDates(parseCSV(csv));

    const outPath = path.join(__dirname, '..', 'js', 'reservation-dates.js');
    fs.writeFileSync(outPath, `window.RESERVATION_DATES = ${JSON.stringify(dates, null, 2)};\n`, 'utf8');
    console.log(`Saved reservation dates: ${JSON.stringify(dates)}`);
}

if (require.main === module) {
    main().catch(err => { console.error('Error:', err.message); process.exit(1); });
}

module.exports = { parseReservationDates };
