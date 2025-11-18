/**
 * ===== FILE: ATV_ui.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * UI functions:
 * - Show HTML sidebars/dialogs
 * - Handle form submissions
 * - UI helper functions
 */

// ============================================================================
// UI DISPLAY FUNCTIONS
// ============================================================================

/**
 * Shows the Control Center sidebar
 */
function ATV_showControlCenter() {
  const html = HtmlService.createHtmlOutputFromFile('atv_control_center')
    .setTitle('🏍️ ATV Control Center')
    .setWidth(ATV_UI_CONFIG.SIDEBAR_WIDTH);

  SpreadsheetApp.getUi().showSidebar(html);
  ATV_logInfo('ATV_showControlCenter', 'Control Center opened');
}

/**
 * Shows the Deal Review panel
 */
function ATV_showDealReview() {
  const html = HtmlService.createHtmlOutputFromFile('atv_deal_review')
    .setTitle('🧰 Deal Review')
    .setWidth(ATV_UI_CONFIG.SIDEBAR_WIDTH);

  SpreadsheetApp.getUi().showSidebar(html);
  ATV_logInfo('ATV_showDealReview', 'Deal Review opened');
}

/**
 * Shows the Settings dialog
 */
function ATV_showSettings() {
  const html = HtmlService.createHtmlOutputFromFile('atv_settings')
    .setWidth(ATV_UI_CONFIG.DIALOG_WIDTH)
    .setHeight(ATV_UI_CONFIG.DIALOG_HEIGHT);

  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ ATV Analyzer Settings');
  ATV_logInfo('ATV_showSettings', 'Settings dialog opened');
}

/**
 * Shows the Help dialog
 */
function ATV_showHelp() {
  const html = HtmlService.createHtmlOutputFromFile('atv_help')
    .setWidth(ATV_UI_CONFIG.DIALOG_WIDTH)
    .setHeight(ATV_UI_CONFIG.DIALOG_HEIGHT);

  SpreadsheetApp.getUi().showModalDialog(html, '📚 ATV Analyzer Help');
  ATV_logInfo('ATV_showHelp', 'Help dialog opened');
}

/**
 * Shows the Builds/Parts panel
 */
function ATV_showBuildsPanel() {
  const html = HtmlService.createHtmlOutputFromFile('atv_deal_review')
    .setTitle('🧩 Parts & Builds')
    .setWidth(ATV_UI_CONFIG.SIDEBAR_WIDTH);

  SpreadsheetApp.getUi().showSidebar(html);
  ATV_logInfo('ATV_showBuildsPanel', 'Builds panel opened');
}

// ============================================================================
// DATA GETTERS FOR UI
// ============================================================================

/**
 * Gets data for Control Center display
 * @returns {Object} Control center data
 */
function ATV_getControlCenterData() {
  return {
    stats: ATV_getQuickStats(),
    recentLogs: ATV_getRecentLogs(ATV_UI_CONFIG.RECENT_LOGS_COUNT),
    buildsInProgress: ATV_getBuildsInProgress().slice(0, 5)
  };
}

/**
 * Gets top deals for Deal Review panel
 * @returns {Array} Top deals
 */
function ATV_getDealsForReview() {
  return ATV_getTopDeals(ATV_UI_CONFIG.TOP_DEALS_COUNT);
}

/**
 * Gets current settings for Settings dialog
 * @returns {Object} Current settings
 */
function ATV_getSettingsForUi() {
  return ATV_loadSettings();
}

// ============================================================================
// FORM HANDLERS
// ============================================================================

/**
 * Handles settings form submission
 * @param {Object} formData - Form data object
 * @returns {Object} Result
 */
function ATV_handleSettingsSubmit(formData) {
  try {
    // Save settings
    const result = ATV_saveSettingsFromUi(formData);

    if (result.success) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Settings saved!', 'Success', 3);
    }

    return result;

  } catch (e) {
    ATV_logError('ATV_handleSettingsSubmit', 'Failed to save settings', e.message);
    return { success: false, message: e.message };
  }
}

// ============================================================================
// DEAL ACTIONS
// ============================================================================

/**
 * Updates deal status in master DB
 * @param {string} atvId - ATV ID
 * @param {string} status - New status
 * @returns {Object} Result
 */
