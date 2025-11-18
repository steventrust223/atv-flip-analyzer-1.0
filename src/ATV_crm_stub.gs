/**
 * ===== FILE: ATV_crm_stub.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * CRM/SMS integration stubs:
 * - Placeholder functions for future integrations
 * - External system sync logging
 * - SMS/notification stubs
 */

// ============================================================================
// CRM INTEGRATION STUBS
// ============================================================================

/**
 * Stub: Syncs a lead to external CRM
 * @param {string} leadId - Lead ID to sync
 * @returns {Object} Result
 */
function ATV_syncToCRM(leadId) {
  // TODO: Implement actual CRM sync
  // Examples: Podio, Monday.com, HubSpot, etc.

  ATV_logSyncEvent('OUT', 'Lead', leadId, 'CRM', null, 'pending', null, 'Stub - not implemented');

  return {
    success: true,
    message: 'CRM sync stub - not yet implemented',
    externalId: null
  };
}

/**
 * Stub: Pulls updates from external CRM
 * @returns {Object} Result
 */
function ATV_pullFromCRM() {
  // TODO: Implement actual CRM pull

  ATV_logSyncEvent('IN', 'Lead', null, 'CRM', null, 'pending', null, 'Stub - not implemented');

  return {
    success: true,
    message: 'CRM pull stub - not yet implemented',
    records: []
  };
}

/**
 * Stub: Syncs an ATV to inventory management system
 * @param {string} atvId - ATV ID to sync
 * @returns {Object} Result
 */
function ATV_syncToInventory(atvId) {
  // TODO: Implement inventory system sync
  // Examples: Airtable, custom system, etc.

  ATV_logSyncEvent('OUT', 'ATV', atvId, 'Inventory', null, 'pending', null, 'Stub - not implemented');

  return {
    success: true,
    message: 'Inventory sync stub - not yet implemented',
    externalId: null
  };
}

// ============================================================================
// SMS/NOTIFICATION STUBS
// ============================================================================

/**
 * Stub: Sends SMS to seller
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {Object} Result
 */
function ATV_sendSMS(phone, message) {
  // TODO: Implement actual SMS sending
  // Examples: Twilio, TextMagic, etc.

  ATV_logInfo('ATV_sendSMS', `SMS stub: ${phone}`, message.substring(0, 50));

  return {
    success: true,
    message: 'SMS stub - not yet implemented',
    messageId: null
  };
}

/**
 * Stub: Sends email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Object} Result
 */
function ATV_sendEmail(to, subject, body) {
  // Could use GmailApp.sendEmail() for actual implementation

  ATV_logInfo('ATV_sendEmail', `Email stub: ${to}`, subject);

  return {
    success: true,
    message: 'Email stub - not yet implemented'
  };
}

/**
 * Stub: Sends push notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Object} Result
 */
function ATV_sendPushNotification(title, body) {
  // TODO: Implement push notifications
  // Examples: Pushover, Pushbullet, etc.

  ATV_logInfo('ATV_sendPushNotification', `Push stub: ${title}`, body.substring(0, 50));

  return {
    success: true,
    message: 'Push notification stub - not yet implemented'
  };
}

/**
 * Notifies about a HOT deal
 * @param {Object} deal - Deal object
 * @returns {Object} Result
 */
function ATV_notifyHotDeal(deal) {
  const message = `HOT DEAL: ${deal['Title']} - ${ATV_formatCurrency(deal['Expected Profit'])} profit potential`;

  // In production, would send via configured channel
  ATV_logInfo('ATV_notifyHotDeal', message);

  return ATV_sendPushNotification('🔥 HOT ATV Deal', message);
}

// ============================================================================
// SYNC EVENT LOGGING
// ============================================================================

/**
 * Logs a sync event to CRM_INTEGRATION sheet
 * @param {string} direction - IN or OUT
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Internal entity ID
 * @param {string} externalSystem - Name of external system
 * @param {string} externalId - External system ID
 * @param {string} status - Sync status
 * @param {Object} payload - Sync payload
 * @param {string} error - Error message if any
 */
