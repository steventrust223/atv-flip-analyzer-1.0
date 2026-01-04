# Example Deal Analysis: Yamaha Blaster Roller

## Real-World CarHawk Analysis

This is the exact Blaster roller deal you analyzed earlier, showing how CarHawk processes it.

---

## 📥 Source Listing (Source_Staging)

**Raw Listing Text:**
```
Yamaha Blaster ROLLER / CHASSIS BUILD — $800

No engine, no wheels or tires. Built chassis with high-value suspension
and drivetrain components.

REAR:
- +3 Swingarm (NEW - never used)
- Rebuilt Rear Axle (fresh)
- 450R Rear Shock Conversion (HUGE upgrade)

FRONT:
- Alba +2 A-Arms (desirable brand)
- Disc Brake Setup (visible in photos)
- Front Shock Setup (aftermarket)

FRAME & MISC:
- Clean Blaster Frame
- Subframe / Controls included
- Skid / Nerf / Bracing

Located in Phoenix, AZ. Cash only. Message to see.
```

**Source Data Entry:**

| Field | Value |
|-------|-------|
| Raw_Listing_Text | (full text above) |
| Source_URL | https://facebook.com/marketplace/item/12345 |
| Source_Platform | Facebook Marketplace |
| Date_Found | 2026-01-04 |
| Asking_Price | $800 |
| Location | Phoenix, AZ |
| Seller_Contact | (555) 123-4567 |

---

## 🔄 Data Normalization (Master_Database)

After running **CarHawk → Normalize Data**, the system extracts:

### Extracted Information

| Field | Extracted Value | How Detected |
|-------|----------------|--------------|
| **Asset_Type** | ATV | Default for this type |
| **Year** | (Unknown) | Not mentioned in listing |
| **Make** | Yamaha | Keyword match: "yamaha" |
| **Model** | Blaster | Keyword match: "blaster" |
| **Platform_Code** | YFS200 | Known model → platform mapping |
| **Condition** | Roller/Parts | Keywords: "roller", "no engine" |
| **Title_Status** | Unknown | Not mentioned |
| **Has_Engine** | FALSE | Explicit: "no engine" |
| **Has_Wheels** | FALSE | Explicit: "no wheels or tires" |
| **Capital_Tier** | Tier 2 | $800 falls in $500-$1,500 range |

### Extracted Notes
```
+3 swingarm; rebuilt rear axle; 450r shock conversion;
alba a-arms; disc brake setup; aftermarket front shocks;
clean frame
```

---

## 🎯 Risk Assessment (Risk_Score)

### Risk Factor Breakdown

