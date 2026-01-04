# 🦅 CarHawk Quick Start Guide

## 5-Minute Setup

### 1. Create Google Sheet
- Go to https://sheets.google.com
- Create new blank spreadsheet
- Name it: "ATV Flip Analyzer"

### 2. Add Apps Script Code
- Click **Extensions → Apps Script**
- Delete default code
- Copy all 7 files from `/apps-script/` folder
- Save

### 3. Run Setup
- In Apps Script, run `setupSheets()`
- Authorize permissions
- Wait for success message

### 4. Start Adding Deals
- Go to **Source_Staging** sheet
- Paste listing details
- Run **CarHawk → Normalize Data**
- Check **Verdict** sheet for results

---

## Understanding the Verdict

| Verdict | Meaning | Action |
|---------|---------|--------|
| 🟢 **BUY** | Strong deal | Message seller with MAO |
| 🟡 **WATCH** | Fair deal | Monitor for price drop |
| 🔴 **PASS** | Poor deal | Ignore |

---

## Key Concepts

### MAO (Maximum Allowable Offer)
**Your ceiling price — NEVER pay more**

```
MAO = Resale - Repairs - Holding - Risk - Profit
```

### Risk Score (0-10)
- **0-3**: Low risk (green light) 🟢
- **4-6**: Medium risk (caution) 🟡
- **7-10**: High risk (avoid) 🔴

### Capital Tiers
- **Tier 1**: $0-$500 (parts/rollers)
- **Tier 2**: $500-$1,500 (most ATVs)
- **Tier 3**: $1,500-$3,500 (premium)
- **Tier 4**: $3,500-$7,500 (retail)
- **Tier 5**: $7,500+ (collectible)

### Part-Out Floor
**Worst-case liquidation value**
- Your safety net
- Asking price should be near or below this

---

## Daily Workflow

### Morning Routine (15 min)
1. Browse Facebook Marketplace / Craigslist
2. Copy interesting listings to Source_Staging
3. Run normalize data

### Review Deals (10 min)
4. Check Verdict sheet
5. Message sellers for BUY deals
6. Bookmark WATCH deals

### Follow-Up (as needed)
7. Negotiate using MAO as ceiling
8. Update dates when contacted/purchased

---

## Example Deal Entry

| Column | What to Enter |
|--------|---------------|
| **Raw_Listing_Text** | Full listing description |
| **Source_URL** | Link to ad |
| **Source_Platform** | Facebook / Craigslist / etc |
| **Asking_Price** | $800 |
| **Location** | Phoenix, AZ |
| **Seller_Contact** | Phone or message link |

Run **CarHawk → Normalize Data** and check Verdict!

---

## Pro Tips

🔥 **Never skip the part-out floor** — It's your downside protection
🔥 **Trust the Risk_Score** — If >7, walk away
🔥 **MAO is non-negotiable** — Discipline beats deals
🔥 **Speed matters** — Good deals vanish in hours

---

## Negotiation Template

```
Hey! Interested in [MAKE/MODEL].

I can pick it up today. Would you take [MAO - 20%] cash?

If they say no:
What's the lowest you'd take?

Walk away if above your MAO.
```

---

## Need Help?

- **Full Setup**: See `/documentation/SETUP.md`
- **Example Analysis**: See `/examples/blaster-roller-analysis.md`
- **Issues**: GitHub issues tab

---

**Let's make money. 🦅**

This is not a spreadsheet. This is a rules engine.
