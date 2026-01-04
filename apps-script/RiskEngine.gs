/**
 * RiskEngine.gs
 * Risk scoring and assessment engine
 *
 * Risk_Score = (Mechanical × 30%) + (Paperwork × 20%) + (Liquidity × 20%)
 *              + (Repair × 20%) + (Unknowns × 10%)
 *
 * Score ranges:
 * 0-3: Low risk (green light)
 * 4-6: Medium risk (proceed with caution)
 * 7-10: High risk (pass unless massive upside)
 */

// ============================================================================
// RISK SCORING ENGINE
// ============================================================================

/**
 * Calculate comprehensive risk score for a deal
 *
 * @param {Object} deal - Deal object with all relevant fields
 * @returns {number} Risk score (0-10)
 */
function calculateRiskScore(deal) {
  const mechanicalRisk = assessMechanicalRisk(deal);
  const paperworkRisk = assessPaperworkRisk(deal);
  const liquidityRisk = assessLiquidityRisk(deal);
  const repairRisk = assessRepairComplexityRisk(deal);
  const unknownsRisk = assessUnknownsRisk(deal);

  // Weighted risk calculation
  const riskScore = (
    mechanicalRisk * 0.30 +
    paperworkRisk * 0.20 +
    liquidityRisk * 0.20 +
    repairRisk * 0.20 +
    unknownsRisk * 0.10
  );

  return Math.round(riskScore * 10) / 10; // Round to 1 decimal
}

/**
 * Assess mechanical risk (0-10)
 * This is the most heavily weighted factor (30%)
 */
function assessMechanicalRisk(deal) {
  let risk = 5; // Start at medium

  const condition = (deal.condition || '').toLowerCase();
  const hasEngine = deal.hasEngine !== false;
  const notes = (deal.notes || '').toLowerCase();

  // Condition-based risk
  if (condition.includes('running') || condition.includes('runs great')) {
    risk = 2; // Low risk
  } else if (condition.includes('non-running') || condition.includes("doesn't run")) {
    risk = 7; // High risk - unknown internal issues
  } else if (condition.includes('roller') || condition.includes('no engine')) {
    risk = 3; // Lower risk - no engine surprises
  } else if (condition.includes('parts')) {
    risk = 2; // Low risk - already written off
  }

  // Engine presence
  if (!hasEngine) {
    risk = Math.min(risk, 3); // Reduces risk - no engine unknowns
  }

  // Rebuild/new parts reduce risk
  if (notes.includes('rebuilt') || notes.includes('new engine')) {
    risk = Math.max(0, risk - 2);
  }

  // Issues mentioned increase risk
  if (notes.includes('needs') || notes.includes('issue') || notes.includes('problem')) {
    risk = Math.min(10, risk + 2);
  }

  // Specific red flags
  if (notes.includes('locked up') || notes.includes('seized')) {
    risk = 9;
  }

  return Math.min(10, Math.max(0, risk));
}

/**
 * Assess paperwork/title risk (0-10)
 * 20% weight
 */
function assessPaperworkRisk(deal) {
  const title = (deal.titleStatus || '').toLowerCase();
  const assetType = (deal.assetType || '').toLowerCase();

  // ATVs don't always need titles in many states
  const titleRequired = !assetType.includes('atv');

  let risk = 5;

  if (title.includes('clean') || title.includes('title in hand')) {
    risk = 1; // Very low risk
  } else if (title.includes('bill of sale')) {
    risk = titleRequired ? 6 : 3; // Higher risk if title required
  } else if (title.includes('no title') || title.includes('none')) {
    risk = titleRequired ? 8 : 4; // Major risk if title required
  } else if (title.includes('lost') || title.includes('can get')) {
    risk = 7; // Promises are risky
  }

  return risk;
}

/**
 * Assess market liquidity risk (0-10)
 * How fast can you flip or part out? 20% weight
 */
function assessLiquidityRisk(deal) {
  const make = (deal.make || '').toLowerCase();
  const model = (deal.model || '').toLowerCase();
  const assetType = (deal.assetType || '').toLowerCase();
  const condition = (deal.condition || '').toLowerCase();

  let risk = 5; // Medium baseline

  // Popular brands = lower risk
  const popularBrands = ['yamaha', 'honda', 'suzuki', 'kawasaki', 'polaris'];
  if (popularBrands.some(brand => make.includes(brand))) {
    risk -= 2;
  }

  // Popular models = even lower risk
  const hotModels = ['blaster', 'banshee', 'raptor', 'yfz', '400ex', 'trx'];
  if (hotModels.some(m => model.includes(m))) {
    risk -= 1;
  }

  // Condition affects liquidity
  if (condition.includes('running')) {
    risk -= 1; // Easier to sell
  } else if (condition.includes('parts')) {
    risk -= 1; // Parts always move
  }

  // Asset type
  if (assetType.includes('atv')) {
    risk -= 1; // ATVs move fast
  }

  return Math.min(10, Math.max(0, risk));
}

