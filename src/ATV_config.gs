/**
 * ===== FILE: ATV_config.gs =====
 * Quantum ATV & Powersport Analyzer v1.0 - "Garage Flip Edition"
 *
 * Central configuration file containing:
 * - Sheet names
 * - Header arrays for all sheets
 * - Default thresholds and settings
 * - Color schemes
 * - Enums and constants
 */

// ============================================================================
// SHEET NAMES
// ============================================================================

const ATV_SHEETS = {
  // Import / Staging
  IMPORT_FB: 'IMPORT_FB_ATV',
  IMPORT_CL: 'IMPORT_CL_ATV',
  IMPORT_OU: 'IMPORT_OU_ATV',
  IMPORT_EBAY: 'IMPORT_EBAY_ATV',
  IMPORT_OTHER: 'IMPORT_OTHER_ATV',

  // Core Analysis
  MASTER_DB: 'MASTER_ATV_DB',
  DEAL_ANALYZER: 'ATV_DEAL_ANALYZER',
  LEAD_SCORE: 'ATV_LEAD_SCORE',
  MAO_ENGINE: 'ATV_MAO_ENGINE',
  SALES_VELOCITY: 'ATV_SALES_VELOCITY',

  // Parts & Build Support
  PARTS_NEEDED: 'ATV_PARTS_NEEDED',
  BUILD_PLANS: 'ATV_BUILD_PLANS',
  POST_SALE: 'POST_SALE_TRACKER',

  // Supporting / System
  VERDICT: 'ATV_VERDICT',
  LEADS_TRACKER: 'LEADS_TRACKER_ATV',
  CRM_INTEGRATION: 'CRM_INTEGRATION_ATV',
  SETTINGS: 'ATV_SETTINGS',
  SYSTEM_LOG: 'ATV_SYSTEM_LOG',
  DASHBOARD: 'ATV_DASHBOARD'
};

// List of all import sheet names for iteration
const ATV_IMPORT_SHEETS = [
  ATV_SHEETS.IMPORT_FB,
  ATV_SHEETS.IMPORT_CL,
  ATV_SHEETS.IMPORT_OU,
  ATV_SHEETS.IMPORT_EBAY,
  ATV_SHEETS.IMPORT_OTHER
];

// ============================================================================
// HEADER ARRAYS
// ============================================================================

// Shared headers for all IMPORT sheets
const ATV_HEADERS_IMPORT = [
  'Timestamp',
  'Platform',
  'Listing URL',
  'Title',
  'Asking Price',
  'Location (Raw)',
  'Year',
  'Make',
  'Model',
  'Trim / Variant',
  'Engine Size (cc)',
  'Stroke / Cylinders',
  'Drive Type',
  'Condition (Raw)',
  'Odometer / Hours',
  'Description',
  'Images',
  'Seller Name',
  'Seller Contact',
  'Scrape Job Link',
  'Source Sheet',
  'Seller ZIP / Location'
];

// MASTER_ATV_DB headers
const ATV_HEADERS_MASTER = [
  'ATV ID',
  'Import Source',
  'Platform',
  'Listing URL',
  'Title (Normalized)',
  'Year',
  'Make',
  'Model',
  'Variant / Special Edition',
  'Engine Size (cc)',
  'Engine Type',
  'Drive Type',
  'Category',
  'Condition (Raw)',
  'Condition Score',
  'Running Status',
  'Key Issues',
  'Mods / Extras',
  'Asking Price',
  'Estimated Retail Value',
  'Estimated Project Value',
  'Repair / Build Cost Estimate',
  'Total All-In Cost',
  'MAO',
  'Offer Target',
  'Expected Profit',
  'Profit Margin %',
  'Capital Tier',
  'Lead Score',
  'Risk Score',
  'Deal Class',
  'Platform Velocity Score',
  'Sales Velocity Tier',
  'Distance (mi)',
  'Location Risk',
  'Use Case Fit',
  'Hazard Flags',
  'Seller Name',
  'Seller Contact',
  'Seller Reputation Notes',
  'Notes / Build Ideas',
  'Status',
  'Last Updated'
];

