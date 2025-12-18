/**
 * ===== FILE: ATV_setup.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Setup functions:
 * - onOpen trigger and menu creation
 * - Sheet creation and configuration
 * - Header setup and formatting
 * - Initial data population
 */

// ============================================================================
// MENU & TRIGGERS
// ============================================================================

/**
 * Creates the custom menu when the spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🏍️ Quantum ATV Analyzer')
    .addItem('🔧 Setup / Refresh Structure', 'ATV_createOrUpdateSheets')
    .addSeparator()
    .addItem('🔄 Run Import → Master Sync', 'ATV_runFullSync')
    .addItem('📊 Run Full Analysis', 'ATV_runFullAnalysis')
    .addItem('🏅 Rebuild Verdict Sheet', 'ATV_rebuildVerdict')
    .addSeparator()
    .addItem('🧩 Parts & Builds', 'ATV_showBuildsPanel')
    .addItem('🎛️ Control Center', 'ATV_showControlCenter')
    .addItem('🧰 Deal Review Panel', 'ATV_showDealReview')
    .addSeparator()
    .addItem('🔧 Admin Panel', 'ATV_showAdminPanel')
    .addItem('🏥 System Health Check', 'ATV_showSystemHealthCheck')
    .addSeparator()
    .addItem('⚙️ Settings', 'ATV_showSettings')
    .addItem('📚 Help / Overview', 'ATV_showHelp')
    .addToUi();

  ATV_logInfo('onOpen', 'Menu created successfully');
}

/**
 * Installable trigger setup (run once manually)
 */
function ATV_setupTriggers() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create onOpen trigger
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();

  ATV_logInfo('ATV_setupTriggers', 'Triggers configured');
}

// ============================================================================
// SHEET CREATION & CONFIGURATION
// ============================================================================

/**
 * Main function to create or update all sheets
 * Creates sheets if they don't exist, ensures headers are correct
 */
function ATV_createOrUpdateSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ATV_logInfo('ATV_createOrUpdateSheets', 'Starting sheet setup...');

    // Import sheets
    ATV_IMPORT_SHEETS.forEach(sheetName => {
      ATV_setupSheet(ss, sheetName, ATV_HEADERS_IMPORT, ATV_COLORS.HEADER_IMPORT);
    });

    // Core analysis sheets
    ATV_setupSheet(ss, ATV_SHEETS.MASTER_DB, ATV_HEADERS_MASTER, ATV_COLORS.HEADER_MASTER);
    ATV_setupSheet(ss, ATV_SHEETS.DEAL_ANALYZER, ATV_HEADERS_DEAL_ANALYZER, ATV_COLORS.HEADER_ANALYSIS);
    ATV_setupSheet(ss, ATV_SHEETS.LEAD_SCORE, ATV_HEADERS_LEAD_SCORE, ATV_COLORS.HEADER_ANALYSIS);
    ATV_setupSheet(ss, ATV_SHEETS.MAO_ENGINE, ATV_HEADERS_MAO_ENGINE, ATV_COLORS.HEADER_ANALYSIS);
    ATV_setupSheet(ss, ATV_SHEETS.SALES_VELOCITY, ATV_HEADERS_VELOCITY, ATV_COLORS.HEADER_ANALYSIS);

    // Parts & Build support
    ATV_setupSheet(ss, ATV_SHEETS.PARTS_NEEDED, ATV_HEADERS_PARTS, ATV_COLORS.HEADER_PARTS);
    ATV_setupSheet(ss, ATV_SHEETS.BUILD_PLANS, ATV_HEADERS_BUILD_PLANS, ATV_COLORS.HEADER_PARTS);
    ATV_setupSheet(ss, ATV_SHEETS.POST_SALE, ATV_HEADERS_POST_SALE, ATV_COLORS.HEADER_PARTS);

    // Supporting / System
    ATV_setupSheet(ss, ATV_SHEETS.VERDICT, ATV_HEADERS_VERDICT, ATV_COLORS.HEADER_VERDICT);
    ATV_setupSheet(ss, ATV_SHEETS.LEADS_TRACKER, ATV_HEADERS_LEADS, ATV_COLORS.HEADER_SYSTEM);
    ATV_setupSheet(ss, ATV_SHEETS.CRM_INTEGRATION, ATV_HEADERS_CRM, ATV_COLORS.HEADER_SYSTEM);
    ATV_setupSheet(ss, ATV_SHEETS.SETTINGS, ATV_HEADERS_SETTINGS, ATV_COLORS.HEADER_SYSTEM);
    ATV_setupSheet(ss, ATV_SHEETS.SYSTEM_LOG, ATV_HEADERS_LOG, ATV_COLORS.HEADER_SYSTEM);
    ATV_setupSheet(ss, ATV_SHEETS.DASHBOARD, ATV_HEADERS_DASHBOARD, ATV_COLORS.HEADER_MASTER);

    // Initialize default settings
    ATV_initializeDefaultSettings();

    // Initialize velocity data
    ATV_initializeVelocityData();

    // Apply additional formatting
    ATV_applyVerdictFormatting(ss);
    ATV_applyMasterFormatting(ss);

    SpreadsheetApp.getActiveSpreadsheet().toast('All sheets created/updated successfully!', 'Setup Complete', 5);
    ATV_logInfo('ATV_createOrUpdateSheets', 'Sheet setup completed successfully');

  } catch (e) {
    ATV_logError('ATV_createOrUpdateSheets', 'Sheet setup failed', e.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + e.message, 'Setup Failed', 5);
    throw e;
  }
}

