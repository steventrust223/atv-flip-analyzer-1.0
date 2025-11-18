/**
 * ===== FILE: ATV_utils.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Utility functions:
 * - Logging to ATV_SYSTEM_LOG
 * - ID generation
 * - Header/column mapping helpers
 * - Settings loader/saver
 * - Common data manipulation utilities
 */

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Logs an event to the ATV_SYSTEM_LOG sheet
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} functionName - Name of the calling function
 * @param {string} message - Log message
 * @param {string} [details] - Optional additional details
 */
function ATV_log(level, functionName, message, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ATV_SHEETS.SYSTEM_LOG);

    if (!sheet) {
      // Create log sheet if it doesn't exist
      sheet = ss.insertSheet(ATV_SHEETS.SYSTEM_LOG);
      sheet.appendRow(ATV_HEADERS_LOG);
      ATV_formatHeaderRow(sheet, ATV_COLORS.HEADER_SYSTEM);
    }

    const timestamp = new Date();
    const logRow = [
      timestamp,
      level || 'INFO',
      functionName || 'Unknown',
      message || '',
      details || ''
    ];

    sheet.appendRow(logRow);

    // Keep only last 1000 log entries to prevent bloat
    const lastRow = sheet.getLastRow();
    if (lastRow > 1001) {
      sheet.deleteRows(2, lastRow - 1001);
    }
  } catch (e) {
    // Fail silently - don't break the app if logging fails
    console.error('Logging failed: ' + e.message);
  }
}

/**
 * Convenience logging functions
 */
function ATV_logInfo(func, message, details) {
  ATV_log('INFO', func, message, details);
}

function ATV_logWarn(func, message, details) {
  ATV_log('WARN', func, message, details);
}

function ATV_logError(func, message, details) {
  ATV_log('ERROR', func, message, details);
}