// ATV_PARTS_NEEDED headers
const ATV_HEADERS_PARTS = [
  'Part ID',
  'ATV ID',
  'Build Name / Plan',
  'Part Category',
  'Part Description',
  'Part Source',
  'Estimated Cost',
  'Priority',
  'Status',
  'Notes'
];

// ATV_BUILD_PLANS headers
const ATV_HEADERS_BUILD_PLANS = [
  'Build Plan ID',
  'Build Name',
  'Target Category',
  'Description',
  'Estimated Total Cost',
  'Target Sale Price',
  'Expected Profit',
  'Complexity',
  'Time Estimate (Days)',
  'Required Skills',
  'Notes',
  'Created Date',
  'Last Updated'
];

// POST_SALE_TRACKER headers
const ATV_HEADERS_POST_SALE = [
  'Sale ID',
  'ATV ID',
  'Platform Sold On',
  'Buyer Type',
  'Purchase Date',
  'Purchase Price',
  'Parts & Repair Cost',
  'Total Cost',
  'Sale Date',
  'Sale Price',
  'Gross Profit',
  'Gross Margin %',
  'Holding Time (Days)',
  'ROI %',
  'Notes / Lessons'
];

// ATV_VERDICT headers
const ATV_HEADERS_VERDICT = [
  'Rank',
  'Deal Score',
  'Title',
  'Platform',
  'Category',
  'Asking Price',
  'Offer Target',
  'Expected Profit',
  'Profit Margin %',
  'Capital Tier',
  'Risk Score',
  'Deal Class',
  'Distance (mi)',
  'Hot Build Potential?',
  'Key Issues',
  'Recommended Action',
  'Seller Name',
  'Seller Contact',
  'Listing URL',
  'ATV ID',
  'Notes'
];

// LEADS_TRACKER_ATV headers
const ATV_HEADERS_LEADS = [
  'Lead ID',
  'ATV ID',
  'Seller Name',
  'Seller Contact',
  'Platform',
  'Initial Contact Date',
  'Contact Method',
  'Status',
  'Last Contact',
  'Next Follow-up',
  'Offer Made',
  'Counter Offer',
  'Notes',
  'Outcome'
];

// CRM_INTEGRATION_ATV headers (stub)
const ATV_HEADERS_CRM = [
  'Sync ID',
  'Timestamp',
  'Direction',
  'Entity Type',
  'Entity ID',
  'External System',
  'External ID',
  'Status',
  'Payload',
  'Response',
  'Error Message'
];

// ATV_SETTINGS headers
const ATV_HEADERS_SETTINGS = [
  'Setting Key',
  'Setting Value',
  'Description',
  'Last Updated'
];

// ATV_SYSTEM_LOG headers
const ATV_HEADERS_LOG = [
  'Timestamp',
  'Level',
  'Function',
  'Message',
  'Details'
];

// ATV_DASHBOARD headers (for KPI storage)
const ATV_HEADERS_DASHBOARD = [
  'Metric Name',
  'Current Value',
  'Previous Value',
  'Change %',
  'Last Updated'
];

// ATV_DEAL_ANALYZER headers
const ATV_HEADERS_DEAL_ANALYZER = [
  'ATV ID',
  'Title',
  'Category',
  'Asking Price',
  'Condition Score',
  'Running Status',
  'MAO',
  'Offer Target',
  'Expected Profit',
  'Deal Class',
  'Risk Score',
  'Priority Rank',
  'Action Required',
  'Notes'
];

// ATV_LEAD_SCORE headers
const ATV_HEADERS_LEAD_SCORE = [
  'ATV ID',
  'Title',
  'Base Score',
  'Condition Factor',
  'Price Factor',
  'Velocity Factor',
  'Risk Adjustment',
  'Final Lead Score',
  'Score Breakdown',
  'Last Calculated'
];

