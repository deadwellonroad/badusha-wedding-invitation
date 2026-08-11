/**
 * Google Apps Script RSVP backend for Mohamed Badusha & Mumthas Nadeera.
 *
 * Bind this script to the family-owned Google Sheet and deploy it as a Web App.
 * Store ADMIN_USERNAME and ADMIN_PASSWORD in Apps Script Project Settings →
 * Script properties. No credentials belong in this source file.
 */
const SHEET_NAME = 'RSVP';
const MAX_GUESTS = 10;

function doGet(e) {
  const parameters = (e && e.parameter) || {};
  try {
    if (String(parameters.action || '') === 'list') {
      if (!isAdmin_(parameters.username, parameters.password)) {
        return output_({ ok: false, error: 'Unauthorized' }, parameters.callback);
      }
      return output_({ ok: true, records: readRecords_() }, parameters.callback);
    }
    return output_({ ok: true, service: 'Wedding RSVP', status: 'online' }, parameters.callback);
  } catch (error) {
    return output_({ ok: false, error: publicError_(error) }, parameters.callback);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (String(data.action || '') === 'list') {
      if (!isAdmin_(data.username, data.password)) {
        return json_({ ok: false, error: 'Unauthorized' });
      }
      return json_({ ok: true, records: readRecords_() });
    }

    const record = validateRsvp_(data);
    upsertRecord_(record);
    return json_({ ok: true, updatedAt: record.timestamp });
  } catch (error) {
    return json_({ ok: false, error: publicError_(error) });
  }
}

function validateRsvp_(data) {
  const name = clean_(data.name, 100);
  if (name.length < 2) throw new Error('A valid name or family name is required.');

  const attendance = String(data.attendance || '');
  if (attendance !== 'Yes' && attendance !== 'No') throw new Error('Attendance must be Yes or No.');

  const rawCount = Number(data.guestCount != null ? data.guestCount : data.guests);
  let guestCount = 0;
  if (attendance === 'Yes') {
    if (!Number.isInteger(rawCount) || rawCount < 1 || rawCount > MAX_GUESTS) {
      throw new Error('Guest count must be a whole number from 1 to 10.');
    }
    guestCount = rawCount;
  }

  const phone = clean_(data.phone, 20);
  const phoneDigits = normalizePhone_(phone);
  if (phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    throw new Error('Phone number is invalid.');
  }

  return {
    timestamp: new Date().toISOString(),
    name: safeCell_(name),
    attendance: attendance,
    guestCount: guestCount,
    phone: safeCell_(phone)
  };
}

function isAdmin_(username, password) {
  const properties = PropertiesService.getScriptProperties();
  const expectedUsername = properties.getProperty('ADMIN_USERNAME');
  const expectedPassword = properties.getProperty('ADMIN_PASSWORD');
  if (!expectedUsername || !expectedPassword) return false;
  return String(username || '') === expectedUsername && String(password || '') === expectedPassword;
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').slice(0, maxLength || 250);
}

function safeCell_(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function normalizePhone_(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeName_(value) {
  return String(value || '').replace(/^'/, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('This script must be bound to a Google Sheet.');
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'name', 'attendance', 'guestCount', 'phone']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:E1').setFontWeight('bold');
  }
  return sheet;
}

function upsertRecord_(record) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('The RSVP list is busy. Please try again.');
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    const targetPhone = normalizePhone_(record.phone);
    const targetName = normalizeName_(record.name);
    let existingRow = 0;

    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
      for (let index = 0; index < rows.length; index += 1) {
        const rowPhone = normalizePhone_(rows[index][4]);
        const rowName = normalizeName_(rows[index][1]);
        const samePhone = targetPhone && rowPhone && targetPhone === rowPhone;
        const sameName = targetName && targetName === rowName;
        if (samePhone || sameName) {
          existingRow = index + 2;
          break;
        }
      }
    }

    const values = [[record.timestamp, record.name, record.attendance, record.guestCount, record.phone]];
    if (existingRow) sheet.getRange(existingRow, 1, 1, 5).setValues(values);
    else sheet.getRange(lastRow + 1, 1, 1, 5).setValues(values);
  } finally {
    lock.releaseLock();
  }
}

function readRecords_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift().map(String);
  return values.filter(function(row) {
    return row.some(function(value) { return value !== ''; });
  }).map(function(row) {
    const record = {};
    headers.forEach(function(header, index) {
      record[header] = row[index] instanceof Date ? row[index].toISOString() : row[index];
    });
    return record;
  });
}

function output_(object, callback) {
  const functionName = String(callback || '');
  if (/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(functionName)) {
    return ContentService.createTextOutput(functionName + '(' + JSON.stringify(object) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(object);
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

function publicError_(error) {
  const message = String(error && error.message ? error.message : error || 'Unexpected error');
  return message.slice(0, 180);
}
