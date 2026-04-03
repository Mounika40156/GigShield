import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const STEPS = ['Personal Info', 'Work Details', 'Verification', 'Risk Profile'];
const PLATFORMS = ['Swiggy', 'Zomato', 'Zepto', 'Blinkit', 'Amazon Flex', 'Flipkart'];
const CITIES = ['Mumbai', 'Delhi', 'Hyderabad', 'Bengaluru', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

export default function Register() {
  const navigate = useNavigate();
  const { setUser, calculateRiskProfile } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [gpsOk, setGpsOk] = useState(false);
  const [riskProfile, setRiskProfile] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', platform:'', city:'', vehicleType:'Bike', dailyEarnings:'', partnerIdFile:null, otp:'' });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const sendOtp = () => { setLoading(true); setTimeout(()=>{ setOtpSent(true); setLoading(false); }, 1200); };
  const verifyOtp = () => { setLoading(true); setTimeout(()=>{ setOtpVerified(true); setLoading(false); }, 900); };
  const captureGps = () => {
    setLoading(true);
    if(navigator.geolocation) { navigator.geolocation.getCurrentPosition(()=>{setGpsOk(true);setLoading(false);},()=>{setGpsOk(true);setLoading(false);}); }
    else setTimeout(()=>{setGpsOk(true);setLoading(false);},1200);
  };

  const next = () => {
    if(step===2){ const risk=calculateRiskProfile(form.city,form.platform,form.dailyEarnings); setRiskProfile(risk); }
    setStep(s=>s+1);
  };

  const finish = () => {
    setUser({...form, id:`GS-${Date.now()}`, registeredAt:new Date().toISOString(), trustScore:42, riskProfile});
    navigate('/policy');
  };

  const canNext = () => {
    if(step===0) return form.name && form.phone && form.email;
    if(step===1) return form.platform && form.city && form.dailyEarnings;
    if(step===2) return otpVerified && gpsOk && form.partnerIdFile;
    return true;
  };

  const riskColor = riskProfile?.zone==='HIGH' ? 'var(--red)' : riskProfile?.zone==='MEDIUM' ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="auth-page">
      <div className="auth-wrap fade-up">
        <div className="auth-logo">
          <div className="auth-logo-mark">🛡️</div>
          <span className="auth-logo-name">GigShield</span>
        </div>

        {/* Step indicator */}
        <div className="step-row">
          {STEPS.map((label,i)=>(
            <React.Fragment key={i}>
              <div className="step-item">
                <div className={`step-dot ${i<step?'done':i===step?'active':''}`}>{i<step?'✓':i+1}</div>
                {i===step && <span className="step-text active">{label}</span>}
              </div>
              {i<STEPS.length-1 && <div className={`step-line ${i<step?'done':''}`}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          <div className="mb-20">
            <h2 style={{fontSize:18,marginBottom:3}}>{STEPS[step]}</h2>
            <p className="text-sm text-2">
              {step===0 && 'Enter your basic details to create your account'}
              {step===1 && 'Tell us about your delivery work so we can calculate your risk'}
              {step===2 && 'Verify your identity — this prevents fraud and protects everyone'}
              {step===3 && 'Your personalised AI risk profile based on location and platform data'}
            </p>
          </div>

          {step===0 && (<>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="e.g. Arjun Kumar" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Mobile Number</label><input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Email Address</label><input className="form-input" type="email" placeholder="you@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
          </>)}

          {step===1 && (<>
            <div className="form-group"><label className="form-label">Delivery Platform</label>
              <select className="form-select" value={form.platform} onChange={e=>set('platform',e.target.value)}>
                <option value="">Select your platform</option>
                {PLATFORMS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Your City</label>
              <select className="form-select" value={form.city} onChange={e=>set('city',e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Vehicle</label>
                <select className="form-select" value={form.vehicleType} onChange={e=>set('vehicleType',e.target.value)}>
                  <option>Bike</option><option>Auto</option><option>Scooter</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom:0}}><label className="form-label">Avg Daily Earnings (₹)</label><input className="form-input" type="number" placeholder="800" value={form.dailyEarnings} onChange={e=>set('dailyEarnings',e.target.value)}/></div>
            </div>
          </>)}

          {step===2 && (<>
            {/* OTP */}
            <div style={{padding:'16px',background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)',marginBottom:14}}>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-8"><span style={{fontSize:15}}>📱</span><span style={{fontWeight:600,fontSize:13}}>OTP Verification</span></div>
                {otpVerified && <span className="badge badge-green">✓ Verified</span>}
              </div>
              {!otpVerified && (!otpSent
                ? <button className="btn btn-outline btn-sm w-full" onClick={sendOtp} disabled={loading}>{loading?<span className="spinner spinner-dark"/>:null} Send OTP to {form.phone||'your number'}</button>
                : <div className="flex gap-8"><input className="form-input" placeholder="4-digit OTP (any 4 digits)" maxLength={4} value={form.otp} onChange={e=>set('otp',e.target.value)}/><button className="btn btn-primary btn-sm" onClick={verifyOtp} disabled={loading}>{loading?<span className="spinner"/>:'Verify'}</button></div>
              )}
            </div>
            {/* GPS */}
            <div style={{padding:'16px',background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)',marginBottom:14}}>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-8"><span style={{fontSize:15}}>📍</span><span style={{fontWeight:600,fontSize:13}}>GPS Validation</span></div>
                {gpsOk && <span className="badge badge-green">✓ Captured</span>}
              </div>
              {!gpsOk
                ? <button className="btn btn-outline btn-sm w-full" onClick={captureGps} disabled={loading}>{loading?<span className="spinner spinner-dark"/>:'📍'} Capture My Location</button>
                : <p className="text-sm text-2">Zone registered: {form.city} Metro Area</p>}
            </div>
            {/* Partner ID */}
            <div style={{padding:'16px',background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)'}}>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-8"><span style={{fontSize:15}}>🪪</span><span style={{fontWeight:600,fontSize:13}}>Partner ID Upload</span></div>
                {form.partnerIdFile && <span className="badge badge-green">✓ Uploaded</span>}
              </div>
              <p className="text-sm text-2 mb-12">Upload your {form.platform||'platform'} partner ID card or onboarding letter</p>
              <input type="file" accept="image/*,.pdf" onChange={e=>set('partnerIdFile',e.target.files[0]?.name||null)} style={{display:'none'}} id="pidInput"/>
              <label htmlFor="pidInput" className="btn btn-ghost btn-sm" style={{cursor:'pointer',display:'inline-flex'}}>📄 Choose File</label>
              {form.partnerIdFile && <span className="text-sm text-2" style={{marginLeft:10}}>{form.partnerIdFile}</span>}
            </div>
          </>)}

          {step===3 && riskProfile && (<>
            <div className="alert alert-blue mb-20">
              <span className="alert-icon">🤖</span>
              <div><div style={{fontWeight:600,fontSize:13,marginBottom:2}}>AI Risk Assessment Complete</div><div className="text-sm text-2">Based on your city, platform, and 12-month IMD weather data</div></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:20,padding:'20px',background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)',marginBottom:16}}>
              <div style={{width:72,height:72,borderRadius:'50%',border:`3px solid ${riskColor}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:22,color:riskColor,lineHeight:1}}>{riskProfile.score}</span>
                <span style={{fontSize:10,color:'var(--text-3)'}}>/ 100</span>
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:riskColor}}>{riskProfile.zone} RISK ZONE</div>
                <div className="text-sm text-2 mt-4">{form.city} · {form.platform}</div>
                <div className="text-sm text-2 mt-4">Risk multiplier: <strong>×{riskProfile.multiplier.toFixed(2)}</strong></div>
              </div>
            </div>
            <div style={{padding:'14px 16px',background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)'}}>
              <div className="flex items-center justify-between mb-8"><span style={{fontSize:13,fontWeight:600}}>Initial Trust Score</span><span style={{fontWeight:700,color:'var(--brand)',fontSize:13}}>42 / 100</span></div>
              <div className="progress-track"><div className="progress-fill" style={{width:'42%'}}/></div>
              <p className="text-xs text-3 mt-8">Grows automatically as we verify your delivery activity over 3–4 weeks</p>
            </div>
          </>)}

          <div className="flex justify-between mt-20">
            {step>0
              ? <button className="btn btn-ghost" onClick={()=>setStep(s=>s-1)}>← Back</button>
              : <button className="btn btn-ghost" onClick={()=>navigate('/')}>← Home</button>}
            {step<STEPS.length-1
              ? <button className="btn btn-primary" onClick={next} disabled={!canNext()}>Continue →</button>
              : <button className="btn btn-primary" onClick={finish}>Activate Coverage →</button>}
          </div>
        </div>

        <p className="text-center text-sm text-2 mt-16">
          Already registered?{' '}
          <span style={{color:'var(--brand)',cursor:'pointer',fontWeight:600}} onClick={()=>navigate('/login')}>Login here</span>
        </p>
      </div>
    </div>
  );
}