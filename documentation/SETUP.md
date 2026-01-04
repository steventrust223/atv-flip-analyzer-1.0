# CarHawk Setup Guide

## Complete Installation & Configuration

### Step 1: Create Google Sheet

1. Go to https://sheets.google.com
2. Click **"Blank"** to create a new spreadsheet
3. Name it: `ATV Flip Analyzer - CarHawk Engine`

### Step 2: Open Apps Script Editor

1. In your Google Sheet, click **Extensions → Apps Script**
2. You'll see a default `Code.gs` file with placeholder code
3. **Delete all the default code** in `Code.gs`

### Step 3: Add CarHawk Code Files

You need to add 7 code files to Apps Script:

#### Method 1: Manual Copy-Paste (Recommended)

1. In Apps Script editor, you should see `Code.gs`
2. Open `/apps-script/Code.gs` from this repository
3. Copy all contents and paste into the Apps Script `Code.gs`
4. Click the **+** button next to "Files" to add more files:
   - Add `DatabaseManager.gs` (copy from `/apps-script/DatabaseManager.gs`)
   - Add `RiskEngine.gs` (copy from `/apps-script/RiskEngine.gs`)
   - Add `MAOCalculator.gs` (copy from `/apps-script/MAOCalculator.gs`)
   - Add `VerdictEngine.gs` (copy from `/apps-script/VerdictEngine.gs`)
   - Add `SheetSetup.gs` (copy from `/apps-script/SheetSetup.gs`)
   - Add `CRMIntegration.gs` (copy from `/apps-script/CRMIntegration.gs`)

#### Method 2: Using clasp (Advanced)

