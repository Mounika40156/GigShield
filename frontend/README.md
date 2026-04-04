# 🛡️ GigShield – AI-Powered Parametric Insurance Platform for Gig Delivery Workers

> *"India's gig workers deserve better. GigShield delivers."*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gig--shield--six.vercel.app-orange?style=for-the-badge)](https://gig-shield-six.vercel.app/)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-red?style=for-the-badge)](https://youtu.be/s2i6chsLJAo)
[![GitHub](https://img.shields.io/badge/GitHub-GigShield-black?style=for-the-badge)](https://github.com/Mounika40156/GigShield)

---

## 🚀 Phase 2 Update — Automation & Protection (April 4, 2026)

### What's Built in Phase 2

#### Registration Process
- 4-step onboarding: Personal Info → Work Details → Verification → AI Risk Profile
- OTP phone verification + real-time GPS zone capture + Partner ID upload
- AI risk assessment runs at registration — assigns LOW / MEDIUM / HIGH risk tier

#### Insurance Policy Management
- 3 weekly plans: Basic (₹49), Standard (₹99), Premium (₹149)
- AI-adjusted pricing based on city risk multiplier + platform risk factor
- Policy persisted across sessions — weekly renewal with one click
- Instant activation with Razorpay mock payment flow

#### Dynamic Premium Calculation
- XGBoost-inspired rule engine with 6 feature weights:
  City Rain Risk (35%), Heat Index (20%), AQI History (15%),
  Platform Risk (15%), Earnings Level (10%), Trust Score (5%)
- Real-time recalculation as user changes city/platform/plan
- Historical disruption chart (8 months IMD data) shown per city

#### Claims Management — Zero Touch Flow
- 5 parametric triggers monitored: Heavy Rain, Heatwave, Severe AQI, Flood Alert, Platform Outage
- One-click simulate → 5-layer AI fraud check animates in real time
- Payout formula: `Daily Earnings × Severity % × 1.5 duration factor`
- Severity by trigger: Rain=40%, Outage=50%, Flood=60%, Heat=30%, AQI=25%
- UPI payout receipt generated with Transaction ID within 3 seconds

#### Fraud Detection — 5 Layers
1. GPS Signal Validation — location vs registered zone
2. Platform Login Check — was worker active on trigger day?
3. Device Fingerprint Check — one account per device
4. Behavioral Baseline Match — trust score threshold
5. Trust Score Evaluation — final gate before payout release

#### Live Demo
- **URL:** https://gig-shield-six.vercel.app
- **Test OTP:** `1234`
- **Demo workers:** Ravi Kumar (clean), Priya Sharma (fraud), Arjun Patel (suspicious)

---

## Market Crash Response — Adversarial Defense & Anti-Spoofing Strategy

> **500 delivery partners. Fake GPS. Real payouts. A coordinated fraud ring just drained a platform's liquidity pool — and yours is next.**

### The Attack Vector
A fraud ring registers 500 fake accounts, simulates GPS locations inside heavy-rain zones, and triggers automatic payouts — draining the insurance pool in hours. Simple GPS verification is dead. Here's how GigShield fights back.

---

### Layer 1 — GPS Spoofing Detection

Raw GPS coordinates are never trusted alone. Every location ping is cross-validated using a **multi-signal triangulation model**:

| Signal | What We Check |
|--------|--------------|
| **GPS coordinates** | Location at payout trigger time |
| **Cell tower triangulation** | Does cell tower data match GPS location? |
| **IP geolocation** | Does the device IP match the claimed region? |
| **Accelerometer & gyroscope** | Is the device actually moving like a delivery rider? |
| **Battery & network state** | Is the device behaving like a field device or a desktop? |

**Spoofing Red Flags:**
- GPS location changes faster than physically possible (teleportation detection)
- GPS signal is suspiciously perfect — real outdoor GPS has natural drift noise; a spoofer's signal is too clean
- Cell tower data contradicts GPS coordinates
- Device is stationary but GPS claims movement
- Multiple accounts sharing the same cell tower cluster

---

### Layer 2 — Behavioral Pattern Analysis

Each registered user builds a **behavioral baseline** over time:

- Average daily active hours
- Typical delivery zones (geofenced clusters)
- Login frequency and session length
- Historical payout trigger frequency

**Fraud Ring Detection Logic:**

A fraud ring doesn't behave like a real worker. We flag accounts where:

- **Activation spike**: More than 3 new accounts activate within the same 1km² zone within 1 hour of a disruption trigger → automatic hold
- **Synchronized claims**: 10+ accounts trigger payouts within the same 5-minute window in the same location → liquidity protection pause + human review
- **Zero delivery history**: Account has no movement history before the disruption event — a real worker has GPS traces across days
- **Template registration**: Name patterns, phone number sequences, or device fingerprints that suggest bulk account creation

---

### Layer 3 — Device & Identity Fingerprinting

Each device is assigned a **hardware fingerprint** combining:
- Device model + OS version
- Screen resolution + battery health
- SIM card operator + IMEI hash (where permitted)

**Rules:**
- One account per device fingerprint — if a second account tries to register on the same device, both are flagged
- If 5+ devices share the same WiFi router MAC address or IP subnet during registration, the cluster is quarantined for manual review
- VPN and GPS mock app detection — known spoofing apps (Fake GPS, Mock Location) are detected via device package signatures on Android

---

### Layer 4 — Real-Time Liquidity Protection

When a large-scale disruption event occurs (e.g., a citywide flood alert):

1. **Claim velocity monitoring**: If payouts in a single zone exceed 2× the historical average rate, a **soft cap** is activated
2. **Tiered payout release**: Instead of instant full payout, 60% is released immediately and 40% after a 2-hour behavior validation window
3. **Ring isolation**: If a fraud cluster is detected mid-event, affected accounts are frozen without impacting legitimate users in the same zone

---

### Layer 5 — Honest Worker Protection (Zero False Positives)

The hardest problem: **how do you block a fraud ring without punishing a genuine stranded worker?**

Our approach:

- **Trust score system**: Every account has a rolling trust score (0–100) built from weeks of genuine behavior. A new account with no history doesn't get blocked — it gets a **reduced initial payout cap** (₹500 max) that increases as trust is established
- **Appeal window**: Any flagged payout gets an instant SMS/notification with a one-tap appeal option — a human reviewer resolves it within 2 hours
- **Disruption witness validation**: If 80%+ of trusted accounts in a zone are claiming, new or low-trust accounts in the same zone get auto-approved — the crowd validates the disruption
- **Graduated holds, not bans**: Suspicious accounts are held, not banned. A false positive can be reversed. A wrongful ban cannot

---

### Fraud Scenario Playbook

| Scenario | Detection Method | Response |
|----------|-----------------|----------|
| Single user with GPS spoofing app | Device package scan + signal noise analysis | Account flagged, payout held |
| 50-account fraud ring, same area | Activation spike + device fingerprint cluster | Cluster quarantined, human review |
| Coordinated attack during real flood | Behavioral baseline deviation + payout velocity | Tiered release, ring isolated, real users unaffected |
| Fake account with no history | Zero movement trace + trust score = 0 | Capped at ₹500, escalates with verified activity |
| Insider attack (platform employee) | Anomaly detection on admin-level payout overrides | Audit log alert, two-person approval required |

---

## How GigShield Verifies Real Delivery Workers

> *"Anyone can claim to be a delivery partner. Here's how we make sure they actually are."*

This is the hardest problem in gig worker insurance — and most platforms ignore it. GigShield uses a **4-level progressive verification system** that gets stronger over time.

---

### Level 1 — Document Upload (At Registration)
- User uploads their **Swiggy/Zomato partner ID card** or onboarding letter
- AI-powered OCR extracts name, partner ID, and platform
- Cross-referenced against the user's registered phone number
- Quick to implement, acts as the first filter

---

### Level 2 — Movement Pattern Analysis (Ongoing)
Real delivery workers move in a **very specific behavioral pattern** that is nearly impossible to fake consistently:

| Signal | Genuine Delivery Worker | Fraudster |
|--------|------------------------|-----------|
| **Trip duration** | 5–15 min short trips repeatedly | Stationary or random movement |
| **Active hours** | 11AM–2PM and 7PM–10PM clusters | Anytime, no pattern |
| **Location clusters** | Near known restaurants & delivery zones | Random or fixed location |
| **Speed** | Consistent with a bike (20–40 km/h) | Walking speed or zero movement |
| **Daily GPS traces** | Hundreds of location points across the city | Few or no traces |

Our AI builds a **delivery rider signature** from the first week of app usage. If a user's movement pattern matches this signature, their trust score increases automatically.

---

### Level 3 — UPI Payment Pattern Validation
- User links their UPI/bank account during onboarding
- GigShield checks for **regular small incoming payments of ₹40–₹80** — the exact per-delivery payout pattern from Swiggy/Zomato
- This payment fingerprint is **unmistakable proof** of active delivery work
- Cannot be faked without actually doing deliveries

---

### Level 4 — Platform API Integration *(Phase 2 Roadmap)*
- Direct integration with **Swiggy and Zomato Partner APIs**
- Pulls real-time delivery count, active hours, and verified earnings
- **Cryptographically confirms** the user is a registered, active delivery partner
- Eliminates the need for any manual verification entirely

---

### Progressive Trust — The Smart Safeguard

Even without Level 3 and 4, genuine workers prove themselves naturally over time:

```
Week 1  →  New account, capped payout ₹500 (low trust)
Week 2  →  Movement traces match delivery rider pattern → Trust Score ↑
Week 3  →  Consistent behavior confirmed → Payout cap ₹1,500
Week 4+ →  Full plan payout unlocked → Trusted worker
```

**A fraudster won't fake delivery movements for 3 weeks just to unlock ₹500 payouts — it's simply not worth it.** That's the real protection progressive trust provides.

---

##  Who Is Our User, Really?

Meet **Arjun**, 24, delivery partner for Swiggy in Hyderabad.

Arjun wakes up at 7 AM, checks the weather, and makes a silent calculation: *"Will today be worth it?"* He earns ₹700–₹1,000 on a good day, but after fuel costs of ₹350–₹400, his net take-home is often under ₹600. He has no savings buffer. No sick leave. No employer.

One Tuesday afternoon, the skies open. Rain floods Tolichowki. His phone shows zero new orders. He sits at a petrol pump for 3 hours. He earns ₹120 that day.

Arjun doesn't have time to file a claim. He doesn't trust insurance — his cousin filed a motor claim once and waited 6 months. He needs money in his UPI account **today**, not a promise.

**GigShield is built for Arjun.** Not for people who can afford to wait. Not for people with HR departments. For the 15 million gig delivery workers in India who live one bad weather day away from skipping dinner.

---

##  The Problem

Gig delivery workers on platforms like Swiggy and Zomato depend entirely on daily active hours. Environmental disruptions directly cut their income:

| Disruption | Income Impact |
|-----------|--------------|
| Heavy Rain (>60mm) | 40–60% drop in orders |
| Heatwave (>45°C) | 25–35% drop (customers stay indoors, workers physically at risk) |
| Severe AQI (>400) | 20–30% drop + health risk |
| Flood Alert | Near-zero orders, dangerous roads |

**The gap:** No existing insurance product serves this user. Traditional insurers require documentation, processing time, and trust the worker doesn't have bandwidth for. Platform-side income protection doesn't exist.

**GigShield fills this gap with full automation.**

---

##  Our Solution — Parametric Insurance

Parametric insurance pays based on **a measurable event**, not a reported loss. When rainfall crosses 60mm — we pay. No receipts. No proof. No waiting.

```
Real-World Event → Environmental API → Threshold Crossed → 
AI Fraud Check → Payout Calculated → UPI Transfer (< 5 min)
```

---

##  How the AI Actually Works

GigShield uses machine learning at three critical points:

### 1. Risk Assessment at Onboarding
When a user registers, our model evaluates:
- **Historical weather data** for their city/zone (last 12 months)
- **Disruption frequency** of their registered location
- **Device and identity signals** (for trust scoring)

Output: A **risk tier** (Low / Medium / High) that determines their premium pricing and initial payout cap.

**Model used:** Gradient Boosted Decision Trees (XGBoost) trained on IMD weather data + historical claim simulations

### 2. Income Loss Estimation
When a disruption is detected, the AI estimates how much income the worker likely lost:

```
Estimated Loss = Base Daily Earnings × Disruption Severity Score × Duration Factor
```

- **Base Daily Earnings**: Derived from the worker's self-reported earnings, validated against city-level platform averages
- **Disruption Severity Score**: Normalized 0–1 score based on how far the trigger threshold was exceeded (60mm rain = 0.5, 90mm = 1.0)
- **Duration Factor**: How long the disruption lasted within working hours

The payout = `min(Estimated Loss, Plan Max Payout)`

**Model used:** Linear regression with feature engineering on weather severity + time-of-day + city-level order density proxies

### 3. Fraud Detection
A binary classifier runs on every payout trigger:

**Features:**
- Trust score (0–100, built over account lifetime)
- GPS signal quality metrics
- Device fingerprint match
- Claim frequency vs. historical baseline
- Zone-level claim density (are 50 people claiming from the same 100m radius?)

**Output:** APPROVE / HOLD / REJECT with confidence score

**Model used:** Random Forest Classifier (Scikit-learn) with SMOTE for class imbalance handling

---

##  Application Workflow

```
1. Register (OTP + GPS validation)
        ↓
2. AI Risk Assessment (location + device + weather history)
        ↓
3. Plan Selection + Razorpay Payment
        ↓
4. Real-Time Monitoring (Weather API + AQI API, polling every 15 min)
        ↓
5. Disruption Detected (threshold crossed)
        ↓
6. AI Fraud Check (< 30 seconds)
        ↓
7. Payout Calculated + Processed via Razorpay
        ↓
8. UPI Credit + User Notification (SMS + in-app)
```

---

## Pricing & Payout Model

| Plan | Weekly Premium | Max Weekly Payout | Best For |
|------|---------------|------------------|----------|
|  Basic | ₹49 | ₹1,500 | Part-time workers |
| Standard | ₹99 | ₹3,000 | Full-time workers |
| Premium | ₹149 | ₹5,000 | High-earning partners |

**Payout Example:**
> Standard Plan user loses ₹400 due to 75mm rainfall → AI estimates ₹400 loss → ₹400 credited to UPI within 5 minutes

---

## Parametric Triggers

| Disruption | Trigger Condition | Data Source |
|-----------|------------------|-------------|
| Heavy Rain | Rainfall > 60mm | OpenWeatherMap API |
| Heatwave | Temperature > 45°C | IMD + OpenWeatherMap |
| Air Pollution | AQI > 400 | CPCB AQI API |
| Flood Alert | Government advisory | NDMA API |

---

## Multi-Layer Fraud Prevention (Summary)

1. **OTP authentication** — verified phone number required
2. **GPS validation** — real-time location must match registered zone
3. **Device fingerprinting** — one account per device
4. **Behavioral AI** — flags anomalies vs. personal baseline
5. **Zone density check** — detects coordinated ring attacks
6. **Trust score system** — protects new legitimate users from false positives
7. **Tiered payout release** — holds 40% for 2-hour validation during high-risk events

---

## Tech Stack

### Frontend
- **React.js** — Registration, dashboard, plan selection UI
- **Tailwind CSS** — Responsive design

### Backend
- **Node.js + Express.js** — REST APIs for users, plans, triggers, payouts

### AI / Machine Learning
- **Python + Scikit-learn** — Risk assessment, income loss estimation, fraud detection
- **XGBoost** — Risk tier classification
- **Pandas + NumPy** — Feature engineering on weather + behavioral data

### Database
- **MongoDB** — Users, plans, transactions, behavioral logs, audit trails

### External APIs
- **OpenWeatherMap** — Rainfall & temperature
- **CPCB AQI API** — Air quality index
- **Google Maps API** — Location validation + zone mapping
- **Razorpay** — Premium collection + payout disbursement

---

## Future Enhancements

- **Platform API integration** — Verify workers directly via Swiggy/Zomato partner APIs
- **Mobile app** — Android-first, low-data optimized for field use
- **Predictive alerts** — Warn workers 2–3 hours before a disruption trigger based on forecast data
- **Micro-zone pricing** — Premium varies by hyperlocal flood/rain risk (street-level granularity)
- **Gang of devices detection** — IMEI-level cross-account analysis at scale

---

## Team — The GameChangers

| Name | ID |
|------|----|
| T. Mounika | 2300040156 |
| Md. Karishma | 2300040100 |
| B. Kamal Nadh | 2300040372 |
| D. Abhilash Manikanta | 2300040322 |

---

*Built with ❤️ for the 15 million gig workers who keep India's food delivery running — rain or shine.*
