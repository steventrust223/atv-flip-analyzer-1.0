/**
 * SheetSetup.gs
 * Creates all required sheets with proper schemas and headers
 */

// ============================================================================
// SHEET CREATION FUNCTIONS
// ============================================================================

/**
 * Create Config sheet
 */
function createConfigSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.CONFIG);

  // Headers
  sheet.getRange('A1:B1').setValues([['Setting', 'Value']]);

  // Default configuration
  const config = [
    ['Daily_Holding_Cost', 2],
    ['Default_Profit_Margin', 0.25],
    ['Min_ROI_Threshold', 30],
    ['Auto_Normalize_On_Import', true],
    ['CRM_Webhook_URL', ''],
    ['CRM_Auto_Sync', false],
    ['Market_Multiplier', 1.0],
    ['', ''],
    ['=== TIER 1 SETTINGS ===', ''],
    ['Tier1_Min_Profit', 300],
    ['Tier1_Max_Hold_Days', 45],
    ['', ''],
    ['=== TIER 2 SETTINGS ===', ''],
    ['Tier2_Min_Profit', 600],
    ['Tier2_Max_Hold_Days', 60],
    ['', ''],
    ['=== TIER 3 SETTINGS ===', ''],
    ['Tier3_Min_Profit', 1000],
    ['Tier3_Max_Hold_Days', 75],
    ['', ''],
    ['=== TIER 4 SETTINGS ===', ''],
    ['Tier4_Min_Profit', 1500],
    ['Tier4_Max_Hold_Days', 90],
    ['', ''],
    ['=== TIER 5 SETTINGS ===', ''],
    ['Tier5_Min_Profit', 2500],
    ['Tier5_Max_Hold_Days', 120]
  ];

  sheet.getRange(2, 1, config.length, 2).setValues(config);

  // Format
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 150);

  return sheet;
}

/**
 * Create Capital_Tiers sheet
 */
function createCapitalTiersSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.CAPITAL_TIERS);

  // Headers
  const headers = [[
    'Tier',
    'Min_Capital',
    'Max_Capital',
    'Risk_Tolerance',
    'Min_Profit',
    'Max_Hold_Days',
    'Use_Case',
    'Notes'
  ]];
  sheet.getRange('A1:H1').setValues(headers);

  // Tier definitions
  const tiers = [
    ['Tier 1', 0, 500, 'High', 300, 45, 'Parts, rollers, scrap', 'High volume, quick flips'],
    ['Tier 2', 500, 1500, 'Medium', 600, 60, 'ATVs, beaters, projects', 'Most ATV deals fall here'],
    ['Tier 3', 1500, 3500, 'Medium-Low', 1000, 75, 'Complete machines, clean titles', 'Premium ATVs, UTV'],
    ['Tier 4', 3500, 7500, 'Low', 1500, 90, 'Retail flips, low-risk inventory', 'Car territory'],
    ['Tier 5', 7500, 99999, 'Very Low', 2500, 120, 'Long holds, premium units', 'Rare/collectible']
  ];

  sheet.getRange(2, 1, tiers.length, tiers[0].length).setValues(tiers);

  // Format currency columns
  sheet.getRange(2, 2, tiers.length, 2).setNumberFormat('$#,##0');
  sheet.getRange(2, 5, tiers.length, 1).setNumberFormat('$#,##0');

  return sheet;
}

/**
 * Create Source_Staging sheet
 */
function createSourceStagingSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.SOURCE_STAGING);

  const headers = [[
    'Raw_Listing_Text',
    'Source_URL',
    'Source_Platform',
    'Date_Found',
    'Asking_Price',
    'Location',
    'Seller_Contact'
  ]];
  sheet.getRange('A1:G1').setValues(headers);

  // Column widths
  sheet.setColumnWidth(1, 400); // Raw text
  sheet.setColumnWidth(2, 300); // URL
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(7, 200);

  // Add instructions
  sheet.getRange('A2').setNote(
    'INSTRUCTIONS:\n\n' +
    '1. Paste raw listing text here\n' +
    '2. Fill in Source_URL if available\n' +
    '3. Select platform (Facebook, Craigslist, etc.)\n' +
    '4. Date auto-fills\n' +
    '5. Extract asking price\n\n' +
    'Then run: CarHawk > Normalize Data'
  );

  return sheet;
}

/**
 * Create Master_Database sheet
 */
function createMasterDatabaseSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.MASTER_DATABASE);

  const headers = [[
    'Asset_ID',
    'Asset_Type',
    'Year',
    'Make',
    'Model',
    'Platform_Code',
    'Asking_Price',
    'Estimated_Resale',
    'MAO',
    'Part_Out_Floor',
    'Repair_Estimate',
    'Risk_Score',
    'Capital_Tier',
    'Exit_Strategy',
    'Verdict',
    'Confidence_Score',
    'Condition',
    'Title_Status',
    'Has_Engine',
    'Has_Wheels',
    'Notes',
    'Source_URL',
    'Source_Platform',
    'Location',
    'Seller_Contact',
    'Date_Found',
    'Date_Added',
    'Date_Contacted',
    'Date_Purchased',
    'Status'
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  // Format currency columns
  const currencyCols = [7, 8, 9, 10, 11]; // Asking, Resale, MAO, Floor, Repair
  currencyCols.forEach(col => {
    sheet.getRange(2, col, 1000, 1).setNumberFormat('$#,##0');
  });

  // Date columns
  const dateCols = [26, 27, 28, 29];
  dateCols.forEach(col => {
    sheet.getRange(2, col, 1000, 1).setNumberFormat('yyyy-mm-dd');
  });

  return sheet;
}

/**
 * Create Repair_Estimator sheet
 */
function createRepairEstimatorSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.REPAIR_ESTIMATOR);

  const headers = [[
    'Repair_Type',
    'Parts_Cost',
    'Labor_Hours',
    'Labor_Rate',
    'Total_Cost',
    'Difficulty',
    'Notes'
  ]];
  sheet.getRange('A1:G1').setValues(headers);

  // Common ATV repairs
  const repairs = [
    ['Carb Clean/Rebuild', 50, 2, 50, '=B2+C2*D2', 'Easy', 'Most common fix'],
    ['Top End Rebuild', 300, 4, 50, '=B3+C3*D3', 'Medium', 'Piston, rings, gaskets'],
    ['Bottom End Rebuild', 800, 8, 50, '=B4+C4*D4', 'Hard', 'Crank, bearings'],
    ['Clutch Replacement', 200, 3, 50, '=B5+C5*D5', 'Medium', ''],
    ['Electrical Diagnosis', 100, 4, 50, '=B6+C6*D6', 'Medium', 'Time-consuming'],
    ['Plastics Replacement', 300, 1, 0, '=B7+C7*D7', 'Easy', 'Cosmetic'],
    ['Wheels & Tires (used)', 400, 1, 0, '=B8+C8*D8', 'Easy', ''],
    ['Wheels & Tires (new)', 800, 1, 0, '=B9+C9*D9', 'Easy', ''],
    ['Brake Rebuild', 150, 2, 50, '=B10+C10*D10', 'Easy', ''],
    ['Full Engine Swap', 600, 6, 50, '=B11+C11*D11', 'Hard', 'Used engine + install'],
    ['Suspension Rebuild', 400, 4, 50, '=B12+C12*D12', 'Medium', 'All shocks'],
    ['Chain & Sprockets', 100, 1, 50, '=B13+C13*D13', 'Easy', '']
  ];

  sheet.getRange(2, 1, repairs.length, repairs[0].length).setValues(repairs);

  // Format currency
  sheet.getRange(2, 2, repairs.length, 1).setNumberFormat('$#,##0');
  sheet.getRange(2, 4, repairs.length, 1).setNumberFormat('$#,##0');
  sheet.getRange(2, 5, repairs.length, 1).setNumberFormat('$#,##0');

  return sheet;
}

/**
 * Create Parts_Analyzer sheet
 */
function createPartsAnalyzerSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.PARTS_ANALYZER);

  const headers = [[
    'Part_Category',
    'Part_Name',
    'Fits_Model',
    'Condition',
    'Market_Value_Low',
    'Market_Value_High',
    'Avg_Value',
    'Demand',
    'Notes'
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  // Common high-value ATV parts
  const parts = [
    ['Engine', 'Complete Engine', 'Blaster', 'Running', 400, 700, '=AVERAGE(E2:F2)', 'High', ''],
    ['Engine', 'Complete Engine', 'Banshee', 'Running', 800, 1500, '=AVERAGE(E3:F3)', 'Very High', ''],
    ['Engine', 'Complete Engine', 'YFZ450', 'Running', 800, 1400, '=AVERAGE(E4:F4)', 'High', ''],
    ['Engine', 'Complete Engine', 'Raptor 700', 'Running', 1200, 2000, '=AVERAGE(E5:F5)', 'High', ''],
    ['Suspension', '+3 Swingarm', 'Blaster', 'New', 250, 350, '=AVERAGE(E6:F6)', 'Medium', ''],
    ['Suspension', 'Alba A-Arms', 'Blaster', 'Used', 300, 400, '=AVERAGE(E7:F7)', 'Medium', ''],
    ['Suspension', '450R Shock', 'Universal', 'Rebuilt', 300, 450, '=AVERAGE(E8:F8)', 'High', ''],
    ['Frame', 'Clean Frame', 'Blaster', 'Good', 250, 350, '=AVERAGE(E9:F9)', 'Medium', 'No cracks'],
    ['Frame', 'Clean Frame', 'Banshee', 'Good', 400, 600, '=AVERAGE(E10:F10)', 'High', ''],
    ['Wheels', 'Wheels & Tires', 'Universal', 'Good', 300, 600, '=AVERAGE(E11:F11)', 'High', 'Set of 4'],
    ['Exhaust', 'Aftermarket Exhaust', 'Blaster', 'Used', 150, 300, '=AVERAGE(E12:F12)', 'Medium', ''],
    ['Axle', 'Rebuilt Rear Axle', 'Blaster', 'Rebuilt', 200, 300, '=AVERAGE(E13:F13)', 'Medium', '']
  ];

  sheet.getRange(2, 1, parts.length, parts[0].length).setValues(parts);

  // Format currency
  sheet.getRange(2, 5, parts.length, 3).setNumberFormat('$#,##0');

  return sheet;
}

/**
 * Create Enhanced_Analysis sheet
 */
function createEnhancedAnalysisSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.ENHANCED_ANALYSIS);

  const headers = [[
    'Asset_ID',
    'Description',
    'Asking_Price',
    'MAO',
    'All_In_Cost',
    'Best_Case_Resale',
    'Expected_Resale',
    'Worst_Case_Resale',
    'Best_Profit',
    'Expected_Profit',
    'Worst_Profit',
    'ROI',
    'Time_To_Profit_Days',
    'Exit_Strategy',
    'Scenario_Notes'
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  // This sheet is populated by formulas from Master_Database
  // Add example formula in row 2
  sheet.getRange('A2').setNote('This sheet auto-populates from Master_Database via formulas or script');

  return sheet;
}

/**
 * Create Lead_Scoring sheet
 */
function createLeadScoringSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.LEAD_SCORING);

  const headers = [[
    'Asset_ID',
    'Deal_Score',
    'Profit_Score',
    'Risk_Score',
    'Liquidity_Score',
    'Value_Score',
    'Overall_Rank',
    'Compared_To_Avg',
    'Recommendation'
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  return sheet;
}

/**
 * Create Verdict sheet
 */
function createVerdictSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.VERDICT);

  const headers = [[
    'Rank',
    'Asset_ID',
    'Description',
    'Asking_Price',
    'MAO',
    'Est_Resale',
    'Profit',
    'ROI',
    'Risk',
    'Risk_Level',
    'Verdict',
    'Confidence',
    'Condition',
    'Location',
    'URL',
    'Action'
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  // Format currency columns
  sheet.getRange(2, 4, 1000, 4).setNumberFormat('$#,##0');

  // This sheet is populated by rankDeals() function
  sheet.getRange('A2').setNote(
    'This sheet is auto-generated.\n\n' +
    'Run: CarHawk > Update Verdicts\n\n' +
    'Deals are ranked by:\n' +
    '1. Verdict (BUY > WATCH > PASS)\n' +
    '2. Profit potential'
  );

  return sheet;
}

/**
 * Create CRM_Integration sheet
 */
function createCRMIntegrationSheet(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.CRM_INTEGRATION);

  const headers = [[
    'Asset_ID',
    'Sent_To_CRM',
    'CRM_Deal_ID',
    'Platform',
    'Sent_Date',
    'Status',
    'Last_Sync',
    'Notes'
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  // Add CRM webhook configuration
  sheet.getRange('J1').setValue('CRM Settings');
  sheet.getRange('J2').setValue('Webhook URL:');
  sheet.getRange('K2').setValue('');
  sheet.getRange('J3').setValue('API Key:');
  sheet.getRange('K3').setValue('');
  sheet.getRange('J4').setValue('Auto Sync:');
  sheet.getRange('K4').setValue('FALSE');

  return sheet;
}
