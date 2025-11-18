/**
 * ===== FILE: ATV_condition.gs =====
 * Quantum ATV & Powersport Analyzer v1.0
 *
 * Condition assessment functions:
 * - Condition scoring (0-100)
 * - Running status detection
 * - Hazard flag identification
 * - Mods/extras detection
 * - Build notes generation
 */

// ============================================================================
// MAIN CONDITION ANALYSIS
// ============================================================================

/**
 * Runs condition analysis on all records in master DB
 */
function ATV_runConditionAnalysis() {
  try {
    ATV_logInfo('ATV_runConditionAnalysis', 'Starting condition analysis...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ATV_SHEETS.MASTER_DB);

    if (!sheet || sheet.getLastRow() <= 1) {
      ATV_logWarn('ATV_runConditionAnalysis', 'No data to analyze');
      return;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const headerMap = {};
    headers.forEach((h, i) => headerMap[h] = i);

    let updated = 0;

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Get relevant fields for analysis
      const conditionRaw = row[headerMap['Condition (Raw)']] || '';
      const title = row[headerMap['Title (Normalized)']] || '';
      const description = row[headerMap['Notes / Build Ideas']] || ''; // Could also use a description field
      const combinedText = `${title} ${conditionRaw} ${description}`.toLowerCase();

      // Calculate condition score
      const conditionScore = ATV_calculateConditionScore(combinedText);
      row[headerMap['Condition Score']] = conditionScore;

      // Determine running status
      const runningStatus = ATV_detectRunningStatus(combinedText);
      row[headerMap['Running Status']] = runningStatus;

      // Identify hazard flags
      const hazardFlags = ATV_identifyHazardFlags(combinedText);
      row[headerMap['Hazard Flags']] = hazardFlags.join(', ');

      // Extract key issues
      const keyIssues = ATV_extractKeyIssues(combinedText);
      row[headerMap['Key Issues']] = keyIssues;

      // Detect mods/extras
      const mods = ATV_detectMods(combinedText);
      row[headerMap['Mods / Extras']] = mods;

      // Generate build notes
      const buildNotes = ATV_generateBuildNotes(combinedText, conditionScore, runningStatus, hazardFlags);
      if (!row[headerMap['Notes / Build Ideas']]) {
        row[headerMap['Notes / Build Ideas']] = buildNotes;
      }

      // Update timestamp
      row[headerMap['Last Updated']] = new Date();

      updated++;
    }

    // Write updated data back
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    ATV_logInfo('ATV_runConditionAnalysis', `Condition analysis completed`, `Updated ${updated} records`);
    return updated;

  } catch (e) {
    ATV_logError('ATV_runConditionAnalysis', 'Condition analysis failed', e.message);
    throw e;
  }
}

// ============================================================================
// CONDITION SCORING
// ============================================================================

/**
 * Calculates a condition score from 0-100
 * @param {string} text - Combined text to analyze
 * @returns {number} Score from 0-100
 */
function ATV_calculateConditionScore(text) {
  let score = 50; // Start at neutral

  // Major negatives (each can significantly lower score)
  if (ATV_containsKeywords(text, ['blown', 'seized', 'locked up'])) score -= 35;
  if (ATV_containsKeywords(text, ['no compression'])) score -= 30;
  if (ATV_containsKeywords(text, ['frame damage', 'bent frame', 'cracked frame'])) score -= 40;
  if (ATV_containsKeywords(text, ['fire damage', 'fire'])) score -= 45;
  if (ATV_containsKeywords(text, ['flood', 'submerged', 'water damage'])) score -= 35;
  if (ATV_containsKeywords(text, ['salvage', 'salvage title'])) score -= 25;
  if (ATV_containsKeywords(text, ['not running', 'won\'t start', 'doesn\'t run'])) score -= 20;
  if (ATV_containsKeywords(text, ['no spark', 'no fire'])) score -= 15;
  if (ATV_containsKeywords(text, ['no title', 'lost title', 'bill of sale only'])) score -= 15;

  // Moderate negatives
  if (ATV_containsKeywords(text, ['needs motor', 'needs engine'])) score -= 25;
  if (ATV_containsKeywords(text, ['needs top end', 'needs rebuild'])) score -= 15;
  if (ATV_containsKeywords(text, ['roller', 'frame only'])) score -= 30;
  if (ATV_containsKeywords(text, ['basket case', 'parts missing'])) score -= 20;
  if (ATV_containsKeywords(text, ['runs rough', 'idles rough'])) score -= 10;
  if (ATV_containsKeywords(text, ['needs carb', 'carb work', 'carb issues'])) score -= 8;
  if (ATV_containsKeywords(text, ['electrical', 'wiring issues'])) score -= 10;
  if (ATV_containsKeywords(text, ['overheats', 'cooling'])) score -= 12;

  // Minor negatives
  if (ATV_containsKeywords(text, ['needs plastics', 'broken plastics'])) score -= 5;
  if (ATV_containsKeywords(text, ['needs tires', 'bald tires'])) score -= 5;
  if (ATV_containsKeywords(text, ['cosmetic', 'scratches', 'dents'])) score -= 3;
  if (ATV_containsKeywords(text, ['needs battery'])) score -= 3;
  if (ATV_containsKeywords(text, ['project'])) score -= 10;
  if (ATV_containsKeywords(text, ['as is', 'as-is'])) score -= 8;

  // Positives
  if (ATV_containsKeywords(text, ['excellent', 'mint', 'pristine'])) score += 25;
  if (ATV_containsKeywords(text, ['like new'])) score += 20;
  if (ATV_containsKeywords(text, ['low hours', 'low miles'])) score += 15;
  if (ATV_containsKeywords(text, ['garage kept', 'always garaged'])) score += 10;
  if (ATV_containsKeywords(text, ['adult owned', 'adult ridden'])) score += 8;
  if (ATV_containsKeywords(text, ['never raced'])) score += 8;
  if (ATV_containsKeywords(text, ['well maintained', 'maintained'])) score += 10;
  if (ATV_containsKeywords(text, ['runs great', 'runs perfect', 'runs strong'])) score += 20;
  if (ATV_containsKeywords(text, ['ready to ride', 'turn key', 'turnkey'])) score += 15;
  if (ATV_containsKeywords(text, ['fresh top end', 'rebuilt'])) score += 10;
  if (ATV_containsKeywords(text, ['new tires', 'new battery'])) score += 5;
  if (ATV_containsKeywords(text, ['clean title', 'clear title'])) score += 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// RUNNING STATUS DETECTION
// ============================================================================

/**
 * Detects the running status of the vehicle
 * @param {string} text - Text to analyze
 * @returns {string} Running status
 */
function ATV_detectRunningStatus(text) {
  // Check in order of specificity

  // Frame/Roller (no motor at all)
  if (ATV_containsKeywords(text, ['frame only', 'frame', 'roller', 'no motor', 'no engine', 'motor missing'])) {
    if (ATV_containsKeywords(text, ['frame only'])) return 'Frame Only';
    if (ATV_containsKeywords(text, ['roller', 'no motor', 'no engine'])) return 'Roller';
  }

  // Not Running
  if (ATV_containsKeywords(text, ['not running', 'doesn\'t run', 'won\'t start', 'doesn\'t start',
                                  'no start', 'won\'t run', 'needs motor', 'needs engine',
                                  'blown', 'seized', 'locked up', 'no compression'])) {
    return 'Not Running';
  }

  // Runs Rough
  if (ATV_containsKeywords(text, ['runs rough', 'idles rough', 'runs but', 'starts but',
                                  'needs tune', 'needs carb', 'bogs', 'sputters', 'misfires'])) {
    return 'Runs Rough';
  }

  // Runs Great
  if (ATV_containsKeywords(text, ['runs great', 'runs perfect', 'runs excellent', 'runs strong',
                                  'runs like new', 'ready to ride', 'turn key', 'turnkey'])) {
    return 'Runs Great';
  }

  // Runs (basic confirmation)
  if (ATV_containsKeywords(text, ['runs', 'runs and drives', 'runs good', 'starts', 'starts right up'])) {
    return 'Runs';
  }

  return 'Unknown';
}

// ============================================================================
// HAZARD FLAG IDENTIFICATION
// ============================================================================

/**
 * Identifies hazard flags from text
 * @param {string} text - Text to analyze
 * @returns {Array} Array of hazard flag strings
 */
function ATV_identifyHazardFlags(text) {
  const flags = [];

  // NO_TITLE
  if (ATV_containsKeywords(text, ['no title', 'lost title', 'bill of sale only', 'bos only',
                                  'no paperwork', 'title issues'])) {
    flags.push('NO_TITLE');
  }

  // BLOWN_MOTOR
  if (ATV_containsKeywords(text, ['blown', 'blown motor', 'blown engine', 'seized',
                                  'locked up', 'spun bearing', 'hole in case', 'no compression'])) {
    flags.push('BLOWN_MOTOR');
  }

  // FRAME_DAMAGE
  if (ATV_containsKeywords(text, ['frame damage', 'bent frame', 'cracked frame', 'frame crack',
                                  'frame bent', 'tweaked frame'])) {
    flags.push('FRAME_DAMAGE');
  }

  // PARTS_MISSING
  if (ATV_containsKeywords(text, ['parts missing', 'missing parts', 'incomplete', 'basket case',
                                  'no motor', 'no engine', 'no carb', 'no exhaust'])) {
    flags.push('PARTS_MISSING');
  }

  // UNKNOWN_HISTORY
  if (ATV_containsKeywords(text, ['unknown history', 'don\'t know', 'no history', 'just got it',
                                  'bought as is', 'mystery'])) {
    flags.push('UNKNOWN_HISTORY');
  }

  // FLOOD_DAMAGE
  if (ATV_containsKeywords(text, ['flood', 'flood damage', 'water damage', 'submerged', 'underwater'])) {
    flags.push('FLOOD_DAMAGE');
  }

  // SALVAGE
  if (ATV_containsKeywords(text, ['salvage', 'salvage title', 'rebuilt title', 'reconstructed'])) {
    flags.push('SALVAGE');
  }

  // STOLEN_RISK
  if (ATV_containsKeywords(text, ['no vin', 'vin removed', 'vin scratched', 'numbers don\'t match'])) {
    flags.push('STOLEN_RISK');
  }

  // LIEN_RISK
  if (ATV_containsKeywords(text, ['lien', 'still owe', 'bank owns', 'financed'])) {
    flags.push('LIEN_RISK');
  }

  return flags;
}

// ============================================================================
// KEY ISSUES EXTRACTION
// ============================================================================

/**
 * Extracts key issues as a readable summary
 * @param {string} text - Text to analyze
 * @returns {string} Key issues summary
 */
function ATV_extractKeyIssues(text) {
  const issues = [];

  // Engine issues
  if (ATV_containsKeywords(text, ['needs top end'])) issues.push('Needs top end');
  if (ATV_containsKeywords(text, ['blown motor', 'blown engine', 'blown'])) issues.push('Blown motor');
  if (ATV_containsKeywords(text, ['seized'])) issues.push('Seized engine');
  if (ATV_containsKeywords(text, ['no compression'])) issues.push('No compression');
  if (ATV_containsKeywords(text, ['needs motor', 'needs engine'])) issues.push('Needs motor');
  if (ATV_containsKeywords(text, ['overheats'])) issues.push('Overheats');

  // Electrical
  if (ATV_containsKeywords(text, ['no spark'])) issues.push('No spark');
  if (ATV_containsKeywords(text, ['electrical', 'wiring'])) issues.push('Electrical issues');
  if (ATV_containsKeywords(text, ['stator', 'cdi', 'coil'])) issues.push('Ignition issues');

  // Fuel/Carb
  if (ATV_containsKeywords(text, ['needs carb', 'carb work', 'carb issues'])) issues.push('Carb needs work');
  if (ATV_containsKeywords(text, ['fuel pump', 'fuel issue'])) issues.push('Fuel system issues');

  // Transmission/Clutch
  if (ATV_containsKeywords(text, ['trans', 'transmission', 'gears'])) issues.push('Transmission issues');
  if (ATV_containsKeywords(text, ['clutch'])) issues.push('Clutch issues');

  // Cosmetic/Body
  if (ATV_containsKeywords(text, ['needs plastics', 'broken plastics', 'missing plastics'])) issues.push('Needs plastics');
  if (ATV_containsKeywords(text, ['needs tires', 'bald'])) issues.push('Needs tires');

  // Title
  if (ATV_containsKeywords(text, ['no title'])) issues.push('No title');

  // Frame
  if (ATV_containsKeywords(text, ['frame damage', 'bent frame'])) issues.push('Frame damage');

  // Limit to top 5 issues
  return issues.slice(0, 5).join('; ') || 'None identified';
}

// ============================================================================
// MODS/EXTRAS DETECTION
// ============================================================================

/**
 * Detects modifications and extras
 * @param {string} text - Text to analyze
 * @returns {string} Mods and extras summary
 */
function ATV_detectMods(text) {
  const mods = [];

  // Engine mods
  if (ATV_containsKeywords(text, ['big bore', 'big-bore'])) mods.push('Big bore kit');
  if (ATV_containsKeywords(text, ['ported', 'port work'])) mods.push('Ported');
  if (ATV_containsKeywords(text, ['cammed', 'hot cams', 'stage'])) mods.push('Performance cams');
  if (ATV_containsKeywords(text, ['stroker'])) mods.push('Stroker');
  if (ATV_containsKeywords(text, ['wiseco', 'je piston', 'cp piston'])) mods.push('Aftermarket piston');

  // Exhaust
  if (ATV_containsKeywords(text, ['fmf', 'pro circuit', 'yoshimura', 'dg', 'bills pipe'])) mods.push('Aftermarket exhaust');
  if (ATV_containsKeywords(text, ['pipe', 'exhaust']) && !ATV_containsKeywords(text, ['stock'])) mods.push('Exhaust');

  // Intake
  if (ATV_containsKeywords(text, ['k&n', 'uni filter', 'pod filter', 'intake'])) mods.push('Intake');
  if (ATV_containsKeywords(text, ['jetted', 'jet kit', 'rejetted'])) mods.push('Jetted');

  // Suspension
  if (ATV_containsKeywords(text, ['fox', 'elka', 'ohlins', 'wp', 'showa'])) mods.push('Aftermarket shocks');
  if (ATV_containsKeywords(text, ['a-arms', 'long travel', '+2'])) mods.push('Extended A-arms');

  // Accessories
  if (ATV_containsKeywords(text, ['nerf bars', 'nerfs'])) mods.push('Nerf bars');
  if (ATV_containsKeywords(text, ['bumper', 'grab bar'])) mods.push('Bumper');
  if (ATV_containsKeywords(text, ['skid plate', 'skids'])) mods.push('Skid plates');
  if (ATV_containsKeywords(text, ['graphics', 'wrap'])) mods.push('Graphics');
  if (ATV_containsKeywords(text, ['lights', 'led'])) mods.push('Lights');
  if (ATV_containsKeywords(text, ['winch'])) mods.push('Winch');

  // Wheels/Tires
  if (ATV_containsKeywords(text, ['beadlock', 'beadlocks'])) mods.push('Beadlock wheels');
  if (ATV_containsKeywords(text, ['paddle', 'sand tire'])) mods.push('Paddle tires');
  if (ATV_containsKeywords(text, ['new tires'])) mods.push('New tires');

  return mods.join(', ') || 'Stock';
}

// ============================================================================
// BUILD NOTES GENERATION
// ============================================================================

/**
 * Generates build notes/recommendations
 * @param {string} text - Text to analyze
 * @param {number} conditionScore - Condition score
 * @param {string} runningStatus - Running status
 * @param {Array} hazardFlags - Hazard flags
 * @returns {string} Build notes
 */
function ATV_generateBuildNotes(text, conditionScore, runningStatus, hazardFlags) {
  const notes = [];

  // Based on condition and status, suggest approach
  if (conditionScore >= 80 && runningStatus === 'Runs Great') {
    notes.push('Ready to flip - minor cleanup only');
  } else if (conditionScore >= 60 && (runningStatus === 'Runs' || runningStatus === 'Runs Great')) {
    notes.push('Easy flip - cosmetics and tuning');
  } else if (runningStatus === 'Runs Rough') {
    notes.push('Carb/tune work needed');
    if (ATV_containsKeywords(text, ['2-stroke', '2 stroke', 'banshee', 'blaster'])) {
      notes.push('Check reeds and top end');
    }
  } else if (runningStatus === 'Not Running') {
    if (ATV_containsKeywords(text, ['no spark'])) {
      notes.push('Diagnose ignition system');
    }
    if (ATV_containsKeywords(text, ['needs top end'])) {
      notes.push('Top end rebuild candidate');
    }
    if (ATV_containsKeywords(text, ['blown', 'seized'])) {
      notes.push('Full engine rebuild or swap needed');
    }
  } else if (runningStatus === 'Roller' || runningStatus === 'Frame Only') {
    notes.push('Full build project');
    notes.push('Good frame for custom build');
  }

  // Title concerns
  if (hazardFlags.includes('NO_TITLE')) {
    notes.push('Factor in bonded title cost ($150-300)');
  }

  // Specific build potentials
  if (ATV_containsKeywords(text, ['banshee'])) {
    notes.push('High demand - good flip potential');
  }
  if (ATV_containsKeywords(text, ['raptor 700', 'raptor 660'])) {
    notes.push('Strong resale market');
  }
  if (ATV_containsKeywords(text, ['yfz450', 'trx450'])) {
    notes.push('Popular sport quad - good parts availability');
  }
  if (ATV_containsKeywords(text, ['youth', 'kids', '50', '70', '90'])) {
    notes.push('Youth market - fast sellers');
  }

  return notes.slice(0, 4).join('. ') || 'Evaluate in person';
}

// ============================================================================
// SINGLE RECORD CONDITION ASSESSMENT
// ============================================================================

/**
 * Assesses condition for a single ATV by ID
 * @param {string} atvId - ATV ID to assess
 * @returns {Object} Condition assessment results
 */
function ATV_assessCondition(atvId) {
  const record = ATV_findRowById(ATV_SHEETS.MASTER_DB, 'ATV ID', atvId);

  if (!record) {
    return { error: 'ATV not found' };
  }

  const data = record.data;
  const combinedText = `${data['Title (Normalized)']} ${data['Condition (Raw)']} ${data['Notes / Build Ideas']}`.toLowerCase();

  return {
    conditionScore: ATV_calculateConditionScore(combinedText),
    runningStatus: ATV_detectRunningStatus(combinedText),
    hazardFlags: ATV_identifyHazardFlags(combinedText),
    keyIssues: ATV_extractKeyIssues(combinedText),
    mods: ATV_detectMods(combinedText),
    buildNotes: ATV_generateBuildNotes(combinedText, 0, '', [])
  };
}
