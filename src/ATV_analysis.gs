/**
 * ===== FILE: ATV_analysis.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Analysis and scoring functions:
 * - Risk score calculation
 * - Deal class assignment (HOT/SOLID/MARGINAL/PASS)
 * - Sales velocity scoring
 * - Lead score calculation
 * - Deal score (composite)
 * - Full analysis orchestrator
 */

// ============================================================================
// MAIN ANALYSIS ORCHESTRATOR
// ============================================================================

/**
 * Runs the full analysis pipeline
 */
function ATV_runFullAnalysis() {
  try {
    ATV_logInfo('ATV_runFullAnalysis', 'Starting full analysis pipeline...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast('Running full analysis...', 'Analysis', -1);

    // Step 1: Import sync (if any new data)
    ATV_runFullSync();

    // Step 2: Condition analysis
    ATV_runConditionAnalysis();

    // Step 3: MAO calculations
    ATV_runMaoCalculations();

    // Step 4: Risk and deal scoring
    ATV_runDealScoring();

    // Step 5: Rebuild verdict
    ATV_rebuildVerdict();

    // Step 6: Update dashboard
    ATV_updateDashboard();

    ss.toast('Full analysis complete!', 'Analysis', 5);
    ATV_logInfo('ATV_runFullAnalysis', 'Full analysis pipeline completed');

  } catch (e) {
    ATV_logError('ATV_runFullAnalysis', 'Analysis pipeline failed', e.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + e.message, 'Analysis Failed', 5);
    throw e;
  }
}

/**
 * Runs deal scoring (risk, velocity, lead score, deal class)
 */
function ATV_runDealScoring() {
  try {
    ATV_logInfo('ATV_runDealScoring', 'Starting deal scoring...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);

    if (!sheet || sheet.getLastRow() <= 1) {
      ATV_logWarn('ATV_runDealScoring', 'No data to score');
      return;
    }

    const settings = ATV_loadSettings();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const headerMap = {};
    headers.forEach((h, i) => headerMap[h] = i);

    let updated = 0;

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Get fields for scoring
      const conditionScore = row[headerMap['Condition Score']] || 50;
      const runningStatus = row[headerMap['Running Status']] || 'Unknown';
      const hazardFlags = row[headerMap['Hazard Flags']] || '';
      const distance = row[headerMap['Distance (mi)']] || 0;
      const platform = row[headerMap['Platform']] || 'Other';
      const category = row[headerMap['Category']] || 'Other';
      const askingPrice = ATV_cleanPrice(row[headerMap['Asking Price']]);
      const offerTarget = row[headerMap['Offer Target']] || 0;
      const expectedProfit = row[headerMap['Expected Profit']] || 0;
      const profitMargin = row[headerMap['Profit Margin %']] || 0;
      const capitalTier = row[headerMap['Capital Tier']] || 'T3 Mid';

      // Calculate risk score
      const riskScore = ATV_calculateRiskScore(conditionScore, runningStatus, hazardFlags, distance);
      row[headerMap['Risk Score']] = riskScore;

      // Calculate location risk
      const locationRisk = ATV_calculateLocationRisk(distance, settings);
      row[headerMap['Location Risk']] = locationRisk;

      // Get platform velocity
      const velocityResult = ATV_getPlatformVelocity(platform, category);
      row[headerMap['Platform Velocity Score']] = velocityResult.score;
      row[headerMap['Sales Velocity Tier']] = velocityResult.tier;

      // Calculate lead score
      const leadScore = ATV_calculateLeadScore(
        conditionScore, expectedProfit, profitMargin, riskScore,
        velocityResult.score, askingPrice, offerTarget
      );
      row[headerMap['Lead Score']] = leadScore;

      // Determine deal class
      const dealClass = ATV_determineDealClass(leadScore, riskScore, expectedProfit, profitMargin, settings);
      row[headerMap['Deal Class']] = dealClass;

      // Update timestamp
      row[headerMap['Last Updated']] = new Date();

      updated++;
    }

    // Write updated data back
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    ATV_logInfo('ATV_runDealScoring', `Deal scoring completed`, `Updated ${updated} records`);
    return updated;

  } catch (e) {
    ATV_logError('ATV_runDealScoring', 'Deal scoring failed', e.message);
    throw e;
  }
}

// ============================================================================
// RISK SCORING
// ============================================================================

/**
 * Calculates risk score (0-100, higher = riskier)
 * @param {number} conditionScore - Condition score
 * @param {string} runningStatus - Running status
 * @param {string} hazardFlags - Hazard flags string
 * @param {number} distance - Distance in miles
 * @returns {number} Risk score
 */
function ATV_calculateRiskScore(conditionScore, runningStatus, hazardFlags, distance) {
  let risk = 0;

  // Inverse of condition (poor condition = higher risk)
  risk += (100 - conditionScore) * 0.3;

  // Running status risk
  const statusRisk = {
    'Runs Great': 0,
    'Runs': 5,
    'Runs Rough': 20,
    'Not Running': 35,
    'Roller': 45,
    'Frame Only': 55,
    'Unknown': 30
  };
  risk += statusRisk[runningStatus] || 25;

  // Hazard flag risks
  if (hazardFlags.includes('NO_TITLE')) risk += 15;
  if (hazardFlags.includes('BLOWN_MOTOR')) risk += 20;
  if (hazardFlags.includes('FRAME_DAMAGE')) risk += 25;
  if (hazardFlags.includes('PARTS_MISSING')) risk += 10;
  if (hazardFlags.includes('UNKNOWN_HISTORY')) risk += 10;
  if (hazardFlags.includes('FLOOD_DAMAGE')) risk += 20;
  if (hazardFlags.includes('SALVAGE')) risk += 15;
  if (hazardFlags.includes('STOLEN_RISK')) risk += 30;
  if (hazardFlags.includes('LIEN_RISK')) risk += 20;

  // Distance risk
  if (distance > 200) risk += 15;
  else if (distance > 100) risk += 10;
  else if (distance > 50) risk += 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(risk)));
}

