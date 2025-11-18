/**
 * ===== FILE: ATV_verdict.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Verdict sheet building:
 * - Ranks all deals by deal score
 * - Creates actionable verdict view
 * - Applies conditional formatting
 */

// ============================================================================
// MAIN VERDICT BUILDER
// ============================================================================

/**
 * Rebuilds the verdict sheet from master DB data
 */
function ATV_rebuildVerdict() {
  try {
    ATV_logInfo('ATV_rebuildVerdict', 'Rebuilding verdict sheet...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
    const verdictSheet = ss.getSheetByName(ATV_SHEETS.VERDICT);

    if (!masterSheet || !verdictSheet) {
      ATV_logError('ATV_rebuildVerdict', 'Required sheets not found');
      return;
    }

    // Clear existing verdict data (keep headers)
    if (verdictSheet.getLastRow() > 1) {
      verdictSheet.getRange(2, 1, verdictSheet.getLastRow() - 1, verdictSheet.getLastColumn()).clearContent();
    }

    // Get master data
    const masterData = ATV_getSheetDataAsObjects(ATV_SHEETS.MASTER_DB);

    if (masterData.length === 0) {
      ATV_logWarn('ATV_rebuildVerdict', 'No data in master DB');
      return;
    }

    // Calculate deal scores and sort
    const scoredDeals = masterData.map(record => {
      // Composite deal score based on lead score, profit potential, and risk
      const leadScore = record['Lead Score'] || 50;
      const expectedProfit = record['Expected Profit'] || 0;
      const profitMargin = record['Profit Margin %'] || 0;
      const riskScore = record['Risk Score'] || 50;

      // Deal score formula
      let dealScore = leadScore * 0.5;
      dealScore += Math.min(30, expectedProfit / 50);
      dealScore += profitMargin * 20;
      dealScore -= riskScore * 0.2;
      dealScore = Math.max(0, Math.min(100, dealScore));

      return {
        ...record,
        dealScore: Math.round(dealScore)
      };
    });

    // Sort by deal score descending
    scoredDeals.sort((a, b) => b.dealScore - a.dealScore);

    // Build verdict rows
    const verdictRows = scoredDeals.map((deal, index) => {
      const distance = deal['Distance (mi)'] || 0;
      const expectedProfit = deal['Expected Profit'] || 0;

      // Determine recommended action
      const action = ATV_getRecommendedAction(deal['Deal Class'], distance, expectedProfit);

      // Determine hot build potential
      const hotBuild = ATV_hasHotBuildPotential(
        deal['Make'],
        deal['Model'],
        deal['Category'],
        deal['Running Status']
      ) ? 'Yes' : 'No';

      return [
        index + 1,                          // Rank
        deal.dealScore,                     // Deal Score
        deal['Title (Normalized)'],         // Title
        deal['Platform'],                   // Platform
        deal['Category'],                   // Category
        deal['Asking Price'],               // Asking Price
        deal['Offer Target'],               // Offer Target
        deal['Expected Profit'],            // Expected Profit
        deal['Profit Margin %'],            // Profit Margin %
        deal['Capital Tier'],               // Capital Tier
        deal['Risk Score'],                 // Risk Score
        deal['Deal Class'],                 // Deal Class
        distance,                           // Distance
        hotBuild,                           // Hot Build Potential
        deal['Key Issues'],                 // Key Issues
        action,                             // Recommended Action
        deal['Seller Name'],                // Seller Name
        deal['Seller Contact'],             // Seller Contact
        deal['Listing URL'],                // Listing URL
        deal['ATV ID'],                     // ATV ID
        deal['Notes / Build Ideas']         // Notes
      ];
    });

    // Write to verdict sheet
    if (verdictRows.length > 0) {
      verdictSheet.getRange(2, 1, verdictRows.length, verdictRows[0].length).setValues(verdictRows);
    }

    // Apply formatting
    ATV_applyVerdictFormatting(ss);
    ATV_applyVerdictConditionalFormatting(verdictSheet);

    // Format currency and percentage columns
    ATV_formatVerdictColumns(verdictSheet);

    ATV_logInfo('ATV_rebuildVerdict', `Verdict sheet rebuilt`, `${verdictRows.length} deals ranked`);
    SpreadsheetApp.getActiveSpreadsheet().toast(`Ranked ${verdictRows.length} deals`, 'Verdict Updated', 3);

  } catch (e) {
    ATV_logError('ATV_rebuildVerdict', 'Failed to rebuild verdict', e.message);
    throw e;
  }
}

// ============================================================================
// VERDICT FORMATTING
// ============================================================================

/**
 * Applies conditional formatting to verdict sheet
 * @param {Sheet} sheet - Verdict sheet
 */
function ATV_applyVerdictConditionalFormatting(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const headerMap = ATV_getHeaderMap(sheet);
  const rules = [];

  // Deal Class column formatting
  const dealClassCol = headerMap['Deal Class'];
  if (dealClassCol) {
    const range = sheet.getRange(2, dealClassCol, lastRow - 1, 1);

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('HOT')
        .setBackground(ATV_COLORS.DEAL_HOT)
        .setFontColor('#FFFFFF')
        .setBold(true)
        .setRanges([range])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('SOLID')
        .setBackground(ATV_COLORS.DEAL_SOLID)
        .setFontColor('#FFFFFF')
        .setRanges([range])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('MARGINAL')
        .setBackground(ATV_COLORS.DEAL_MARGINAL)
        .setFontColor('#000000')
        .setRanges([range])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('PASS')
        .setBackground(ATV_COLORS.DEAL_PASS)
        .setFontColor('#FFFFFF')
        .setRanges([range])
        .build()
    );
  }

  // Recommended Action column formatting
  const actionCol = headerMap['Recommended Action'];
  if (actionCol) {
    const range = sheet.getRange(2, actionCol, lastRow - 1, 1);

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('CALL NOW')
        .setBackground('#FF5722')
        .setFontColor('#FFFFFF')
        .setBold(true)
        .setRanges([range])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('TEXT')
        .setBackground('#2196F3')
        .setFontColor('#FFFFFF')
        .setRanges([range])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('GO SEE')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF')
        .setRanges([range])
        .build()
    );
  }

  // Hot Build Potential column
  const hotBuildCol = headerMap['Hot Build Potential?'];
  if (hotBuildCol) {
    const range = sheet.getRange(2, hotBuildCol, lastRow - 1, 1);

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Yes')
        .setBackground('#FFD700')
        .setBold(true)
        .setRanges([range])
        .build()
    );
  }

  // Deal Score gradient
  const scoreCol = headerMap['Deal Score'];
  if (scoreCol) {
    const range = sheet.getRange(2, scoreCol, lastRow - 1, 1);

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .setGradientMaxpointWithValue('#4CAF50', SpreadsheetApp.InterpolationType.NUMBER, '100')
        .setGradientMidpointWithValue('#FFEB3B', SpreadsheetApp.InterpolationType.NUMBER, '50')
        .setGradientMinpointWithValue('#F44336', SpreadsheetApp.InterpolationType.NUMBER, '0')
        .setRanges([range])
        .build()
    );
  }

  sheet.setConditionalFormatRules(rules);
}