// ATV_MAO_ENGINE headers
const ATV_HEADERS_MAO_ENGINE = [
  'ATV ID',
  'Title',
  'Category',
  'Asking Price',
  'Estimated Retail Value',
  'Repair Cost Estimate',
  'Max Offer %',
  'Target Profit',
  'Risk Buffer',
  'Calculated MAO',
  'Offer Target',
  'Margin at MAO',
  'Calculation Notes',
  'Last Updated'
];

// ATV_SALES_VELOCITY headers
const ATV_HEADERS_VELOCITY = [
  'Category',
  'Platform',
  'Avg Days to Sell',
  'Demand Level',
  'Velocity Score',
  'Velocity Tier',
  'Sample Size',
  'Last Updated',
  'Notes'
];

// ============================================================================
// COLOR SCHEMES
// ============================================================================

const ATV_COLORS = {
  // Header colors by sheet type
  HEADER_IMPORT: '#4A90D9',      // Blue for imports
  HEADER_MASTER: '#2E7D32',      // Dark green for master
  HEADER_ANALYSIS: '#6A1B9A',    // Purple for analysis
  HEADER_PARTS: '#E65100',       // Orange for parts/builds
  HEADER_SYSTEM: '#455A64',      // Blue-grey for system
  HEADER_VERDICT: '#C62828',     // Red for verdict

  // Text colors
  HEADER_TEXT: '#FFFFFF',

  // Deal class colors
  DEAL_HOT: '#FF6B6B',           // Bright coral red
  DEAL_SOLID: '#4ECDC4',         // Teal
  DEAL_MARGINAL: '#FFE66D',      // Yellow
  DEAL_PASS: '#95A5A6',          // Grey

  // Status colors
  STATUS_ACTIVE: '#27AE60',
  STATUS_PENDING: '#F39C12',
  STATUS_CLOSED: '#7F8C8D',

  // Risk colors
  RISK_LOW: '#A8E6CF',
  RISK_MEDIUM: '#FFD93D',
  RISK_HIGH: '#FF6B6B',

  // Alternating row colors
  ROW_EVEN: '#F8F9FA',
  ROW_ODD: '#FFFFFF',

  // Capital tier colors
  TIER_T1: '#E8F5E9',            // Light green - Micro
  TIER_T2: '#E3F2FD',            // Light blue - Budget
  TIER_T3: '#FFF3E0',            // Light orange - Mid
  TIER_T4: '#FCE4EC'             // Light pink - High
};

// ============================================================================
// DEFAULT SETTINGS & THRESHOLDS
// ============================================================================

const ATV_DEFAULT_SETTINGS = {
  // MAO Percentages (of estimated retail value)
  MAO_PCT_RUNNER: 0.65,          // 65% for running units
  MAO_PCT_PROJECT: 0.45,         // 45% for non-running projects
  MAO_PCT_FRAME: 0.25,           // 25% for frames/rollers

  // Target profits
  MIN_PROFIT_AMOUNT: 300,        // Minimum $300 profit target
  MIN_PROFIT_MARGIN: 0.25,       // 25% minimum margin

  // Capital tiers (based on all-in cost)
  TIER_T1_MAX: 500,              // Micro: $0-500
  TIER_T2_MAX: 1500,             // Budget: $501-1500
  TIER_T3_MAX: 3500,             // Mid: $1501-3500
  // T4: Above $3500              // High: $3500+

  // Risk thresholds
  RISK_LOW_MAX: 30,
  RISK_MEDIUM_MAX: 60,
  // High: Above 60

  // Deal class thresholds (based on deal score)
  DEAL_HOT_MIN: 80,
  DEAL_SOLID_MIN: 60,
  DEAL_MARGINAL_MIN: 40,
  // PASS: Below 40

  // Distance thresholds (miles)
  DISTANCE_LOCAL: 25,
  DISTANCE_REGIONAL: 100,
  DISTANCE_FAR: 250,

  // Platform base velocity scores (higher = faster selling)
  VELOCITY_FB: 80,
  VELOCITY_CL: 60,
  VELOCITY_OU: 55,
  VELOCITY_EBAY: 70,
  VELOCITY_OTHER: 50,

  // Negotiation cushion (subtract from MAO for offer target)
  NEGOTIATION_CUSHION_PCT: 0.10  // 10% below MAO
};

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

