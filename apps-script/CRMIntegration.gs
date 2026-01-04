/**
 * CRMIntegration.gs
 * CRM webhook integration for SMS-iT, OneHash, CompanyHub, etc.
 */

// ============================================================================
// CRM INTEGRATION
// ============================================================================

/**
 * Send hot deals to CRM
 * Only sends deals with Verdict = BUY
 *
 * @returns {number} Number of deals synced
 */
function sendCRMAlerts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);
  const crmSheet = ss.getSheetByName(SHEETS.CRM_INTEGRATION);

  if (!masterSheet || !crmSheet) {
    throw new Error('Required sheets not found');
  }

  // Get CRM settings
  const webhookUrl = crmSheet.getRange('K2').getValue();
  const apiKey = crmSheet.getRange('K3').getValue();
  const autoSync = crmSheet.getRange('K4').getValue();

  if (!webhookUrl) {
    throw new Error('CRM Webhook URL not configured. Set it in CRM_Integration sheet (K2).');
  }

  const masterData = masterSheet.getDataRange().getValues();
  const crmData = crmSheet.getDataRange().getValues();

  // Get already-synced Asset_IDs
  const syncedIds = new Set();
  for (let i = 1; i < crmData.length; i++) {
    if (crmData[i][0] && crmData[i][1]) {
      syncedIds.add(crmData[i][0]);
    }
  }

  let syncedCount = 0;
  const newSyncs = [];

  // Find BUY verdicts that haven't been synced
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const assetId = row[0];
    const verdict = row[14]; // Verdict column

    if (verdict === 'BUY' && !syncedIds.has(assetId)) {
      const deal = createDealObjectFromRow(row);
      const dealDetails = getDealDetailsForCRM(deal);

      try {
        // Send to CRM via webhook
        const response = sendToCRM(webhookUrl, apiKey, dealDetails);

        // Log successful sync
        newSyncs.push([
          assetId,
          true,
          response.dealId || '',
          'Auto',
          new Date(),
          'Sent',
          new Date(),
          response.message || 'Synced successfully'
        ]);

        syncedCount++;

      } catch (error) {
        // Log failed sync
        newSyncs.push([
          assetId,
          false,
          '',
          'Auto',
          new Date(),
          'Failed',
          new Date(),
          error.toString()
        ]);

        Logger.log(`Failed to sync ${assetId}: ${error}`);
      }
    }
  }

  // Append sync records
  if (newSyncs.length > 0) {
    const lastRow = crmSheet.getLastRow();
    crmSheet.getRange(lastRow + 1, 1, newSyncs.length, newSyncs[0].length)
      .setValues(newSyncs);
  }

  logActivity('sendCRMAlerts', `Synced ${syncedCount} deals to CRM`);
  return syncedCount;
}

/**
 * Send deal to CRM via webhook
 */
function sendToCRM(webhookUrl, apiKey, dealDetails) {
  const payload = {
    api_key: apiKey,
    deal: dealDetails,
    source: 'CarHawk ATV Analyzer',
    timestamp: new Date().toISOString()
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    const statusCode = response.getResponseCode();

    if (statusCode >= 200 && statusCode < 300) {
      const responseData = JSON.parse(response.getContentText());
      return {
        success: true,
        dealId: responseData.deal_id || responseData.id || '',
        message: responseData.message || 'Success'
      };
    } else {
      throw new Error(`HTTP ${statusCode}: ${response.getContentText()}`);
    }

  } catch (error) {
    throw new Error(`CRM sync failed: ${error.toString()}`);
  }
}

/**
 * Send SMS alert for hot deal (via SMS-iT)
 */
function sendSMSAlert(deal, phoneNumber) {
  const message = formatSMSMessage(deal);

  // This would integrate with SMS-iT or similar service
  // For now, just log it
  Logger.log(`SMS to ${phoneNumber}: ${message}`);

  // Example SMS-iT integration (replace with actual credentials)
  /*
  const smsUrl = 'https://your-sms-it-instance.com/api/sms/send';
  const smsPayload = {
    to: phoneNumber,
    message: message,
    from: 'CarHawk'
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(smsPayload)
  };

  UrlFetchApp.fetch(smsUrl, options);
  */

  return true;
}

/**
 * Format SMS message for hot deal
 */
function formatSMSMessage(deal) {
  return `🦅 HOT DEAL ALERT!\n\n` +
         `${deal.year} ${deal.make} ${deal.model}\n` +
         `💰 Ask: $${deal.askingPrice} | MAO: $${deal.mao}\n` +
         `📈 Profit: $${deal.profit} (${deal.roi}% ROI)\n` +
         `⚠️ Risk: ${getRiskLevel(deal.riskScore)}\n` +
         `📍 ${deal.location}\n\n` +
         `Action: Message seller now!\n` +
         `${deal.sourceUrl}`;
}

/**
 * Create deal in OneHash CRM
 */
function createOneHashDeal(deal) {
  // OneHash CRM integration example
  // Replace with your actual OneHash instance and credentials

  const oneHashUrl = 'https://your-instance.onehash.ai/api/resource/Deal';

  const dealData = {
    deal_name: `${deal.year} ${deal.make} ${deal.model}`,
    amount: deal.estimatedResale,
    status: 'Open',
    expected_closing: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    custom_asking_price: deal.askingPrice,
    custom_mao: deal.mao,
    custom_profit_potential: deal.profit,
    custom_risk_score: deal.riskScore,
    notes: deal.notes,
    source: deal.sourcePlatform
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'token YOUR_API_KEY:YOUR_API_SECRET'
    },
    'payload': JSON.stringify(dealData),
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(oneHashUrl, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log(`OneHash integration error: ${error}`);
    throw error;
  }
}

/**
 * Export deal to CompanyHub
 */
function exportToCompanyHub(deal) {
  // CompanyHub integration example
  // Replace with your actual CompanyHub credentials

  const companyHubUrl = 'https://api.companyhub.com/v1/deals';

  const dealData = {
    name: `${deal.year} ${deal.make} ${deal.model}`,
    value: deal.estimatedResale,
    stage: 'prospect',
    tags: ['atv', 'carhawk', deal.verdict.toLowerCase()],
    custom_fields: {
      asking_price: deal.askingPrice,
      mao: deal.mao,
      profit_potential: deal.profit,
      risk_score: deal.riskScore,
      condition: deal.condition
    }
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    'payload': JSON.stringify(dealData),
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(companyHubUrl, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log(`CompanyHub integration error: ${error}`);
    throw error;
  }
}

/**
 * Auto-sync on deal update (trigger)
 */
function onDealUpdate(e) {
  const autoSync = getConfigValue('CRM_Auto_Sync', false);

  if (!autoSync) return;

  // Check if verdict changed to BUY
  const range = e.range;
  const sheet = range.getSheet();

  if (sheet.getName() === SHEETS.MASTER_DATABASE) {
    const col = range.getColumn();
    const verdictCol = 15; // Verdict column

    if (col === verdictCol && range.getValue() === 'BUY') {
      // Auto-sync this specific deal
      const row = range.getRow();
      const assetId = sheet.getRange(row, 1).getValue();

      Logger.log(`Auto-syncing deal ${assetId} to CRM`);
      // Implement single-deal sync here
    }
  }
}

/**
 * Export deals to CSV for external CRM
 */
function exportDealsToCSV() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(SHEETS.VERDICT);

  if (!verdictSheet) {
    throw new Error('Verdict sheet not found');
  }

  const data = verdictSheet.getDataRange().getValues();
  let csv = '';

  data.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  // Save to Drive or return
  Logger.log('CSV Export:\n' + csv);

  return csv;
}