function ATV_logDebug(func, message, details) {
  ATV_log('DEBUG', func, message, details);
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generates a unique ATV ID
 * Format: ATV-YYYYMMDD-XXXXX (random 5 chars)
 * @returns {string} Unique ATV ID
 */
function ATV_generateAtvId() {
  const date = new Date();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ATV-${dateStr}-${random}`;
}

/**
 * Generates a unique Part ID
 * Format: PRT-XXXXX
 */
function ATV_generatePartId() {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PRT-${random}`;
}

/**
 * Generates a unique Lead ID
 * Format: LED-XXXXX
 */
function ATV_generateLeadId() {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LED-${random}`;
}

/**
 * Generates a unique Sale ID
 * Format: SLE-YYYYMMDD-XXX
 */
function ATV_generateSaleId() {
  const date = new Date();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SLE-${dateStr}-${random}`;
}

/**
 * Generates a unique Build Plan ID
 * Format: BLD-XXXXX
 */
function ATV_generateBuildId() {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BLD-${random}`;
}

// ============================================================================
// HEADER & COLUMN MAPPING
// ============================================================================

/**
 * Creates a map of header names to column indices (1-based)
 * @param {Sheet} sheet - The sheet to map
 * @returns {Object} Map of header name to column index
 */
function ATV_getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};

  for (let i = 0; i < headers.length; i++) {
    if (headers[i]) {
      map[headers[i].toString().trim()] = i + 1; // 1-based index
    }
  }

  return map;
}

/**
 * Gets column index for a header name (1-based)
 * @param {Sheet} sheet - The sheet
 * @param {string} headerName - Name of the header
 * @returns {number} Column index (1-based) or -1 if not found
 */
function ATV_getColumnIndex(sheet, headerName) {
  const map = ATV_getHeaderMap(sheet);
  return map[headerName] || -1;
}

/**
 * Gets value from a row by header name
 * @param {Array} row - Row data array
 * @param {Object} headerMap - Header map object
 * @param {string} headerName - Name of the header
 * @returns {*} Value at that column or empty string
 */
function ATV_getValueByHeader(row, headerMap, headerName) {
  const colIndex = headerMap[headerName];
  if (colIndex && colIndex > 0) {
    return row[colIndex - 1] || '';
  }
  return '';
}

/**
 * Sets value in a row array by header name
 * @param {Array} row - Row data array
 * @param {Object} headerMap - Header map object
 * @param {string} headerName - Name of the header
 * @param {*} value - Value to set
 */
function ATV_setValueByHeader(row, headerMap, headerName, value) {
  const colIndex = headerMap[headerName];
  if (colIndex && colIndex > 0) {
    row[colIndex - 1] = value;
  }
}

/**
 * Formats the header row of a sheet
 * @param {Sheet} sheet - The sheet to format
 * @param {string} bgColor - Background color for header
 */
function ATV_formatHeaderRow(sheet, bgColor) {
  const lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange.setBackground(bgColor || ATV_COLORS.HEADER_SYSTEM);
    headerRange.setFontColor(ATV_COLORS.HEADER_TEXT);
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Loads all settings from ATV_SETTINGS sheet
 * @returns {Object} Settings object with key-value pairs
 */
function ATV_loadSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.SETTINGS);

  // Return defaults if settings sheet doesn't exist
  if (!sheet) {
    return { ...ATV_DEFAULT_SETTINGS };
  }

  const data = sheet.getDataRange().getValues();
  const settings = { ...ATV_DEFAULT_SETTINGS };

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key) {
      // Try to parse numeric values
      const numVal = parseFloat(value);
      settings[key] = isNaN(numVal) ? value : numVal;
    }
  }

  return settings;
}

/**
 * Saves a setting to ATV_SETTINGS sheet
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @param {string} [description] - Optional description
 */
function ATV_saveSetting(key, value, description) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ATV_SHEETS.SETTINGS);

  if (!sheet) {
    // Create settings sheet if needed
    sheet = ss.insertSheet(ATV_SHEETS.SETTINGS);
    sheet.appendRow(ATV_HEADERS_SETTINGS);
    ATV_formatHeaderRow(sheet, ATV_COLORS.HEADER_SYSTEM);
  }

  const data = sheet.getDataRange().getValues();
  let found = false;

  // Look for existing setting
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 4).setValue(new Date());
      if (description) {
        sheet.getRange(i + 1, 3).setValue(description);
      }
      found = true;
      break;
    }
  }

  // Add new setting if not found
  if (!found) {
    sheet.appendRow([key, value, description || '', new Date()]);
  }
}

/**
 * Saves multiple settings from a form/UI
 * @param {Object} formData - Object with setting keys and values
 */
function ATV_saveSettingsFromUi(formData) {
  try {
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        ATV_saveSetting(key, formData[key]);
      }
    }
    ATV_logInfo('ATV_saveSettingsFromUi', 'Settings saved successfully', JSON.stringify(formData));
    return { success: true, message: 'Settings saved successfully' };
  } catch (e) {
    ATV_logError('ATV_saveSettingsFromUi', 'Failed to save settings', e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Gets a specific setting value
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Setting value
 */
function ATV_getSetting(key, defaultValue) {
  const settings = ATV_loadSettings();
  return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

// ============================================================================
// DATA MANIPULATION UTILITIES
// ============================================================================

/**
 * Cleans and normalizes a price string to number
 * @param {string|number} priceStr - Price value
 * @returns {number} Cleaned price or 0
 */
function ATV_cleanPrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;

  // Remove currency symbols, commas, spaces
  const cleaned = priceStr.toString()
    .replace(/[$,\s]/g, '')
    .replace(/[kK]$/, '000'); // Handle "2k" -> 2000

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Cleans and normalizes a year string
 * @param {string|number} yearStr - Year value
 * @returns {number} Year or 0 if invalid
 */
function ATV_cleanYear(yearStr) {
  if (!yearStr) return 0;

  const num = parseInt(yearStr.toString().replace(/\D/g, ''));

  // Handle 2-digit years
  if (num >= 0 && num <= 99) {
    return num > 50 ? 1900 + num : 2000 + num;
  }

  // Validate reasonable year range
  if (num >= 1970 && num <= new Date().getFullYear() + 1) {
    return num;
  }

  return 0;
}

/**
 * Extracts engine size (cc) from various formats
 * @param {string} text - Text containing engine size
 * @returns {number} Engine size in cc or 0
 */
function ATV_extractEngineCC(text) {
  if (!text) return 0;

  const str = text.toString().toLowerCase();

  // Match patterns like "450cc", "450 cc", "450"
  const ccMatch = str.match(/(\d+)\s*cc/);
  if (ccMatch) return parseInt(ccMatch[1]);

  // Check for common sizes in model names
  const modelMatch = str.match(/\b(50|70|90|110|125|150|200|250|300|350|400|450|500|550|600|650|700|750|800|850|900|1000)\b/);
  if (modelMatch) return parseInt(modelMatch[1]);

  return 0;
}

/**
 * Normalizes text to title case
 * @param {string} text - Text to normalize
 * @returns {string} Title-cased text
 */
function ATV_toTitleCase(text) {
  if (!text) return '';
  return text.toString()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Calculates distance between two ZIP codes (simplified estimation)
 * This is a stub - would need actual ZIP database for accuracy
 * @param {string} zip1 - First ZIP code
 * @param {string} zip2 - Second ZIP code
 * @returns {number} Estimated distance in miles
 */
function ATV_calculateDistance(zip1, zip2) {
  // Stub implementation - returns random realistic distance
  // In production, would use ZIP code database or geocoding API
  if (!zip1 || !zip2) return 0;

  // Simple heuristic based on first 3 digits
  const prefix1 = zip1.toString().substring(0, 3);
  const prefix2 = zip2.toString().substring(0, 3);

  if (prefix1 === prefix2) return Math.floor(Math.random() * 25);

  const diff = Math.abs(parseInt(prefix1) - parseInt(prefix2));
  return Math.min(diff * 5 + Math.floor(Math.random() * 50), 500);
}

/**
 * Formats a number as currency
 * @param {number} num - Number to format
 * @returns {string} Formatted currency string
 */
function ATV_formatCurrency(num) {
  if (typeof num !== 'number' || isNaN(num)) return '$0';
  return '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats a number as percentage
 * @param {number} num - Number to format (0.25 = 25%)
 * @returns {string} Formatted percentage string
 */
function ATV_formatPercent(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0%';
  return (num * 100).toFixed(1) + '%';
}

/**
 * Checks if a string contains any keywords from a list (case-insensitive)
 * @param {string} text - Text to search
 * @param {Array} keywords - Array of keywords
 * @returns {boolean} True if any keyword found
 */
function ATV_containsKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return false;

  const lowerText = text.toString().toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Finds all matching keywords in text
 * @param {string} text - Text to search
 * @param {Array} keywords - Array of keywords
 * @returns {Array} Array of found keywords
 */
function ATV_findKeywords(text, keywords) {
  if (!text || !keywords) return [];

  const lowerText = text.toString().toLowerCase();
  return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Creates a duplicate key for detecting duplicate listings
 * @param {string} platform - Platform name
 * @param {string} url - Listing URL
 * @param {string} title - Listing title
 * @returns {string} Duplicate detection key
 */
function ATV_createDuplicateKey(platform, url, title) {
  // Normalize components
  const normPlatform = (platform || '').toString().toLowerCase().trim();
  const normUrl = (url || '').toString().toLowerCase().trim();
  const normTitle = (title || '').toString().toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .substring(0, 50);

  return `${normPlatform}|${normUrl}|${normTitle}`;
}

/**
 * Gets current timestamp formatted for display
 * @returns {string} Formatted timestamp
 */
function ATV_getTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Gets all data from a sheet as array of objects
 * @param {string} sheetName - Name of the sheet
 * @returns {Array} Array of row objects with header keys
 */
function ATV_getSheetDataAsObjects(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet || sheet.getLastRow() < 2) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }

  return result;
}

/**
 * Finds a row by ID in a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {string} idColumn - Name of the ID column
 * @param {string} idValue - ID value to find
 * @returns {Object} Object with row data and row number, or null
 */
function ATV_findRowById(sheetName, idColumn, idValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet || sheet.getLastRow() < 2) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIndex = headers.indexOf(idColumn);

  if (idColIndex === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][idColIndex] === idValue) {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      return { data: obj, rowNumber: i + 1 };
    }
  }

  return null;
}

/**
 * Updates a specific cell by sheet name, row number, and column name
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowNumber - Row number (1-based)
 * @param {string} columnName - Column header name
 * @param {*} value - Value to set
 */
function ATV_updateCell(sheetName, rowNumber, columnName, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return;

  const colIndex = ATV_getColumnIndex(sheet, columnName);
  if (colIndex > 0) {
    sheet.getRange(rowNumber, colIndex).setValue(value);
  }
}

// ============================================================================
// SHEET EXISTENCE HELPERS
// ============================================================================

/**
 * Checks if a sheet exists
 * @param {string} sheetName - Name of the sheet
 * @returns {boolean} True if sheet exists
 */
function ATV_sheetExists(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName) !== null;
}

/**
 * Gets or creates a sheet
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} The sheet object
 */
function ATV_getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}
