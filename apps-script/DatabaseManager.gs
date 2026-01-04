/**
 * DatabaseManager.gs
 * Handles data normalization from Source_Staging to Master_Database
 */

// ============================================================================
// DATA NORMALIZATION ENGINE
// ============================================================================

/**
 * Normalize data from Source_Staging into Master_Database
 * This is the critical data flow function
 *
 * @returns {number} Number of records processed
 */
function normalizeData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(SHEETS.SOURCE_STAGING);
  const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);

  if (!sourceSheet || !masterSheet) {
    throw new Error('Required sheets not found. Run setupSheets() first.');
  }

  const sourceData = sourceSheet.getDataRange().getValues();
  const masterData = masterSheet.getDataRange().getValues();

  // Get existing Asset_IDs to avoid duplicates
  const existingIds = new Set();
  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][0]) {
      existingIds.add(masterData[i][0]);
    }
  }

  let processedCount = 0;
  const newRecords = [];

  // Process each row from Source_Staging (skip header)
  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];

    // Skip empty rows
    if (!row[0] && !row[1]) continue;

    // Generate unique Asset_ID
    const assetId = generateAssetId(row);

    // Skip if already processed
    if (existingIds.has(assetId)) continue;

    // Normalize the record
    const normalizedRecord = normalizeRecord(row, assetId);
    newRecords.push(normalizedRecord);
    processedCount++;
  }

  // Append new records to Master_Database
  if (newRecords.length > 0) {
    const lastRow = masterSheet.getLastRow();
    masterSheet.getRange(lastRow + 1, 1, newRecords.length, newRecords[0].length)
      .setValues(newRecords);
  }

  logActivity('normalizeData', `Processed ${processedCount} new records`);
  return processedCount;
}

/**
 * Normalize a single record from Source_Staging format to Master_Database format
 *
 * @param {Array} row - Raw row from Source_Staging
 * @param {string} assetId - Generated unique ID
 * @returns {Array} Normalized record
 */
function normalizeRecord(row, assetId) {
  // Source_Staging columns (from createSourceStagingSheet):
  // 0: Raw_Listing_Text
  // 1: Source_URL
  // 2: Source_Platform
  // 3: Date_Found
  // 4: Asking_Price
  // 5: Location
  // 6: Seller_Contact

  const rawText = row[0] || '';
  const sourceUrl = row[1] || '';
  const platform = row[2] || '';
  const dateFound = row[3] || new Date();
  const askingPrice = parsePrice(row[4]);
  const location = row[5] || '';
  const sellerContact = row[6] || '';

  // Extract vehicle details from raw text
  const vehicleInfo = extractVehicleInfo(rawText);

  // Determine capital tier based on asking price
  const capitalTier = determineCapitalTier(askingPrice);

  // Master_Database record format:
  return [
    assetId,                          // 0: Asset_ID
    vehicleInfo.assetType,            // 1: Asset_Type
    vehicleInfo.year,                 // 2: Year
    vehicleInfo.make,                 // 3: Make
    vehicleInfo.model,                // 4: Model
    vehicleInfo.platformCode,         // 5: Platform_Code
    askingPrice,                      // 6: Asking_Price
    '',                               // 7: Estimated_Resale (calculated)
    '',                               // 8: MAO (calculated)
    '',                               // 9: Part_Out_Floor (calculated)
    '',                               // 10: Repair_Estimate (manual/calculated)
    '',                               // 11: Risk_Score (calculated)
    capitalTier,                      // 12: Capital_Tier
    '',                               // 13: Exit_Strategy (manual)
    '',                               // 14: Verdict (calculated)
    '',                               // 15: Confidence_Score (calculated)
    vehicleInfo.condition,            // 16: Condition
    vehicleInfo.title,                // 17: Title_Status
    vehicleInfo.hasEngine,            // 18: Has_Engine
    vehicleInfo.hasWheels,            // 19: Has_Wheels
    vehicleInfo.notes,                // 20: Notes
    sourceUrl,                        // 21: Source_URL
    platform,                         // 22: Source_Platform
    location,                         // 23: Location
    sellerContact,                    // 24: Seller_Contact
    dateFound,                        // 25: Date_Found
    new Date(),                       // 26: Date_Added
    '',                               // 27: Date_Contacted
    '',                               // 28: Date_Purchased
    'NEW'                             // 29: Status
  ];
}

/**
 * Generate unique Asset_ID
 */
function generateAssetId(row) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  const platform = (row[2] || 'UNK').substring(0, 2).toUpperCase();

  return `${platform}-${timestamp}-${random}`;
}

/**
 * Extract vehicle information from raw text using pattern matching
 */