function ATV_updateDealStatus(atvId, status) {
  try {
    ATV_updateCell(ATV_SHEETS.MASTER_DB, ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId).rowNumber, 'Status', status);
    ATV_updateCell(ATV_SHEETS.MASTER_DB, ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId).rowNumber, 'Last Updated', new Date());

    ATV_logInfo('ATV_updateDealStatus', `Updated ${atvId} to ${status}`);
    return { success: true };

  } catch (e) {
    ATV_logError('ATV_updateDealStatus', 'Failed to update status', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Creates a lead entry for an ATV
 * @param {string} atvId - ATV ID
 * @returns {Object} Result with lead ID
 */
function ATV_createLead(atvId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leadsSheet = ss.getSheetByName(ATV_SHEETS.LEADS_TRACKER);

    if (!leadsSheet) {
      return { success: false, error: 'Leads sheet not found' };
    }

    // Get ATV data
    const atvData = ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId);
    if (!atvData) {
      return { success: false, error: 'ATV not found' };
    }

    const leadId = ATV_generateLeadId();
    const now = new Date();

    const row = [
      leadId,
      atvId,
      atvData.data['Seller Name'] || '',
      atvData.data['Seller Contact'] || '',
      atvData.data['Platform'] || '',
      now,
      'Not Contacted',
      'New',
      now,
      '', // Next follow-up
      '', // Offer made
      '', // Counter offer
      '', // Notes
      ''  // Outcome
    ];

    leadsSheet.appendRow(row);

    // Update ATV status
    ATV_updateDealStatus(atvId, 'Pursuing');

    ATV_logInfo('ATV_createLead', `Created lead ${leadId} for ${atvId}`);
    return { success: true, leadId: leadId };

  } catch (e) {
    ATV_logError('ATV_createLead', 'Failed to create lead', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Marks a deal as pursued
 * @param {string} atvId - ATV ID
 * @returns {Object} Result
 */
function ATV_markAsPursuing(atvId) {
  const result = ATV_createLead(atvId);
  if (result.success) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Deal marked as pursuing', 'Success', 3);
  }
  return result;
}

/**
 * Marks a deal as inspected
 * @param {string} atvId - ATV ID
 * @returns {Object} Result
 */
function ATV_markAsInspected(atvId) {
  const result = ATV_updateDealStatus(atvId, 'Inspected');
  if (result.success) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Deal marked as inspected', 'Success', 3);
  }
  return result;
}

/**
 * Marks a deal as under negotiation
 * @param {string} atvId - ATV ID
 * @returns {Object} Result
 */
function ATV_markAsNegotiating(atvId) {
  const result = ATV_updateDealStatus(atvId, 'Negotiating');
  if (result.success) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Deal marked as negotiating', 'Success', 3);
  }
  return result;
}

/**
 * Records a purchase
 * @param {string} atvId - ATV ID
 * @param {number} purchasePrice - Actual purchase price
 * @returns {Object} Result
 */
function ATV_recordPurchase(atvId, purchasePrice) {
  try {
    // Update master DB
    const result = ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId);
    if (!result) {
      return { success: false, error: 'ATV not found' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);

    ATV_updateCell(ATV_SHEETS.MASTER_DB, result.rowNumber, 'Status', 'Purchased');
    ATV_updateCell(ATV_SHEETS.MASTER_DB, result.rowNumber, 'Last Updated', new Date());

    ATV_logInfo('ATV_recordPurchase', `Recorded purchase of ${atvId} for ${purchasePrice}`);
    SpreadsheetApp.getActiveSpreadsheet().toast('Purchase recorded!', 'Success', 3);

    return { success: true };

  } catch (e) {
    ATV_logError('ATV_recordPurchase', 'Failed to record purchase', e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigates to a specific ATV in master DB
 * @param {string} atvId - ATV ID
 */
function ATV_navigateToATV(atvId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);

  if (!sheet) return;

  const result = ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId);
  if (result) {
    sheet.activate();
    sheet.getRange(result.rowNumber, 1).activate();
  }
}

/**
 * Navigates to the verdict sheet
 */
function ATV_navigateToVerdict() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.VERDICT);
  if (sheet) {
    sheet.activate();
  }
}

/**
 * Navigates to the dashboard
 */
function ATV_navigateToDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.DASHBOARD);
  if (sheet) {
    sheet.activate();
  }
}

// ============================================================================
// TOAST & ALERTS
// ============================================================================

/**
 * Shows a toast notification
 * @param {string} message - Message text
 * @param {string} title - Toast title
 * @param {number} timeout - Timeout in seconds
 */
function ATV_showToast(message, title, timeout) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title || 'ATV Analyzer', timeout || 3);
}

/**
 * Shows an alert dialog
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 */
function ATV_showAlert(title, message) {
  SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Shows a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @returns {boolean} True if user clicked Yes
 */
function ATV_showConfirm(title, message) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(title, message, ui.ButtonSet.YES_NO);
  return response === ui.Button.YES;
}