/**
 * Sets up a single sheet with headers and formatting
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} headers - Array of header strings
 * @param {string} headerColor - Background color for header
 */
function ATV_setupSheet(ss, sheetName, headers, headerColor) {
  let sheet = ss.getSheetByName(sheetName);
  const isNew = !sheet;

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    ATV_logInfo('ATV_setupSheet', `Created new sheet: ${sheetName}`);
  }

  // Check if headers need to be set
  const currentHeaders = sheet.getLastColumn() > 0 ?
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];

  if (isNew || currentHeaders.length === 0 || currentHeaders[0] === '') {
    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Apply formatting
  ATV_formatHeaderRow(sheet, headerColor);

  // Set column widths based on content type
  ATV_setColumnWidths(sheet, headers);

  // Apply alternating row colors if there's data
  if (sheet.getLastRow() > 1) {
    ATV_applyAlternatingColors(sheet);
  }

  // Freeze appropriate columns for certain sheets
  if (sheetName === ATV_SHEETS.VERDICT) {
    sheet.setFrozenColumns(3);
  } else if (sheetName === ATV_SHEETS.MASTER_DB) {
    sheet.setFrozenColumns(1);
  }
}

/**
 * Sets appropriate column widths based on header names
 * @param {Sheet} sheet - The sheet
 * @param {Array} headers - Array of header names
 */
function ATV_setColumnWidths(sheet, headers) {
  headers.forEach((header, index) => {
    const col = index + 1;
    let width = 120; // default

    // Adjust width based on content type
    if (header.includes('URL') || header.includes('Link')) {
      width = 200;
    } else if (header.includes('Description') || header.includes('Notes')) {
      width = 250;
    } else if (header.includes('ID')) {
      width = 150;
    } else if (header.includes('Title') || header.includes('Name')) {
      width = 180;
    } else if (header.includes('$') || header.includes('Price') || header.includes('Cost') || header.includes('Profit')) {
      width = 100;
    } else if (header.includes('%')) {
      width = 80;
    } else if (header.includes('Score') || header.includes('Rank')) {
      width = 80;
    } else if (header.includes('Date') || header.includes('Timestamp')) {
      width = 140;
    }

    sheet.setColumnWidth(col, width);
  });
}

/**
 * Applies alternating row colors to a sheet
 * @param {Sheet} sheet - The sheet
 */
function ATV_applyAlternatingColors(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow <= 1 || lastCol <= 0) return;

  // Remove existing banding
  const bandings = sheet.getBandings();
  bandings.forEach(banding => banding.remove());

  // Apply new banding
  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
}

