/**
 * VerdictEngine.gs
 * Automated verdict and ranking logic
 *
 * Verdicts: BUY / WATCH / PASS
 * Ranking: Sorts deals by profit potential and safety
 */

// ============================================================================
// VERDICT ENGINE
// ============================================================================

/**
 * Calculate verdict for a deal
 * This is the decision-making brain
 *
 * @param {Object} deal - Deal object
 * @returns {string} Verdict: BUY, WATCH, or PASS
 */
function calculateVerdict(deal) {
  const askingPrice = deal.askingPrice || 0;
  const mao = deal.mao || calculateMAO(deal);
  const riskScore = deal.riskScore || calculateRiskScore(deal);
  const profit = calculateProfitPotential(deal);
  const roi = calculateROI(deal);
  const partOutFloor = deal.partOutFloor || calculatePartOutFloor(deal);

  // Get tier-specific thresholds
  const tier = deal.capitalTier || determineCapitalTier(askingPrice);
  const tierConfig = getTierConfig(tier);

  // Key decision factors
  const priceUnderMAO = askingPrice <= mao;
  const hasDownsideProtection = askingPrice <= partOutFloor * 1.2; // Within 20% of floor
  const profitMeetsTarget = tierConfig ? profit >= tierConfig.minProfit : profit >= 500;
  const roiAcceptable = roi >= 30; // Minimum 30% ROI
  const lowRisk = riskScore <= 3;
  const mediumRisk = riskScore <= 6;

  // === BUY LOGIC ===
  // Strong buy conditions
  if (priceUnderMAO && profitMeetsTarget && lowRisk) {
    return 'BUY'; // Perfect deal - low risk, good profit, under MAO
  }

  if (priceUnderMAO && hasDownsideProtection && mediumRisk) {
    return 'BUY'; // Protected downside, even with medium risk
  }

  if (profit >= (tierConfig?.minProfit || 500) * 1.5 && mediumRisk && priceUnderMAO) {
    return 'BUY'; // Exceptional profit justifies medium risk
  }

  // === WATCH LOGIC ===
  // Deals that could become good with price drop
  if (askingPrice <= mao * 1.15 && profitMeetsTarget && mediumRisk) {
    return 'WATCH'; // Close to MAO, could negotiate down
  }

  if (hasDownsideProtection && !profitMeetsTarget) {
    return 'WATCH'; // Safe floor but low profit - wait for drop
  }

  if (priceUnderMAO && !profitMeetsTarget) {
    return 'WATCH'; // Under MAO but profit too slim
  }

  // === PASS LOGIC ===
  // Everything else
  return 'PASS';
}

/**
 * Calculate confidence score (0-100)
 * How confident are we in this verdict?
 */
function calculateConfidenceScore(deal) {
  let confidence = 50; // Start at medium

  const riskScore = deal.riskScore || 5;
  const hasGoodInfo = deal.year && deal.make && deal.model && deal.condition;
  const hasPhotos = (deal.notes || '').toLowerCase().includes('photos');

  // Low risk increases confidence
  if (riskScore <= 3) {
    confidence += 20;
  } else if (riskScore >= 7) {
    confidence -= 15;
  }

  // Good information increases confidence
  if (hasGoodInfo) {
    confidence += 15;
  }

  // Photos increase confidence
  if (hasPhotos) {
    confidence += 10;
  }

  // Popular models we know well = higher confidence
  const model = (deal.model || '').toLowerCase();
  const knownModels = ['blaster', 'banshee', 'raptor', 'yfz', '400ex'];
  if (knownModels.some(m => model.includes(m))) {
    confidence += 10;
  }

  // Clamp to 0-100
  return Math.min(100, Math.max(0, confidence));
}

/**
 * Rank all deals in Master_Database and update Verdict sheet
 */
