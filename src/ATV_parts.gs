/**
 * ===== FILE: ATV_parts.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Parts and build management:
 * - Parts list management
 * - Build plan tracking
 * - Parts cost rollup
 * - Build progress tracking
 */

// ============================================================================
// PARTS MANAGEMENT
// ============================================================================

/**
 * Adds a part to the parts needed list
 * @param {string} atvId - ATV ID
 * @param {Object} partData - Part data object
 * @returns {Object} Result with success/error
 */
function ATV_addPart(atvId, partData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.PARTS_NEEDED);

    if (!sheet) {
      return { success: false, error: 'Parts sheet not found' };
    }

    const partId = ATV_generatePartId();
    const row = [
      partId,
      atvId,
      partData.buildName || '',
      partData.category || '',
      partData.description || '',
      partData.source || '',
      partData.cost || 0,
      partData.priority || 'Medium',
      'Needed',
      partData.notes || ''
    ];

    sheet.appendRow(row);
    ATV_logInfo('ATV_addPart', `Added part ${partId} for ATV ${atvId}`);

    return { success: true, partId: partId };

  } catch (e) {
    ATV_logError('ATV_addPart', 'Failed to add part', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Updates a part's status
 * @param {string} partId - Part ID
 * @param {string} newStatus - New status
 * @returns {Object} Result
 */
function ATV_updatePartStatus(partId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.PARTS_NEEDED);

    if (!sheet) return { success: false, error: 'Parts sheet not found' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('Part ID');
    const statusIdx = headers.indexOf('Status');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === partId) {
        sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
        ATV_logInfo('ATV_updatePartStatus', `Updated part ${partId} to ${newStatus}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Part not found' };

  } catch (e) {
    ATV_logError('ATV_updatePartStatus', 'Failed to update part', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gets all parts for an ATV
 * @param {string} atvId - ATV ID
 * @returns {Array} Array of part objects
 */
function ATV_getPartsForATV(atvId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ATV_SHEETS.PARTS_NEEDED);

  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const parts = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[headers.indexOf('ATV ID')] === atvId) {
      const part = {};
      headers.forEach((h, idx) => part[h] = row[idx]);
      parts.push(part);
    }
  }

  return parts;
}

/**
 * Calculates total parts cost for an ATV
 * @param {string} atvId - ATV ID
 * @returns {number} Total parts cost
 */
function ATV_getPartsCostForATV(atvId) {
  const parts = ATV_getPartsForATV(atvId);
  return parts.reduce((total, part) => {
    return total + (parseFloat(part['Estimated Cost']) || 0);
  }, 0);
}

/**
 * Gets parts summary by status for an ATV
 * @param {string} atvId - ATV ID
 * @returns {Object} Summary by status
 */
function ATV_getPartsSummary(atvId) {
  const parts = ATV_getPartsForATV(atvId);
  const summary = {
    total: parts.length,
    needed: 0,
    sourcing: 0,
    ordered: 0,
    received: 0,
    installed: 0,
    totalCost: 0,
    remainingCost: 0
  };

  parts.forEach(part => {
    const cost = parseFloat(part['Estimated Cost']) || 0;
    summary.totalCost += cost;

    switch (part['Status']) {
      case 'Needed':
        summary.needed++;
        summary.remainingCost += cost;
        break;
      case 'Sourcing':
        summary.sourcing++;
        summary.remainingCost += cost;
        break;
      case 'Ordered':
        summary.ordered++;
        break;
      case 'Received':
        summary.received++;
        break;
      case 'Installed':
        summary.installed++;
        break;
    }
  });

  return summary;
}

// ============================================================================
// BUILD PLAN MANAGEMENT
// ============================================================================

/**
 * Creates a new build plan
 * @param {Object} planData - Build plan data
 * @returns {Object} Result with plan ID
 */
function ATV_createBuildPlan(planData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.BUILD_PLANS);

    if (!sheet) {
      return { success: false, error: 'Build plans sheet not found' };
    }

    const planId = ATV_generateBuildId();
    const now = new Date();

    const row = [
      planId,
      planData.name || 'Unnamed Build',
      planData.category || 'Other',
      planData.description || '',
      planData.estimatedCost || 0,
      planData.targetPrice || 0,
      planData.expectedProfit || 0,
      planData.complexity || 'Medium',
      planData.timeEstimate || 7,
      planData.requiredSkills || '',
      planData.notes || '',
      now,
      now
    ];

    sheet.appendRow(row);
    ATV_logInfo('ATV_createBuildPlan', `Created build plan ${planId}: ${planData.name}`);

    return { success: true, planId: planId };

  } catch (e) {
    ATV_logError('ATV_createBuildPlan', 'Failed to create build plan', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gets all build plans
 * @returns {Array} Array of build plan objects
 */
function ATV_getBuildPlans() {
  return ATV_getSheetDataAsObjects(ATV_SHEETS.BUILD_PLANS);
}

/**
 * Gets a specific build plan
 * @param {string} planId - Build plan ID
 * @returns {Object} Build plan object or null
 */
function ATV_getBuildPlan(planId) {
  const result = ATV_findRowById(ATV_SHEETS.BUILD_PLANS, 'Build Plan ID', planId);
  return result ? result.data : null;
}

// ============================================================================
// PARTS COST ROLLUP
// ============================================================================

/**
 * Updates repair/parts costs in master DB based on parts list
 */
function ATV_rollupPartsCosts() {
  try {
    ATV_logInfo('ATV_rollupPartsCosts', 'Rolling up parts costs...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
    const partsSheet = ss.getSheetByName(ATV_SHEETS.PARTS_NEEDED);

    if (!masterSheet || !partsSheet) {
      ATV_logError('ATV_rollupPartsCosts', 'Required sheets not found');
      return;
    }

    // Build cost map by ATV ID
    const costMap = {};
    if (partsSheet.getLastRow() > 1) {
      const partsData = partsSheet.getDataRange().getValues();
      const partsHeaders = partsData[0];
      const atvIdIdx = partsHeaders.indexOf('ATV ID');
      const costIdx = partsHeaders.indexOf('Estimated Cost');

      for (let i = 1; i < partsData.length; i++) {
        const atvId = partsData[i][atvIdIdx];
        const cost = parseFloat(partsData[i][costIdx]) || 0;

        if (!costMap[atvId]) costMap[atvId] = 0;
        costMap[atvId] += cost;
      }
    }

    // Update master DB
    if (masterSheet.getLastRow() > 1) {
      const masterData = masterSheet.getDataRange().getValues();
      const masterHeaders = masterData[0];
      const masterHeaderMap = {};
      masterHeaders.forEach((h, i) => masterHeaderMap[h] = i);

      let updated = 0;

      for (let i = 1; i < masterData.length; i++) {
        const atvId = masterData[i][masterHeaderMap['ATV ID']];
        if (costMap[atvId]) {
          // Add parts cost to existing repair estimate
          const currentRepair = parseFloat(masterData[i][masterHeaderMap['Repair / Build Cost Estimate']]) || 0;
          // Only update if parts cost is higher
          if (costMap[atvId] > currentRepair) {
            masterData[i][masterHeaderMap['Repair / Build Cost Estimate']] = costMap[atvId];
            updated++;
          }
        }
      }

      if (updated > 0) {
        masterSheet.getRange(1, 1, masterData.length, masterData[0].length).setValues(masterData);
      }

      ATV_logInfo('ATV_rollupPartsCosts', `Updated ${updated} records with parts costs`);
    }

  } catch (e) {
    ATV_logError('ATV_rollupPartsCosts', 'Failed to rollup parts costs', e.message);
  }
}

// ============================================================================
// BUILD PROGRESS TRACKING
// ============================================================================

/**
 * Gets builds in progress (ATVs with parts in non-installed status)
 * @returns {Array} Array of build status objects
 */
function ATV_getBuildsInProgress() {
  const partsData = ATV_getSheetDataAsObjects(ATV_SHEETS.PARTS_NEEDED);

  // Group by ATV ID
  const buildMap = {};
  partsData.forEach(part => {
    const atvId = part['ATV ID'];
    if (!buildMap[atvId]) {
      buildMap[atvId] = {
        atvId: atvId,
        buildName: part['Build Name / Plan'],
        totalParts: 0,
        installed: 0,
        remaining: 0,
        totalCost: 0,
        remainingCost: 0
      };
    }

    const build = buildMap[atvId];
    const cost = parseFloat(part['Estimated Cost']) || 0;

    build.totalParts++;
    build.totalCost += cost;

    if (part['Status'] === 'Installed') {
      build.installed++;
    } else {
      build.remaining++;
      build.remainingCost += cost;
    }
  });

  // Filter to only in-progress builds
  const inProgress = Object.values(buildMap).filter(b => b.remaining > 0);

  // Sort by remaining parts (most work first)
  inProgress.sort((a, b) => b.remaining - a.remaining);

  return inProgress;
}

/**
 * Marks all parts for an ATV as installed
 * @param {string} atvId - ATV ID
 * @returns {Object} Result
 */
function ATV_markBuildComplete(atvId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.PARTS_NEEDED);

    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, error: 'No parts data' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const atvIdIdx = headers.indexOf('ATV ID');
    const statusIdx = headers.indexOf('Status');

    let updated = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][atvIdIdx] === atvId && data[i][statusIdx] !== 'Installed') {
        data[i][statusIdx] = 'Installed';
        updated++;
      }
    }

    if (updated > 0) {
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }

    ATV_logInfo('ATV_markBuildComplete', `Marked ${updated} parts as installed for ${atvId}`);
    return { success: true, updated: updated };

  } catch (e) {
    ATV_logError('ATV_markBuildComplete', 'Failed to mark build complete', e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// COMMON BUILD TEMPLATES
// ============================================================================

/**
 * Gets common parts for a build type
 * @param {string} buildType - Build type (e.g., "top end", "full rebuild")
 * @param {string} category - Vehicle category
 * @returns {Array} Array of part templates
 */
function ATV_getCommonParts(buildType, category) {
  const templates = {
    'top end': [
      { category: 'Engine', description: 'Piston kit', priority: 'Critical', cost: 150 },
      { category: 'Engine', description: 'Rings', priority: 'Critical', cost: 50 },
      { category: 'Engine', description: 'Gasket set', priority: 'Critical', cost: 40 },
      { category: 'Engine', description: 'Cylinder hone/bore', priority: 'High', cost: 100 }
    ],
    'full rebuild': [
      { category: 'Engine', description: 'Crank kit', priority: 'Critical', cost: 250 },
      { category: 'Engine', description: 'Piston kit', priority: 'Critical', cost: 150 },
      { category: 'Engine', description: 'Bearings', priority: 'Critical', cost: 100 },
      { category: 'Engine', description: 'Gasket set', priority: 'Critical', cost: 60 },
      { category: 'Engine', description: 'Seals', priority: 'High', cost: 30 }
    ],
    'cosmetic': [
      { category: 'Body', description: 'Plastics set', priority: 'High', cost: 200 },
      { category: 'Body', description: 'Graphics kit', priority: 'Medium', cost: 80 },
      { category: 'Body', description: 'Seat cover', priority: 'Low', cost: 40 }
    ],
    'maintenance': [
      { category: 'Consumables', description: 'Oil & filter', priority: 'High', cost: 30 },
      { category: 'Consumables', description: 'Air filter', priority: 'High', cost: 25 },
      { category: 'Consumables', description: 'Spark plug', priority: 'Medium', cost: 10 },
      { category: 'Brakes', description: 'Brake pads', priority: 'Medium', cost: 40 }
    ]
  };

  return templates[buildType] || [];
}

/**
 * Adds common parts for a build type to an ATV
 * @param {string} atvId - ATV ID
 * @param {string} buildType - Build type
 * @param {string} buildName - Build name
 * @returns {Object} Result with count
 */
function ATV_addCommonParts(atvId, buildType, buildName) {
  const parts = ATV_getCommonParts(buildType, '');
  let added = 0;

  parts.forEach(part => {
    const result = ATV_addPart(atvId, {
      buildName: buildName,
      category: part.category,
      description: part.description,
      source: '',
      cost: part.cost,
      priority: part.priority,
      notes: `From ${buildType} template`
    });

    if (result.success) added++;
  });

  return { success: true, added: added };
}