const ATV_ENUMS = {
  // Running status options
  RUNNING_STATUS: [
    'Runs Great',
    'Runs',
    'Runs Rough',
    'Not Running',
    'Roller',
    'Frame Only',
    'Unknown'
  ],

  // Categories
  CATEGORIES: [
    'Sport ATV',
    'Utility ATV',
    'Youth ATV',
    'Dirt Bike',
    'Side-by-Side',
    'Go-Kart',
    'Other'
  ],

  // Engine types
  ENGINE_TYPES: [
    '2-Stroke',
    '4-Stroke',
    'Electric',
    'Unknown'
  ],

  // Drive types
  DRIVE_TYPES: [
    '2x4',
    '4x4',
    'Chain',
    'Shaft',
    'Unknown'
  ],

  // Deal classes
  DEAL_CLASSES: [
    'HOT',
    'SOLID',
    'MARGINAL',
    'PASS'
  ],

  // Capital tiers
  CAPITAL_TIERS: [
    'T1 Micro',
    'T2 Budget',
    'T3 Mid',
    'T4 High'
  ],

  // Velocity tiers
  VELOCITY_TIERS: [
    'A - Very Fast',
    'B - Normal',
    'C - Slow',
    'D - Very Slow'
  ],

  // Hazard flags
  HAZARD_FLAGS: [
    'NO_TITLE',
    'BLOWN_MOTOR',
    'FRAME_DAMAGE',
    'PARTS_MISSING',
    'UNKNOWN_HISTORY',
    'FLOOD_DAMAGE',
    'SALVAGE',
    'STOLEN_RISK',
    'LIEN_RISK'
  ],

  // Lead statuses
  LEAD_STATUSES: [
    'New',
    'Contacted',
    'Negotiating',
    'Offer Made',
    'Under Contract',
    'Purchased',
    'Lost',
    'Dead'
  ],

  // Part statuses
  PART_STATUSES: [
    'Needed',
    'Sourcing',
    'Ordered',
    'Received',
    'Installed'
  ],

  // Part priorities
  PART_PRIORITIES: [
    'Critical',
    'High',
    'Medium',
    'Low'
  ],

  // Buyer types
  BUYER_TYPES: [
    'Retail',
    'Flipper',
    'Dealer',
    'Friend/Family',
    'Export',
    'Trade'
  ],

  // Recommended actions
  RECOMMENDED_ACTIONS: [
    'CALL NOW',
    'TEXT',
    'GO SEE',
    'MAKE OFFER',
    'MONITOR',
    'PASS'
  ],

  // Use case fits
  USE_CASES: [
    'Trail Riding',
    'Track/Race',
    'Kids/Youth',
    'Farm/Work',
    'Collector',
    'Parts Only',
    'General'
  ],

  // Platforms
  PLATFORMS: [
    'Facebook',
    'Craigslist',
    'OfferUp',
    'eBay',
    'Cycle Trader',
    'ATV Trader',
    'Other'
  ],

  // Log levels
  LOG_LEVELS: [
    'INFO',
    'WARN',
    'ERROR',
    'DEBUG'
  ]
};

// ============================================================================
// COMMON MAKE/MODEL DATA (for normalization)
// ============================================================================