// ============================================================================
// DEFAULT DATA INITIALIZATION
// ============================================================================

/**
 * Initializes default settings if not already present
 */
function ATV_initializeDefaultSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.SETTINGS);

  if (!sheet || sheet.getLastRow() > 1) return; // Already has data

  const defaults = [
    ['MAO_PCT_RUNNER', ATV_DEFAULT_SETTINGS.MAO_PCT_RUNNER, 'Max offer % for running units'],
    ['MAO_PCT_PROJECT', ATV_DEFAULT_SETTINGS.MAO_PCT_PROJECT, 'Max offer % for non-running projects'],
    ['MAO_PCT_FRAME', ATV_DEFAULT_SETTINGS.MAO_PCT_FRAME, 'Max offer % for frames/rollers'],
    ['MIN_PROFIT_AMOUNT', ATV_DEFAULT_SETTINGS.MIN_PROFIT_AMOUNT, 'Minimum profit target ($)'],
    ['MIN_PROFIT_MARGIN', ATV_DEFAULT_SETTINGS.MIN_PROFIT_MARGIN, 'Minimum profit margin (decimal)'],
    ['TIER_T1_MAX', ATV_DEFAULT_SETTINGS.TIER_T1_MAX, 'Max cost for T1 Micro tier'],
    ['TIER_T2_MAX', ATV_DEFAULT_SETTINGS.TIER_T2_MAX, 'Max cost for T2 Budget tier'],
    ['TIER_T3_MAX', ATV_DEFAULT_SETTINGS.TIER_T3_MAX, 'Max cost for T3 Mid tier'],
    ['RISK_LOW_MAX', ATV_DEFAULT_SETTINGS.RISK_LOW_MAX, 'Max score for low risk'],
    ['RISK_MEDIUM_MAX', ATV_DEFAULT_SETTINGS.RISK_MEDIUM_MAX, 'Max score for medium risk'],
    ['DEAL_HOT_MIN', ATV_DEFAULT_SETTINGS.DEAL_HOT_MIN, 'Min score for HOT deal'],
    ['DEAL_SOLID_MIN', ATV_DEFAULT_SETTINGS.DEAL_SOLID_MIN, 'Min score for SOLID deal'],
    ['DEAL_MARGINAL_MIN', ATV_DEFAULT_SETTINGS.DEAL_MARGINAL_MIN, 'Min score for MARGINAL deal'],
    ['DISTANCE_LOCAL', ATV_DEFAULT_SETTINGS.DISTANCE_LOCAL, 'Max miles for local'],
    ['DISTANCE_REGIONAL', ATV_DEFAULT_SETTINGS.DISTANCE_REGIONAL, 'Max miles for regional'],
    ['DISTANCE_FAR', ATV_DEFAULT_SETTINGS.DISTANCE_FAR, 'Max miles for far'],
    ['VELOCITY_FB', ATV_DEFAULT_SETTINGS.VELOCITY_FB, 'Facebook velocity score'],
    ['VELOCITY_CL', ATV_DEFAULT_SETTINGS.VELOCITY_CL, 'Craigslist velocity score'],
    ['VELOCITY_OU', ATV_DEFAULT_SETTINGS.VELOCITY_OU, 'OfferUp velocity score'],
    ['VELOCITY_EBAY', ATV_DEFAULT_SETTINGS.VELOCITY_EBAY, 'eBay velocity score'],
    ['VELOCITY_OTHER', ATV_DEFAULT_SETTINGS.VELOCITY_OTHER, 'Other platform velocity score'],
    ['NEGOTIATION_CUSHION_PCT', ATV_DEFAULT_SETTINGS.NEGOTIATION_CUSHION_PCT, 'Negotiation cushion (decimal)'],
    ['USER_ZIP', '00000', 'User ZIP code for distance calculations']
  ];

  const timestamp = new Date();
  const rows = defaults.map(row => [...row, timestamp]);

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  ATV_logInfo('ATV_initializeDefaultSettings', 'Default settings initialized');
}

