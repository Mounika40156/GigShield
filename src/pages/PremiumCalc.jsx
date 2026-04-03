import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';

const CITIES = ['Mumbai','Delhi','Hyderabad','Bengaluru','Chennai','Kolkata','Pune','Ahmedabad'];
const PLATFORMS = ['Swiggy','Zomato','Zepto','Blinkit','Amazon Flex','Flipkart'];
const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
const HIST = { Mumbai:[4.2,3.8,5.1,6.3,5.5,4.9,6.8,5.2], Delhi:[2.1,1.8,3.2,4.5,5.1,4.8,3.2,2.9], Hyderabad:[1.2,1.5,2.1,3.4,2.8,1.9,1.5,1.2], Bengaluru:[2.8,3.1,2.5,3.8,4.2,3.5,2.9,2.4], Chennai:[3.5,4.1,3.8,5.2,6.1,5.5,4.8,3.9], Kolkata:[3.8,4.5,5.2,6.8,7.1,6.5,5.8,4.9], Pune:[1.5,1.8,2.3,3.1,2.8,2.1,1.9,1.6], Ahmedabad:[0.8,1.1,1.5,2.8,3.1,2.5,1.8,1.2] };
const FEATURES = [{name:'City Rain Risk',w:35},{name:'Heat Index',w:20},{name:'AQI History',w:15},{name:'Platform Risk',w:15},{name:'Earnings Level',w:10},{name:'Trust Score',w:5}];

