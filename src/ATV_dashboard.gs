/**
 * ===== FILE: ATV_dashboard.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Dashboard and metrics:
 * - KPI calculations
 * - Dashboard sheet population
 * - Summary statistics
 */

// ============================================================================
// MAIN DASHBOARD UPDATE
// ============================================================================

/**
 * Updates the dashboard with current metrics
 */
function ATV_updateDashboard() {
  try {
    ATV_logInfo('ATV_updateDashboard', 'Updating dashboard...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dashSheet = ss.getSheetByName(ATV_SHEETS.DASHBOARD);

    if (!dashSheet) {
      ATV_logError('ATV_updateDashboard', 'Dashboard sheet not found');
      return;
    }

    // Calculate all metrics
    const metrics = ATV_calculateAllMetrics();

    // Clear existing data
    if (dashSheet.getLastRow() > 1) {
      dashSheet.getRange(2, 1, dashSheet.getLastRow() - 1, dashSheet.getLastColumn()).clearContent();
    }

    // Write metrics
    const rows = [];
    const now = new Date();

    for (const key in metrics) {
      rows.push([
        key,
        metrics[key].current,
        metrics[key].previous || '',
        metrics[key].change || '',
        now
      ]);
    }

    if (rows.length > 0) {
      dashSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }

    // Apply formatting
    ATV_formatDashboard(dashSheet);

    ATV_logInfo('ATV_updateDashboard', 'Dashboard updated', `${rows.length} metrics`);

  } catch (e) {
    ATV_logError('ATV_updateDashboard', 'Dashboard update failed', e.message);
  }
}

// ============================================================================
// METRIC CALCULATIONS
// ============================================================================

/**
 * Calculates all dashboard metrics
 * @returns {Object} Metrics object
 */
function ATV_calculateAllMetrics() {
  const masterData = ATV_getSheetDataAsObjects(ATV_SHEETS.MASTER_DB);
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);
  const postSaleData = ATV_getSheetDataAsObjects(ATV_SHEETS.POST_SALE);
  const partsData = ATV_getSheetDataAsObjects(ATV_SHEETS.PARTS_NEEDED);

  const metrics = {};

  // Total listings
  metrics['Total Listings'] = { current: masterData.length };

  // Deals by class
  const hotDeals = verdictData.filter(d => d['Deal Class'] === 'HOT').length;
  const solidDeals = verdictData.filter(d => d['Deal Class'] === 'SOLID').length;
  const marginalDeals = verdictData.filter(d => d['Deal Class'] === 'MARGINAL').length;

  metrics['HOT Deals'] = { current: hotDeals };
  metrics['SOLID Deals'] = { current: solidDeals };
  metrics['MARGINAL Deals'] = { current: marginalDeals };
  metrics['Actionable Deals'] = { current: hotDeals + solidDeals };

  // Total expected profit
  const totalProfit = verdictData
    .filter(d => d['Deal Class'] === 'HOT' || d['Deal Class'] === 'SOLID')
    .reduce((sum, d) => sum + (parseFloat(d['Expected Profit']) || 0), 0);
  metrics['Total Expected Profit'] = { current: ATV_formatCurrency(totalProfit) };

  // Average profit per deal
  const actionableCount = hotDeals + solidDeals;
  const avgProfit = actionableCount > 0 ? totalProfit / actionableCount : 0;
  metrics['Avg Profit per Deal'] = { current: ATV_formatCurrency(avgProfit) };

  // By category
  const categories = {};
  masterData.forEach(d => {
    const cat = d['Category'] || 'Other';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  for (const cat in categories) {
    metrics[`${cat} Count`] = { current: categories[cat] };
  }

  // By platform
  const platforms = {};
  masterData.forEach(d => {
    const plat = d['Platform'] || 'Other';
    platforms[plat] = (platforms[plat] || 0) + 1;
  });

  for (const plat in platforms) {
    metrics[`${plat} Listings`] = { current: platforms[plat] };
  }

  // Capital exposure
  const totalCapital = verdictData
    .filter(d => d['Deal Class'] === 'HOT' || d['Deal Class'] === 'SOLID')
    .reduce((sum, d) => sum + (parseFloat(d['Offer Target']) || 0), 0);
  metrics['Total Capital Needed'] = { current: ATV_formatCurrency(totalCapital) };

  // Sales performance
  if (postSaleData.length > 0) {
    const totalSales = postSaleData.reduce((sum, s) => sum + (parseFloat(s['Sale Price']) || 0), 0);
    const totalGrossProfit = postSaleData.reduce((sum, s) => sum + (parseFloat(s['Gross Profit']) || 0), 0);
    const avgROI = postSaleData.reduce((sum, s) => sum + (parseFloat(s['ROI %']) || 0), 0) / postSaleData.length;

    metrics['Total Sales'] = { current: ATV_formatCurrency(totalSales) };
    metrics['Total Gross Profit'] = { current: ATV_formatCurrency(totalGrossProfit) };
    metrics['Average ROI'] = { current: ATV_formatPercent(avgROI / 100) };
    metrics['Deals Completed'] = { current: postSaleData.length };
  }

  // Builds in progress
  const buildsInProgress = ATV_getBuildsInProgress();
  metrics['Builds In Progress'] = { current: buildsInProgress.length };

  // Parts pending
  const partsPending = partsData.filter(p => p['Status'] !== 'Installed').length;
  metrics['Parts Pending'] = { current: partsPending };

  // Average risk score
  const avgRisk = masterData.length > 0 ?
    masterData.reduce((sum, d) => sum + (parseFloat(d['Risk Score']) || 0), 0) / masterData.length : 0;
  metrics['Avg Risk Score'] = { current: Math.round(avgRisk) };

  // Urgent actions needed
  const urgentDeals = verdictData.filter(d =>
    d['Recommended Action'] === 'CALL NOW' || d['Recommended Action'] === 'GO SEE'
  ).length;
  metrics['Urgent Actions'] = { current: urgentDeals };

  return metrics;
}

/**
 * Formats the dashboard sheet
 * @param {Sheet} sheet - Dashboard sheet
 */
function ATV_formatDashboard(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  // Format metric names bold
  const nameCol = sheet.getRange(2, 1, lastRow - 1, 1);
  nameCol.setFontWeight('bold');

  // Auto-fit columns
  sheet.autoResizeColumns(1, sheet.getLastColumn());
}

// ============================================================================
// QUICK STATS
// ============================================================================

/**
 * Gets quick stats for UI display
 * @returns {Object} Quick stats object
 */
function ATV_getQuickStats() {
  const verdictData = ATV_getSheetDataAsObjects(ATV_SHEETS.VERDICT);

  const hotCount = verdictData.filter(d => d['Deal Class'] === 'HOT').length;
  const solidCount = verdictData.filter(d => d['Deal Class'] === 'SOLID').length;

  const totalProfit = verdictData
    .filter(d => d['Deal Class'] === 'HOT' || d['Deal Class'] === 'SOLID')
    .reduce((sum, d) => sum + (parseFloat(d['Expected Profit']) || 0), 0);

  const buildsInProgress = ATV_getBuildsInProgress().length;

  const urgentDeals = verdictData.filter(d =>
    d['Recommended Action'] === 'CALL NOW'
  ).length;

  return {
    hotDeals: hotCount,
    solidDeals: solidCount,
    totalDeals: verdictData.length,
    totalProfit: totalProfit,
    totalProfitFormatted: ATV_formatCurrency(totalProfit),
    buildsInProgress: buildsInProgress,
    urgentDeals: urgentDeals
  };
}

/**
 * Gets recent log entries for UI display
 * @param {number} count - Number of entries
 * @returns {Array} Recent log entries
 */
function ATV_getRecentLogs(count) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(ATV_SHEETS.SYSTEM_LOG);

  if (!logSheet || logSheet.getLastRow() <= 1) return [];

  const data = logSheet.getDataRange().getValues();
  const headers = data[0];

  // Get last N rows
  const startRow = Math.max(1, data.length - count);
  const logs = [];

  for (let i = data.length - 1; i >= startRow; i--) {
    const log = {};
    headers.forEach((h, idx) => log[h] = data[i][idx]);
    logs.push(log);
  }

  return logs;
}

// ============================================================================
// SUMMARY GENERATORS
// ============================================================================

/**
 * Generates a text summary of current opportunities
 * @returns {string} Summary text
 */
function ATV_generateOpportunitySummary() {
  const stats = ATV_getQuickStats();
  const topDeals = ATV_getTopDeals(3);

  let summary = `**Current Opportunities**\n`;
  summary += `- ${stats.hotDeals} HOT deals, ${stats.solidDeals} SOLID deals\n`;
  summary += `- Total expected profit: ${stats.totalProfitFormatted}\n`;
  summary += `- ${stats.urgentDeals} deals need immediate action\n\n`;

  if (topDeals.length > 0) {
    summary += `**Top 3 Deals:**\n`;
    topDeals.forEach((deal, i) => {
      summary += `${i + 1}. ${deal['Title']} - ${ATV_formatCurrency(deal['Expected Profit'])} profit (${deal['Deal Class']})\n`;
    });
  }

  return summary;
}

/**
 * Gets performance metrics for a time period
 * @param {number} days - Number of days to look back
 * @returns {Object} Performance metrics
 */
function ATV_getPerformanceMetrics(days) {
  const postSaleData = ATV_getSheetDataAsObjects(ATV_SHEETS.POST_SALE);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentSales = postSaleData.filter(sale => {
    const saleDate = new Date(sale['Sale Date']);
    return saleDate >= cutoffDate;
  });

  if (recentSales.length === 0) {
    return {
      salesCount: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgProfit: 0,
      avgROI: 0,
      avgHoldingDays: 0
    };
  }

  const totalRevenue = recentSales.reduce((sum, s) => sum + (parseFloat(s['Sale Price']) || 0), 0);
  const totalProfit = recentSales.reduce((sum, s) => sum + (parseFloat(s['Gross Profit']) || 0), 0);
  const avgROI = recentSales.reduce((sum, s) => sum + (parseFloat(s['ROI %']) || 0), 0) / recentSales.length;
  const avgHolding = recentSales.reduce((sum, s) => sum + (parseFloat(s['Holding Time (Days)']) || 0), 0) / recentSales.length;

  return {
    salesCount: recentSales.length,
    totalRevenue: totalRevenue,
    totalProfit: totalProfit,
    avgProfit: totalProfit / recentSales.length,
    avgROI: avgROI,
    avgHoldingDays: avgHolding
  };
}
