/**
 * ===== FILE: ATV_mao.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * MAO (Maximum Allowable Offer) and flip math:
 * - Retail value estimation
 * - Repair cost estimation
 * - MAO calculation
 * - Offer target generation
 * - Profit and margin calculations
 * - Capital tier classification
 */

// ============================================================================
// MAIN MAO CALCULATION
// ============================================================================

/**
 * Runs MAO calculations on all records in master DB
 */
function ATV_runMaoCalculations() {
  try {
    ATV_logInfo('ATV_runMaoCalculations', 'Starting MAO calculations...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);

    if (!sheet || sheet.getLastRow() <= 1) {
      ATV_logWarn('ATV_runMaoCalculations', 'No data to calculate');
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

      // Get required fields
      const askingPrice = ATV_cleanPrice(row[headerMap['Asking Price']]);
      const conditionScore = row[headerMap['Condition Score']] || 50;
      const runningStatus = row[headerMap['Running Status']] || 'Unknown';
      const category = row[headerMap['Category']] || 'Other';
      const make = row[headerMap['Make']] || '';
      const model = row[headerMap['Model']] || '';
      const year = row[headerMap['Year']] || 0;
      const engineCC = row[headerMap['Engine Size (cc)']] || 0;
      const hazardFlags = row[headerMap['Hazard Flags']] || '';

      // Estimate retail value
      const retailValue = ATV_estimateRetailValue(make, model, year, engineCC, conditionScore, category);
      row[headerMap['Estimated Retail Value']] = retailValue;

      // Estimate project/as-is value
      const projectValue = ATV_estimateProjectValue(retailValue, conditionScore, runningStatus);
      row[headerMap['Estimated Project Value']] = projectValue;

      // Estimate repair costs
      const repairCost = ATV_estimateRepairCost(conditionScore, runningStatus, hazardFlags, category);
      row[headerMap['Repair / Build Cost Estimate']] = repairCost;

      // Calculate MAO
      const maoResult = ATV_calculateMAO(retailValue, repairCost, runningStatus, settings);
      row[headerMap['MAO']] = maoResult.mao;

      // Calculate offer target
      const offerTarget = ATV_calculateOfferTarget(maoResult.mao, settings);
      row[headerMap['Offer Target']] = offerTarget;

      // Calculate total all-in cost (using offer target as expected purchase)
      const totalCost = offerTarget + repairCost;
      row[headerMap['Total All-In Cost']] = totalCost;

      // Calculate expected profit and margin
      const expectedProfit = retailValue - totalCost;
      const profitMargin = retailValue > 0 ? expectedProfit / retailValue : 0;
      row[headerMap['Expected Profit']] = expectedProfit;
      row[headerMap['Profit Margin %']] = profitMargin;

      // Determine capital tier
      const capitalTier = ATV_determineCapitalTier(totalCost, settings);
      row[headerMap['Capital Tier']] = capitalTier;

      // Update timestamp
      row[headerMap['Last Updated']] = new Date();

      updated++;
    }

    // Write updated data back
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    ATV_logInfo('ATV_runMaoCalculations', `MAO calculations completed`, `Updated ${updated} records`);
    return updated;

  } catch (e) {
    ATV_logError('ATV_runMaoCalculations', 'MAO calculations failed', e.message);
    throw e;
  }
}

// ============================================================================
// VALUE ESTIMATION
// ============================================================================

/**
 * Estimates retail value (ready-to-ride)
 * @param {string} make - Make
 * @param {string} model - Model
 * @param {number} year - Year
 * @param {number} engineCC - Engine size
 * @param {number} conditionScore - Condition score
 * @param {string} category - Category
 * @returns {number} Estimated retail value
 */
function ATV_estimateRetailValue(make, model, year, engineCC, conditionScore, category) {
  // Base value calculation using category and engine size
  let baseValue = ATV_getBaseValue(category, engineCC);

  // Apply make/model multipliers
  const makeMultiplier = ATV_getMakeMultiplier(make, model);
  baseValue *= makeMultiplier;

  // Age depreciation (approximate)
  const currentYear = new Date().getFullYear();
  const age = year > 0 ? currentYear - year : 15;
  let ageMultiplier = 1;

  if (age <= 2) ageMultiplier = 1.0;
  else if (age <= 5) ageMultiplier = 0.85;
  else if (age <= 10) ageMultiplier = 0.70;
  else if (age <= 15) ageMultiplier = 0.55;
  else if (age <= 20) ageMultiplier = 0.45;
  else ageMultiplier = 0.35;

  baseValue *= ageMultiplier;

  // Condition adjustment (assuming this is "ready to ride" value)
  // Only slight adjustment since this is target retail
  const conditionMultiplier = 0.8 + (conditionScore / 100) * 0.4;
  baseValue *= conditionMultiplier;

  return Math.round(baseValue);
}

/**
 * Gets base value by category and engine size
 * @param {string} category - Vehicle category
 * @param {number} engineCC - Engine size
 * @returns {number} Base value
 */
function ATV_getBaseValue(category, engineCC) {
  const values = {
    'Sport ATV': {
      small: 1800,   // Under 250cc
      medium: 3500,  // 250-400cc
      large: 5500,   // 400-500cc
      xlarge: 7000   // 500cc+
    },
    'Utility ATV': {
      small: 2000,
      medium: 3500,
      large: 5000,
      xlarge: 7000
    },
    'Youth ATV': {
      small: 800,
      medium: 1200,
      large: 1800,
      xlarge: 2500
    },
    'Dirt Bike': {
      small: 1500,
      medium: 3000,
      large: 5000,
      xlarge: 7000
    },
    'Side-by-Side': {
      small: 5000,
      medium: 8000,
      large: 12000,
      xlarge: 18000
    },
    'Other': {
      small: 1000,
      medium: 2000,
      large: 3500,
      xlarge: 5000
    }
  };

  const categoryValues = values[category] || values['Other'];

  if (engineCC <= 150) return categoryValues.small;
  if (engineCC <= 350) return categoryValues.medium;
  if (engineCC <= 500) return categoryValues.large;
  return categoryValues.xlarge;
}

/**
 * Gets make/model value multiplier
 * @param {string} make - Make
 * @param {string} model - Model
 * @returns {number} Multiplier
 */
function ATV_getMakeMultiplier(make, model) {
  // Premium makes
  const premiumMakes = ['Honda', 'Yamaha', 'KTM', 'Husqvarna'];
  const midMakes = ['Suzuki', 'Kawasaki', 'Polaris', 'Can-Am'];
  const budgetMakes = ['Arctic Cat', 'CFMoto', 'Kymco'];

  // Special high-value models
  const premiumModels = ['Banshee', 'Raptor 700', 'YFZ450', 'TRX450R', 'LTR450', 'KFX450R'];
  const collectorModels = ['Banshee', 'Tecate', 'LT250R', 'TRX250R'];

  let multiplier = 1.0;

  // Make adjustment
  if (premiumMakes.includes(make)) multiplier *= 1.15;
  else if (budgetMakes.includes(make)) multiplier *= 0.85;

  // Model adjustment
  if (premiumModels.some(m => model.includes(m))) multiplier *= 1.2;
  if (collectorModels.some(m => model.includes(m))) multiplier *= 1.3;

  return multiplier;
}

/**
 * Estimates project/as-is value
 * @param {number} retailValue - Ready-to-ride value
 * @param {number} conditionScore - Condition score
 * @param {string} runningStatus - Running status
 * @returns {number} Project value
 */
function ATV_estimateProjectValue(retailValue, conditionScore, runningStatus) {
  let multiplier = 0.5;

  // Adjust based on running status
  if (runningStatus === 'Runs Great' || runningStatus === 'Runs') {
    multiplier = 0.7 + (conditionScore / 100) * 0.2;
  } else if (runningStatus === 'Runs Rough') {
    multiplier = 0.5 + (conditionScore / 100) * 0.15;
  } else if (runningStatus === 'Not Running') {
    multiplier = 0.3 + (conditionScore / 100) * 0.1;
  } else if (runningStatus === 'Roller') {
    multiplier = 0.2;
  } else if (runningStatus === 'Frame Only') {
    multiplier = 0.1;
  }

  return Math.round(retailValue * multiplier);
}

// ============================================================================
// REPAIR COST ESTIMATION
// ============================================================================

/**
 * Estimates repair/build costs
 * @param {number} conditionScore - Condition score
 * @param {string} runningStatus - Running status
 * @param {string} hazardFlags - Hazard flags string
 * @param {string} category - Vehicle category
 * @returns {number} Estimated repair cost
 */
function ATV_estimateRepairCost(conditionScore, runningStatus, hazardFlags, category) {
  let cost = 0;

  // Base cost by running status
  if (runningStatus === 'Runs Great') {
    cost = 50; // Minor cleanup
  } else if (runningStatus === 'Runs') {
    cost = 150; // Tune and service
  } else if (runningStatus === 'Runs Rough') {
    cost = 300; // Carb work, tune, possible parts
  } else if (runningStatus === 'Not Running') {
    cost = 600; // Diagnosis and repair
  } else if (runningStatus === 'Roller') {
    cost = 1200; // Need entire engine
  } else if (runningStatus === 'Frame Only') {
    cost = 1800; // Full build
  } else {
    cost = 400; // Unknown - assume some work
  }

  // Adjust for condition score
  // Lower condition = higher repair cost
  const conditionAdjustment = (100 - conditionScore) * 5;
  cost += conditionAdjustment;

  // Add for specific hazards
  if (hazardFlags.includes('BLOWN_MOTOR')) cost += 800;
  if (hazardFlags.includes('FRAME_DAMAGE')) cost += 500;
  if (hazardFlags.includes('PARTS_MISSING')) cost += 300;
  if (hazardFlags.includes('FLOOD_DAMAGE')) cost += 400;
  if (hazardFlags.includes('NO_TITLE')) cost += 200; // Bonded title

  // Category adjustment
  if (category === 'Side-by-Side') cost *= 1.5;
  if (category === 'Youth ATV') cost *= 0.6;

  return Math.round(cost);
}

// ============================================================================
// MAO CALCULATION
// ============================================================================

/**
 * Calculates Maximum Allowable Offer
 * @param {number} retailValue - Estimated retail value
 * @param {number} repairCost - Estimated repair cost
 * @param {string} runningStatus - Running status
 * @param {Object} settings - Settings object
 * @returns {Object} MAO result with breakdown
 */
function ATV_calculateMAO(retailValue, repairCost, runningStatus, settings) {
  // Determine MAO percentage based on running status
  let maoPercent;
  if (runningStatus === 'Runs Great' || runningStatus === 'Runs') {
    maoPercent = settings.MAO_PCT_RUNNER || 0.65;
  } else if (runningStatus === 'Frame Only' || runningStatus === 'Roller') {
    maoPercent = settings.MAO_PCT_FRAME || 0.25;
  } else {
    maoPercent = settings.MAO_PCT_PROJECT || 0.45;
  }

  // Calculate base MAO
  let mao = retailValue * maoPercent;

  // Subtract repair costs
  mao -= repairCost;

  // Ensure minimum profit
  const minProfit = settings.MIN_PROFIT_AMOUNT || 300;
  const minMargin = settings.MIN_PROFIT_MARGIN || 0.25;

  // Check if MAO provides minimum profit
  const profitAtMao = retailValue - mao - repairCost;
  if (profitAtMao < minProfit) {
    mao = retailValue - repairCost - minProfit;
  }

  // Check margin
  const marginAtMao = (retailValue - mao - repairCost) / retailValue;
  if (marginAtMao < minMargin) {
    mao = retailValue * (1 - minMargin) - repairCost;
  }

  // Don't let MAO go negative
  mao = Math.max(0, Math.round(mao));

  return {
    mao: mao,
    maoPercent: maoPercent,
    repairCost: repairCost,
    retailValue: retailValue
  };
}

/**
 * Calculates offer target (MAO minus negotiation cushion)
 * @param {number} mao - Maximum allowable offer
 * @param {Object} settings - Settings object
 * @returns {number} Offer target
 */
function ATV_calculateOfferTarget(mao, settings) {
  const cushion = settings.NEGOTIATION_CUSHION_PCT || 0.10;
  const offerTarget = mao * (1 - cushion);
  return Math.round(offerTarget);
}

// ============================================================================
// CAPITAL TIER CLASSIFICATION
// ============================================================================

/**
 * Determines capital tier based on total investment
 * @param {number} totalCost - Total all-in cost
 * @param {Object} settings - Settings object
 * @returns {string} Capital tier
 */
function ATV_determineCapitalTier(totalCost, settings) {
  const t1Max = settings.TIER_T1_MAX || 500;
  const t2Max = settings.TIER_T2_MAX || 1500;
  const t3Max = settings.TIER_T3_MAX || 3500;

  if (totalCost <= t1Max) return 'T1 Micro';
  if (totalCost <= t2Max) return 'T2 Budget';
  if (totalCost <= t3Max) return 'T3 Mid';
  return 'T4 High';
}

// ============================================================================
// SINGLE RECORD MAO CALCULATION
// ============================================================================

/**
 * Calculates MAO for a single ATV by ID
 * @param {string} atvId - ATV ID
 * @returns {Object} MAO calculation results
 */
function ATV_calculateMaoForATV(atvId) {
  const record = ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId);

  if (!record) {
    return { error: 'ATV not found' };
  }

  const settings = ATV_loadSettings();
  const data = record.data;

  const retailValue = ATV_estimateRetailValue(
    data['Make'],
    data['Model'],
    data['Year'],
    data['Engine Size (cc)'],
    data['Condition Score'] || 50,
    data['Category']
  );

  const repairCost = ATV_estimateRepairCost(
    data['Condition Score'] || 50,
    data['Running Status'] || 'Unknown',
    data['Hazard Flags'] || '',
    data['Category']
  );

  const maoResult = ATV_calculateMAO(
    retailValue,
    repairCost,
    data['Running Status'] || 'Unknown',
    settings
  );

  const offerTarget = ATV_calculateOfferTarget(maoResult.mao, settings);
  const totalCost = offerTarget + repairCost;
  const expectedProfit = retailValue - totalCost;
  const profitMargin = retailValue > 0 ? expectedProfit / retailValue : 0;

  return {
    retailValue: retailValue,
    projectValue: ATV_estimateProjectValue(retailValue, data['Condition Score'] || 50, data['Running Status']),
    repairCost: repairCost,
    mao: maoResult.mao,
    offerTarget: offerTarget,
    totalCost: totalCost,
    expectedProfit: expectedProfit,
    profitMargin: profitMargin,
    capitalTier: ATV_determineCapitalTier(totalCost, settings)
  };
}

