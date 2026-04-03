import { useState, useEffect } from "react";

const PLANS = [
  { id: "basic", name: "Basic", premium: 49, payout: 1500, color: "#22c55e", features: ["Rain protection", "Instant payout", "Basic fraud check"] },
  { id: "standard", name: "Standard", premium: 99, payout: 3000, color: "#f97316", features: ["Rain + Heatwave", "Instant payout", "AI fraud detection", "AQI monitoring"], popular: true },
  { id: "premium", name: "Premium", premium: 149, payout: 5000, color: "#a855f7", features: ["All disruptions", "Instant payout", "Advanced AI", "Priority support", "Flood alerts"] },
];

const GF = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');`;
const BS = `* { box-sizing: border-box; margin: 0; padding: 0; }
input, select, button { font-family: 'DM Sans', sans-serif; }
::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slide-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes slide-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes scan { 0%{top:0%} 100%{top:90%} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes grow { from{width:0%} to{width:var(--w)} }`;

// Trust score levels
const TRUST_LEVELS = [
  { min: 0,  max: 30, label: "New Account",   color: "#ef4444", payoutCap: 500,   desc: "Payout capped at ₹500 until verified" },
  { min: 31, max: 55, label: "Building Trust", color: "#f97316", payoutCap: 1500,  desc: "Movement patterns being analyzed" },
  { min: 56, max: 75, label: "Verified Worker", color: "#eab308", payoutCap: 3000, desc: "Delivery patterns confirmed" },
  { min: 76, max: 100, label: "Trusted Partner", color: "#22c55e", payoutCap: 5000, desc: "Full payout access unlocked" },
];

function getTrustLevel(score) {
  return TRUST_LEVELS.find(l => score >= l.min && score <= l.max) || TRUST_LEVELS[0];
}

