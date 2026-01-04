/**
 * CarHawk ATV Flip Analyzer - Main Entry Point
 *
 * This is a spreadsheet-based underwriting engine that turns messy marketplace
 * listings into ranked, risk-adjusted investment decisions.
 *
 * @version 1.0
 * @author Quantum ATV Analyzer
 */

// ============================================================================
// GLOBAL CONSTANTS
// ============================================================================

const SHEETS = {
  SOURCE_STAGING: 'Source_Staging',
  MASTER_DATABASE: 'Master_Database',
  ENHANCED_ANALYSIS: 'Enhanced_Analysis',
  VERDICT: 'Verdict',
  LEAD_SCORING: 'Lead_Scoring',
  REPAIR_ESTIMATOR: 'Repair_Estimator',
  PARTS_ANALYZER: 'Parts_Analyzer',
  CAPITAL_TIERS: 'Capital_Tiers',
  CRM_INTEGRATION: 'CRM_Integration',
  CONFIG: 'Config'
};

// ============================================================================
// SETUP & INITIALIZATION
// ============================================================================

/**
 * Creates the menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🦅 CarHawk')
    .addItem('🔧 Setup All Sheets', 'setupSheets')
    .addSeparator()
    .addItem('📥 Import Listing', 'importListing')
    .addItem('🔄 Normalize Data', 'normalizeAllData')
    .addItem('📊 Refresh Analysis', 'refreshAnalysis')
    .addItem('🏆 Update Verdicts', 'updateVerdicts')
    .addSeparator()
    .addItem('📤 Send to CRM', 'syncToCRM')
    .addItem('💰 Update Parts Pricing', 'updatePartsPricing')
    .addSeparator()
    .addItem('📖 Help & Documentation', 'showHelp')
    .addToUi();
}

/**
 * Initial setup - creates all required sheets with proper schemas
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    // Create each sheet if it doesn't exist
    createConfigSheet(ss);
    createCapitalTiersSheet(ss);
    createSourceStagingSheet(ss);
    createMasterDatabaseSheet(ss);
    createRepairEstimatorSheet(ss);
    createPartsAnalyzerSheet(ss);
    createEnhancedAnalysisSheet(ss);
    createLeadScoringSheet(ss);
    createVerdictSheet(ss);
    createCRMIntegrationSheet(ss);

    // Set up named ranges for easy formula access
    setupNamedRanges(ss);

    // Apply formatting
    formatAllSheets(ss);

    ui.alert('✅ Success!',
             'All CarHawk sheets have been created and configured.\n\n' +
             'Next steps:\n' +
             '1. Configure your settings in the Config sheet\n' +
             '2. Start adding deals to Source_Staging\n' +
             '3. Check Verdict sheet for ranked decisions',
             ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ Setup Error',
             'There was an error during setup:\n\n' + error.toString(),
             ui.ButtonSet.OK);
    Logger.log('Setup error: ' + error);
  }
}

/**
 * Set up named ranges for formulas
 */
function setupNamedRanges(ss) {
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);
  const tiersSheet = ss.getSheetByName(SHEETS.CAPITAL_TIERS);

  // Config ranges
  if (configSheet) {
    ss.setNamedRange('Config_Settings', configSheet.getRange('A2:B50'));
  }

  // Tier ranges
  if (tiersSheet) {
    ss.setNamedRange('Tier_Definitions', tiersSheet.getRange('A2:H10'));
  }
}

/**
 * Apply consistent formatting across all sheets
 */
function formatAllSheets(ss) {
  const sheets = [
    SHEETS.MASTER_DATABASE,
    SHEETS.VERDICT,
    SHEETS.ENHANCED_ANALYSIS,
    SHEETS.LEAD_SCORING
  ];

  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      // Freeze header row
      sheet.setFrozenRows(1);

      // Bold headers
      const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285F4');
      headerRange.setFontColor('#FFFFFF');

      // Auto-resize columns
      sheet.autoResizeColumns(1, sheet.getLastColumn());
    }
  });
}

// ============================================================================
// USER ACTIONS
// ============================================================================

/**
 * Import a listing from clipboard
 */
function importListing() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '📥 Import Listing',
    'Paste the listing text (title, price, description):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const text = response.getResponseText();
    parseAndImportListing(text);
    ui.alert('✅ Listing imported to Source_Staging');
  }
}

/**
 * Normalize all data from Source_Staging to Master_Database
 */
function normalizeAllData() {
  try {
    const normalized = normalizeData();
    SpreadsheetApp.getUi().alert(
      '✅ Data Normalized',
      `Successfully processed ${normalized} records.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Refresh all analysis calculations
 */
function refreshAnalysis() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Analysis refreshed');
}

/**
 * Update all verdict rankings
 */
function updateVerdicts() {
  try {
    rankDeals();
    SpreadsheetApp.getUi().alert('✅ Verdicts updated');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Sync hot deals to CRM
 */
function syncToCRM() {
  try {
    const synced = sendCRMAlerts();
    SpreadsheetApp.getUi().alert(
      '✅ CRM Sync Complete',
      `Sent ${synced} hot deals to CRM.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Update parts pricing from market data
 */
function updatePartsPricing() {
  SpreadsheetApp.getUi().alert(
    '📊 Parts Pricing',
    'Parts pricing update feature coming soon.\n\n' +
    'For now, manually update the Parts_Analyzer sheet with current market values.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Show help documentation
 */
function showHelp() {
  const helpText = `
🦅 CARHAWK ATV FLIP ANALYZER - HELP

WORKFLOW:
1. Add listings to Source_Staging (manual or import)
2. Run "Normalize Data" to process into Master_Database
3. Check Verdict sheet for ranked BUY/WATCH/PASS decisions
4. Use MAO (Maximum Allowable Offer) for negotiations

KEY CONCEPTS:
• MAO = Your ceiling price (never pay more)
• Risk Score = 0-10 (lower is safer)
• Capital Tier = Investment size category
• Part-Out Floor = Worst-case liquidation value

VERDICTS:
🟢 BUY = Strong deal, message seller immediately
🟡 WATCH = Fair deal, monitor for price drop
🔴 PASS = Poor deal, ignore

For detailed documentation, see the README file in the repository.
  `;

  SpreadsheetApp.getUi().alert('📖 Help & Documentation', helpText, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get or create a sheet
 */
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Helper to get config value
 */
function getConfigValue(key, defaultValue = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);

  if (!configSheet) return defaultValue;

  const data = configSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }

  return defaultValue;
}

/**
 * Helper to log activity
 */
function logActivity(action, details = '') {
  Logger.log(`[${new Date().toISOString()}] ${action}: ${details}`);
}