/**
 * Initializes sales velocity reference data
 */
function ATV_initializeVelocityData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.SALES_VELOCITY);

  if (!sheet || sheet.getLastRow() > 1) return; // Already has data

  // Default velocity data by category and platform
  const velocityData = [
    ['Sport ATV', 'Facebook', 14, 'High', 85, 'A - Very Fast', 100, new Date(), 'Banshees, Raptors, sport quads sell fast'],
    ['Sport ATV', 'Craigslist', 21, 'Medium', 65, 'B - Normal', 50, new Date(), ''],
    ['Sport ATV', 'eBay', 18, 'Medium-High', 75, 'B - Normal', 75, new Date(), 'Good for rare/collector models'],
    ['Utility ATV', 'Facebook', 21, 'Medium', 70, 'B - Normal', 100, new Date(), 'Steady demand'],
    ['Utility ATV', 'Craigslist', 28, 'Medium', 60, 'B - Normal', 50, new Date(), ''],
    ['Youth ATV', 'Facebook', 10, 'Very High', 90, 'A - Very Fast', 80, new Date(), 'Parents always looking'],
    ['Youth ATV', 'OfferUp', 14, 'High', 80, 'A - Very Fast', 60, new Date(), ''],
    ['Dirt Bike', 'Facebook', 12, 'High', 85, 'A - Very Fast', 100, new Date(), 'High demand, fast sales'],
    ['Dirt Bike', 'Craigslist', 18, 'Medium-High', 70, 'B - Normal', 50, new Date(), ''],
    ['Side-by-Side', 'Facebook', 30, 'Medium', 60, 'C - Slow', 50, new Date(), 'Higher price = longer sell time'],
    ['Other', 'Facebook', 21, 'Medium', 65, 'B - Normal', 50, new Date(), 'Varies widely']
  ];

  sheet.getRange(2, 1, velocityData.length, velocityData[0].length).setValues(velocityData);
  ATV_logInfo('ATV_initializeVelocityData', 'Velocity reference data initialized');
}

// ============================================================================
// SPECIAL FORMATTING
// ============================================================================