export default function GigShield() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState({ name: "", phone: "", city: "Hyderabad", plan: null, trustScore: 22, gpsVerified: false, docVerified: false });
  const [form, setForm] = useState({ name: "", phone: "", city: "Hyderabad", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [docVerified, setDocVerified] = useState(false);
  const [weatherData, setWeatherData] = useState({ rain: 42, temp: 38, aqi: 180 });
  const [disruption, setDisruption] = useState(null);
  const [payoutDone, setPayoutDone] = useState(false);
  const [payoutAmt, setPayoutAmt] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [fraudCheckSteps, setFraudCheckSteps] = useState([]);
  const [fraudAlert, setFraudAlert] = useState(null);
  const [tab, setTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (screen !== "dashboard") return;
    const interval = setInterval(() => {
      setWeatherData(d => ({
        rain: Math.min(80, Math.max(10, d.rain + (Math.random() - 0.45) * 4)),
        temp: Math.min(50, Math.max(28, d.temp + (Math.random() - 0.5) * 1.2)),
        aqi: Math.min(500, Math.max(60, d.aqi + (Math.random() - 0.4) * 15)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [screen]);

  // Trust score grows as verifications are completed
  useEffect(() => {
    let score = 22;
    if (docVerified) score += 28;
    if (gpsVerified) score += 20;
    if (transactions.length > 0) score += Math.min(transactions.length * 8, 30);
    setUser(u => ({ ...u, trustScore: Math.min(score, 100) }));
  }, [docVerified, gpsVerified, transactions.length]);

  function simulateDisruption(type, isFraud = false) {
    if (simulating) return;
    setSimulating(true);
    setDisruption(null);
    setPayoutDone(false);
    setFraudCheckSteps([]);
    setFraudAlert(null);

    const planObj = PLANS.find(p => p.id === user.plan);
    const trustLevel = getTrustLevel(user.trustScore);
    const loss = Math.floor(Math.random() * 300) + 200;
    const payout = Math.min(loss, Math.min(planObj.payout, trustLevel.payoutCap));

    const steps = isFraud
      ? ["Checking GPS coordinates...", "⚠️ GPS spoof detected — signal too clean, no drift noise", "Cross-checking cell tower data...", "🚨 Cell tower location doesn't match GPS", "Checking delivery movement history...", "❌ Zero delivery traces found — account has no history", "🚫 PAYOUT BLOCKED — Fraud detected"]
      : ["Checking GPS coordinates...", "✅ GPS signal verified with natural drift", "Validating device fingerprint...", "✅ Device recognized & trusted", "Checking delivery movement history...", `✅ ${user.docVerified ? "Partner ID verified + " : ""}Movement pattern matches delivery rider`, "Running behavioral analysis...", "✅ Behavior within normal range — APPROVED"];

    steps.forEach((step, i) => {
      setTimeout(() => setFraudCheckSteps(prev => [...prev, step]), 450 * (i + 1));
    });

    setTimeout(() => {
      if (isFraud) {
        setFraudAlert({ type, reason: "GPS spoofing detected + zero delivery history" });
        setSimulating(false);
      } else {
        setDisruption({ type, payout });
        setPayoutAmt(payout);
        setTimeout(() => {
          setPayoutDone(true);
          setTransactions(t => [{ id: Date.now(), type, amount: payout, time: new Date().toLocaleTimeString(), status: "Credited" }, ...t]);
          setSimulating(false);
        }, 1000);
      }
    }, 450 * steps.length + 500);
  }

  if (screen === "landing") return <Landing onStart={() => setScreen("register")} />;
  if (screen === "register") return (
    <RegisterScreen
      form={form} setForm={setForm}
      otpSent={otpSent} setOtpSent={setOtpSent}
      otpVerified={otpVerified} setOtpVerified={setOtpVerified}
      gpsVerified={gpsVerified} setGpsVerified={setGpsVerified}
      docVerified={docVerified} setDocVerified={setDocVerified}
      onComplete={() => { setUser(u => ({ ...u, ...form, gpsVerified, docVerified })); setScreen("plans"); }}
    />
  );
  if (screen === "plans") return <PlansScreen onSelect={id => { setUser(u => ({ ...u, plan: id })); setScreen("dashboard"); }} />;
  return (
    <Dashboard
      user={user} weatherData={weatherData}
      disruption={disruption} payoutDone={payoutDone}
      payoutAmt={payoutAmt} simulating={simulating}
      fraudCheckSteps={fraudCheckSteps} fraudAlert={fraudAlert}
      simulateDisruption={simulateDisruption}
      tab={tab} setTab={setTab}
      transactions={transactions}
      onChangePlan={() => setScreen("plans")}
    />
  );
}

// ─── LANDING ────────────────────────────────────────────────────────────────
function Landing({ onStart }) {
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0b", color:"#fff", fontFamily:"'DM Sans', sans-serif" }}>
      <style>{GF + BS + `.cta:hover{transform:scale(1.04);box-shadow:0 0 40px rgba(249,115,22,0.5)!important;} .stat:hover{transform:translateY(-4px);border-color:rgba(249,115,22,0.4)!important;} .how:hover{background:rgba(249,115,22,0.05)!important;}`}</style>
      <div style={{ position:"fixed", top:-200, left:"50%", transform:"translateX(-50%)", width:700, height:700, background:"radial-gradient(circle,rgba(249,115,22,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 48px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <Logo />
        <button onClick={onStart} className="cta" style={{ background:"#f97316", color:"#fff", border:"none", borderRadius:99, padding:"10px 24px", fontWeight:600, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}>Get Started →</button>
      </nav>
      <div style={{ textAlign:"center", padding:"90px 24px 60px", animation:"slide-up 0.7s ease" }}>
        <div style={{ display:"inline-block", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", borderRadius:99, padding:"6px 18px", fontSize:12, color:"#f97316", marginBottom:28, fontWeight:600, letterSpacing:1 }}>AI-POWERED PARAMETRIC INSURANCE</div>
        <h1 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:"clamp(36px,6vw,68px)", lineHeight:1.05, letterSpacing:"-2px", marginBottom:24 }}>
          Your income,<br /><span style={{ background:"linear-gradient(90deg,#f97316,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>always protected.</span>
        </h1>
        <p style={{ color:"#777", fontSize:18, maxWidth:500, margin:"0 auto 44px", lineHeight:1.7 }}>When rain, heat, or pollution cuts your deliveries — GigShield pays you instantly. No claims. No paperwork. Only real delivery workers get paid.</p>
        <button onClick={onStart} className="cta" style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", border:"none", borderRadius:14, padding:"16px 44px", fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:18, cursor:"pointer", transition:"all 0.25s", boxShadow:"0 8px 32px rgba(249,115,22,0.35)" }}>Start Free Trial</button>
        <p style={{ color:"#444", fontSize:13, marginTop:14 }}>Plans from ₹49/week · Cancel anytime · Real workers only</p>
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:20, padding:"0 24px 60px", flexWrap:"wrap" }}>
        {[["₹1,000","avg daily earnings"],["20–30%","income lost in disruptions"],["< 5 min","payout time"],["4 Levels","worker verification"]].map(([v,l]) => (
          <div key={l} className="stat" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"22px 30px", textAlign:"center", transition:"all 0.25s", cursor:"default" }}>
            <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:26, color:"#f97316" }}>{v}</div>
            <div style={{ color:"#555", fontSize:12, marginTop:6 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"0 24px 80px" }}>
        <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:26, textAlign:"center", marginBottom:36 }}>How it works</h2>
        {[
          ["01","Register & Verify Identity","Upload your Swiggy/Zomato partner ID, complete OTP, and pass GPS validation."],
          ["02","Build Your Trust Score","Your delivery movement patterns are analyzed. Real riders get full payouts within weeks."],
          ["03","We Watch the Weather","AI monitors rainfall, temperature & AQI around you 24/7."],
          ["04","Auto Payout","Threshold crossed → 5-layer AI fraud check → money in your UPI in minutes."],
        ].map(([n,t,d]) => (
          <div key={n} className="how" style={{ display:"flex", gap:20, padding:"18px 22px", borderRadius:14, marginBottom:8, transition:"background 0.2s" }}>
            <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:30, color:"rgba(249,115,22,0.25)", minWidth:44 }}>{n}</div>
            <div><div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>{t}</div><div style={{ color:"#666", fontSize:13, lineHeight:1.6 }}>{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REGISTER ───────────────────────────────────────────────────────────────
function RegisterScreen({ form, setForm, otpSent, setOtpSent, otpVerified, setOtpVerified, gpsVerified, setGpsVerified, docVerified, setDocVerified, onComplete }) {
  const [gpsScanning, setGpsScanning] = useState(false);
  const [gpsStep, setGpsStep] = useState(0);
  const [docScanning, setDocScanning] = useState(false);
  const [docStep, setDocStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState("");

  // steps: 1=details, 2=otp, 3=doc upload, 4=gps, 5=done
  const step = !otpSent ? 1 : !otpVerified ? 2 : !docVerified ? 3 : !gpsVerified ? 4 : 5;
  const CITIES = ["Hyderabad","Mumbai","Bangalore","Delhi","Chennai","Pune"];

  const gpsSteps = ["Acquiring GPS signal...","Checking cell tower triangulation...","Verifying IP geolocation match...","Device fingerprint saved...","✅ All checks passed — Location verified!"];
  const docSteps = ["Reading document with OCR...","Extracting Partner ID & name...","Cross-referencing with phone number...","Checking platform database...","✅ Delivery partner identity confirmed!"];

  function startGPS() {
    setGpsScanning(true); setGpsStep(0);
    gpsSteps.forEach((_, i) => setTimeout(() => setGpsStep(i+1), 700*(i+1)));
    setTimeout(() => { setGpsScanning(false); setGpsVerified(true); }, 700*gpsSteps.length+300);
  }

  function startDocScan() {
    if (!selectedPlatform) return;
    setDocScanning(true); setDocStep(0);
    docSteps.forEach((_, i) => setTimeout(() => setDocStep(i+1), 650*(i+1)));
    setTimeout(() => { setDocScanning(false); setDocVerified(true); }, 650*docSteps.length+300);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0b", color:"#fff", fontFamily:"'DM Sans', sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{GF + BS}</style>
      <div style={{ width:"100%", maxWidth:460 }}>
        <div style={{ marginBottom:44 }}><Logo /></div>
        {/* step bar */}
        <div style={{ display:"flex", gap:5, marginBottom:32 }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} style={{ flex:1, height:3, borderRadius:99, background: s<=step?"#f97316":"rgba(255,255,255,0.08)", transition:"background 0.4s" }} />
          ))}
        </div>
        <h2 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:24, marginBottom:6 }}>
          {step===1?"Create your account":step===2?"Verify your number":step===3?"Verify Delivery Partner ID":step===4?"GPS Validation":"Almost done!"}
        </h2>
        <p style={{ color:"#666", fontSize:13, marginBottom:26 }}>
          {step===1?"Enter your details to get started"
          :step===2?"We sent a code to +91 "+form.phone
          :step===3?"Upload your Swiggy or Zomato partner ID so we know you're a real delivery worker"
          :step===4?"Confirming you're physically in the field — not a GPS spoofer"
          :"Choose your city to complete setup"}
        </p>

        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Input label="Full Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Arjun Kumar" />
            <Input label="Phone Number" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v.replace(/\D/,"").slice(0,10)}))} placeholder="10-digit number" prefix="+91" />
            <Btn onClick={()=>setOtpSent(true)} disabled={!form.name||form.phone.length!==10}>Send OTP →</Btn>
          </div>
        )}

        {step===2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#f97316" }}>💡 Demo OTP: <strong>1234</strong></div>
            <Input label="Enter OTP" value={form.otp} onChange={v=>setForm(f=>({...f,otp:v.slice(0,4)}))} placeholder="4-digit code" />
            <Btn onClick={()=>{ if(form.otp==="1234") setOtpVerified(true); }} disabled={form.otp.length!==4}>Verify OTP →</Btn>
          </div>
        )}

        {step===3 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Platform select */}
            <div>
              <label style={{ fontSize:12, color:"#777", display:"block", marginBottom:8 }}>Delivery Platform</label>
              <div style={{ display:"flex", gap:10 }}>
                {["Swiggy","Zomato"].map(p => (
                  <button key={p} onClick={()=>setSelectedPlatform(p)} style={{ flex:1, background: selectedPlatform===p?"rgba(249,115,22,0.12)":"rgba(255,255,255,0.04)", border:`1.5px solid ${selectedPlatform===p?"#f97316":"rgba(255,255,255,0.1)"}`, borderRadius:12, padding:"12px", color: selectedPlatform===p?"#f97316":"#888", fontSize:15, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
                    {p==="Swiggy"?"🧡":"❤️"} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Doc upload area */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:`1.5px dashed ${docVerified?"rgba(34,197,94,0.5)":"rgba(255,255,255,0.12)"}`, borderRadius:16, padding:24, textAlign:"center", position:"relative", overflow:"hidden", transition:"border-color 0.4s" }}>
              {docScanning && <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#f97316,transparent)", animation:"scan 1s linear infinite", top:0 }} />}
              <div style={{ fontSize:40, marginBottom:10 }}>{docVerified?"✅":docScanning?"🔍":"📄"}</div>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:15, marginBottom:10 }}>
                {docVerified?"Partner ID Verified!":docScanning?"Scanning Document...":"Upload Partner ID Card"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14, textAlign:"left" }}>
                {docSteps.slice(0, docStep).map((s,i) => (
                  <div key={i} style={{ fontSize:12, color: s.includes("✅")?"#22c55e":"#888", animation:"fadeIn 0.3s ease" }}>{s}</div>
                ))}
              </div>
              {!docVerified && (
                <button onClick={startDocScan} disabled={!selectedPlatform||docScanning} style={{ background: (!selectedPlatform||docScanning)?"rgba(255,255,255,0.04)":"rgba(249,115,22,0.12)", border:"1px solid rgba(249,115,22,0.3)", color: (!selectedPlatform||docScanning)?"#444":"#f97316", borderRadius:10, padding:"10px 22px", fontSize:13, fontWeight:600, cursor:(!selectedPlatform||docScanning)?"not-allowed":"pointer", transition:"all 0.2s" }}>
                  {docScanning?"Scanning...":!selectedPlatform?"Select platform first":"📎 Simulate ID Upload"}
                </button>
              )}
              {docVerified && (
                <div style={{ fontSize:13, color:"#22c55e" }}>
                  ✅ {selectedPlatform} Partner ID matched · OCR verified · Trust Score +28
                </div>
              )}
            </div>
            {docVerified && <Btn onClick={()=>{}}>Continue to GPS →</Btn>}
          </div>
        )}

        {step===4 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${gpsVerified?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:16, padding:24, textAlign:"center", position:"relative", overflow:"hidden", transition:"border-color 0.4s" }}>
              {gpsScanning && <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#22c55e,transparent)", animation:"scan 1.1s linear infinite", top:0 }} />}
              <div style={{ fontSize:44, marginBottom:10 }}>{gpsVerified?"📍":gpsScanning?"🛰️":"📡"}</div>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:15, marginBottom:12 }}>
                {gpsVerified?"Location Verified!":gpsScanning?"Scanning...":"GPS Validation Required"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14, textAlign:"left" }}>
                {gpsSteps.slice(0, gpsStep).map((s,i) => (
                  <div key={i} style={{ fontSize:12, color: s.includes("✅")?"#22c55e":"#888", animation:"fadeIn 0.3s ease" }}>{s}</div>
                ))}
              </div>
              {!gpsVerified && (
                <button onClick={startGPS} disabled={gpsScanning} style={{ background: gpsScanning?"rgba(255,255,255,0.04)":"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", color: gpsScanning?"#444":"#22c55e", borderRadius:10, padding:"10px 22px", fontSize:13, fontWeight:600, cursor: gpsScanning?"not-allowed":"pointer", transition:"all 0.2s" }}>
                  {gpsScanning?"Verifying...":"📍 Verify My Location"}
                </button>
              )}
              {gpsVerified && <div style={{ fontSize:13, color:"#22c55e" }}>✅ Hyderabad confirmed · Trust Score +20</div>}
            </div>
            {gpsVerified && <Btn onClick={()=>{}}>Continue →</Btn>}
          </div>
        )}

        {step===5 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:"#777", display:"block", marginBottom:7 }}>Select Your City</label>
              <select value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:11, padding:"13px 14px", color:"#fff", fontSize:14 }}>
                {CITIES.map(c=><option key={c} value={c} style={{ background:"#1a1a1b" }}>{c}</option>)}
              </select>
            </div>
            {/* Trust score preview */}
            <div style={{ background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:12, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:"#f97316" }}>🎯 Your Starting Trust Score</div>
              <TrustBar score={docVerified&&gpsVerified?70:docVerified?50:gpsVerified?42:22} />
              <div style={{ fontSize:12, color:"#666", marginTop:8 }}>Score grows as your delivery movement patterns are confirmed over time</div>
            </div>
            <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:14, fontSize:13, color:"#888", lineHeight:1.9 }}>
              ✅ OTP Verified &nbsp;·&nbsp; 📄 Partner ID Checked &nbsp;·&nbsp; 📍 GPS Validated &nbsp;·&nbsp; 🔒 Device Saved
            </div>
            <Btn onClick={onComplete}>Go to Plans →</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PLANS ──────────────────────────────────────────────────────────────────