/**
 * Formats currency and percentage columns in verdict sheet
 * @param {Sheet} sheet - Verdict sheet
 */
function ATV_formatVerdictColumns(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const headerMap = ATV_getHeaderMap(sheet);

  // Currency columns
  const currencyCols = ['Asking Price', 'Offer Target', 'Expected Profit'];
  currencyCols.forEach(colName => {
    const col = headerMap[colName];
    if (col) {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('$#,##0');
    }
  });

  // Percentage columns
  const pctCol = headerMap['Profit Margin %'];
  if (pctCol) {
    sheet.getRange(2, pctCol, lastRow - 1, 1).setNumberFormat('0.0%');
  }
}

// ============================================================================
// VERDICT QUERIES
// ============================================================================

/**
 * Gets top N deals from verdict
 * @param {number} n - Number of deals to return
 * @returns {Array} Array of top deal objects
 */
function ATV_getTopDeals(n) {
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);

  // Already sorted by rank
  return verdictData.slice(0, n || 10);
}

/**
 * Gets deals by class
 * @param {string} dealClass - Deal class (HOT, SOLID, MARGINAL, PASS)
 * @returns {Array} Array of deals
 */
function ATV_getDealsByClass(dealClass) {
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);
  return verdictData.filter(deal => deal['Deal Class'] === dealClass);
}

/**
 * Gets HOT deals count
 * @returns {number} Number of HOT deals
 */
function ATV_getHotDealsCount() {
  return ATV_getDealsByClass('HOT').length;
}

/**
 * Gets total expected profit from all HOT and SOLID deals
 * @returns {number} Total expected profit
 */
function ATV_getTotalExpectedProfit() {
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);

  return verdictData
    .filter(deal => deal['Deal Class'] === 'HOT' || deal['Deal Class'] === 'SOLID')
    .reduce((total, deal) => total + (parseFloat(deal['Expected Profit']) || 0), 0);
}

/**
 * Gets deals needing immediate action (HOT + local)
 * @returns {Array} Array of urgent deals
 */
function ATV_getUrgentDeals() {
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);

  return verdictData.filter(deal => {
    return deal['Deal Class'] === 'HOT' &&
           (deal['Recommended Action'] === 'CALL NOW' || deal['Recommended Action'] === 'GO SEE');
  });
}

// ============================================================================
// VERDICT HELPERS
// ============================================================================

/**
 * Gets a single verdict entry by ATV ID
 * @param {string} atvId - ATV ID
 * @returns {Object} Verdict entry or null
 */
function ATV_getVerdictForATV(atvId) {
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);
  return verdictData.find(deal => deal['ATV ID'] === atvId) || null;
}

/**
 * Updates notes for a verdict entry
 * @param {string} atvId - ATV ID
 * @param {string} notes - New notes
 * @returns {Object} Result
 */
function ATV_updateVerdictNotes(atvId, notes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.VERDICT);

  if (!sheet) return { success: false, error: 'Verdict sheet not found' };

  const result = ATV_findRowById(ATV_SHEETS.VERDICT, 'ATV ID', atvId);
  if (!result) return { success: false, error: 'ATV not found in verdict' };

  const notesCol = ATV_getColumnIndex(sheet, 'Notes');
  if (notesCol > 0) {
    sheet.getRange(result.rowNumber, notesCol).setValue(notes);
    return { success: true };
  }

  return { success: false, error: 'Notes column not found' };
}