| Risk Factor | Score (0-10) | Reasoning |
|-------------|--------------|-----------|
| **Mechanical Risk** | 3.0 | ✅ No engine = no engine surprises |
|  | | ✅ Rebuilt components reduce risk |
|  | | ✅ "Roller" condition is predictable |
| **Paperwork Risk** | 4.0 | ⚠️ No title mentioned (but ATVs often don't need) |
|  | | ⚠️ Unknown title status |
| **Market Liquidity** | 3.5 | ✅ Yamaha = popular brand |
|  | | ✅ Blaster = hot model |
|  | | ⚠️ Parts/roller = narrower buyer pool |
| **Repair Complexity** | 2.0 | ✅ No repairs needed to part out |
|  | | ✅ If building: need engine but straightforward |
| **Unknowns Risk** | 4.0 | ⚠️ No year specified |
|  | | ⚠️ No title status |
|  | | ✅ Condition well-described |

### Overall Risk Score: **3.5 / 10** 🟢

**Risk Level: LOW**

**Risk Buffer:** $150 (based on low risk)

---

## 💰 MAO Calculation (Maximum Allowable Offer)

### Step 1: Estimated Resale Value

**Base Value (Blaster roller):** $1,800
- +15% for aftermarket parts: **$2,070**

**Final Estimated Resale:** $2,070

### Step 2: Repair Estimate

**Scenario A: Part-Out**
- No repairs needed: **$0**

**Scenario B: Build & Flip**
- Used Blaster engine: $500
- Engine installation: $150
- Wheels & tires (used): $400
- Misc (chain, sprockets, fluids): $150
- **Total Build Cost:** $1,200

### Step 3: Holding Cost

**Part-Out:** 45 days × $2/day = $90
**Build & Flip:** 60 days × $2/day = $120

### Step 4: Risk Buffer

**Low risk (3.5 score):** 5% of resale value
- $2,070 × 0.05 = **$104**

### Step 5: Desired Profit

**Tier 2 minimum:** $600

### MAO Calculation (Part-Out Strategy)

```
MAO = Estimated_Resale - Repair_Estimate - Holding_Cost - Risk_Buffer - Desired_Profit
MAO = $2,070 - $0 - $90 - $104 - $600
MAO = $1,276
```

**Maximum Allowable Offer:** $1,276

### Part-Out Floor (Downside Protection)

**Conservative parts value:**
- +3 Swingarm: $250
- 450R Shock: $300
- Alba A-Arms: $300
- Rebuilt Axle: $200
- Frame: $250
- Misc parts: $200

**Part-Out Floor:** $1,500

**Safety Check:** Asking price ($800) is **47% below** part-out floor ✅

---

## 📊 Profit Scenarios

### Scenario A: Part-Out Strategy

| Metric | Value |
|--------|-------|
| Buy Price | $800 |
| Additional Investment | $0 (list parts immediately) |
| **All-In Cost** | **$800** |
| Expected Return | $1,850 (conservative parts sales) |
| **Profit** | **$1,050** |
| **ROI** | **131%** |
| Time to Profit | 45-60 days |
| Risk Level | Very Low |

**Verdict:** Part out high-value components individually

### Scenario B: Build & Flip Strategy

| Metric | Value |
|--------|-------|
| Buy Price | $800 |
| Build Costs | $1,200 (engine + wheels + misc) |
| **All-In Cost** | **$2,000** |
| Expected Resale | $2,800-$3,200 (running Blaster) |
| **Profit** | **$800-$1,200** |
| **ROI** | **40-60%** |
| Time to Profit | 60-90 days |
| Risk Level | Low-Medium |

**Verdict:** Only if you have spare engine/wheels

---

## 🏆 CarHawk Automated Verdict

### Final Verdict: **BUY** 🟢

**Confidence Score:** 85/100

### Reasoning

✅ **Asking price ($800) is 37% below MAO ($1,276)**
✅ **Protected downside:** Asking is below part-out floor
✅ **Low risk (3.5/10):** No engine unknowns
✅ **High-value parts:** Known aftermarket components
✅ **Popular platform:** Yamaha Blaster parts always sell
✅ **Multiple exit strategies:** Part-out OR build

### Action Item

**💰 Message seller immediately**

**Negotiation Strategy:**
1. Start at $700: "I can pick it up today with $700 cash"
2. Walk-away price: $800 (asking price is already fair)
3. Absolute ceiling: $1,000 (still profitable)

**Message Template:**
```
Hey! Interested in the Blaster roller. I can come pick it up today.
Would you take $700 cash?
```

---

## 📈 Comparison to Other Deals

### vs. $600 Non-Running Blaster (Complete)

| Category | $800 Roller | $600 Non-Runner |
|----------|-------------|-----------------|
| Engine Risk | 🟢 None | 🔴 High (unknown issue) |
| Parts Quality | 🟢 High-end | 🟡 Stock/unknown |
| Downside Floor | $1,500 | ~$900 |
| Build Ceiling | Very High | Medium |
| **CarHawk Score** | **9.2/10** | **7.5/10** |

**Winner:** $800 Roller (safer, higher upside)

---

## 🎓 Key Lessons from This Deal

### Why This Is a STRONG BUY

1. **No Engine Surprises**
   - You're buying known-value parts
   - No risk of seized engine, bad crank, etc.

2. **High-Quality Parts**
   - Aftermarket suspension alone almost covers asking price
   - New/rebuilt components hold value

3. **Protected Downside**
   - Even worst-case part-out yields profit
   - Can't lose money at $800

4. **Multiple Paths to Profit**
   - Part out immediately (45 days)
   - Build if you have engine (90 days)
   - Hold for someone else to build (passive)

5. **Market Proven**
   - Blaster is perennially popular
   - Parts always in demand
   - Easy to liquidate

### What CarHawk Caught That Manual Analysis Might Miss

- ✅ Calculated exact part-out floor ($1,500)
- ✅ Quantified risk score (3.5 vs. gut feeling)
- ✅ Computed true MAO ($1,276 vs. guessing)
- ✅ Compared holding costs across scenarios
- ✅ Factored in market liquidity
- ✅ Provided negotiation ranges

---

## 📋 Post-Purchase Checklist

If you buy this Blaster:

### Immediate (Day 1)
- [ ] Inspect all parts in person
- [ ] Take detailed photos of everything
- [ ] Test fit all components
- [ ] Identify any missing hardware

### Week 1 (Part-Out Strategy)
- [ ] List +3 swingarm on Facebook ($300)
- [ ] List 450R shock ($350)
- [ ] List Alba A-Arms ($350)
- [ ] List frame ($300)
- [ ] List rebuilt axle ($250)
- [ ] List misc parts in bulk ($200)

### Week 1 (Build Strategy)
- [ ] Source used engine ($500-700)
- [ ] Find wheels/tires ($300-400)
- [ ] Order missing parts (chain, etc.)
- [ ] Plan build timeline

### Month 1
- [ ] Track which parts sell first
- [ ] Adjust pricing based on demand
- [ ] Update Parts_Analyzer with actual sale prices

### Month 2
- [ ] Complete part-out or build
- [ ] Calculate actual profit
- [ ] Update CarHawk with learnings

---

## 💡 CarHawk Pro Tips from This Deal

1. **Trust the part-out floor** — It's your safety net
2. **Low risk beats high upside** — This deal is both
3. **Aftermarket parts = premium pricing** — Always factor in
4. **No engine can be GOOD** — Eliminates biggest unknown
5. **Popular platform = fast exit** — Liquidity matters

---

**This is why CarHawk works.**

It turns emotion ("ooh, cool parts!") into math ("$1,050 profit, 131% ROI, 3.5 risk").

🦅 **STRONG BUY AT $800**
