import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';

const PLANS = [
  { id:'Basic', price:49, maxPayout:1500, features:['₹1,500/week max payout','Rain + Heat triggers','3 claims per month','Standard AI fraud checks'], best:'Part-time workers' },
  { id:'Standard', price:99, maxPayout:3000, popular:true, features:['₹3,000/week max payout','Rain, Heat, AQI, Flood triggers','8 claims per month','Advanced 5-layer AI detection','Priority processing'], best:'Full-time workers' },
  { id:'Premium', price:149, maxPayout:5000, features:['₹5,000/week max payout','All triggers + Social disruptions','Unlimited claims','Instant payout < 5 min','Dedicated support line'], best:'High-earning partners' },
];

const TRIGGERS = [
  { icon:'🌧️', name:'Heavy Rain', threshold:'>60mm/day', api:'OpenWeatherMap', plans:['Basic','Standard','Premium'] },
  { icon:'🌡️', name:'Heatwave', threshold:'>45°C', api:'OpenWeatherMap', plans:['Basic','Standard','Premium'] },
  { icon:'😷', name:'Severe AQI', threshold:'>400 AQI', api:'CPCB AQI API', plans:['Standard','Premium'] },
  { icon:'🌊', name:'Flood Alert', threshold:'Govt. advisory', api:'NDMA API', plans:['Standard','Premium'] },
  { icon:'🚧', name:'Local Curfew', threshold:'Zone closure', api:'Social API (mock)', plans:['Premium'] },
  { icon:'📵', name:'Platform Outage', threshold:'>2hr downtime', api:'Status API', plans:['Premium'] },
];

export default function Policy() {
  const navigate = useNavigate();
  const { user, policy, setPolicy, calculatePremium } = useApp();
  const [selected, setSelected] = useState(policy?.plan||'Standard');
  const [paying, setPaying] = useState(false);
  if(!user){ navigate('/register'); return null; }

  const activate = () => {
    setPaying(true);
    setTimeout(()=>{
      const plan = PLANS.find(p=>p.id===selected);
      const premium = calculatePremium(selected, user.city, user.platform, user.dailyEarnings);
      const start = new Date(), end = new Date(start.getTime()+7*24*60*60*1000);
      setPolicy({ plan:selected, premium, maxPayout:plan.maxPayout, startDate:start.toISOString().split('T')[0], endDate:end.toISOString().split('T')[0], status:'ACTIVE', claimsUsed:0 });
      setPaying(false);
    }, 2000);
  };

  const renew = () => {
    const start=new Date(), end=new Date(start.getTime()+7*24*60*60*1000);
    setPolicy({...policy, startDate:start.toISOString().split('T')[0], endDate:end.toISOString().split('T')[0], claimsUsed:0});
  };

  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-header">
          <h1>Insurance Policy</h1>
          <p>Weekly parametric income protection — priced to match your payout cycle</p>
        </div>

        {/* Active policy */}
        {policy && (
          <div className="card-blue mb-20">
            <div className="flex items-center justify-between">
              <div>
                <div style={{fontSize:11,opacity:0.75,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Active Policy</div>
                <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:22,marginBottom:4}}>GigShield {policy.plan}</div>
                <div style={{opacity:0.9,fontSize:13}}>₹{policy.premium}/week · Up to ₹{policy.maxPayout.toLocaleString()} covered</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'8px 14px',marginBottom:8}}>
                  <div style={{fontSize:10,opacity:0.75,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.05em'}}>Valid Until</div>
                  <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:700,fontSize:15}}>{policy.endDate}</div>
                </div>
                <button className="btn btn-sm" style={{background:'white',color:'var(--brand-dark)',fontWeight:700}} onClick={renew}>↻ Renew Week</button>
              </div>
            </div>
            <div style={{marginTop:18,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.2)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[{l:'Start Date',v:policy.startDate},{l:'End Date',v:policy.endDate},{l:'Claims Used',v:(policy.claimsUsed||0)+' this week'},{l:'Status',v:'● ACTIVE'}].map((x,i)=>(
                <div key={i}><div style={{fontSize:10,opacity:0.7,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>{x.l}</div><div style={{fontWeight:600,fontSize:13}}>{x.v}</div></div>
              ))}
            </div>
          </div>
        )}

        {/* Plan selection */}
        <div className="mb-16">
          <h3 style={{fontSize:16,marginBottom:3}}>{policy?'Change Your Plan':'Choose a Plan'}</h3>
          <p className="text-sm text-2">AI adjusts the premium based on your city's risk score. All plans billed weekly.</p>
        </div>

        <div className="grid-3 mb-20">
          {PLANS.map(plan=>{
            const price = calculatePremium(plan.id, user.city, user.platform, user.dailyEarnings);
            const isSelected = selected===plan.id;
            return (
              <div key={plan.id} className={`plan-card ${isSelected?'selected':''} ${plan.popular?'':''}` } onClick={()=>setSelected(plan.id)}>
                {plan.popular && <div className="plan-popular-badge">MOST POPULAR</div>}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{plan.id}</div>
                  <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:28,color:isSelected?'var(--brand)':'var(--text)',letterSpacing:'-0.5px'}}>
                    ₹{price}<span style={{fontSize:13,fontWeight:400,color:'var(--text-2)'}}>/ week</span>
                  </div>
                  {price!==plan.price&&<div className="text-xs text-3 mt-4">AI-adjusted from ₹{plan.price} for {user.city}</div>}
                  <div style={{fontSize:12,color:'var(--green)',marginTop:6,fontWeight:600}}>Up to ₹{plan.maxPayout.toLocaleString()} / week</div>
                </div>
                <div className="text-xs text-2 mb-12">Best for: {plan.best}</div>
                <div className="divider"/>
                {plan.features.map((f,i)=>(
                  <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8}}>
                    <span style={{color:'var(--green)',fontSize:12,flexShrink:0,marginTop:1}}>✓</span>
                    <span className="text-sm text-2">{f}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Triggers table */}
        <div className="card mb-20">
          <h3 style={{fontSize:15,marginBottom:16}}>Parametric Triggers Covered</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {TRIGGERS.map((t,i)=>{
              const active = t.plans.includes(selected);
              return (
                <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 14px',borderRadius:9,background:active?'var(--blue-bg)':'var(--surface2)',border:'1px solid '+(active?'var(--blue-border)':'var(--border)'),opacity:active?1:0.5}}>
                  <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{t.name}</div>
                    <div className="text-xs text-3">{t.threshold} · {t.api}</div>
                  </div>
                  {active&&<span className="badge badge-blue ml-auto" style={{fontSize:10}}>Active</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          <button className="btn btn-primary btn-lg" onClick={activate} disabled={paying}>
            {paying?<><span className="spinner"/>Processing Razorpay...</>
              :policy?`Switch to ${selected} — ₹${calculatePremium(selected,user.city,user.platform,user.dailyEarnings)}/week`
              :`Activate ${selected} — ₹${calculatePremium(selected,user.city,user.platform,user.dailyEarnings)}/week`}
          </button>
          <p className="text-xs text-3">Coverage begins instantly · Cancel anytime · Zero hidden fees</p>
        </div>
      </main>
    </div>
  );
}
