/**
 * UIHandlers.gs
 * HTML UI interface handlers for CarHawk
 */

// ============================================================================
// UI DISPLAY FUNCTIONS
// ============================================================================

/**
 * Show main dashboard sidebar
 */
function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('🦅 CarHawk Dashboard')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show deal entry form
 */
function showDealEntryForm() {
  const html = HtmlService.createHtmlOutputFromFile('DealEntryForm')
    .setTitle('➕ Add New Deal')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show verdicts panel
 */
function showVerdictsPanel() {
  const html = HtmlService.createHtmlOutputFromFile('VerdictsPanel')
    .setTitle('🏆 Verdicts')
    .setWidth(450);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show settings panel
 */
function showSettingsPanel() {
  const html = HtmlService.createHtmlOutputFromFile('SettingsPanel')
    .setTitle('⚙️ Settings')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
}

// ============================================================================
// DATA PROVIDERS FOR UI
// ============================================================================

/**
 * Get dashboard data for HTML UI
 */
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);
  const verdictSheet = ss.getSheetByName(SHEETS.VERDICT);

  if (!masterSheet) {
    return {
      buyCount: 0,
      watchCount: 0,
      totalDeals: 0,
      avgProfit: 0,
      hotDeals: []
    };
  }

  const masterData = masterSheet.getDataRange().getValues();

  // Count verdicts
  let buyCount = 0;
  let watchCount = 0;
  let passCount = 0;
  let totalProfit = 0;
  let profitCount = 0;

  for (let i = 1; i < masterData.length; i++) {
    const verdict = masterData[i][14]; // Verdict column
    const profit = calculateProfitForRow(masterData[i]);

    if (verdict === 'BUY') buyCount++;
    else if (verdict === 'WATCH') watchCount++;
    else if (verdict === 'PASS') passCount++;

    if (profit > 0) {
      totalProfit += profit;
      profitCount++;
    }
  }

  const avgProfit = profitCount > 0 ? totalProfit / profitCount : 0;

  // Get top BUY and WATCH deals
  const hotDeals = [];
  if (verdictSheet) {
    const verdictData = verdictSheet.getDataRange().getValues();
    for (let i = 1; i < Math.min(11, verdictData.length); i++) { // Top 10
      const row = verdictData[i];
      if (row[10] === 'BUY' || row[10] === 'WATCH') { // Verdict column
        hotDeals.push({
          assetId: row[1],
          description: row[2],
          askingPrice: row[3],
          mao: row[4],
          profit: row[6],
          riskScore: row[8],
          verdict: row[10]
        });
      }
    }
  }

  return {
    buyCount: buyCount,
    watchCount: watchCount,
    totalDeals: masterData.length - 1,
    avgProfit: avgProfit,
    hotDeals: hotDeals
  };
}

/**
 * Calculate profit for a Master_Database row
 */
function calculateProfitForRow(row) {
  const deal = createDealObjectFromRow(row);

  if (!deal.mao || !deal.estimatedResale) {
    return 0;
  }

  const repairEstimate = deal.repairEstimate || estimateRepairCost(deal);
  const allInCost = deal.mao + repairEstimate;
  const profit = deal.estimatedResale - allInCost;

  return profit;
}

/**
 * Get all verdicts for verdicts panel
 */
function getVerdictsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(SHEETS.VERDICT);

  if (!verdictSheet) {
    return { deals: [] };
  }

  const data = verdictSheet.getDataRange().getValues();
  const deals = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Has rank
      deals.push({
        rank: row[0],
        assetId: row[1],
        description: row[2],
        askingPrice: row[3],
        mao: row[4],
        estResale: row[5],
        profit: row[6],
        roi: row[7],
        risk: row[8],
        riskLevel: row[9],
        verdict: row[10],
        confidence: row[11],
        condition: row[12],
        location: row[13],
        url: row[14],
        action: row[15]
      });
    }
  }

  return { deals: deals };
}

/**
 * Get settings for settings panel
 */
function getSettingsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);

  if (!configSheet) {
    return { settings: [] };
  }

  const data = configSheet.getDataRange().getValues();
  const settings = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] && !row[0].startsWith('===')) {
      settings.push({
        key: row[0],
        value: row[1]
      });
    }
  }

  return { settings: settings };
}

/**
 * Update a setting
 */
function updateSetting(key, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);

  if (!configSheet) {
    throw new Error('Config sheet not found');
  }

  const data = configSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      logActivity('updateSetting', `${key} = ${value}`);
      return { success: true, message: 'Setting updated' };
    }
  }

  throw new Error('Setting not found: ' + key);
}

// ============================================================================
// FORM HANDLERS
// ============================================================================

/**
 * Quick import from pasted text
 */
function quickImportListing(text) {
  try {
    // Add to Source_Staging and normalize
    parseAndImportListing(text);

    // Run analysis
    normalizeData();
    rankDeals();

    // Get the latest verdict
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);
    const lastRow = masterSheet.getLastRow();
    const verdictRow = masterSheet.getRange(lastRow, 1, 1, 30).getValues()[0];
    const verdict = verdictRow[14];

    logActivity('quickImportListing', 'Imported and analyzed listing');

    return {
      success: true,
      message: 'Deal imported and analyzed',
      verdict: verdict
    };

  } catch (error) {
    logActivity('quickImportListing ERROR', error.toString());
    throw new Error('Failed to import listing: ' + error.message);
  }
}

/**
 * Add deal manually from form
 */
function addDealManually(dealData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName(SHEETS.SOURCE_STAGING);

    if (!sourceSheet) {
      throw new Error('Source_Staging sheet not found');
    }

    // Add to Source_Staging
    const lastRow = sourceSheet.getLastRow();
    sourceSheet.getRange(lastRow + 1, 1, 1, 7).setValues([[
      dealData.rawText,
      dealData.sourceUrl || '',
      dealData.platform || 'Manual Entry',
      new Date(),
      dealData.askingPrice,
      dealData.location || '',
      dealData.sellerContact || ''
    ]]);

    // Normalize and analyze
    normalizeData();
    rankDeals();

    // Get verdict
    const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);
    const lastMasterRow = masterSheet.getLastRow();
    const verdictRow = masterSheet.getRange(lastMasterRow, 1, 1, 30).getValues()[0];
    const verdict = verdictRow[14];

    logActivity('addDealManually', 'Added deal: ' + dealData.rawText.substring(0, 50));

    return {
      success: true,
      message: 'Deal added and analyzed',
      verdict: verdict
    };

  } catch (error) {
    logActivity('addDealManually ERROR', error.toString());
    throw new Error('Failed to add deal: ' + error.message);
  }
}

/**
 * View deal details (navigate to row)
 */
function viewDealDetails(assetId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);

  if (!masterSheet) return;

  const data = masterSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === assetId) {
      // Navigate to this row
      masterSheet.setActiveRange(masterSheet.getRange(i + 1, 1));
      ss.setActiveSheet(masterSheet);
      break;
    }
  }
}