function rankDeals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEETS.MASTER_DATABASE);
  const verdictSheet = ss.getSheetByName(SHEETS.VERDICT);

  if (!masterSheet || !verdictSheet) {
    throw new Error('Required sheets not found');
  }

  const masterData = masterSheet.getDataRange().getValues();
  const deals = [];

  // Process each deal (skip header)
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    if (!row[0]) continue; // Skip empty rows

    const deal = createDealObjectFromRow(row);

    // Calculate all metrics
    deal.estimatedResale = estimateResaleValue(deal);
    deal.repairEstimate = deal.repairEstimate || estimateRepairCost(deal);
    deal.mao = calculateMAO(deal);
    deal.partOutFloor = calculatePartOutFloor(deal);
    deal.riskScore = calculateRiskScore(deal);
    deal.verdict = calculateVerdict(deal);
    deal.confidenceScore = calculateConfidenceScore(deal);
    deal.profit = calculateProfitPotential(deal);
    deal.roi = calculateROI(deal);

    // Update Master_Database with calculated values
    masterSheet.getRange(i + 1, 8).setValue(deal.estimatedResale); // Estimated_Resale
    masterSheet.getRange(i + 1, 9).setValue(deal.mao); // MAO
    masterSheet.getRange(i + 1, 10).setValue(deal.partOutFloor); // Part_Out_Floor
    masterSheet.getRange(i + 1, 11).setValue(deal.repairEstimate); // Repair_Estimate
    masterSheet.getRange(i + 1, 12).setValue(deal.riskScore); // Risk_Score
    masterSheet.getRange(i + 1, 15).setValue(deal.verdict); // Verdict
    masterSheet.getRange(i + 1, 16).setValue(deal.confidenceScore); // Confidence_Score

    deals.push(deal);
  }

  // Sort deals by score (BUY > WATCH > PASS, then by profit)
  deals.sort((a, b) => {
    const verdictScore = { 'BUY': 3, 'WATCH': 2, 'PASS': 1 };
    const scoreA = verdictScore[a.verdict] * 10000 + a.profit;
    const scoreB = verdictScore[b.verdict] * 10000 + b.profit;
    return scoreB - scoreA;
  });

  // Build Verdict sheet data
  const verdictData = [
    // Header row (already exists)
  ];

  deals.forEach((deal, index) => {
    verdictData.push([
      index + 1,                    // Rank
      deal.assetId,                 // Asset_ID
      `${deal.year} ${deal.make} ${deal.model}`, // Description
      deal.askingPrice,             // Asking_Price
      deal.mao,                     // MAO
      deal.estimatedResale,         // Est_Resale
      deal.profit,                  // Profit
      deal.roi + '%',               // ROI
      deal.riskScore,               // Risk
      getRiskLevel(deal.riskScore), // Risk_Level
      deal.verdict,                 // Verdict
      deal.confidenceScore,         // Confidence
      deal.condition,               // Condition
      deal.location,                // Location
      deal.sourceUrl,               // URL
      getActionItem(deal)           // Action
    ]);
  });

  // Clear and update Verdict sheet (keep header)
  if (verdictData.length > 0) {
    verdictSheet.getRange(2, 1, verdictSheet.getLastRow() - 1, verdictSheet.getLastColumn()).clear();
    verdictSheet.getRange(2, 1, verdictData.length, verdictData[0].length).setValues(verdictData);
  }

  // Apply conditional formatting
  applyVerdictFormatting(verdictSheet, verdictData.length);

  logActivity('rankDeals', `Ranked ${deals.length} deals`);
  return deals.length;
}

/**
 * Get action item for deal
 */
function getActionItem(deal) {
  switch (deal.verdict) {
    case 'BUY':
      return `💰 Message seller - Offer $${deal.mao}`;
    case 'WATCH':
      return '👀 Monitor for price drop';
    case 'PASS':
      return '❌ Ignore';
    default:
      return '';
  }
}

/**
 * Apply conditional formatting to Verdict sheet
 */
function applyVerdictFormatting(sheet, rowCount) {
  if (rowCount === 0) return;

  // Verdict column conditional formatting
  const verdictCol = 11; // Column K (Verdict)
  const verdictRange = sheet.getRange(2, verdictCol, rowCount, 1);

  // Clear existing rules for this range
  const rules = sheet.getConditionalFormatRules();
  const filteredRules = rules.filter(rule => {
    const range = rule.getRanges()[0];
    return range.getColumn() !== verdictCol;
  });

  // Add new rules
  const buyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('BUY')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([verdictRange])
    .build();

  const watchRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('WATCH')
    .setBackground('#FBBC04')
    .setFontColor('#000000')
    .setRanges([verdictRange])
    .build();

  const passRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('PASS')
    .setBackground('#EA4335')
    .setFontColor('#FFFFFF')
    .setRanges([verdictRange])
    .build();

  filteredRules.push(buyRule, watchRule, passRule);
  sheet.setConditionalFormatRules(filteredRules);
}

/**
 * Get deal details for CRM export
 */
function getDealDetailsForCRM(deal) {
  return {
    asset_id: deal.assetId,
    title: `${deal.year} ${deal.make} ${deal.model}`,
    asking_price: deal.askingPrice,
    mao: deal.mao,
    estimated_resale: deal.estimatedResale,
    profit_potential: deal.profit,
    roi: deal.roi,
    risk_score: deal.riskScore,
    risk_level: getRiskLevel(deal.riskScore),
    verdict: deal.verdict,
    condition: deal.condition,
    location: deal.location,
    seller_contact: deal.sellerContact,
    source_url: deal.sourceUrl,
    notes: deal.notes,
    action_item: getActionItem(deal)
  };
}
