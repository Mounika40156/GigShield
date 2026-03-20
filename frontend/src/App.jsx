import { useState, useEffect, useRef } from "react";

const PLANS = [
  { id: "basic", name: "Basic", premium: 49, payout: 1500, color: "#22c55e", features: ["Rain protection", "Instant payout", "Basic fraud check"] },
  { id: "standard", name: "Standard", premium: 99, payout: 3000, color: "#f97316", features: ["Rain + Heatwave", "Instant payout", "AI fraud detection", "AQI monitoring"], popular: true },
  { id: "premium", name: "Premium", premium: 149, payout: 5000, color: "#a855f7", features: ["All disruptions", "Instant payout", "Advanced AI", "Priority support", "Flood alerts"] },
];

const TRIGGERS = [
  { type: "Heavy Rain", icon: "🌧️", condition: "Rainfall > 60mm", active: false },
  { type: "Heatwave", icon: "🌡️", condition: "Temp > 45°C", active: false },
  { type: "Air Pollution", icon: "😷", condition: "AQI > 400", active: false },
  { type: "Flood Alert", icon: "🌊", condition: "Govt Warning", active: false },
];

const CITIES = ["Hyderabad", "Mumbai", "Bangalore", "Delhi", "Chennai", "Pune"];

function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function WeatherCard({ label, value, unit, icon, bar, barColor }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif" }}>{value}<span style={{ fontSize: 14, color: "#888", marginLeft: 4 }}>{unit}</span></div>
      <div style={{ marginTop: 10, background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 5 }}>
        <div style={{ width: `${bar}%`, background: barColor, borderRadius: 99, height: 5, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

export default function GigShield() {
  const [screen, setScreen] = useState("landing"); // landing | register | dashboard | plans | payout
  const [user, setUser] = useState({ name: "", phone: "", city: "Hyderabad", plan: null });
  const [form, setForm] = useState({ name: "", phone: "", city: "Hyderabad", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [weatherData, setWeatherData] = useState({ rain: 42, temp: 38, aqi: 180, flood: false });
  const [disruption, setDisruption] = useState(null);
  const [payoutAmt, setPayoutAmt] = useState(0);
  const [payoutDone, setPayoutDone] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [tab, setTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);

  // Animate weather values
  useEffect(() => {
    if (screen !== "dashboard") return;
    const interval = setInterval(() => {
      setWeatherData(d => ({
        rain: Math.min(80, Math.max(10, d.rain + (Math.random() - 0.45) * 4)),
        temp: Math.min(50, Math.max(28, d.temp + (Math.random() - 0.5) * 1.2)),
        aqi: Math.min(500, Math.max(60, d.aqi + (Math.random() - 0.4) * 15)),
        flood: d.flood,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [screen]);

  function sendOtp() {
    if (form.name && form.phone.length === 10) setOtpSent(true);
  }
  function verifyOtp() {
    if (form.otp === "1234") { setOtpVerified(true); }
  }
  function completeRegistration() {
    setUser({ ...form, plan: null });
    setScreen("plans");
  }
  function selectPlan(plan) {
    setUser(u => ({ ...u, plan }));
    setScreen("dashboard");
  }

  function simulateDisruption(type) {
    if (simulating) return;
    setSimulating(true);
    setDisruption(null);
    setPayoutDone(false);

    const planObj = PLANS.find(p => p.id === user.plan);
    const loss = Math.floor(Math.random() * 300) + 200;
    const payout = Math.min(loss, planObj.payout);

    setTimeout(() => {
      setDisruption({ type, payout });
      setPayoutAmt(payout);
    }, 1800);

    setTimeout(() => {
      setPayoutDone(true);
      setTransactions(t => [
        { id: Date.now(), type, amount: payout, time: new Date().toLocaleTimeString(), status: "Credited" },
        ...t,
      ]);
      setSimulating(false);
    }, 4200);
  }

  // ── SCREENS ─────────────────────────────────────────────
  if (screen === "landing") return <Landing onStart={() => setScreen("register")} />;
  if (screen === "register") return (
    <RegisterScreen
      form={form} setForm={setForm}
      otpSent={otpSent} sendOtp={sendOtp}
      otpVerified={otpVerified} verifyOtp={verifyOtp}
      onComplete={completeRegistration}
    />
  );
  if (screen === "plans") return <PlansScreen onSelect={selectPlan} />;
  if (screen === "dashboard") return (
    <Dashboard
      user={user} weatherData={weatherData}
      disruption={disruption} payoutDone={payoutDone}
      payoutAmt={payoutAmt} simulating={simulating}
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
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes slide-up { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .stat-card:hover { transform: translateY(-4px); border-color: rgba(249,115,22,0.4) !important; }
        .cta-btn:hover { transform: scale(1.04); box-shadow: 0 0 40px rgba(249,115,22,0.5) !important; }
        .feature-row:hover { background: rgba(249,115,22,0.06) !important; }
      `}</style>

      {/* bg glow */}
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>GigShield</span>
        </div>
        <button onClick={onStart} className="cta-btn" style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 99, padding: "10px 24px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>Get Started →</button>
      </nav>

      {/* hero */}
      <div style={{ textAlign: "center", padding: "90px 24px 60px", animation: "slide-up 0.8s ease forwards" }}>
        <div style={{ display: "inline-block", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 99, padding: "6px 18px", fontSize: 12, color: "#f97316", marginBottom: 28, fontWeight: 600, letterSpacing: 1 }}>
          AI-POWERED PARAMETRIC INSURANCE
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 24 }}>
          Protect your earnings.<br />
          <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Automatically.
          </span>
        </h1>
        <p style={{ color: "#888", fontSize: 18, maxWidth: 500, margin: "0 auto 44px", lineHeight: 1.7, fontWeight: 400 }}>
          When rain, heat, or pollution cuts your deliveries — GigShield pays you instantly. No claims. No paperwork. Just protection.
        </p>
        <button onClick={onStart} className="cta-btn" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", borderRadius: 14, padding: "16px 44px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, cursor: "pointer", transition: "all 0.25s", boxShadow: "0 8px 32px rgba(249,115,22,0.35)" }}>
          Start Free Trial
        </button>
        <p style={{ color: "#444", fontSize: 13, marginTop: 14 }}>Plans from ₹49/week · Cancel anytime</p>
      </div>

      {/* stats row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "0 24px 60px", flexWrap: "wrap" }}>
        {[["₹1,000", "avg daily earnings"], ["20-30%", "income lost in disruptions"], ["< 5 min", "payout time"], ["₹49/wk", "starting premium"]].map(([val, label]) => (
          <div key={label} className="stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 32px", textAlign: "center", transition: "all 0.25s", cursor: "default" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#f97316" }}>{val}</div>
            <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* how it works */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, textAlign: "center", marginBottom: 40 }}>How it works</h2>
        {[
          ["01", "Register & Verify", "Quick OTP-based sign-up with GPS location validation."],
          ["02", "Pick a Plan", "Choose Basic, Standard or Premium — starting ₹49/week."],
          ["03", "We Watch the Weather", "AI monitors rainfall, temperature & AQI around you 24/7."],
          ["04", "Auto Payout", "Threshold crossed → fraud check → money in your UPI in minutes."],
        ].map(([num, title, desc]) => (
          <div key={num} className="feature-row" style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "20px 24px", borderRadius: 14, marginBottom: 8, transition: "background 0.2s", cursor: "default" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "rgba(249,115,22,0.3)", minWidth: 48 }}>{num}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{title}</div>
              <div style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "0 24px 80px" }}>
        <button onClick={onStart} className="cta-btn" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", borderRadius: 14, padding: "16px 44px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, cursor: "pointer", transition: "all 0.25s", boxShadow: "0 8px 32px rgba(249,115,22,0.35)" }}>
          Get Protected Now →
        </button>
      </div>
    </div>
  );
}

// ─── REGISTER ───────────────────────────────────────────────────────────────
function RegisterScreen({ form, setForm, otpSent, sendOtp, otpVerified, verifyOtp, onComplete }) {
  const step = !otpSent ? 1 : !otpVerified ? 2 : 3;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} input{outline:none;}`}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>GigShield</span>
        </div>

        {/* step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? "#f97316" : "rgba(255,255,255,0.1)", transition: "background 0.4s" }} />
          ))}
        </div>

        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 8, letterSpacing: "-0.5px" }}>
          {step === 1 ? "Create your account" : step === 2 ? "Verify your number" : "Almost done!"}
        </h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 32 }}>
          {step === 1 ? "Enter your details to get started" : step === 2 ? `We sent a code to +91 ${form.phone}` : "Choose your city to complete setup"}
        </p>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Arjun Kumar" />
            <Input label="Phone Number" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v.replace(/\D/, "").slice(0, 10) }))} placeholder="10-digit mobile number" prefix="+91" />
            <Btn onClick={sendOtp} disabled={!form.name || form.phone.length !== 10}>Send OTP →</Btn>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#f97316" }}>
              💡 Demo OTP: <strong>1234</strong>
            </div>
            <Input label="Enter OTP" value={form.otp} onChange={v => setForm(f => ({ ...f, otp: v.slice(0, 4) }))} placeholder="4-digit code" />
            <Btn onClick={verifyOtp} disabled={form.otp.length !== 4}>Verify OTP →</Btn>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 8 }}>Select Your City</label>
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
                {CITIES.map(c => <option key={c} value={c} style={{ background: "#1a1a1b" }}>{c}</option>)}
              </select>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              ✅ OTP Verified &nbsp;·&nbsp; 📍 GPS will be used for location validation &nbsp;·&nbsp; 🔒 Your data is secure
            </div>
            <Btn onClick={onComplete}>Continue to Plans →</Btn>
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
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fff", fontFamily: "'DM Sans', sans-serif", padding: "48px 24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap'); *{box-sizing:border-box;} .plan-card{transition:all 0.25s;} .plan-card:hover{transform:translateY(-4px);}`}</style>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, letterSpacing: "-1px", marginBottom: 12 }}>Pick your shield</div>
          <p style={{ color: "#666", fontSize: 16 }}>Weekly plans. Cancel anytime. Instant payouts.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className="plan-card" onClick={() => setSelected(plan.id)} style={{ background: selected === plan.id ? `rgba(${plan.id === "basic" ? "34,197,94" : plan.id === "standard" ? "249,115,22" : "168,85,247"},0.08)` : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected === plan.id ? plan.color : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: 28, cursor: "pointer", position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#f97316", color: "#fff", borderRadius: 99, padding: "4px 14px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
              <div style={{ fontSize: 28, marginBottom: 12 }}>{plan.id === "basic" ? "🌱" : plan.id === "standard" ? "⚡" : "👑"}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ color: plan.color, fontSize: 32, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>₹{plan.premium}<span style={{ color: "#666", fontSize: 14, fontWeight: 400 }}>/week</span></div>
              <div style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>Up to ₹{plan.payout.toLocaleString()} payout</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map(f => <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ccc" }}><span style={{ color: plan.color }}>✓</span> {f}</div>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <Btn onClick={() => onSelect(selected)} style={{ padding: "16px 60px", fontSize: 17 }}>
            Activate {PLANS.find(p => p.id === selected).name} Plan →
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ user, weatherData, disruption, payoutDone, payoutAmt, simulating, simulateDisruption, tab, setTab, transactions, onChangePlan }) {
  const planObj = PLANS.find(p => p.id === user.plan);
  const rain = Math.round(weatherData.rain);
  const temp = Math.round(weatherData.temp);
  const aqi = Math.round(weatherData.aqi);
  const rainAlert = rain > 60;
  const heatAlert = temp > 45;
  const aqiAlert = aqi > 400;
  const anyAlert = rainAlert || heatAlert || aqiAlert;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap'); *{box-sizing:border-box;} @keyframes ping{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.6}} @keyframes slide-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} .tab-btn:hover{background:rgba(255,255,255,0.06)!important;} .sim-btn:hover{transform:scale(1.03);} .sim-btn:active{transform:scale(0.97);}`}</style>

      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,11,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>GigShield</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {anyAlert && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 99, padding: "5px 14px", fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "ping 1.4s infinite" }} />
            ALERT ACTIVE
          </div>}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "6px 14px", fontSize: 13, color: "#ccc" }}>
            👤 {user.name || "Arjun"} · {user.city}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        {/* payout banner */}
        {disruption && (
          <div style={{ background: payoutDone ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)", border: `1px solid ${payoutDone ? "rgba(34,197,94,0.4)" : "rgba(249,115,22,0.4)"}`, borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", animation: "slide-in 0.5s ease" }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: payoutDone ? "#22c55e" : "#f97316" }}>
                {payoutDone ? `✅ ₹${payoutAmt} Credited to UPI!` : `⚡ Processing ${disruption.type} Payout...`}
              </div>
              <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                {payoutDone ? "Income loss compensated automatically · No claim needed" : "AI fraud check in progress..."}
              </div>
            </div>
            {!payoutDone && <div style={{ width: 36, height: 36, border: "3px solid rgba(249,115,22,0.3)", borderTop: "3px solid #f97316", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />}
          </div>
        )}

        {/* plan badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Live Dashboard</h1>
            <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Real-time environment monitoring · {user.city}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: `rgba(${planObj.id === "basic" ? "34,197,94" : planObj.id === "standard" ? "249,115,22" : "168,85,247"},0.12)`, border: `1px solid ${planObj.color}40`, borderRadius: 99, padding: "8px 18px", fontSize: 13, color: planObj.color, fontWeight: 600 }}>
              {planObj.id === "basic" ? "🌱" : planObj.id === "standard" ? "⚡" : "👑"} {planObj.name} Plan · ₹{planObj.premium}/wk
            </div>
            <button onClick={onChangePlan} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "8px 16px", fontSize: 13, color: "#888", cursor: "pointer" }}>Upgrade</button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4 }}>
          {["overview", "simulate", "history"].map(t => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? "rgba(249,115,22,0.15)" : "transparent", border: tab === t ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent", borderRadius: 10, padding: "10px", color: tab === t ? "#f97316" : "#666", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize" }}>
              {t === "overview" ? "🌐 Overview" : t === "simulate" ? "⚡ Simulate" : "📋 History"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ animation: "slide-in 0.4s ease" }}>
            {/* weather grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              <WeatherCard label="Rainfall" value={rain} unit="mm" icon="🌧️" bar={Math.min(100, (rain / 80) * 100)} barColor={rainAlert ? "#ef4444" : "#60a5fa"} />
              <WeatherCard label="Temperature" value={temp} unit="°C" icon="🌡️" bar={Math.min(100, ((temp - 25) / 30) * 100)} barColor={heatAlert ? "#ef4444" : "#f97316"} />
              <WeatherCard label="AQI" value={aqi} unit="" icon="😷" bar={Math.min(100, (aqi / 500) * 100)} barColor={aqiAlert ? "#ef4444" : "#a855f7"} />
              <WeatherCard label="Flood Alert" value={weatherData.flood ? "Active" : "Clear"} unit="" icon="🌊" bar={weatherData.flood ? 100 : 5} barColor={weatherData.flood ? "#ef4444" : "#22c55e"} />
            </div>

            {/* triggers */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Parametric Triggers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Heavy Rain", icon: "🌧️", cond: `Rainfall > 60mm`, active: rainAlert, current: `${rain}mm now` },
                  { label: "Heatwave", icon: "🌡️", cond: "Temp > 45°C", active: heatAlert, current: `${temp}°C now` },
                  { label: "Air Pollution", icon: "😷", cond: "AQI > 400", active: aqiAlert, current: `AQI ${aqi} now` },
                  { label: "Flood Alert", icon: "🌊", cond: "Govt Warning", active: weatherData.flood, current: weatherData.flood ? "Active" : "Clear" },
                ].map(t => (
                  <div key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: t.active ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${t.active ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.05)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{t.cond}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>{t.current}</span>
                      <div style={{ background: t.active ? "#ef4444" : "#22c55e", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>{t.active ? "TRIGGERED" : "SAFE"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "simulate" && (
          <div style={{ animation: "slide-in 0.4s ease" }}>
            <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, fontSize: 14, color: "#f97316" }}>
              ⚡ Click a disruption below to simulate automatic payout. This shows how GigShield protects your earnings in real time.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { type: "Heavy Rain", icon: "🌧️", loss: "₹200–₹500", color: "#60a5fa" },
                { type: "Heatwave", icon: "🌡️", loss: "₹300–₹500", color: "#f97316" },
                { type: "Air Pollution", icon: "😷", loss: "₹250–₹450", color: "#a855f7" },
                { type: "Flood Alert", icon: "🌊", loss: "₹400–₹600", color: "#ef4444" },
              ].map(d => (
                <button key={d.type} className="sim-btn" onClick={() => simulateDisruption(d.type)} disabled={simulating} style={{ background: "rgba(255,255,255,0.03)", border: `1.5px solid ${simulating ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}`, borderRadius: 18, padding: "28px 20px", cursor: simulating ? "not-allowed" : "pointer", textAlign: "center", opacity: simulating ? 0.5 : 1, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{d.icon}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{d.type}</div>
                  <div style={{ color: d.color, fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Est. loss: {d.loss}</div>
                  <div style={{ color: "#555", fontSize: 12 }}>Click to simulate →</div>
                </button>
              ))}
            </div>
            {simulating && (
              <div style={{ marginTop: 28, textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 99, padding: "12px 28px" }}>
                  <div style={{ width: 18, height: 18, border: "2px solid rgba(249,115,22,0.3)", borderTop: "2px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: "#f97316", fontWeight: 600, fontSize: 14 }}>AI verifying disruption & processing payout...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div style={{ animation: "slide-in 0.4s ease" }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px", color: "#444" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 16 }}>No payouts yet · Simulate a disruption to see history</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {transactions.map(tx => (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 42, height: 42, background: "rgba(34,197,94,0.12)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {tx.type === "Heavy Rain" ? "🌧️" : tx.type === "Heatwave" ? "🌡️" : tx.type === "Air Pollution" ? "😷" : "🌊"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{tx.type} Disruption</div>
                        <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>{tx.time} · Auto-triggered payout</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#22c55e", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>+₹{tx.amount}</div>
                      <div style={{ fontSize: 11, color: "#22c55e", marginTop: 2 }}>✓ {tx.status}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#888", fontSize: 14 }}>Total Credited</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#22c55e" }}>₹{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, prefix }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, overflow: "hidden" }}>
        {prefix && <span style={{ padding: "14px 12px 14px 16px", color: "#666", fontSize: 15, borderRight: "1px solid rgba(255,255,255,0.08)" }}>{prefix}</span>}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, background: "transparent", border: "none", padding: "14px 16px", color: "#fff", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }} />
      </div>
    </div>
  );
}

function Btn({ onClick, disabled, children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: disabled ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #f97316, #ea580c)", color: disabled ? "#555" : "#fff", border: "none", borderRadius: 12, padding: "14px 28px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, cursor: disabled ? "not-allowed" : "pointer", width: "100%", transition: "all 0.2s", ...style }}>
      {children}
    </button>
  );
}