function PlansScreen({ onSelect }) {
  const [selected, setSelected] = useState("standard");
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0b", color:"#fff", fontFamily:"'DM Sans', sans-serif", padding:"48px 24px" }}>
      <style>{GF + BS + `.plan:hover{transform:translateY(-4px);}`}</style>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:32, letterSpacing:"-1px", marginBottom:10 }}>Pick your shield</div>
          <p style={{ color:"#666", fontSize:15 }}>Weekly plans · Instant payouts · Only real delivery partners eligible</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:18, marginBottom:36 }}>
          {PLANS.map(plan=>(
            <div key={plan.id} className="plan" onClick={()=>setSelected(plan.id)} style={{ background: selected===plan.id?`rgba(${plan.id==="basic"?"34,197,94":plan.id==="standard"?"249,115,22":"168,85,247"},0.08)`:"rgba(255,255,255,0.03)", border:`1.5px solid ${selected===plan.id?plan.color:"rgba(255,255,255,0.08)"}`, borderRadius:20, padding:26, cursor:"pointer", position:"relative", transition:"all 0.25s" }}>
              {plan.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#f97316", color:"#fff", borderRadius:99, padding:"4px 14px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>MOST POPULAR</div>}
              <div style={{ fontSize:26, marginBottom:10 }}>{plan.id==="basic"?"🌱":plan.id==="standard"?"⚡":"👑"}</div>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:20, marginBottom:4 }}>{plan.name}</div>
              <div style={{ color:plan.color, fontSize:28, fontWeight:800, fontFamily:"'Syne', sans-serif", marginBottom:2 }}>₹{plan.premium}<span style={{ color:"#666", fontSize:13, fontWeight:400 }}>/week</span></div>
              <div style={{ color:"#666", fontSize:12, marginBottom:18 }}>Up to ₹{plan.payout.toLocaleString()} payout</div>
              {plan.features.map(f=><div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"#bbb", marginBottom:6 }}><span style={{ color:plan.color }}>✓</span>{f}</div>)}
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center" }}><Btn onClick={()=>onSelect(selected)} style={{ maxWidth:320, margin:"0 auto", padding:"15px 0", fontSize:16 }}>Activate {PLANS.find(p=>p.id===selected).name} Plan →</Btn></div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ user, weatherData, disruption, payoutDone, payoutAmt, simulating, fraudCheckSteps, fraudAlert, simulateDisruption, tab, setTab, transactions, onChangePlan }) {
  const planObj = PLANS.find(p=>p.id===user.plan);
  const rain=Math.round(weatherData.rain), temp=Math.round(weatherData.temp), aqi=Math.round(weatherData.aqi);
  const rainAlert=rain>60, heatAlert=temp>45, aqiAlert=aqi>400;
  const trustLevel = getTrustLevel(user.trustScore);

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0b", color:"#fff", fontFamily:"'DM Sans', sans-serif" }}>
      <style>{GF + BS + `.tab:hover{background:rgba(255,255,255,0.05)!important;} .sim:hover{transform:scale(1.03);} .sim:active{transform:scale(0.97);}`}</style>

      {/* topbar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(10,10,11,0.92)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100, flexWrap:"wrap", gap:10 }}>
        <Logo />
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          {/* Trust Score Badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.03)", border:`1px solid ${trustLevel.color}35`, borderRadius:99, padding:"6px 14px" }}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
              <circle cx="14" cy="14" r="11" fill="none" stroke={trustLevel.color} strokeWidth="2.5"
                strokeDasharray={`${2*Math.PI*11}`}
                strokeDashoffset={`${2*Math.PI*11*(1-user.trustScore/100)}`}
                strokeLinecap="round" transform="rotate(-90 14 14)"
                style={{ transition:"stroke-dashoffset 1s ease" }} />
              <text x="14" y="18" textAnchor="middle" fill={trustLevel.color} fontSize="8" fontWeight="700">{user.trustScore}</text>
            </svg>
            <div>
              <div style={{ fontSize:10, color:trustLevel.color, fontWeight:700, letterSpacing:0.5 }}>TRUST SCORE</div>
              <div style={{ fontSize:10, color:"#555" }}>{trustLevel.label}</div>
            </div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:99, padding:"7px 14px", fontSize:13, color:"#aaa" }}>
            👤 {user.name||"Arjun"} · {user.city}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:920, margin:"0 auto", padding:"24px 16px" }}>

        {/* Trust Score Progress Card */}
        <div style={{ background:`rgba(${user.trustScore>=76?"34,197,94":user.trustScore>=56?"234,179,8":user.trustScore>=31?"249,115,22":"239,68,68"},0.06)`, border:`1px solid ${trustLevel.color}25`, borderRadius:16, padding:"18px 22px", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:15, color:trustLevel.color }}>{trustLevel.label} — Trust Score {user.trustScore}/100</div>
              <div style={{ fontSize:12, color:"#666", marginTop:3 }}>{trustLevel.desc} · Payout cap: ₹{trustLevel.payoutCap.toLocaleString()}</div>
            </div>
            <div style={{ fontSize:12, color:"#555" }}>Grows with verified delivery activity</div>
          </div>
          <TrustBar score={user.trustScore} />
          {/* milestones */}
          <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
            {[
              { label:"📱 OTP", done:true },
              { label:"📄 Partner ID", done:user.docVerified },
              { label:"📍 GPS", done:user.gpsVerified },
              { label:"🚴 Movement", done:transactions.length>=2 },
              { label:"⭐ Trusted", done:user.trustScore>=76 },
            ].map(m=>(
              <div key={m.label} style={{ background: m.done?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.03)", border:`1px solid ${m.done?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:99, padding:"4px 12px", fontSize:11, color: m.done?"#22c55e":"#555", fontWeight:600 }}>
                {m.done?"✓ ":""}{m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Fraud / Payout banners */}
        {fraudAlert && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:16, padding:"18px 22px", marginBottom:18, animation:"slide-in 0.4s ease" }}>
            <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:17, color:"#ef4444" }}>🚨 Fraud Alert — Payout Blocked</div>
            <div style={{ color:"#888", fontSize:13, marginTop:4 }}>Reason: {fraudAlert.reason}</div>
            <div style={{ marginTop:8, fontSize:12, color:"#666" }}>Genuine workers can appeal via the app within 2 hours.</div>
          </div>
        )}
        {disruption && !fraudAlert && (
          <div style={{ background: payoutDone?"rgba(34,197,94,0.08)":"rgba(249,115,22,0.08)", border:`1px solid ${payoutDone?"rgba(34,197,94,0.3)":"rgba(249,115,22,0.25)"}`, borderRadius:16, padding:"18px 22px", marginBottom:18, animation:"slide-in 0.4s ease" }}>
            <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:17, color: payoutDone?"#22c55e":"#f97316" }}>
              {payoutDone?`✅ ₹${payoutAmt} Credited to UPI!`:`⚡ Processing Payout...`}
            </div>
            <div style={{ color:"#777", fontSize:13, marginTop:4 }}>{payoutDone?"Compensated automatically · No claim needed":"AI verification running..."}</div>
          </div>
        )}

        {/* plan + tabs */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:22, letterSpacing:"-0.5px" }}>Live Dashboard</h1>
            <p style={{ color:"#555", fontSize:12, marginTop:3 }}>Real-time monitoring · {user.city} · {user.gpsVerified?"📍 GPS Verified":"📡 Active"}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ background:`rgba(${planObj.id==="basic"?"34,197,94":planObj.id==="standard"?"249,115,22":"168,85,247"},0.1)`, border:`1px solid ${planObj.color}40`, borderRadius:99, padding:"7px 14px", fontSize:13, color:planObj.color, fontWeight:600 }}>
              {planObj.id==="basic"?"🌱":planObj.id==="standard"?"⚡":"👑"} {planObj.name} · ₹{planObj.premium}/wk
            </div>
            <button onClick={onChangePlan} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:99, padding:"7px 14px", fontSize:13, color:"#666", cursor:"pointer" }}>Upgrade</button>
          </div>
        </div>

        <div style={{ display:"flex", gap:4, marginBottom:22, background:"rgba(255,255,255,0.02)", borderRadius:12, padding:4 }}>
          {["overview","simulate","history"].map(t=>(
            <button key={t} className="tab" onClick={()=>setTab(t)} style={{ flex:1, background: tab===t?"rgba(249,115,22,0.12)":"transparent", border: tab===t?"1px solid rgba(249,115,22,0.3)":"1px solid transparent", borderRadius:10, padding:"10px", color: tab===t?"#f97316":"#666", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
              {t==="overview"?"🌐 Overview":t==="simulate"?"⚡ Simulate":"📋 History"}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==="overview" && (
          <div style={{ animation:"slide-in 0.4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:18 }}>
              {[
                { label:"Rainfall", value:rain, unit:"mm", icon:"🌧️", bar:Math.min(100,(rain/80)*100), color:rainAlert?"#ef4444":"#60a5fa", alert:rainAlert },
                { label:"Temperature", value:temp, unit:"°C", icon:"🌡️", bar:Math.min(100,((temp-25)/30)*100), color:heatAlert?"#ef4444":"#f97316", alert:heatAlert },
                { label:"AQI", value:aqi, unit:"", icon:"😷", bar:Math.min(100,(aqi/500)*100), color:aqiAlert?"#ef4444":"#a855f7", alert:aqiAlert },
                { label:"Flood Alert", value:"Clear", unit:"", icon:"🌊", bar:5, color:"#22c55e", alert:false },
              ].map(c=><WeatherCard key={c.label} {...c} />)}
            </div>

            {/* Worker verification status */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20, marginBottom:14 }}>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:14, marginBottom:14 }}>👷 Delivery Worker Verification</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:8 }}>
                {[
                  { label:"OTP Authentication", status:"Verified", icon:"📱", done:true },
                  { label:"Partner ID (Swiggy/Zomato)", status: user.docVerified?"Verified":"Pending", icon:"📄", done:user.docVerified },
                  { label:"GPS Location", status: user.gpsVerified?"Validated":"Pending", icon:"📍", done:user.gpsVerified },
                  { label:"Movement Pattern AI", status: transactions.length>=2?"Confirmed":"Analyzing...", icon:"🚴", done:transactions.length>=2 },
                  { label:"UPI Payment Pattern", status:"Phase 2", icon:"💳", done:false, phase2:true },
                  { label:"Platform API (Swiggy/Zomato)", status:"Phase 2", icon:"🔗", done:false, phase2:true },
                ].map(l=>(
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:9, background: l.done?"rgba(34,197,94,0.05)":l.phase2?"rgba(168,85,247,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${l.done?"rgba(34,197,94,0.15)":l.phase2?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.06)"}`, borderRadius:10, padding:"9px 11px" }}>
                    <span style={{ fontSize:15 }}>{l.icon}</span>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:"#ccc" }}>{l.label}</div>
                      <div style={{ fontSize:10, color: l.done?"#22c55e":l.phase2?"#a855f7":"#888" }}>{l.done?"✓ ":l.phase2?"🔜 ":"⏳ "}{l.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* triggers */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
              <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:14, marginBottom:14 }}>Parametric Triggers</div>
              {[
                { label:"Heavy Rain", icon:"🌧️", cond:"Rainfall > 60mm", active:rainAlert, curr:`${rain}mm` },
                { label:"Heatwave", icon:"🌡️", cond:"Temp > 45°C", active:heatAlert, curr:`${temp}°C` },
                { label:"Air Pollution", icon:"😷", cond:"AQI > 400", active:aqiAlert, curr:`AQI ${aqi}` },
                { label:"Flood Alert", icon:"🌊", cond:"Govt Warning", active:false, curr:"Clear" },
              ].map(t=>(
                <div key={t.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background: t.active?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.02)", borderRadius:10, border:`1px solid ${t.active?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.05)"}`, marginBottom:7 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ fontSize:17 }}>{t.icon}</span>
                    <div><div style={{ fontSize:13, fontWeight:600 }}>{t.label}</div><div style={{ fontSize:11, color:"#555" }}>{t.cond}</div></div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"#555" }}>{t.curr}</span>
                    <div style={{ background: t.active?"#ef4444":"#22c55e", borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#fff" }}>{t.active?"TRIGGERED":"SAFE"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMULATE */}
        {tab==="simulate" && (
          <div style={{ animation:"slide-in 0.4s ease" }}>
            <div style={{ background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:12, padding:"13px 17px", marginBottom:18, fontSize:13, color:"#f97316" }}>
              ⚡ <strong>Legit claims</strong> are verified and paid instantly. <strong>Fraud attempts</strong> (dashed border) are detected and blocked. Your payout is also capped by your Trust Score (currently ₹{getTrustLevel(user.trustScore).payoutCap.toLocaleString()}).
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
              {[
                { type:"Heavy Rain", icon:"🌧️", loss:"₹200–₹500", color:"#60a5fa", fraud:false },
                { type:"Heatwave", icon:"🌡️", loss:"₹300–₹500", color:"#f97316", fraud:false },
                { type:"Pollution (Spoofed GPS)", icon:"😷🚨", color:"#ef4444", fraud:true },
                { type:"Flood (Fake Account)", icon:"🌊🤖", color:"#ef4444", fraud:true },
              ].map(d=>(
                <button key={d.type} className="sim" onClick={()=>simulateDisruption(d.type, d.fraud)} disabled={simulating}
                  style={{ background: d.fraud?"rgba(239,68,68,0.05)":"rgba(255,255,255,0.03)", border: d.fraud?"1.5px dashed rgba(239,68,68,0.3)":"1.5px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"22px 16px", cursor: simulating?"not-allowed":"pointer", textAlign:"center", opacity: simulating?0.5:1, transition:"all 0.2s", color:"#fff" }}>
                  <div style={{ fontSize:34, marginBottom:8 }}>{d.icon}</div>
                  <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:14, marginBottom:4 }}>{d.type}</div>
                  {d.fraud
                    ? <div style={{ color:d.color, fontSize:12 }}>🚨 Will be blocked</div>
                    : <div style={{ color:d.color, fontSize:12 }}>Est. loss: {d.loss}</div>}
                  <div style={{ color:"#444", fontSize:11, marginTop:4 }}>{d.fraud?"Fraud simulation →":"✅ Legit claim →"}</div>
                </button>
              ))}
            </div>
            {(simulating || fraudCheckSteps.length > 0) && (
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  {simulating && <div style={{ width:14, height:14, border:"2px solid rgba(249,115,22,0.3)", borderTop:"2px solid #f97316", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />}
                  <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:14 }}>
                    {fraudAlert?"🚨 Blocked — Fraud Detected":payoutDone?"✅ Verified — Payout Sent":"🤖 AI Fraud Check Running..."}
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {fraudCheckSteps.map((s,i)=>(
                    <div key={i} style={{ fontSize:13, animation:"slide-in 0.3s ease", color: s.includes("❌")||s.includes("🚨")||s.includes("⚠️")||s.includes("🚫")?"#ef4444":s.includes("✅")?"#22c55e":"#777" }}>{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab==="history" && (
          <div style={{ animation:"slide-in 0.4s ease" }}>
            {transactions.length===0
              ? <div style={{ textAlign:"center", padding:"70px 24px", color:"#444" }}><div style={{ fontSize:42, marginBottom:12 }}>📋</div><div>No payouts yet — simulate a legit disruption to see history</div></div>
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {transactions.map(tx=>(
                    <div key={tx.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:"15px 18px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                        <div style={{ width:38, height:38, background:"rgba(34,197,94,0.1)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>
                          {tx.type.includes("Rain")?"🌧️":tx.type.includes("Heat")?"🌡️":"😷"}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{tx.type}</div>
                          <div style={{ color:"#555", fontSize:11, marginTop:2 }}>{tx.time} · AI verified · Auto-payout</div>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:"#22c55e", fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:17 }}>+₹{tx.amount}</div>
                        <div style={{ fontSize:10, color:"#22c55e", marginTop:2 }}>✓ {tx.status}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:13, padding:"13px 18px" }}>
                    <span style={{ color:"#666", fontSize:13 }}>Total Credited</span>
                    <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:18, color:"#22c55e" }}>₹{transactions.reduce((s,t)=>s+t.amount,0).toLocaleString()}</span>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED ──────────────────────────────────────────────────────────────────
function TrustBar({ score }) {
  const level = getTrustLevel(score);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12, color:"#666" }}>
        <span>0</span><span style={{ color:level.color, fontWeight:600 }}>{score}/100</span><span>100</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:8, position:"relative" }}>
        <div style={{ width:`${score}%`, background:`linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e)`, borderRadius:99, height:8, transition:"width 1s ease" }} />
        {/* milestone markers */}
        {[31,56,76].map(m=>(
          <div key={m} style={{ position:"absolute", top:-2, left:`${m}%`, width:2, height:12, background:"rgba(0,0,0,0.4)", borderRadius:1 }} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:10, color:"#444" }}>
        <span>New</span><span>Building</span><span>Verified</span><span>Trusted</span>
      </div>
    </div>
  );
}

function WeatherCard({ label, value, unit, icon, bar, color, alert }) {
  return (
    <div style={{ background: alert?"rgba(239,68,68,0.06)":"rgba(255,255,255,0.03)", border:`1px solid ${alert?"rgba(239,68,68,0.22)":"rgba(255,255,255,0.07)"}`, borderRadius:14, padding:"15px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:12, color:"#666" }}>{label}</span><span style={{ fontSize:17 }}>{icon}</span>
      </div>
      <div style={{ fontSize:24, fontWeight:700, color: alert?"#ef4444":"#fff", fontFamily:"'Syne', sans-serif" }}>{value}<span style={{ fontSize:11, color:"#555", marginLeft:3 }}>{unit}</span></div>
      {alert && <div style={{ fontSize:10, color:"#ef4444", marginTop:2, fontWeight:600 }}>⚠️ THRESHOLD EXCEEDED</div>}
      <div style={{ marginTop:9, background:"rgba(255,255,255,0.05)", borderRadius:99, height:4 }}>
        <div style={{ width:`${bar}%`, background:color, borderRadius:99, height:4, transition:"width 1s ease" }} />
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <div style={{ width:33, height:33, background:"linear-gradient(135deg,#f97316,#ea580c)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🛡️</div>
      <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:18, color:"#fff" }}>GigShield</span>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, prefix }) {
  return (
    <div>
      <label style={{ fontSize:12, color:"#777", display:"block", marginBottom:7 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:11, overflow:"hidden" }}>
        {prefix && <span style={{ padding:"13px 10px 13px 14px", color:"#555", fontSize:14, borderRight:"1px solid rgba(255,255,255,0.07)" }}>{prefix}</span>}
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ flex:1, background:"transparent", border:"none", padding:"13px 14px", color:"#fff", fontSize:14, outline:"none" }} />
      </div>
    </div>
  );
}

function Btn({ onClick, disabled, children, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: disabled?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#f97316,#ea580c)", color: disabled?"#444":"#fff", border:"none", borderRadius:11, padding:"13px 26px", fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:15, cursor: disabled?"not-allowed":"pointer", width:"100%", transition:"all 0.2s", ...style }}>
      {children}
    </button>
  );
}