If you have `clasp` (Google's command-line tool) installed:

```bash
npm install -g @google/clasp
clasp login
clasp create --title "ATV Flip Analyzer" --type sheets
clasp push
```

### Step 4: Save and Authorize

1. Click the **Save** icon (💾) in Apps Script
2. Click **Run** dropdown and select `setupSheets`
3. Click **Run** button
4. A permissions dialog will appear:
   - Click **Review Permissions**
   - Select your Google account
   - Click **Advanced** → **Go to ATV Flip Analyzer (unsafe)**
   - Click **Allow**

### Step 5: Initialize Sheets

After authorization:

1. The `setupSheets()` function will run automatically
2. You'll see a success message: "All CarHawk sheets have been created"
3. Click **OK**

You should now see **10 new sheets** in your spreadsheet:
- Source_Staging
- Master_Database
- Enhanced_Analysis
- Verdict
- Lead_Scoring
- Repair_Estimator
- Parts_Analyzer
- Capital_Tiers
- CRM_Integration
- Config

### Step 6: Configure Settings

1. Go to the **Config** sheet
2. Review and adjust settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Daily_Holding_Cost | $2 | Cost per day to hold inventory |
| Default_Profit_Margin | 25% | Target profit percentage |
| Min_ROI_Threshold | 30% | Minimum acceptable ROI |
| Tier1_Min_Profit | $300 | Minimum profit for $0-$500 deals |
| Tier2_Min_Profit | $600 | Minimum profit for $500-$1,500 deals |
| Tier3_Min_Profit | $1,000 | Minimum profit for $1,500-$3,500 deals |

3. Adjust based on your:
   - Storage costs
   - Time value
   - Market conditions
   - Profit goals

### Step 7: Review Capital Tiers

1. Go to **Capital_Tiers** sheet
2. Review the 5 tiers:
   - **Tier 1**: $0-$500 (parts, rollers)
   - **Tier 2**: $500-$1,500 (most ATVs)
   - **Tier 3**: $1,500-$3,500 (premium machines)
   - **Tier 4**: $3,500-$7,500 (retail flips)
   - **Tier 5**: $7,500+ (rare/collectible)

3. Adjust ranges based on your capital availability

### Step 8: Customize Parts Pricing (Optional)

1. Go to **Parts_Analyzer** sheet
2. Update market values based on your local market:
   - Check eBay sold listings
   - Check Facebook Marketplace
   - Check local classifieds

3. Add more parts specific to models you deal with

### Step 9: Customize Repair Costs (Optional)

1. Go to **Repair_Estimator** sheet
2. Adjust costs based on:
   - Your skill level (reduce labor if DIY)
   - Your labor rate
   - Local parts pricing

---

## Using the System

### Adding Your First Deal

1. Go to **Source_Staging** sheet
2. Add a new row with:
   - **Raw_Listing_Text**: Paste the full listing description
   - **Source_URL**: Link to the listing
   - **Source_Platform**: Facebook, Craigslist, OfferUp, etc.
   - **Asking_Price**: Extract the price (e.g., $800)
   - **Location**: City/area
   - **Seller_Contact**: Phone or message link

3. Click **CarHawk → Normalize Data** (or run automatically)

4. Go to **Verdict** sheet to see the analysis

### Example Entry

| Raw_Listing_Text | Source_URL | Source_Platform | Asking_Price | Location |
|------------------|------------|-----------------|--------------|----------|
| 2001 Yamaha Blaster roller. No engine, no wheels. Has +3 swingarm, Alba A-Arms, 450R shock conversion. Clean frame. | https://... | Facebook | $800 | Phoenix, AZ |

### Understanding the Verdict

The **Verdict** sheet ranks all deals and shows:

| Column | Meaning |
|--------|---------|
| **Rank** | Sorted by best deal first |
| **Verdict** | 🟢 BUY, 🟡 WATCH, or 🔴 PASS |
| **MAO** | Maximum price you should pay |
| **Profit** | Expected profit if bought at MAO |
| **Risk** | Risk score (0-10, lower is better) |
| **Action** | What to do next |

### Decision Making

- **🟢 BUY**: Message seller immediately with your MAO
- **🟡 WATCH**: Monitor listing, message if price drops
- **🔴 PASS**: Ignore completely

---

## Workflow

### Daily Routine

1. **Morning**: Browse Facebook Marketplace, Craigslist, OfferUp
2. **Copy interesting listings** to Source_Staging
3. **Run**: CarHawk → Normalize Data
4. **Check**: Verdict sheet for BUY recommendations
5. **Message sellers** for BUY deals, offer MAO
6. **Update**: Mark deals as contacted in Master_Database

### Weekly Routine

1. **Review**: All WATCH deals - have any dropped in price?
2. **Update**: Parts_Analyzer with current market prices
3. **Analyze**: What types of deals are working best?
4. **Adjust**: Config settings based on results

---

## CRM Integration (Optional)

### SMS-iT Setup

1. Get SMS-iT webhook URL
2. Go to **CRM_Integration** sheet
3. Enter webhook URL in cell K2
4. Enter API key in cell K3
5. Set Auto Sync to TRUE in cell K4
6. Run **CarHawk → Send to CRM**

### OneHash Setup

1. Get OneHash API credentials
2. Open Apps Script editor
3. Go to `CRMIntegration.gs`
4. Update `createOneHashDeal()` function with your credentials
5. Uncomment the function
6. Run **CarHawk → Send to CRM**

### CompanyHub Setup

1. Get CompanyHub API token
2. Open Apps Script editor
3. Go to `CRMIntegration.gs`
4. Update `exportToCompanyHub()` function
5. Uncomment and configure

---

## Troubleshooting

### "Required sheets not found"

- Run **CarHawk → Setup All Sheets**
- Make sure all 10 sheets exist

### "Permission denied"

- Re-authorize: Run any function from Apps Script
- Click **Review Permissions** and allow

### Formulas not calculating

- Click **CarHawk → Refresh Analysis**
- Or manually: `Ctrl+Shift+F9` (Windows) or `Cmd+Shift+F9` (Mac)

### MAO seems wrong

- Check **Config** sheet settings
- Verify **Parts_Analyzer** pricing
- Adjust **Repair_Estimator** costs
- Review risk weights in `RiskEngine.gs`

### No deals showing as BUY

- Your MAO thresholds might be too strict
- Lower profit targets in **Config** sheet
- Check if asking prices are inflated in your market

---

## Advanced Tips

### Custom Risk Weights

Edit `RiskEngine.gs` to adjust risk factor weights:

```javascript
const riskScore = (
  mechanicalRisk * 0.30 +   // Change these percentages
  paperworkRisk * 0.20 +
  liquidityRisk * 0.20 +
  repairRisk * 0.20 +
  unknownsRisk * 0.10
);
```

### Custom Resale Values

Edit `MAOCalculator.gs` to add your local market data:

```javascript
const baseValues = {
  'blaster': { running: 2800, partout: 1800 },
  'your-model': { running: XXXX, partout: XXXX }  // Add here
};
```

### Auto-Import from Facebook (Advanced)

Use Browse AI or Apify to scrape Facebook Marketplace and auto-populate Source_Staging.

---

## Support

- **Issues**: Create an issue in the GitHub repository
- **Questions**: Check the main README.md
- **Updates**: Pull latest changes from repository

---

**You're ready to flip! 🦅**

Start adding deals to Source_Staging and watch CarHawk do the analysis for you.