// ============================================================================
// MAO ENGINE SHEET POPULATION
// ============================================================================

/**
 * Populates the MAO_ENGINE sheet with calculation details
 */
function ATV_populateMaoEngineSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);
  const maoSheet = ss.getSheetByName(ATV_SHEETS.MAO_ENGINE);

  if (!masterSheet || !maoSheet) {
    ATV_logError('ATV_populateMaoEngineSheet', 'Required sheets not found');
    return;
  }

  // Clear existing data (keep headers)
  if (maoSheet.getLastRow() > 1) {
    maoSheet.getRange(2, 1, maoSheet.getLastRow() - 1, maoSheet.getLastColumn()).clearContent();
  }

  const masterData = ATV_getSheetDataAsObjects(ATV_SHEETS.MASTER_DB);
  const settings = ATV_loadSettings();
  const maoRows = [];

  masterData.forEach(record => {
    const maoResult = ATV_calculateMAO(
      record['Estimated Retail Value'] || 0,
      record['Repair / Build Cost Estimate'] || 0,
      record['Running Status'] || 'Unknown',
      settings
    );

    maoRows.push([
      record['ATV ID'],
      record['Title (Normalized)'],
      record['Category'],
      record['Asking Price'],
      record['Estimated Retail Value'],
      record['Repair / Build Cost Estimate'],
      maoResult.maoPercent,
      settings.MIN_PROFIT_AMOUNT,
      0, // Risk buffer placeholder
      record['MAO'],
      record['Offer Target'],
      record['Profit Margin %'],
      '', // Calculation notes
      new Date()
    ]);
  });

  if (maoRows.length > 0) {
    maoSheet.getRange(2, 1, maoRows.length, maoRows[0].length).setValues(maoRows);
  }

  ATV_logInfo('ATV_populateMaoEngineSheet', `MAO Engine sheet populated`, `${maoRows.length} records`);
}
