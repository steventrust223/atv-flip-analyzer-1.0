/**
 * ===== FILE: ATV_import.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Import and normalization functions:
 * - Pull data from all IMPORT_* sheets
 * - Normalize year, make, model, engine, etc.
 * - Detect duplicates
 * - Write to MASTER_ATV_DB
 */

// ============================================================================
// MAIN IMPORT FUNCTIONS
// ============================================================================

/**
 * Main sync function - imports from all import sheets to master DB
 */
function ATV_runFullSync() {
  try {
    ATV_logInfo('ATV_runFullSync', 'Starting full import sync...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let totalImported = 0;
    let totalSkipped = 0;
    let totalDuplicates = 0;

    // Get existing duplicate keys from master DB
    const existingKeys = ATV_getExistingDuplicateKeys();

    // Process each import sheet
    ATV_IMPORT_SHEETS.forEach(sheetName => {
      const result = ATV_importFromSheet(ss, sheetName, existingKeys);
      totalImported += result.imported;
      totalSkipped += result.skipped;
      totalDuplicates += result.duplicates;

      // Add new keys to existing set
      result.newKeys.forEach(key => existingKeys.add(key));
    });

    const message = `Imported: ${totalImported}, Skipped: ${totalSkipped}, Duplicates: ${totalDuplicates}`;
    ATV_logInfo('ATV_runFullSync', 'Import sync completed', message);
    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Import Complete', 5);

    return { imported: totalImported, skipped: totalSkipped, duplicates: totalDuplicates };

  } catch (e) {
    ATV_logError('ATV_runFullSync', 'Import sync failed', e.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + e.message, 'Import Failed', 5);
    throw e;
  }
}

/**
 * Imports data from a single import sheet to master DB
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the import sheet
 * @param {Set} existingKeys - Set of existing duplicate keys
 * @returns {Object} Results with counts
 */
function ATV_importFromSheet(ss, sheetName, existingKeys) {
  const importSheet = ss.getSheetByName(sheetName);
  const result = { imported: 0, skipped: 0, duplicates: 0, newKeys: [] };

  if (!importSheet || importSheet.getLastRow() <= 1) {
    return result;
  }

  const masterSheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
  if (!masterSheet) {
    ATV_logError('ATV_importFromSheet', 'Master DB sheet not found');
    return result;
  }

  // Get data from import sheet
  const importData = importSheet.getDataRange().getValues();
  const importHeaders = importData[0];
  const importHeaderMap = {};
  importHeaders.forEach((h, i) => importHeaderMap[h] = i);

  // Get master sheet headers
  const masterHeaderMap = ATV_getHeaderMap(masterSheet);

  // Determine platform from sheet name
  const platform = ATV_getPlatformFromSheetName(sheetName);

  // Process each row
  for (let i = 1; i < importData.length; i++) {
    const row = importData[i];

    // Skip empty rows
    if (!row[importHeaderMap['Title']] && !row[importHeaderMap['Listing URL']]) {
      result.skipped++;
      continue;
    }

    // Check for duplicates
    const dupKey = ATV_createDuplicateKey(
      platform,
      row[importHeaderMap['Listing URL']] || '',
      row[importHeaderMap['Title']] || ''
    );

    if (existingKeys.has(dupKey)) {
      result.duplicates++;
      continue;
    }

    // Normalize and create master row
    const masterRow = ATV_normalizeImportRow(row, importHeaderMap, masterHeaderMap, sheetName, platform);

    // Append to master sheet
    masterSheet.appendRow(masterRow);

    // Track the new key
    result.newKeys.push(dupKey);
    existingKeys.add(dupKey);
    result.imported++;
  }

  ATV_logInfo('ATV_importFromSheet', `Processed ${sheetName}`,
    `Imported: ${result.imported}, Skipped: ${result.skipped}, Duplicates: ${result.duplicates}`);

  return result;
}

/**
 * Gets existing duplicate keys from master DB
 * @returns {Set} Set of duplicate keys
 */
function ATV_getExistingDuplicateKeys() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
  const keys = new Set();

  if (!masterSheet || masterSheet.getLastRow() <= 1) {
    return keys;
  }

  const data = masterSheet.getDataRange().getValues();
  const headerMap = {};
  data[0].forEach((h, i) => headerMap[h] = i);

  for (let i = 1; i < data.length; i++) {
    const platform = data[i][headerMap['Platform']] || '';
    const url = data[i][headerMap['Listing URL']] || '';
    const title = data[i][headerMap['Title (Normalized)']] || '';

    const key = ATV_createDuplicateKey(platform, url, title);
    keys.add(key);
  }

  return keys;
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalizes an import row into master DB format
 * @param {Array} importRow - Raw import row
 * @param {Object} importMap - Import header map
 * @param {Object} masterMap - Master header map
 * @param {string} sourceSheet - Source sheet name
 * @param {string} platform - Platform name
 * @returns {Array} Normalized master row
 */
function ATV_normalizeImportRow(importRow, importMap, masterMap, sourceSheet, platform) {
  // Create empty master row
  const masterRow = new Array(Object.keys(masterMap).length).fill('');

  // Helper to set value in master row
  const setValue = (headerName, value) => {
    const idx = masterMap[headerName];
    if (idx) masterRow[idx - 1] = value;
  };

  // Generate new ATV ID
  setValue('ATV ID', ATV_generateAtvId());
  setValue('Import Source', sourceSheet);
  setValue('Platform', platform);

  // Copy direct fields
  setValue('Listing URL', importRow[importMap['Listing URL']] || '');
  setValue('Asking Price', ATV_cleanPrice(importRow[importMap['Asking Price']]));
  setValue('Condition (Raw)', importRow[importMap['Condition (Raw)']] || '');
  setValue('Seller Name', importRow[importMap['Seller Name']] || '');
  setValue('Seller Contact', importRow[importMap['Seller Contact']] || '');

  // Normalize Year
  const year = ATV_cleanYear(importRow[importMap['Year']]);
  setValue('Year', year);

  // Normalize Make
  const rawMake = importRow[importMap['Make']] || '';
  const normalizedMake = ATV_normalizeMake(rawMake, importRow[importMap['Title']] || '');
  setValue('Make', normalizedMake);

  // Normalize Model
  const rawModel = importRow[importMap['Model']] || '';
  const normalizedModel = ATV_normalizeModel(rawModel, normalizedMake, importRow[importMap['Title']] || '');
  setValue('Model', normalizedModel);

  // Create normalized title
  const normalizedTitle = ATV_createNormalizedTitle(year, normalizedMake, normalizedModel, importRow[importMap['Title']]);
  setValue('Title (Normalized)', normalizedTitle);

  // Variant/Special Edition
  setValue('Variant / Special Edition', importRow[importMap['Trim / Variant']] || '');

  // Engine Size
  const engineCC = ATV_extractEngineCC(
    importRow[importMap['Engine Size (cc)']] ||
    importRow[importMap['Title']] ||
    normalizedModel
  );
  setValue('Engine Size (cc)', engineCC);

  // Engine Type (2-stroke/4-stroke)
  const engineType = ATV_normalizeEngineType(
    importRow[importMap['Stroke / Cylinders']] ||
    importRow[importMap['Title']] ||
    importRow[importMap['Description']] || ''
  );
  setValue('Engine Type', engineType);

  // Drive Type
  const driveType = ATV_normalizeDriveType(
    importRow[importMap['Drive Type']] ||
    importRow[importMap['Description']] || ''
  );
  setValue('Drive Type', driveType);

  // Category
  const category = ATV_detectCategory(normalizedTitle, importRow[importMap['Description']] || '', normalizedMake, normalizedModel);
  setValue('Category', category);

  // Location/Distance placeholder
  const location = importRow[importMap['Location (Raw)']] || importRow[importMap['Seller ZIP / Location']] || '';
  setValue('Distance (mi)', ''); // Will be calculated later

  // Status and timestamp
  setValue('Status', 'New');
  setValue('Last Updated', new Date());

  return masterRow;
}

/**
 * Normalizes make name
 * @param {string} rawMake - Raw make value
 * @param {string} title - Listing title for fallback
 * @returns {string} Normalized make
 */
function ATV_normalizeMake(rawMake, title) {
  const text = (rawMake + ' ' + title).toLowerCase();

  // Check against known makes
  for (const make of ATV_COMMON_MAKES) {
    if (text.includes(make.toLowerCase())) {
      return make;
    }
  }

  // Common aliases
  const aliases = {
    'yam': 'Yamaha',
    'kawi': 'Kawasaki',
    'suki': 'Suzuki',
    'zuki': 'Suzuki',
    'canam': 'Can-Am',
    'bombardier': 'Can-Am',
    'cat': 'Arctic Cat',
    'textron': 'Arctic Cat'
  };

  for (const alias in aliases) {
    if (text.includes(alias)) {
      return aliases[alias];
    }
  }

  return rawMake ? ATV_toTitleCase(rawMake) : 'Unknown';
}

/**
 * Normalizes model name
 * @param {string} rawModel - Raw model value
 * @param {string} make - Normalized make
 * @param {string} title - Listing title
 * @returns {string} Normalized model
 */
function ATV_normalizeModel(rawModel, make, title) {
  const text = (rawModel + ' ' + title).toLowerCase();

  // Check known models for this make
  const knownModels = ATV_POPULAR_MODELS[make] || [];
  for (const model of knownModels) {
    if (text.includes(model.toLowerCase())) {
      return model;
    }
  }

  // Common model patterns
  const modelPatterns = [
    // Yamaha
    { pattern: /raptor\s*(\d+)/i, format: 'Raptor $1' },
    { pattern: /yfz\s*(\d+)/i, format: 'YFZ$1' },
    { pattern: /banshee/i, format: 'Banshee' },
    { pattern: /blaster/i, format: 'Blaster' },
    { pattern: /warrior/i, format: 'Warrior' },
    { pattern: /grizzly\s*(\d+)?/i, format: 'Grizzly' },

    // Honda
    { pattern: /trx\s*(\d+)/i, format: 'TRX$1' },
    { pattern: /fourtrax/i, format: 'FourTrax' },
    { pattern: /rancher/i, format: 'Rancher' },
    { pattern: /foreman/i, format: 'Foreman' },
    { pattern: /crf\s*(\d+)/i, format: 'CRF$1' },

    // Suzuki
    { pattern: /ltr?\s*(\d+)/i, format: 'LT$1' },
    { pattern: /king\s*quad/i, format: 'King Quad' },
    { pattern: /quad\s*racer/i, format: 'QuadRacer' },

    // Kawasaki
    { pattern: /kfx\s*(\d+)/i, format: 'KFX$1' },
    { pattern: /brute\s*force/i, format: 'Brute Force' },
    { pattern: /kx\s*(\d+)/i, format: 'KX$1' },

    // Polaris
    { pattern: /rzr/i, format: 'RZR' },
    { pattern: /sportsman/i, format: 'Sportsman' },
    { pattern: /outlaw/i, format: 'Outlaw' },
    { pattern: /scrambler/i, format: 'Scrambler' },

    // Can-Am
    { pattern: /ds\s*(\d+)/i, format: 'DS $1' },
    { pattern: /renegade/i, format: 'Renegade' },
    { pattern: /outlander/i, format: 'Outlander' },
    { pattern: /maverick/i, format: 'Maverick' }
  ];

  for (const mp of modelPatterns) {
    const match = text.match(mp.pattern);
    if (match) {
      return mp.format.replace('$1', match[1] || '').trim();
    }
  }

  return rawModel ? ATV_toTitleCase(rawModel) : 'Unknown';
}

/**
 * Creates a normalized title
 * @param {number} year - Year
 * @param {string} make - Make
 * @param {string} model - Model
 * @param {string} originalTitle - Original title for fallback
 * @returns {string} Normalized title
 */
function ATV_createNormalizedTitle(year, make, model, originalTitle) {
  if (year && make && model && make !== 'Unknown' && model !== 'Unknown') {
    return `${year} ${make} ${model}`;
  }

  // Use original title if we can't normalize
  if (originalTitle) {
    return ATV_toTitleCase(originalTitle.substring(0, 100));
  }

  return `${year || 'Unknown'} ${make} ${model}`;
}

/**
 * Normalizes engine type (2-stroke/4-stroke)
 * @param {string} text - Text to analyze
 * @returns {string} Engine type
 */
function ATV_normalizeEngineType(text) {
  if (!text) return 'Unknown';

  const lower = text.toLowerCase();

  if (lower.includes('2-stroke') || lower.includes('2 stroke') || lower.includes('two stroke') || lower.includes('2t')) {
    return '2-Stroke';
  }

  if (lower.includes('4-stroke') || lower.includes('4 stroke') || lower.includes('four stroke') || lower.includes('4t')) {
    return '4-Stroke';
  }

  // Common 2-stroke models
  const twoStrokes = ['banshee', 'blaster', 'lt250r', 'tecate', 'yz125', 'yz250', 'cr125', 'cr250', 'kx125', 'kx250', 'rm125', 'rm250'];
  if (twoStrokes.some(model => lower.includes(model))) {
    return '2-Stroke';
  }

  return 'Unknown';
}

/**
 * Normalizes drive type
 * @param {string} text - Text to analyze
 * @returns {string} Drive type
 */
function ATV_normalizeDriveType(text) {
  if (!text) return 'Unknown';

  const lower = text.toLowerCase();

  if (lower.includes('4x4') || lower.includes('4wd') || lower.includes('awd')) {
    return '4x4';
  }

  if (lower.includes('2x4') || lower.includes('2wd')) {
    return '2x4';
  }

  if (lower.includes('chain')) {
    return 'Chain';
  }

  if (lower.includes('shaft')) {
    return 'Shaft';
  }

  return 'Unknown';
}

/**
 * Detects vehicle category
 * @param {string} title - Normalized title
 * @param {string} description - Description
 * @param {string} make - Make
 * @param {string} model - Model
 * @returns {string} Category
 */
function ATV_detectCategory(title, description, make, model) {
  const text = (title + ' ' + description + ' ' + model).toLowerCase();

  // Check for Side-by-Side
  if (text.includes('rzr') || text.includes('ranger') || text.includes('maverick') ||
      text.includes('commander') || text.includes('general') || text.includes('sxs') ||
      text.includes('side by side') || text.includes('utv')) {
    return 'Side-by-Side';
  }

  // Check for Dirt Bike
  if (text.includes('crf') || text.includes('yz') || text.includes('kx') ||
      text.includes('rm') || text.includes('ktm') || text.includes('dirt bike') ||
      text.includes('motocross') || text.includes('mx') || text.includes('enduro')) {
    return 'Dirt Bike';
  }

  // Check for Youth/Kids
  if (text.includes('youth') || text.includes('kids') || text.includes('jr') ||
      text.match(/\b(50|70|90|110)\b/) || text.includes('crf50') || text.includes('pw50') ||
      text.includes('ttr50') || text.includes('jr50')) {
    return 'Youth ATV';
  }

  // Check for Sport ATV
  const sportModels = ['raptor', 'yfz', 'banshee', 'blaster', 'warrior', 'trx450', 'trx400',
                       'ltr', 'ltz', 'kfx', 'ds450', 'outlaw'];
  if (sportModels.some(m => text.includes(m)) || text.includes('sport')) {
    return 'Sport ATV';
  }

  // Check for Utility ATV
  const utilityModels = ['grizzly', 'kodiak', 'rancher', 'foreman', 'rubicon', 'king quad',
                         'brute force', 'sportsman', 'outlander', 'renegade'];
  if (utilityModels.some(m => text.includes(m)) || text.includes('utility') || text.includes('4x4')) {
    return 'Utility ATV';
  }

  // Check for Go-Kart
  if (text.includes('go kart') || text.includes('gokart') || text.includes('go-kart')) {
    return 'Go-Kart';
  }

  return 'Other';
}

/**
 * Gets platform name from sheet name
 * @param {string} sheetName - Sheet name
 * @returns {string} Platform name
 */
function ATV_getPlatformFromSheetName(sheetName) {
  const mapping = {
    [ATV_SHEETS.IMPORT_FB]: 'Facebook',
    [ATV_SHEETS.IMPORT_CL]: 'Craigslist',
    [ATV_SHEETS.IMPORT_OU]: 'OfferUp',
    [ATV_SHEETS.IMPORT_EBAY]: 'eBay',
    [ATV_SHEETS.IMPORT_OTHER]: 'Other'
  };

  return mapping[sheetName] || 'Unknown';
}

// ============================================================================
// IMPORT UTILITIES
// ============================================================================

/**
 * Marks imported rows in source sheet (optional helper)
 * @param {Sheet} sheet - Import sheet
 * @param {number} startRow - First row to mark
 * @param {number} endRow - Last row to mark
 */
function ATV_markAsImported(sheet, startRow, endRow) {
  // This could add a "Imported" column or change row color
  // Implementation depends on workflow preference
}

/**
 * Gets count of unimported rows in import sheets
 * @returns {Object} Counts by sheet
 */
function ATV_getImportCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const counts = {};

  ATV_IMPORT_SHEETS.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const rowCount = Math.max(0, sheet.getLastRow() - 1);
      counts[sheetName] = rowCount;
    } else {
      counts[sheetName] = 0;
    }
  });

  return counts;
}

/**
 * Clears all import sheets (keeps headers)
 */
function ATV_clearImportSheets() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear Import Sheets',
    'This will clear all data from import sheets. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ATV_IMPORT_SHEETS.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
  });

  ATV_logInfo('ATV_clearImportSheets', 'Import sheets cleared');
  SpreadsheetApp.getActiveSpreadsheet().toast('Import sheets cleared', 'Complete', 3);
}