const ATV_COMMON_MAKES = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'Kawasaki',
  'Polaris',
  'Can-Am',
  'Arctic Cat',
  'KTM',
  'Husqvarna',
  'Beta',
  'Gas Gas',
  'TM Racing',
  'Sherco',
  'CFMoto',
  'Kymco',
  'TaoTao',
  'Coolster',
  'SSR',
  'Other'
];

// Popular models for matching (not exhaustive)
const ATV_POPULAR_MODELS = {
  'Honda': ['TRX450R', 'TRX400EX', 'TRX250X', 'Rancher', 'Foreman', 'Rubicon', 'CRF450', 'CRF250', 'CRF150', 'CRF110', 'CRF50'],
  'Yamaha': ['Raptor 700', 'Raptor 660', 'YFZ450', 'Banshee', 'Blaster', 'Warrior', 'Grizzly', 'Kodiak', 'YZ450F', 'YZ250', 'YZ125', 'TTR'],
  'Suzuki': ['LTR450', 'LTZ400', 'QuadRacer', 'King Quad', 'RM-Z450', 'RM-Z250', 'DR-Z'],
  'Kawasaki': ['KFX450R', 'KFX400', 'KFX700', 'Brute Force', 'Prairie', 'KX450', 'KX250', 'KLX'],
  'Polaris': ['Outlaw', 'Scrambler', 'Sportsman', 'RZR', 'Ranger', 'General'],
  'Can-Am': ['DS450', 'DS650', 'Renegade', 'Outlander', 'Maverick', 'Commander']
};

// ============================================================================
// KEYWORD PATTERNS (for condition/issue detection)
// ============================================================================

const ATV_KEYWORDS = {
  // Indicates non-running or major issues
  ISSUES_MAJOR: [
    'blown', 'seized', 'locked up', 'no compression', 'needs motor',
    'needs engine', 'frame damage', 'bent frame', 'wrecked', 'salvage',
    'flood', 'fire damage', 'not running', 'won\'t start', 'no spark',
    'no title', 'lost title', 'bill of sale only', 'parts only'
  ],

  // Indicates project status
  PROJECT_INDICATORS: [
    'project', 'needs work', 'needs', 'fixer', 'mechanic special',
    'as is', 'as-is', 'roller', 'frame', 'basket case', 'rebuild',
    'restore', 'restoration'
  ],

  // Indicates minor issues
  ISSUES_MINOR: [
    'needs plastics', 'needs tires', 'cosmetic', 'runs rough',
    'idles rough', 'needs carb', 'carb work', 'needs tune',
    'battery', 'charging', 'electrical'
  ],

  // Indicates good condition
  GOOD_INDICATORS: [
    'excellent', 'mint', 'pristine', 'like new', 'low hours',
    'garage kept', 'adult owned', 'never raced', 'well maintained',
    'runs great', 'runs perfect', 'ready to ride', 'turn key'
  ],

  // Mods and extras
  MODS_INDICATORS: [
    'big bore', 'ported', 'cammed', 'pipe', 'exhaust', 'intake',
    'rebuilt', 'fresh top end', 'hot cams', 'wiseco', 'pro design',
    'nerf bars', 'bumper', 'skid plate', 'a-arms', 'shocks', 'suspension'
  ],

  // Build type indicators
  BUILD_TYPES: {
    'drag': ['drag', 'stretched', 'wheelie bar'],
    'trail': ['trail', 'woods', 'gncc'],
    'mx': ['mx', 'motocross', 'race', 'track'],
    'sand': ['sand', 'dunes', 'paddle'],
    'mud': ['mud', 'snorkel', 'lifted']
  }
};

// ============================================================================
// UI CONFIGURATION
// ============================================================================

const ATV_UI_CONFIG = {
  SIDEBAR_WIDTH: 350,
  DIALOG_WIDTH: 600,
  DIALOG_HEIGHT: 500,

  // Number of top deals to show in review panel
  TOP_DEALS_COUNT: 20,

  // Recent log entries to show in control center
  RECENT_LOGS_COUNT: 10
};