/**
 * Calculates location risk category
 * @param {number} distance - Distance in miles
 * @param {Object} settings - Settings
 * @returns {string} Location risk level
 */
function ATV_calculateLocationRisk(distance, settings) {
  const local = settings.DISTANCE_LOCAL || 25;
  const regional = settings.DISTANCE_REGIONAL || 100;
  const far = settings.DISTANCE_FAR || 250;

  if (distance <= local) return 'Local';
  if (distance <= regional) return 'Regional';
  if (distance <= far) return 'Far';
  return 'Very Far';
}

// ============================================================================
// SALES VELOCITY
// ============================================================================

/**
 * Gets platform velocity score and tier
 * @param {string} platform - Platform name
 * @param {string} category - Vehicle category
 * @returns {Object} Velocity score and tier
 */
function ATV_getPlatformVelocity(platform, category) {
  // Try to get from velocity sheet first
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const velocitySheet = ss.getSheetByName(ATV_SHEETS.SALES_VELOCITY);

  if (velocitySheet && velocitySheet.getLastRow() > 1) {
    const data = velocitySheet.getDataRange().getValues();
    const headers = data[0];
    const catIdx = headers.indexOf('Category');
    const platIdx = headers.indexOf('Platform');
    const scoreIdx = headers.indexOf('Velocity Score');
    const tierIdx = headers.indexOf('Velocity Tier');

    for (let i = 1; i < data.length; i++) {
      if (data[i][catIdx] === category && data[i][platIdx] === platform) {
        return {
          score: data[i][scoreIdx] || 50,
          tier: data[i][tierIdx] || 'B - Normal'
        };
      }
    }
  }

  // Fall back to default platform velocities
  const settings = ATV_loadSettings();
  let score;

  switch (platform) {
    case 'Facebook':
      score = settings.VELOCITY_FB || 80;
      break;
    case 'eBay':
      score = settings.VELOCITY_EBAY || 70;
      break;
    case 'Craigslist':
      score = settings.VELOCITY_CL || 60;
      break;
    case 'OfferUp':
      score = settings.VELOCITY_OU || 55;
      break;
    default:
      score = settings.VELOCITY_OTHER || 50;
  }

  // Category adjustments
  if (category === 'Sport ATV' || category === 'Dirt Bike') score += 10;
  if (category === 'Youth ATV') score += 15;
  if (category === 'Side-by-Side') score -= 10;

  score = Math.max(0, Math.min(100, score));

  // Determine tier
  let tier;
  if (score >= 80) tier = 'A - Very Fast';
  else if (score >= 60) tier = 'B - Normal';
  else if (score >= 40) tier = 'C - Slow';
  else tier = 'D - Very Slow';

  return { score, tier };
}