/**
 * Applies special formatting to the Verdict sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function ATV_applyVerdictFormatting(ss) {
  const sheet = ss.getSheetByName(ATV_SHEETS.VERDICT);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const headerMap = ATV_getHeaderMap(sheet);
  const dealClassCol = headerMap['Deal Class'];

  if (!dealClassCol) return;

  const lastRow = sheet.getLastRow();

  // Create conditional formatting rules for Deal Class
  const rules = sheet.getConditionalFormatRules();

  // Clear existing rules for this column
  const newRules = rules.filter(rule => {
    const ranges = rule.getRanges();
    return !ranges.some(r => r.getColumn() === dealClassCol);
  });

  const range = sheet.getRange(2, dealClassCol, lastRow - 1, 1);

  // HOT - Bold red background
  const hotRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('HOT')
    .setBackground(ATV_COLORS.DEAL_HOT)
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([range])
    .build();

  // SOLID - Teal
  const solidRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('SOLID')
    .setBackground(ATV_COLORS.DEAL_SOLID)
    .setFontColor('#FFFFFF')
    .setRanges([range])
    .build();

  // MARGINAL - Yellow
  const marginalRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('MARGINAL')
    .setBackground(ATV_COLORS.DEAL_MARGINAL)
    .setFontColor('#000000')
    .setRanges([range])
    .build();

  // PASS - Grey
  const passRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('PASS')
    .setBackground(ATV_COLORS.DEAL_PASS)
    .setFontColor('#FFFFFF')
    .setRanges([range])
    .build();

  newRules.push(hotRule, solidRule, marginalRule, passRule);
  sheet.setConditionalFormatRules(newRules);
}

/**
 * Applies special formatting to the Master DB sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function ATV_applyMasterFormatting(ss) {
  const sheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const headerMap = ATV_getHeaderMap(sheet);
  const dealClassCol = headerMap['Deal Class'];
  const riskScoreCol = headerMap['Risk Score'];

  if (!dealClassCol) return;

  const lastRow = sheet.getLastRow();
  const rules = sheet.getConditionalFormatRules();

  // Clear existing rules
  const newRules = [];

  // Deal Class formatting
  const dealRange = sheet.getRange(2, dealClassCol, lastRow - 1, 1);

  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('HOT')
      .setBackground(ATV_COLORS.DEAL_HOT)
      .setFontColor('#FFFFFF')
      .setBold(true)
      .setRanges([dealRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('SOLID')
      .setBackground(ATV_COLORS.DEAL_SOLID)
      .setFontColor('#FFFFFF')
      .setRanges([dealRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('MARGINAL')
      .setBackground(ATV_COLORS.DEAL_MARGINAL)
      .setFontColor('#000000')
      .setRanges([dealRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('PASS')
      .setBackground(ATV_COLORS.DEAL_PASS)
      .setFontColor('#FFFFFF')
      .setRanges([dealRange])
      .build()
  );

  // Risk Score formatting (if column exists)
  if (riskScoreCol) {
    const riskRange = sheet.getRange(2, riskScoreCol, lastRow - 1, 1);
    const settings = ATV_loadSettings();

    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThanOrEqualTo(settings.RISK_LOW_MAX)
        .setBackground(ATV_COLORS.RISK_LOW)
        .setRanges([riskRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberBetween(settings.RISK_LOW_MAX + 1, settings.RISK_MEDIUM_MAX)
        .setBackground(ATV_COLORS.RISK_MEDIUM)
        .setRanges([riskRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThan(settings.RISK_MEDIUM_MAX)
        .setBackground(ATV_COLORS.RISK_HIGH)
        .setRanges([riskRange])
        .build()
    );
  }

  sheet.setConditionalFormatRules(newRules);
}

// ============================================================================
// UTILITY SETUP FUNCTIONS
// ============================================================================

/**
 * Reorders sheets in the workbook for better organization
 */
function ATV_reorderSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const desiredOrder = [
    ATV_SHEETS.DASHBOARD,
    ATV_SHEETS.VERDICT,
    ATV_SHEETS.MASTER_DB,
    ATV_SHEETS.DEAL_ANALYZER,
    ATV_SHEETS.MAO_ENGINE,
    ATV_SHEETS.LEAD_SCORE,
    ATV_SHEETS.SALES_VELOCITY,
    ATV_SHEETS.PARTS_NEEDED,
    ATV_SHEETS.BUILD_PLANS,
    ATV_SHEETS.POST_SALE,
    ATV_SHEETS.LEADS_TRACKER,
    ATV_SHEETS.IMPORT_FB,
    ATV_SHEETS.IMPORT_CL,
    ATV_SHEETS.IMPORT_OU,
    ATV_SHEETS.IMPORT_EBAY,
    ATV_SHEETS.IMPORT_OTHER,
    ATV_SHEETS.SETTINGS,
    ATV_SHEETS.CRM_INTEGRATION,
    ATV_SHEETS.SYSTEM_LOG
  ];

  desiredOrder.forEach((sheetName, index) => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    }
  });

  ATV_logInfo('ATV_reorderSheets', 'Sheets reordered');
}

/**
 * Clears all data from analysis sheets (keeps headers)
 * Use with caution!
 */
function ATV_clearAnalysisData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear Analysis Data',
    'This will clear all data from MASTER_ATV_DB, VERDICT, and related sheets. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsToClear = [
    ATV_SHEETS.MASTER_DB,
    ATV_SHEETS.VERDICT,
    ATV_SHEETS.DEAL_ANALYZER,
    ATV_SHEETS.MAO_ENGINE,
    ATV_SHEETS.LEAD_SCORE
  ];

  sheetsToClear.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
  });

  ATV_logInfo('ATV_clearAnalysisData', 'Analysis data cleared');
  SpreadsheetApp.getActiveSpreadsheet().toast('Analysis data cleared', 'Complete', 3);
}
