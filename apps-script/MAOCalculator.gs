/**
 * MAOCalculator.gs
 * Maximum Allowable Offer (MAO) calculation engine
 *
 * MAO = Estimated_Resale - Repair_Estimate - Holding_Cost - Risk_Buffer - Desired_Profit
 *
 * This ensures you NEVER overpay and always know your walk-away price.
 */

// ============================================================================
// MAO CALCULATION ENGINE
// ============================================================================

/**
 * Calculate Maximum Allowable Offer for a deal
 *
 * @param {Object} deal - Deal object with all relevant fields
 * @returns {number} Maximum Allowable Offer
 */
function calculateMAO(deal) {
  const estimatedResale = estimateResaleValue(deal);
  const repairEstimate = deal.repairEstimate || estimateRepairCost(deal);
  const holdingCost = calculateHoldingCost(deal);
  const riskBuffer = calculateRiskBuffer(deal.riskScore || 5, estimatedResale);
  const desiredProfit = calculateDesiredProfit(deal, estimatedResale);

  const mao = estimatedResale - repairEstimate - holdingCost - riskBuffer - desiredProfit;

  // MAO can't be negative
  return Math.max(0, Math.round(mao));
}

/**
 * Estimate resale value based on market data
 *
 * This is a critical function - resale estimate drives everything
 */
function estimateResaleValue(deal) {
  const make = (deal.make || '').toLowerCase();
  const model = (deal.model || '').toLowerCase();
  const year = parseInt(deal.year) || 2010;
  const condition = (deal.condition || '').toLowerCase();

  // Base values for popular models (update these with market research)
  const baseValues = {
    // Yamaha
    'blaster': { running: 2800, partout: 1800 },
    'banshee': { running: 4500, partout: 3000 },
    'raptor 700': { running: 6500, partout: 4500 },
    'raptor 660': { running: 4800, partout: 3200 },
    'raptor 350': { running: 3500, partout: 2200 },
    'yfz450': { running: 5200, partout: 3500 },
    'warrior': { running: 2500, partout: 1600 },

    // Honda
    '400ex': { running: 3800, partout: 2500 },
    'trx450r': { running: 5500, partout: 3800 },
    'trx400ex': { running: 3800, partout: 2500 },
    'trx250r': { running: 4200, partout: 2800 },

    // Suzuki
    'ltz400': { running: 3600, partout: 2400 },
    'lt500r': { running: 5000, partout: 3300 },

    // Kawasaki
    'kfx450r': { running: 5000, partout: 3400 },
    'kfx400': { running: 3500, partout: 2300 },

    // Polaris
    'predator 500': { running: 3200, partout: 2100 },
    'outlaw 525': { running: 4800, partout: 3200 }
  };

  // Find base value
  let baseValue = null;
  for (const [key, values] of Object.entries(baseValues)) {
    if (model.includes(key) || (make + ' ' + model).includes(key)) {
      baseValue = values;
      break;
    }
  }

  // Default if model not in database
  if (!baseValue) {
    // Generic estimates based on asset type
    if (deal.assetType === 'ATV') {
      baseValue = { running: 3000, partout: 2000 };
    } else {
      baseValue = { running: 3500, partout: 2200 };
    }
  }

  // Start with condition-based value
  let resaleValue = 0;
  if (condition.includes('running') || condition.includes('excellent')) {
    resaleValue = baseValue.running;
  } else if (condition.includes('parts') || condition.includes('roller')) {
    resaleValue = baseValue.partout;
  } else {
    // Unknown condition - conservative middle ground
    resaleValue = (baseValue.running + baseValue.partout) / 2;
  }

  // Year adjustment (depreciation/appreciation)
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age < 3) {
    resaleValue *= 1.1; // Recent models hold value
  } else if (age > 15) {
    resaleValue *= 0.9; // Older models worth less unless collectible
  }

  // Aftermarket parts increase value
  const notes = (deal.notes || '').toLowerCase();
  if (notes.includes('aftermarket') || notes.includes('upgraded')) {
    resaleValue *= 1.15; // 15% bump for mods
  }

  // Performance models command premium
  if (model.includes('r') || model.includes('450') || model.includes('banshee')) {
    resaleValue *= 1.05;
  }

  return Math.round(resaleValue);
}

/**
 * Estimate repair costs based on condition and notes
 */