// ============================================================================
// LEAD SCORING
// ============================================================================

/**
 * Calculates composite lead score
 * @param {number} conditionScore - Condition score
 * @param {number} expectedProfit - Expected profit
 * @param {number} profitMargin - Profit margin
 * @param {number} riskScore - Risk score
 * @param {number} velocityScore - Velocity score
 * @param {number} askingPrice - Asking price
 * @param {number} offerTarget - Offer target
 * @returns {number} Lead score (0-100)
 */
function ATV_calculateLeadScore(conditionScore, expectedProfit, profitMargin, riskScore, velocityScore, askingPrice, offerTarget) {
  let score = 50;

  // Profit contribution (40% weight)
  // More profit = higher score
  if (expectedProfit >= 1500) score += 25;
  else if (expectedProfit >= 1000) score += 20;
  else if (expectedProfit >= 500) score += 12;
  else if (expectedProfit >= 300) score += 5;
  else if (expectedProfit < 0) score -= 20;

  // Margin contribution (15% weight)
  if (profitMargin >= 0.40) score += 10;
  else if (profitMargin >= 0.30) score += 7;
  else if (profitMargin >= 0.20) score += 3;
  else if (profitMargin < 0.10) score -= 5;

  // Risk adjustment (20% weight)
  // Lower risk = higher score
  score -= riskScore * 0.3;

  // Velocity bonus (15% weight)
  score += (velocityScore - 50) * 0.2;

  // Price negotiation room (10% weight)
  // If asking is much higher than offer target, room to negotiate
  if (askingPrice > 0 && offerTarget > 0) {
    const discount = (askingPrice - offerTarget) / askingPrice;
    if (discount >= 0.30) score += 5;
    else if (discount < 0.10) score -= 5;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// DEAL CLASSIFICATION
// ============================================================================

/**
 * Determines deal class based on scores
 * @param {number} leadScore - Lead score
 * @param {number} riskScore - Risk score
 * @param {number} expectedProfit - Expected profit
 * @param {number} profitMargin - Profit margin
 * @param {Object} settings - Settings
 * @returns {string} Deal class
 */
function ATV_determineDealClass(leadScore, riskScore, expectedProfit, profitMargin, settings) {
  const hotMin = settings.DEAL_HOT_MIN || 80;
  const solidMin = settings.DEAL_SOLID_MIN || 60;
  const marginalMin = settings.DEAL_MARGINAL_MIN || 40;

  // Primary classification by lead score
  if (leadScore >= hotMin) {
    // But verify it's actually hot
    if (riskScore > 60 || expectedProfit < 200 || profitMargin < 0.15) {
      return 'SOLID'; // Downgrade if too risky or low profit
    }
    return 'HOT';
  }

  if (leadScore >= solidMin) {
    // Verify it's solidœ
    if (riskScore > 70 || expectedProfit < 100) {
      return 'MARGINAL';
    }
    return 'SOLID';
  }

  if (leadScore >= marginalMin) {
    return 'MARGINAL';
  }

  return 'PASS';
}

/**
 * Gets recommended action based on deal class and other factors
 * @param {string} dealClass - Deal class
 * @param {number} distance - Distance in miles
 * @param {number} expectedProfit - Expected profit
 * @returns {string} Recommended action
 */
function ATV_getRecommendedAction(dealClass, distance, expectedProfit) {
  if (dealClass === 'PASS') return 'PASS';

  if (dealClass === 'HOT') {
    if (distance <= 50 && expectedProfit >= 500) return 'CALL NOW';
    if (distance <= 100) return 'CALL NOW';
    return 'TEXT';
  }

  if (dealClass === 'SOLID') {
    if (distance <= 75) return 'TEXT';
    return 'MAKE OFFER';
  }

  if (dealClass === 'MARGINAL') {
    if (expectedProfit >= 300) return 'MONITOR';
    return 'PASS';
  }

  return 'MONITOR';
}

// ============================================================================
// LEAD SCORE SHEET POPULATION
// ============================================================================

/**
 * Populates the LEAD_SCORE sheet with score breakdowns
 */
function ATV_populateLeadScoreSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
  const leadSheet = ss.getSheetByName(ATV_SHEETS.LEAD_SCORE);

  if (!masterSheet || !leadSheet) {
    ATV_logError('ATV_populateLeadScoreSheet', 'Required sheets not found');
    return;
  }

  // Clear existing data
  if (leadSheet.getLastRow() > 1) {
    leadSheet.getRange(2, 1, leadSheet.getLastRow() - 1, leadSheet.getLastColumn()).clearContent();
  }

  const masterData = ATV_getSheetDataAsObjects(ATV_SHEETS.MASTER_DB);
  const leadRows = [];

  masterData.forEach(record => {
    const conditionScore = record['Condition Score'] || 50;
    const expectedProfit = record['Expected Profit'] || 0;
    const profitMargin = record['Profit Margin %'] || 0;
    const riskScore = record['Risk Score'] || 50;
    const velocityScore = record['Platform Velocity Score'] || 50;

    // Calculate factors for breakdown
    const conditionFactor = conditionScore * 0.2;
    const priceFactor = expectedProfit > 0 ? Math.min(30, expectedProfit / 50) : 0;
    const velocityFactor = (velocityScore - 50) * 0.2;
    const riskAdjustment = -riskScore * 0.3;

    const breakdown = `Condition: ${conditionFactor.toFixed(1)}, Price: ${priceFactor.toFixed(1)}, ` +
                      `Velocity: ${velocityFactor.toFixed(1)}, Risk: ${riskAdjustment.toFixed(1)}`;

    leadRows.push([
      record['ATV ID'],
      record['Title (Normalized)'],
      50, // Base score
      conditionFactor,
      priceFactor,
      velocityFactor,
      riskAdjustment,
      record['Lead Score'],
      breakdown,
      new Date()
    ]);
  });

  if (leadRows.length > 0) {
    leadSheet.getRange(2, 1, leadRows.length, leadRows[0].length).setValues(leadRows);
  }

  ATV_logInfo('ATV_populateLeadScoreSheet', `Lead Score sheet populated`, `${leadRows.length} records`);
}

// ============================================================================
// HOT BUILD POTENTIAL DETECTION
// ============================================================================

/**
 * Determines if an ATV has hot build potential
 * @param {string} make - Make
 * @param {string} model - Model
 * @param {string} category - Category
 * @param {string} runningStatus - Running status
 * @returns {boolean} Has hot build potential
 */
function ATV_hasHotBuildPotential(make, model, category, runningStatus) {
  // Hot build models
  const hotModels = ['Banshee', 'Raptor 700', 'Raptor 660', 'YFZ450', 'TRX450R', 'LTR450'];

  // Check if it's a desirable platform
  const isHotPlatform = hotModels.some(m => model.includes(m));

  // Projects on hot platforms have build potential
  if (isHotPlatform && (runningStatus === 'Not Running' || runningStatus === 'Roller')) {
    return true;
  }

  // Sport ATVs in general have build potential
  if (category === 'Sport ATV' && runningStatus !== 'Frame Only') {
    return true;
  }

  return false;
}

// ============================================================================
// USE CASE FIT DETECTION
// ============================================================================

/**
 * Determines use case fit
 * @param {string} category - Category
 * @param {string} model - Model
 * @param {string} mods - Mods string
 * @returns {string} Use case fit
 */
function ATV_determineUseCaseFit(category, model, mods) {
  const modsLower = (mods || '').toLowerCase();
  const modelLower = (model || '').toLowerCase();

  // Check for specific use cases
  if (modsLower.includes('paddle') || modsLower.includes('sand')) return 'Trail Riding';
  if (modsLower.includes('race') || modsLower.includes('mx') || modsLower.includes('track')) return 'Track/Race';
  if (category === 'Youth ATV') return 'Kids/Youth';
  if (category === 'Utility ATV') return 'Farm/Work';

  // Model-based detection
  if (modelLower.includes('banshee') || modelLower.includes('lt250r')) return 'Collector';
  if (category === 'Dirt Bike') return 'Track/Race';

  return 'General';
}
