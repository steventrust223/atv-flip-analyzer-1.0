# 🦅 Quantum ATV & Powersport Analyzer v1.0

**CarHawk Decision Engine for ATV & Powersport Flipping**

A risk-adjusted ROI analysis system built on Google Sheets + Apps Script that turns messy marketplace listings into ranked, profitable investment decisions.

## What This Is

CarHawk is a **spreadsheet-based underwriting engine** with a **professional HTML UI** that:
- Identifies profitable asset acquisitions (ATVs, bikes, powersports)
- Scores deals using risk-adjusted logic, not emotion
- Automates Maximum Allowable Offer (MAO) calculations
- Protects capital with downside floor analysis
- Ranks opportunities by profit potential and safety
- **NEW:** Beautiful visual dashboard and deal entry interfaces

## Core Philosophy

1. **Every deal has a downside floor** (part-out, liquidation, scrap)
2. **Risk must be quantified**, not guessed
3. **Capital tiers matter** (a $500 deal ≠ $5,000 deal)
4. **Exit strategies defined BEFORE purchase**
5. **Speed beats perfection** (fast filtering > deep analysis on bad deals)

## 🎨 Visual Interface

CarHawk includes 4 professional HTML interfaces:

1. **📊 Dashboard** - Real-time stats, hot deals, quick actions
2. **➕ Deal Entry** - One-click import, instant analysis
3. **🏆 Verdicts** - Ranked deals with filters and color-coding
4. **⚙️ Settings** - Visual configuration panel

Access via: **🦅 CarHawk → Open Dashboard**

See [UI_GUIDE.md](documentation/UI_GUIDE.md) for screenshots and workflows.

---

## Quick Start

### 1. Setup Google Sheet

1. Create a new Google Sheet: https://sheets.google.com
2. Name it: "ATV Flip Analyzer - CarHawk Engine"
3. Open **Extensions → Apps Script**
4. Copy all files from `/apps-script/` to Apps Script editor
5. Save and authorize permissions

### 2. Initialize Sheets

In Apps Script editor:
- Run: `setupSheets()` function
- This creates all 10 required sheets with proper schemas

### 3. Start Analyzing

**Option A: Use the UI** (Recommended)
1. Click **🦅 CarHawk → Open Dashboard**
2. Click **➕ Add New Deal**
3. Paste listing and click **Parse & Import**
4. View instant verdict!

**Option B: Use Sheets** (Advanced)
1. Go to **Source_Staging** sheet
2. Add raw listings manually
3. Run **🦅 CarHawk → Update Verdicts**
4. Check **Verdict** sheet for BUY/WATCH/PASS

---

## Capital Tier System

| Tier | Capital Range | Risk Tolerance | Use Case |
|------|---------------|----------------|----------|
| **Tier 1** | $0–$500 | High | Parts, rollers, scrap |
| **Tier 2** | $500–$1,500 | Medium | ATVs, beaters, project bikes |
| **Tier 3** | $1,500–$3,500 | Medium-Low | Complete machines |
| **Tier 4** | $3,500–$7,500 | Low | Retail flips |
| **Tier 5** | $7,500+ | Very Low | Premium units |

---

## Risk Scoring Engine

```
Risk_Score =
  (Mechanical Risk × 30%)
  + (Paperwork Risk × 20%)
  + (Market Liquidity × 20%)
  + (Repair Complexity × 20%)
  + (Unknowns × 10%)
```

---

## MAO Calculator

```
MAO =
  Estimated_Resale
  - Repair_Estimate
  - Holding_Cost
  - Risk_Buffer
  - Desired_Profit
```

**This is not a spreadsheet. This is a rules engine.** 🦅