function extractVehicleInfo(text) {
  text = text.toLowerCase();

  // Asset type detection
  let assetType = 'ATV';
  if (text.includes('motorcycle') || text.includes('bike') || text.includes('sportbike')) {
    assetType = 'Motorcycle';
  } else if (text.includes('utv') || text.includes('side by side') || text.includes('rzr')) {
    assetType = 'UTV';
  } else if (text.includes('dirt bike') || text.includes('mx') || text.includes('motocross')) {
    assetType = 'Dirt Bike';
  }

  // Year extraction
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : '';

  // Common ATV/Powersport makes
  const makes = [
    'yamaha', 'honda', 'suzuki', 'kawasaki', 'polaris', 'can-am', 'canam',
    'arctic cat', 'ktm', 'husqvarna', 'beta', 'gasgas', 'sherco'
  ];

  let make = '';
  for (const m of makes) {
    if (text.includes(m)) {
      make = m.charAt(0).toUpperCase() + m.slice(1);
      if (make === 'Canam') make = 'Can-Am';
      break;
    }
  }

  // Model extraction (common models)
  const models = {
    'blaster': 'Blaster',
    'banshee': 'Banshee',
    'raptor': 'Raptor',
    'warrior': 'Warrior',
    'yfz': 'YFZ450',
    'trx': 'TRX',
    '450r': '450R',
    '400ex': '400EX',
    'ltz': 'LTZ',
    'kfx': 'KFX',
    'predator': 'Predator',
    'outlaw': 'Outlaw'
  };

  let model = '';
  for (const [key, value] of Object.entries(models)) {
    if (text.includes(key)) {
      model = value;
      break;
    }
  }

  // Platform code (for known models)
  let platformCode = '';
  if (make === 'Yamaha' && model === 'Blaster') {
    platformCode = 'YFS200';
  } else if (model) {
    platformCode = model.toUpperCase();
  }

  // Condition detection
  let condition = 'Unknown';
  if (text.includes('runs') || text.includes('running')) {
    condition = 'Running';
  } else if (text.includes('non-running') || text.includes("doesn't run") || text.includes('does not run')) {
    condition = 'Non-Running';
  } else if (text.includes('roller') || text.includes('no engine')) {
    condition = 'Roller/Parts';
  } else if (text.includes('parts') || text.includes('part out')) {
    condition = 'Parts Only';
  }

  // Title status
  let title = 'Unknown';
  if (text.includes('clean title') || text.includes('title in hand')) {
    title = 'Clean';
  } else if (text.includes('no title')) {
    title = 'None';
  } else if (text.includes('bill of sale')) {
    title = 'Bill of Sale';
  }

  // Has engine?
  const hasEngine = !(text.includes('no engine') || text.includes('roller') || text.includes('no motor'));

  // Has wheels?
  const hasWheels = !(text.includes('no wheels') || text.includes('no tires'));

  // Extract notes (key features, upgrades, issues)
  const notes = extractKeyNotes(text);

  return {
    assetType,
    year,
    make,
    model,
    platformCode,
    condition,
    title,
    hasEngine,
    hasWheels,
    notes
  };
}

/**
 * Extract key notes from listing text
 */
function extractKeyNotes(text) {
  const keywords = [
    'rebuilt', 'new', 'upgraded', 'aftermarket', 'custom',
    'a-arms', 'swingarm', 'shock', 'suspension', 'exhaust',
    'needs', 'issue', 'problem', 'missing', 'broken'
  ];

  const sentences = text.split(/[.!?]/);
  const relevantNotes = [];

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    keywords.forEach(keyword => {
      if (lower.includes(keyword) && relevantNotes.length < 3) {
        relevantNotes.push(sentence.trim());
      }
    });
  });

  return relevantNotes.join('; ');
}

/**
 * Parse price from various formats
 */
function parsePrice(priceInput) {
  if (typeof priceInput === 'number') return priceInput;
  if (!priceInput) return 0;

  // Remove currency symbols and commas
  const cleaned = priceInput.toString().replace(/[$,]/g, '');

  // Extract first number
  const match = cleaned.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

/**
 * Determine capital tier based on asking price
 */
function determineCapitalTier(price) {
  if (price <= 500) return 'Tier 1';
  if (price <= 1500) return 'Tier 2';
  if (price <= 3500) return 'Tier 3';
  if (price <= 7500) return 'Tier 4';
  return 'Tier 5';
}

/**
 * Parse and import listing from clipboard text
 */
function parseAndImportListing(text) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(SHEETS.SOURCE_STAGING);

  if (!sourceSheet) {
    throw new Error('Source_Staging sheet not found');
  }

  // Extract price from text
  const priceMatch = text.match(/\$\d+/);
  const price = priceMatch ? priceMatch[0] : '';

  // Add to Source_Staging
  const lastRow = sourceSheet.getLastRow();
  sourceSheet.getRange(lastRow + 1, 1, 1, 7).setValues([[
    text,                    // Raw_Listing_Text
    '',                      // Source_URL
    'Manual Import',         // Source_Platform
    new Date(),              // Date_Found
    price,                   // Asking_Price
    '',                      // Location
    ''                       // Seller_Contact
  ]]);

  // Auto-normalize
  normalizeData();

  logActivity('importListing', 'Imported and normalized new listing');
}
