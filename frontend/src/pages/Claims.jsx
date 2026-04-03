import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';

const FRAUD_STEPS = [
  { label:'GPS Signal Validation',    note:'Cross-validating with cell tower data'         },
  { label:'Device Fingerprint Check', note:'One account per device policy'                 },
  { label:'Behavioral Baseline Match',note:'Comparing your delivery movement pattern'      },
  { label:'Zone Density Analysis',    note:'Checking for coordinated fraud attempts'       },
  { label:'Trust Score Evaluation',   note:'Applying your worker trust score'              },
];

export default function Claims() {
  const navigate = useNavigate();
  const { user, policy, claims, addClaim, activeTrigger, autoClaim, refreshAllData, platformData, floodData } = useApp();
  const [fraudStep,   setFraudStep]   = useState(-1);
  const [fraudDone,   setFraudDone]   = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [latestClaim, setLatestClaim] = useState(null);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!user) { navigate('/register'); return; }
    setLoading(true);
    refreshAllData(user.city, user.platform).finally(() => setLoading(false));
  }, [user]); // eslint-disable-line

  // If auto-claim already fired, show it in the panel
  useEffect(() => {
    if (autoClaim && !latestClaim) {
      setFraudDone(true);
      setLatestClaim(autoClaim);
      setFraudStep(FRAUD_STEPS.length);
    }
  }, [autoClaim]); // eslint-disable-line

  if (!user) return null;

  const ALL_TRIGGERS = [
    {
      icon:'🌧️', key:'rain',
      name:'Heavy Rain (78mm)', threshold:'Rainfall > 60mm',
      api:'OpenWeatherMap API', impact:'40-60% order drop',
      active: activeTrigger?.type === 'Heavy Rain',
    },
    {
      icon:'🌡️', key:'heat',
      name:'Heatwave (46°C)', threshold:'Temperature > 45°C',
      api:'IMD + OpenWeatherMap', impact:'25-35% order drop',
      active: activeTrigger?.type === 'Heatwave',
    },
    {
      icon:'😷', key:'aqi',
      name:'Severe AQI (405)', threshold:'AQI Index > 400',
      api:'CPCB AQI API', impact:'20-30% order drop',
      active: activeTrigger?.type === 'Severe AQI',
    },
    {
      icon:'🌊', key:'flood',
      name: floodData ? `Flood Alert (${floodData.waterlogging})` : 'Flood Alert',
      threshold: floodData ? `NDMA Level: ${floodData.level}` : 'NDMA advisory',
      api:'NDMA Mock API', impact:'Near-zero deliveries',
      active: activeTrigger?.type === 'Flood Alert',
      badge: floodData?.level,
    },
    {
      icon:'⚡', key:'outage',
      name: platformData ? `${platformData.platform} Outage (${platformData.outageHours}hr)` : 'Platform Outage',
      threshold: platformData ? `Uptime: ${platformData.uptime}%` : '> 2hr downtime',
      api:'Platform Status API', impact:'Zero order generation',
      active: activeTrigger?.type === 'Platform Outage',
    },
  ];

  const simulateClaim = (trigger) => {
    if (!policy) { navigate('/policy'); return; }
    setFraudStep(0); setFraudDone(false); setLatestClaim(null); setProcessing(true);
    let s = 0;
    const id = setInterval(() => {
      s++;
      setFraudStep(s);
      if (s >= FRAUD_STEPS.length) {
        clearInterval(id);
        setTimeout(() => {
          setFraudDone(true);
          setProcessing(false);
          const amount = Math.min(
            Math.round((parseFloat(user.dailyEarnings) || 800) * (0.2 + Math.random() * 0.3)),
            policy.maxPayout
          );
          const c = addClaim(trigger.name, amount, false);
          setLatestClaim(c);
        }, 500);
      }
    }, 750);
  };

  const paidClaims = claims.filter(c => c.status === 'PAID');
  const totalPaid  = paidClaims.reduce((s, c) => s + c.amount, 0);
  const autoClaims = claims.filter(c => c.autoTriggered).length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div className="page-header">
          <h1>Claims Management</h1>
          <p>Zero-touch parametric claims — auto-triggered by 5 live disruption APIs, paid in under 5 minutes</p>
        </div>

        {/* Auto-claim notice */}
        {autoClaim && (
          <div style={{background:'linear-gradient(135deg,#065f46,#047857)',borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:14}} className="fade-up">
            <span style={{fontSize:24}}>💸</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:'white',fontSize:14}}>Zero-Touch Claim Auto-Initiated — {autoClaim.triggerLabel}</div>
              <div style={{color:'rgba(255,255,255,0.85)',fontSize:12,marginTop:3}}>{autoClaim.id} · ₹{autoClaim.amount} · No action needed from you</div>
            </div>
            <span className="badge" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}>⚡ Auto</span>
          </div>
        )}

        {!policy && (
          <div className="alert alert-yellow mb-20">
            <span className="alert-icon">⚠️</span>
            <div><div style={{fontWeight:600,fontSize:13}}>No Active Policy</div><div className="text-sm text-2 mt-4">Activate a policy first. <span style={{color:'var(--brand)',cursor:'pointer',fontWeight:600}} onClick={() => navigate('/policy')}>Activate Now →</span></div></div>
          </div>
        )}

        <div className="grid-4 mb-20">
          {[
            { l:'Total Claims',      v:claims.length,                  sub:'since activation' },
            { l:'Total Paid Out',    v:'₹'+totalPaid.toLocaleString(), sub:paidClaims.length+' approved' },
            { l:'Auto-Triggered',    v:autoClaims,                     sub:'zero-touch payouts' },
            { l:'Avg Payout Time',   v:'< 5 min',                      sub:'fully automated' },
          ].map((m,i) => (
            <div className="metric-card" key={i}>
              <div className="metric-label">{m.l}</div>
              <div className="metric-value" style={{fontSize:20}}>{m.v}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-20" style={{alignItems:'start'}}>
          {/* 5 Triggers */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{fontSize:15}}>Live Parametric Triggers</h3>
              {loading && <span className="spinner spinner-dark"/>}
            </div>
            <p className="text-sm text-2 mb-16">5 disruption APIs monitored in real-time · Click Simulate to demo the claim flow</p>
            {ALL_TRIGGERS.map((t, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10,padding:'12px 14px',borderRadius:9,background:t.active?'var(--red-bg)':'var(--surface2)',border:'1px solid '+(t.active?'var(--red-border)':'var(--border)')}}>
                <span style={{fontSize:20,flexShrink:0}}>{t.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13}}>{t.name}</div>
                  <div className="text-xs text-3">{t.threshold} · {t.api}</div>
                  <div className="text-xs" style={{color:'var(--yellow)',marginTop:2}}>{t.impact}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                  <span className={`badge ${t.active?'badge-red':'badge-green'}`}>{t.active?'● TRIGGERED':'✓ CLEAR'}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => simulateClaim(t)} disabled={processing}>Simulate →</button>
                </div>
              </div>
            ))}

            {/* Live API status */}
            <div style={{marginTop:16,padding:'12px 14px',background:'var(--surface2)',borderRadius:9,border:'1px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-3)',marginBottom:10}}>API Health</div>
              {[
                { name:'OpenWeatherMap', status:'LIVE',  latency:'142ms' },
                { name:'CPCB AQI',       status:'LIVE',  latency:'89ms'  },
                { name:'NDMA Flood',     status:'MOCK',  latency:'400ms' },
                { name:'Platform Status',status:'MOCK',  latency:'500ms' },
                { name:'IMD Heatwave',   status:'LIVE',  latency:'210ms' },
              ].map((api, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:api.status==='LIVE'?'var(--green)':'var(--yellow)',flexShrink:0}}/>
                    <span style={{fontSize:12,color:'var(--text-2)'}}>{api.name}</span>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span className={`badge ${api.status==='LIVE'?'badge-green':'badge-yellow'}`} style={{fontSize:10}}>{api.status}</span>
                    <span style={{fontSize:11,color:'var(--text-3)'}}>{api.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud detection + result */}
          <div className="card">
            <h3 style={{fontSize:15,marginBottom:4}}>AI Fraud Detection</h3>
            <p className="text-sm text-2 mb-16">5-layer verification runs in real-time on every claim</p>

            {fraudStep === -1 && !fraudDone && (
              <div style={{textAlign:'center',padding:'32px 0',color:'var(--text-3)'}}>
                <div style={{fontSize:32,marginBottom:12}}>🛡️</div>
                <div className="text-sm">Simulate a trigger to see AI fraud detection in action</div>
              </div>
            )}

            {(fraudStep >= 0 || fraudDone) && (
              <>
                {FRAUD_STEPS.map((s, i) => {
                  const done    = fraudDone || i < fraudStep;
                  const running = !fraudDone && i === fraudStep;
                  return (
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:14,opacity:i>fraudStep&&!fraudDone?0.25:1,transition:'opacity 0.3s'}}>
                      <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:done?'var(--green-bg)':running?'var(--blue-bg)':'var(--surface2)',border:'1.5px solid '+(done?'var(--green-border)':running?'var(--blue-border)':'var(--border)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:done?'var(--green)':running?'var(--brand)':'var(--text-3)',fontWeight:700,marginTop:1}}>
                        {running ? <span className="spinner spinner-dark" style={{width:12,height:12}}/> : done ? '✓' : i+1}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:done?'var(--green)':'var(--text)'}}>{s.label}</div>
                        <div className="text-xs text-3">{s.note}</div>
                      </div>
                    </div>
                  );
                })}

                {fraudDone && latestClaim && (
                  <>
                    <div className="alert alert-green mt-12">
                      <span className="alert-icon">✅</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>Claim Approved — {latestClaim.id}</div>
                        <div className="text-sm text-2 mt-4">₹{latestClaim.amount} → UPI transfer initiated</div>
                      </div>
                    </div>
                    {/* Payout breakdown */}
                    <div style={{marginTop:12,padding:'12px 14px',background:'var(--surface2)',borderRadius:9,border:'1px solid var(--border)'}}>
                      <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-3)',marginBottom:10}}>Payout Breakdown</div>
                      {[
                        { label:'Daily Earnings',    value:'₹'+(parseFloat(user.dailyEarnings)||800)    },
                        { label:'Disruption Severity',value:'35%'                                       },
                        { label:'Duration Factor',   value:'×1.5'                                       },
                        { label:'Plan Cap',          value:policy?'₹'+policy.maxPayout:'—'             },
                        { label:'Final Payout',      value:'₹'+latestClaim.amount, highlight:true      },
                      ].map((row,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:6,paddingBottom:row.highlight?0:6,borderBottom:row.highlight?'none':'1px solid var(--border)'}}>
                          <span style={{fontSize:12,color:'var(--text-2)'}}>{row.label}</span>
                          <span style={{fontSize:12,fontWeight:row.highlight?700:500,color:row.highlight?'var(--green)':'var(--text)'}}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Claims History */}
        <div className="card">
          <div className="flex items-center justify-between mb-16">
            <h3 style={{fontSize:15}}>Claims History</h3>
            <div className="flex gap-8">
              <span className="badge badge-green">{paidClaims.length} Paid</span>
              <span className="badge badge-blue">{claims.filter(c=>c.autoTriggered).length} Auto-Triggered</span>
              <span className="badge badge-yellow">{claims.filter(c=>c.status==='UNDER REVIEW').length} Under Review</span>
            </div>
          </div>
          {claims.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-3)'}}>No claims yet. Simulate one above.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Claim ID</th><th>Date</th><th>Disruption Trigger</th><th>Amount</th><th>Processed In</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {claims.map(c => (
                    <tr key={c.id}>
                      <td style={{fontFamily:'monospace',fontSize:12,color:'var(--brand)'}}>{c.id}</td>
                      <td className="text-2">{c.date}</td>
                      <td style={{fontWeight:500}}>{c.trigger}</td>
                      <td style={{fontWeight:600,color:'var(--green)'}}>₹{c.amount}</td>
                      <td className="text-2">{c.processedIn}</td>
                      <td><span className={`badge ${c.autoTriggered?'badge-green':'badge-gray'}`}>{c.autoTriggered?'⚡ Auto':'Manual'}</span></td>
                      <td><span className={`badge ${c.status==='PAID'?'badge-green':c.status==='PROCESSING'?'badge-blue':'badge-yellow'}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}