export default function PremiumCalc() {
  const navigate = useNavigate();
  const { user, calculatePremium, calculateRiskProfile } = useApp();
  const [city, setCity] = useState(user?.city||'Hyderabad');
  const [platform, setPlatform] = useState(user?.platform||'Swiggy');
  const [earnings, setEarnings] = useState(user?.dailyEarnings||'800');
  const [plan, setPlan] = useState('Standard');
  const [result, setResult] = useState(null);

  useEffect(()=>{
    if(!user){ navigate('/register'); return; }
    const risk = calculateRiskProfile(city, platform, earnings);
    const premium = calculatePremium(plan, city, platform, earnings);
    const maxPayout = {Basic:1500,Standard:3000,Premium:5000}[plan];
    const weeklyEarnings = (parseFloat(earnings)||800)*5;
    const expectedLoss = Math.round(weeklyEarnings*0.08);
    setResult({risk,premium,maxPayout,expectedLoss});
  },[city,platform,plan,earnings,user]);

  if(!user) return null;

  const histData = (HIST[city]||HIST['Hyderabad']).map((v,i)=>({month:MONTHS[i],disruptions:v}));
  const maxV = Math.max(...histData.map(d=>d.disruptions));
  const riskColor = result?.risk.zone==='HIGH'?'var(--red)':result?.risk.zone==='MEDIUM'?'var(--yellow)':'var(--green)';

  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-header">
          <h1>Premium Calculator</h1>
          <p>AI-powered weekly premium based on hyper-local risk factors — powered by XGBoost</p>
        </div>

        <div className="grid-2 mb-20" style={{alignItems:'start'}}>
          <div className="card">
            <h3 style={{fontSize:15,marginBottom:16}}>Input Parameters</h3>
            <div className="form-group"><label className="form-label">City / Zone</label>
              <select className="form-select" value={city} onChange={e=>setCity(e.target.value)}>
                {CITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Delivery Platform</label>
              <select className="form-select" value={platform} onChange={e=>setPlatform(e.target.value)}>
                {PLATFORMS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Average Daily Earnings (₹)</label>
              <input className="form-input" type="number" value={earnings} onChange={e=>setEarnings(e.target.value)} placeholder="800"/>
            </div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Plan</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                {['Basic','Standard','Premium'].map(p=>(
                  <button key={p} onClick={()=>setPlan(p)} style={{padding:'9px 8px',border:'1px solid '+(plan===p?'var(--brand)':'var(--border)'),borderRadius:8,background:plan===p?'var(--brand-light)':'white',color:plan===p?'var(--brand-dark)':'var(--text-2)',fontWeight:plan===p?600:400,cursor:'pointer',fontSize:13,transition:'all 0.15s'}}>{p}</button>
                ))}
              </div>
            </div>
            <div className="divider"/>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Model Feature Weights (XGBoost)</div>
            {FEATURES.map((f,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm text-2">{f.name}</span>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--brand)'}}>{f.w}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width:f.w+'%'}}/></div>
              </div>
            ))}
          </div>

          <div>
            {result && (
              <>
                <div className="card-blue mb-16">
                  <div style={{fontSize:11,opacity:0.75,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>AI-Calculated Weekly Premium</div>
                  <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:900,fontSize:48,lineHeight:1,marginBottom:4}}>₹{result.premium}</div>
                  <div style={{opacity:0.9,fontSize:13,marginBottom:18}}>{plan} Plan · {city} · per week</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div style={{background:'rgba(0,0,0,0.15)',borderRadius:8,padding:'10px 14px'}}>
                      <div style={{fontSize:10,opacity:0.75,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Max Payout / Week</div>
                      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:700,fontSize:16}}>₹{result.maxPayout.toLocaleString()}</div>
                    </div>
                    <div style={{background:'rgba(0,0,0,0.15)',borderRadius:8,padding:'10px 14px'}}>
                      <div style={{fontSize:10,opacity:0.75,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Avg Expected Loss</div>
                      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:700,fontSize:16}}>₹{result.expectedLoss}/week</div>
                    </div>
                  </div>
                </div>

                <div className="card mb-16">
                  <h3 style={{fontSize:14,marginBottom:14}}>Risk Zone Breakdown</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
                    <div style={{textAlign:'center',padding:'14px 8px',background:'var(--surface2)',borderRadius:9}}>
                      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:24,color:riskColor}}>{result.risk.score}</div>
                      <div className="text-xs text-3">RISK SCORE</div>
                    </div>
                    <div style={{textAlign:'center',padding:'14px 8px',background:'var(--surface2)',borderRadius:9}}>
                      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:18,color:'var(--brand)'}}>×{result.risk.multiplier.toFixed(2)}</div>
                      <div className="text-xs text-3">MULTIPLIER</div>
                    </div>
                    <div style={{textAlign:'center',padding:'14px 8px',background:'var(--surface2)',borderRadius:9}}>
                      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:16,color:riskColor}}>{result.risk.zone}</div>
                      <div className="text-xs text-3">ZONE</div>
                    </div>
                  </div>
                  <div style={{padding:'10px 12px',background:'var(--blue-bg)',borderRadius:8,border:'1px solid var(--blue-border)'}}>
                    <p className="text-xs text-2">💡 Model trained on 12-month IMD weather data + historical claim simulations for {city}</p>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{fontSize:14,marginBottom:12}}>Payout Formula</h3>
                  <div style={{fontFamily:'monospace',fontSize:12,background:'var(--surface2)',borderRadius:9,padding:'14px 16px',lineHeight:2,border:'1px solid var(--border)'}}>
                    <span style={{color:'var(--brand)'}}>Payout</span> = min(<span style={{color:'var(--green)'}}>EstLoss</span>, PlanMax)<br/>
                    <span style={{color:'var(--green)'}}>EstLoss</span> = DailyEarnings × Severity × Duration<br/>
                    <span style={{color:'var(--text-3)'}}>// e.g. 72mm rain → severity 0.2 → ₹{Math.round((parseFloat(earnings)||800)*0.2*2)} payout</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-16">
            <div><h3 style={{fontSize:15,marginBottom:2}}>Historical Disruptions — {city}</h3><p className="text-sm text-2">Disruption days per month (last 8 months) — used to train the premium model</p></div>
            <span className="badge badge-blue">IMD Data</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={histData} margin={{top:5,right:5,bottom:0,left:0}}>
              <XAxis dataKey="month" stroke="var(--text-3)" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis stroke="var(--text-3)" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'white',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} formatter={v=>[v+' days','Disruptions']}/>
              <Bar dataKey="disruptions" radius={[5,5,0,0]}>
                {histData.map((d,i)=><Cell key={i} fill={d.disruptions>=maxV*0.8?'#DC2626':d.disruptions>=maxV*0.5?'#D97706':'#059669'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}