function ATV_logSyncEvent(direction, entityType, entityId, externalSystem, externalId, status, payload, error) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.CRM_INTEGRATION);

    if (!sheet) return;

    const syncId = 'SYN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const row = [
      syncId,
      new Date(),
      direction,
      entityType,
      entityId || '',
      externalSystem,
      externalId || '',
      status,
      payload ? JSON.stringify(payload) : '',
      '', // Response
      error || ''
    ];

    sheet.appendRow(row);

  } catch (e) {
    console.error('Failed to log sync event: ' + e.message);
  }
}

// ============================================================================
// WEBHOOK STUBS
// ============================================================================

/**
 * Stub: Handles incoming webhook from external system
 * @param {Object} e - Event object
 * @returns {Object} Response
 */
function ATV_handleWebhook(e) {
  // TODO: Implement webhook handler
  // Would be deployed as web app

  const payload = e.postData ? JSON.parse(e.postData.contents) : {};

  ATV_logSyncEvent('IN', 'Webhook', null, 'External', null, 'received', payload, null);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'received' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Stub: Sends webhook to external system
 * @param {string} url - Webhook URL
 * @param {Object} payload - Data to send
 * @returns {Object} Result
 */
function ATV_sendWebhook(url, payload) {
  // TODO: Implement actual webhook sending
  // Would use UrlFetchApp.fetch()

  ATV_logInfo('ATV_sendWebhook', `Webhook stub: ${url}`);

  return {
    success: true,
    message: 'Webhook stub - not yet implemented'
  };
}

// ============================================================================
// MARKETPLACE API STUBS
// ============================================================================

/**
 * Stub: Posts listing to Facebook Marketplace
 * @param {string} atvId - ATV ID to list
 * @returns {Object} Result
 */
function ATV_postToFacebookMarketplace(atvId) {
  // Note: FB Marketplace API is limited; typically requires manual posting

  ATV_logInfo('ATV_postToFacebookMarketplace', `FB Marketplace stub for ${atvId}`);

  return {
    success: true,
    message: 'Facebook Marketplace posting stub - manual posting required'
  };
}

/**
 * Stub: Posts listing to Craigslist
 * @param {string} atvId - ATV ID to list
 * @returns {Object} Result
 */
function ATV_postToCraigslist(atvId) {
  // Note: CL doesn't have API; would need automation tool

  ATV_logInfo('ATV_postToCraigslist', `Craigslist stub for ${atvId}`);

  return {
    success: true,
    message: 'Craigslist posting stub - manual posting required'
  };
}

/**
 * Stub: Creates eBay listing
 * @param {string} atvId - ATV ID to list
 * @returns {Object} Result
 */
function ATV_postToEbay(atvId) {
  // TODO: Implement eBay API integration

  ATV_logInfo('ATV_postToEbay', `eBay stub for ${atvId}`);

  return {
    success: true,
    message: 'eBay listing stub - not yet implemented'
  };
}

// ============================================================================
// INTEGRATION CONFIGURATION
// ============================================================================

/**
 * Gets integration configuration (stored in settings)
 * @returns {Object} Integration config
 */
function ATV_getIntegrationConfig() {
  const settings = ATV_loadSettings();

  return {
    crmEnabled: settings.CRM_ENABLED || false,
    crmType: settings.CRM_TYPE || '',
    crmApiKey: settings.CRM_API_KEY || '',
    smsEnabled: settings.SMS_ENABLED || false,
    smsProvider: settings.SMS_PROVIDER || '',
    smsApiKey: settings.SMS_API_KEY || '',
    webhookUrl: settings.WEBHOOK_URL || '',
    notifyOnHotDeals: settings.NOTIFY_HOT_DEALS || true
  };
}

/**
 * Tests CRM connection
 * @returns {Object} Test result
 */
function ATV_testCRMConnection() {
  const config = ATV_getIntegrationConfig();

  if (!config.crmEnabled) {
    return { success: false, message: 'CRM integration not enabled' };
  }

  // TODO: Implement actual connection test

  return {
    success: true,
    message: 'CRM connection test stub - not yet implemented'
  };
}

/**
 * Tests SMS connection
 * @returns {Object} Test result
 */
function ATV_testSMSConnection() {
  const config = ATV_getIntegrationConfig();

  if (!config.smsEnabled) {
    return { success: false, message: 'SMS integration not enabled' };
  }

  // TODO: Implement actual connection test

  return {
    success: true,
    message: 'SMS connection test stub - not yet implemented'
  };
}