/**
 * Assess repair complexity risk (0-10)
 * 20% weight
 */
function assessRepairComplexityRisk(deal) {
  const notes = (deal.notes || '').toLowerCase();
  const condition = (deal.condition || '').toLowerCase();
  const repairEstimate = deal.repairEstimate || 0;

  let risk = 5;

  // No repairs needed
  if (condition.includes('running') || condition.includes('parts')) {
    risk = 2;
  }

  // Simple fixes
  if (notes.includes('carb') || notes.includes('carburetor') || notes.includes('fuel')) {
    risk = 3; // Easy fix
  }

  // Medium complexity
  if (notes.includes('electrical') || notes.includes('wiring')) {
    risk = 6; // Time-consuming
  }

  // Complex repairs
  if (notes.includes('bottom end') || notes.includes('transmission') || notes.includes('crank')) {
    risk = 8; // Major work
  }

  // High repair estimate = high risk
  if (repairEstimate > 1000) {
    risk = Math.min(10, risk + 2);
  } else if (repairEstimate > 500) {
    risk = Math.min(10, risk + 1);
  }

  return Math.min(10, Math.max(0, risk));
}

/**
 * Assess unknowns risk (0-10)
 * Missing information = risk. 10% weight
 */
function assessUnknownsRisk(deal) {
  let risk = 5;
  let knownFactors = 0;
  let totalFactors = 0;

  // Check what we know
  const checks = [
    { field: deal.year, weight: 1 },
    { field: deal.make, weight: 2 },
    { field: deal.model, weight: 2 },
    { field: deal.condition, weight: 3 },
    { field: deal.titleStatus, weight: 2 },
    { field: deal.hasEngine, weight: 2 },
    { field: deal.hasWheels, weight: 1 }
  ];

  checks.forEach(check => {
    totalFactors += check.weight;
    if (check.field && check.field !== 'Unknown' && check.field !== '') {
      knownFactors += check.weight;
    }
  });

  // Calculate risk based on known information
  const knownPercentage = knownFactors / totalFactors;

  if (knownPercentage > 0.8) {
    risk = 2; // Most info known
  } else if (knownPercentage > 0.6) {
    risk = 4;
  } else if (knownPercentage > 0.4) {
    risk = 6;
  } else {
    risk = 8; // Very little known
  }

  // Vague listings are risky
  const notes = (deal.notes || '').toLowerCase();
  if (notes.includes('not sure') || notes.includes('don\'t know') || notes.includes('maybe')) {
    risk = Math.min(10, risk + 2);
  }

  return risk;
}

/**
 * Calculate risk buffer for MAO calculation
 * Higher risk = bigger buffer = lower offer
 *
 * @param {number} riskScore - Risk score (0-10)
 * @param {number} baseValue - Base value to calculate buffer from
 * @returns {number} Risk buffer amount
 */
function calculateRiskBuffer(riskScore, baseValue) {
  // Risk buffer as percentage of value
  let bufferPercent = 0;

  if (riskScore <= 3) {
    bufferPercent = 0.05; // 5% buffer for low risk
  } else if (riskScore <= 6) {
    bufferPercent = 0.15; // 15% buffer for medium risk
  } else {
    bufferPercent = 0.25; // 25% buffer for high risk
  }

  return Math.round(baseValue * bufferPercent);
}

/**
 * Get risk level label
 */
function getRiskLevel(riskScore) {
  if (riskScore <= 3) return 'LOW';
  if (riskScore <= 6) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Get risk color for conditional formatting
 */
function getRiskColor(riskScore) {
  if (riskScore <= 3) return '#34A853'; // Green
  if (riskScore <= 6) return '#FBBC04'; // Yellow
  return '#EA4335'; // Red
}

/**
 * Helper: Create deal object from Master_Database row
 */
function createDealObjectFromRow(row) {
  return {
    assetId: row[0],
    assetType: row[1],
    year: row[2],
    make: row[3],
    model: row[4],
    platformCode: row[5],
    askingPrice: row[6],
    estimatedResale: row[7],
    mao: row[8],
    partOutFloor: row[9],
    repairEstimate: row[10],
    riskScore: row[11],
    capitalTier: row[12],
    exitStrategy: row[13],
    verdict: row[14],
    confidenceScore: row[15],
    condition: row[16],
    titleStatus: row[17],
    hasEngine: row[18],
    hasWheels: row[19],
    notes: row[20]
  };
}
