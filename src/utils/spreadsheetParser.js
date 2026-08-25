import * as XLSX from 'xlsx';

// Maps flexible spreadsheet header spellings to the canonical field names
// the backend expects. Add new aliases here rather than in component code.
const HEADER_ALIASES = {
  firstname: 'firstName',
  'first name': 'firstName',
  first: 'firstName',
  lastname: 'lastName',
  'last name': 'lastName',
  last: 'lastName',
  surname: 'lastName',
  email: 'email',
  'email address': 'email',
  phoneno: 'phoneNo',
  'phone_no': 'phoneNo',
  'phone no': 'phoneNo',
  'phone number': 'phoneNo',
  phone: 'phoneNo',
  mobile: 'phoneNo',
  role: 'role',
  'user role': 'role',
  'account type': 'role'
};

const normalizeHeader = (header) => {
  const cleaned = String(header || '').trim().toLowerCase();
  return HEADER_ALIASES[cleaned] || null;
};

// Converts a raw row (with whatever headers were in the file) into
// { firstName, lastName, email, role }. Unrecognised columns are ignored.
const normalizeRow = (rawRow) => {
  const row = { firstName: '', lastName: '', email: '', phoneNo: '', role: '' };
  for (const [header, value] of Object.entries(rawRow)) {
    const field = normalizeHeader(header);
    if (field) row[field] = String(value ?? '').trim();
  }
  return row;
};

/**
 * Parses a .csv, .xlsx, or .xls File into an array of
 * { firstName, lastName, email, role } objects, using the FIRST sheet only.
 * Throws if the file can't be read or parsed.
 */
export const parseSpreadsheet = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('The file has no sheets.'));
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        resolve(rawRows.map(normalizeRow));
      } catch (err) {
        reject(new Error('Could not parse file. Make sure it is a valid .csv or .xlsx file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
};