function estimateRepairCost(deal) {
  const condition = (deal.condition || '').toLowerCase();
  const notes = (deal.notes || '').toLowerCase();
  const hasEngine = deal.hasEngine !== false;

  let repairCost = 0;

  // Base repair by condition
  if (condition.includes('running') || condition.includes('excellent')) {
    repairCost = 200; // Minor cleanup, fluids
  } else if (condition.includes('non-running')) {
    repairCost = 800; // Assume major issue
  } else if (condition.includes('roller') || !hasEngine) {
    repairCost = 1200; // Need engine + installation
  }

  // Specific issues mentioned
  if (notes.includes('carb') || notes.includes('carburetor')) {
    repairCost += 150;
  }

  if (notes.includes('top end') || notes.includes('piston')) {
    repairCost += 500;
  }

  if (notes.includes('bottom end') || notes.includes('crank')) {
    repairCost += 1200;
  }

  if (notes.includes('electrical') || notes.includes('wiring')) {
    repairCost += 300;
  }

  if (notes.includes('transmission') || notes.includes('clutch')) {
    repairCost += 600;
  }

  // Missing parts
  if (!deal.hasWheels) {
    repairCost += 400; // Wheels and tires
  }

  if (notes.includes('plastics')) {
    repairCost += 300;
  }

  return Math.round(repairCost);
}

/**
 * Calculate holding costs (time to flip)
 */
function calculateHoldingCost(deal) {
  const condition = (deal.condition || '').toLowerCase();

  // Holding cost assumptions
  let daysToFlip = 30; // Default 1 month

  if (condition.includes('running')) {
    daysToFlip = 14; // Quick flip
  } else if (condition.includes('parts')) {
    daysToFlip = 45; // Parts take longer
  } else if (condition.includes('non-running')) {
    daysToFlip = 60; // Need repairs first
  }

  // Get daily holding cost from config (default $2/day)
  const dailyHoldingCost = getConfigValue('Daily_Holding_Cost', 2);

  return Math.round(daysToFlip * dailyHoldingCost);
}

/**
 * Calculate desired profit based on capital tier
 * Smaller deals need smaller % profit but still worthwhile
 */
function calculateDesiredProfit(deal, estimatedResale) {
  const tier = deal.capitalTier || determineCapitalTier(deal.askingPrice);

  // Get tier-specific profit targets from Capital_Tiers sheet
  const tierConfig = getTierConfig(tier);

  if (tierConfig) {
    // Use tier-specific minimum profit
    return tierConfig.minProfit;
  }

  // Fallback: tiered profit targets
  switch (tier) {
    case 'Tier 1': // $0-$500
      return 300; // $300 minimum profit
    case 'Tier 2': // $500-$1,500
      return 600; // $600 minimum profit
    case 'Tier 3': // $1,500-$3,500
      return 1000; // $1,000 minimum profit
    case 'Tier 4': // $3,500-$7,500
      return 1500; // $1,500 minimum profit
    case 'Tier 5': // $7,500+
      return 2500; // $2,500 minimum profit
    default:
      return Math.round(estimatedResale * 0.25); // 25% profit
  }
}

/**
 * Calculate part-out floor (worst-case liquidation value)
 * This is your safety net
 */
function calculatePartOutFloor(deal) {
  const make = (deal.make || '').toLowerCase();
  const model = (deal.model || '').toLowerCase();
  const hasEngine = deal.hasEngine !== false;
  const notes = (deal.notes || '').toLowerCase();

  // Start with 60% of running resale value
  const estimatedResale = estimateResaleValue(deal);
  let partOutValue = estimatedResale * 0.60;

  // Adjust based on what you have
  if (!hasEngine) {
    partOutValue *= 0.50; // No engine = less parts value
  }

  // Popular models part out better
  const hotModels = ['blaster', 'banshee', 'raptor', 'yfz', '400ex'];
  if (hotModels.some(m => model.includes(m))) {
    partOutValue *= 1.2; // Hot models = higher demand for parts
  }

  // Aftermarket parts boost floor
  if (notes.includes('aftermarket') || notes.includes('upgraded')) {
    partOutValue *= 1.3; // Aftermarket parts hold value
  }

  return Math.round(partOutValue);
}

/**
 * Get tier configuration
 */
function getTierConfig(tierName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tiersSheet = ss.getSheetByName(SHEETS.CAPITAL_TIERS);

  if (!tiersSheet) return null;

  const data = tiersSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tierName) {
      return {
        tier: data[i][0],
        minCapital: data[i][1],
        maxCapital: data[i][2],
        riskTolerance: data[i][3],
        minProfit: data[i][4],
        maxHoldTime: data[i][5]
      };
    }
  }

  return null;
}

/**
 * Calculate profit potential
 */
function calculateProfitPotential(deal) {
  const mao = deal.mao || calculateMAO(deal);
  const estimatedResale = deal.estimatedResale || estimateResaleValue(deal);
  const repairEstimate = deal.repairEstimate || estimateRepairCost(deal);

  const allInCost = mao + repairEstimate;
  const profit = estimatedResale - allInCost;

  return Math.round(profit);
}

/**
 * Calculate ROI percentage
 */
function calculateROI(deal) {
  const profit = calculateProfitPotential(deal);
  const mao = deal.mao || calculateMAO(deal);
  const repairEstimate = deal.repairEstimate || estimateRepairCost(deal);
  const allInCost = mao + repairEstimate;

  if (allInCost === 0) return 0;

  const roi = (profit / allInCost) * 100;
  return Math.round(roi);
}
