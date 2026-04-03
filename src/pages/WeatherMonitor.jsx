import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';

const CITIES    = ['Mumbai','Delhi','Hyderabad','Bengaluru','Chennai','Kolkata','Pune','Ahmedabad'];
const PLATFORMS = ['Swiggy','Zomato','Zepto','Blinkit','Amazon Flex','Flipkart'];

function GaugeBar({ value, threshold, unit, label, icon, triggered }) {
  const pct   = Math.min((value / (threshold * 1.5)) * 100, 100);
  const color = triggered ? 'var(--red)' : value >= threshold * 0.7 ? 'var(--yellow)' : 'var(--green)';
  return (
    <div className={`gauge-bar ${triggered ? 'triggered' : ''}`}>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-8"><span style={{fontSize:18}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{label}</span></div>
        {triggered && <span className="badge badge-red">TRIGGERED</span>}
      </div>
      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:28,color,letterSpacing:'-0.5px',marginBottom:10}}>{value}{unit}</div>
      <div className="progress-track" style={{height:6,marginBottom:8}}>
        <div style={{height:'100%',borderRadius:10,background:color,width:pct+'%',transition:'width 0.6s ease'}}/>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-3">0{unit}</span>
        <span className="text-xs text-3">Trigger: {threshold}{unit}</span>
        <span className="text-xs text-3">{Math.round(threshold*1.5)}{unit}</span>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, subvalue, color, badgeText, badgeClass }) {
  return (
    <div style={{background:color==='red'?'var(--red-bg)':color==='yellow'?'var(--yellow-bg)':'var(--green-bg)',border:'1px solid '+(color==='red'?'var(--red-border)':color==='yellow'?'var(--yellow-border)':'var(--green-border)'),borderRadius:10,padding:'16px'}}>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-8"><span style={{fontSize:18}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{label}</span></div>
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </div>
      <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:20,color:color==='red'?'var(--red)':color==='yellow'?'var(--yellow)':'var(--green)',marginBottom:4}}>{value}</div>
      <div className="text-xs text-3">{subvalue}</div>
    </div>
  );
}

export default function WeatherMonitor() {
  const navigate = useNavigate();
  const { user, weatherData, platformData, floodData, activeTrigger, refreshAllData } = useApp();
  const [city,        setCity]      = useState(user?.city || 'Hyderabad');
  const [platform,    setPlatform]  = useState(user?.platform || 'Swiggy');
  const [loading,     setLoading]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [polling,     setPolling]   = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { if (!user) { navigate('/register'); return; } doRefresh(); }, [city, platform]); // eslint-disable-line
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  if (!user) return null;

  const doRefresh = async () => {
    setLoading(true);
    await refreshAllData(city, platform);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const startPolling = () => {
    if (polling) return;
    setPolling(true);
    pollRef.current = setInterval(doRefresh, 15000);
  };

  const TRIGGERS_REF = [
    { icon:'🌧️', name:'Heavy Rain',      condition:'Rainfall > 60mm/day',     api:'OpenWeatherMap API',  impact:'40-60% order drop'   },
    { icon:'🌡️', name:'Heatwave',        condition:'Temperature > 45°C',      api:'IMD + OpenWeatherMap',impact:'25-35% order drop'   },
    { icon:'😷', name:'Severe AQI',      condition:'AQI Index > 400',         api:'CPCB AQI API',        impact:'20-30% order drop'   },
    { icon:'🌊', name:'Flood Alert',     condition:'NDMA advisory issued',     api:'NDMA API (mock)',     impact:'Near-zero deliveries' },
    { icon:'⚡', name:'Platform Outage', condition:'> 2hr app downtime',       api:'Platform Status API', impact:'Zero orders'          },
  ];

  const floodLevel = floodData?.level || 'GREEN';
  const floodColor = floodLevel==='RED'?'red':floodLevel==='ORANGE'||floodLevel==='YELLOW'?'yellow':'green';

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div className="page-header">
          <h1>Live Disruption Monitor</h1>
          <p>5 parametric triggers monitored in real-time — auto-initiates zero-touch payouts on breach</p>
        </div>

        {activeTrigger && (
          <div className="trigger-banner">
            <div className="trigger-dot"/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,color:'var(--red)',fontSize:13}}>Parametric Trigger Active — {activeTrigger.type}</div>
              <div className="text-sm text-2 mt-4">Current: {activeTrigger.value} · Threshold: {activeTrigger.threshold} · Severity: {activeTrigger.severity}</div>
            </div>
            <button className="btn btn-sm" style={{background:'var(--red)',color:'white',flexShrink:0}} onClick={() => navigate('/claims')}>View Claims →</button>
          </div>
        )}

        {/* Controls */}
        <div className="card mb-20">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto auto',gap:16,alignItems:'flex-end'}}>
            <div>
              <label className="form-label">Monitor City</label>
              <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Platform</label>
              <select className="form-select" value={platform} onChange={e => setPlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button className="btn btn-outline" onClick={doRefresh} disabled={loading}>
              {loading ? <span className="spinner spinner-dark"/> : '↻'} Refresh
            </button>
            <button className="btn btn-primary" onClick={startPolling} disabled={polling} style={{background:polling?'var(--green)':undefined}}>
              {polling ? '● Polling 15s' : '▶ Auto-Poll'}
            </button>
          </div>
          {lastUpdated && <div className="text-xs text-3 mt-10">Last updated: {lastUpdated.toLocaleTimeString()}</div>}
        </div>

        {weatherData ? (
          <>
            {/* Weather gauges */}
            <div className="grid-3 mb-16">
              <GaugeBar value={weatherData.rain} threshold={60}  unit="mm" label="Rainfall"    icon="🌧️" triggered={weatherData.rain>=60}/>
              <GaugeBar value={weatherData.temp} threshold={45}  unit="°C" label="Temperature" icon="🌡️" triggered={weatherData.temp>=45}/>
              <GaugeBar value={weatherData.aqi}  threshold={400} unit=""   label="AQI Index"   icon="😷" triggered={weatherData.aqi>=400}/>
            </div>

            {/* Flood + Platform status */}
            <div className="grid-2 mb-20">
              <StatusCard
                icon="🌊" label="NDMA Flood Advisory"
                value={floodData ? `${floodData.waterlogging} Waterlogging` : 'Loading…'}
                subvalue={floodData ? `Level: ${floodData.level} · ${city} · NDMA Mock API` : ''}
                color={floodColor}
                badgeText={floodData?.advisory ? '⚠ ADVISORY' : '✓ CLEAR'}
                badgeClass={floodData?.advisory ? 'badge-red' : 'badge-green'}
              />
              <StatusCard
                icon="⚡" label="Platform Status API"
                value={platformData ? (platformData.outageActive ? `Outage: ${platformData.outageHours}hr` : `${platform} Online`) : 'Loading…'}
                subvalue={platformData ? `Uptime: ${platformData.uptime}% · Last outage: ${platformData.lastOutage}` : ''}
                color={platformData?.outageActive ? 'red' : 'green'}
                badgeText={platformData?.outageActive ? '● OUTAGE' : '✓ ONLINE'}
                badgeClass={platformData?.outageActive ? 'badge-red' : 'badge-green'}
              />
            </div>

            {/* Current conditions */}
            <div className="card mb-20">
              <h3 style={{fontSize:15,marginBottom:14}}>Current Conditions — {city}</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                {[
                  { label:'Condition',   value:weatherData.description, icon:weatherData.icon||'🌤️' },
                  { label:'Temperature', value:weatherData.temp+'°C'                                 },
                  { label:'Rainfall',    value:weatherData.rain+'mm'                                 },
                  { label:'AQI Level',   value:String(weatherData.aqi)                              },
                ].map((x,i) => (
                  <div key={i} style={{padding:'14px',background:'var(--surface2)',borderRadius:9,textAlign:'center'}}>
                    {x.icon && <div style={{fontSize:24,marginBottom:6}}>{x.icon}</div>}
                    <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:700,fontSize:18,color:'var(--text)',marginBottom:4}}>{x.value}</div>
                    <div className="text-xs text-3">{x.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card mb-20" style={{textAlign:'center',padding:'48px 0'}}>
            <div style={{fontSize:32,marginBottom:10}}>🌤️</div>
            <div className="text-sm text-2">Click Refresh to load live data</div>
          </div>
        )}

        {/* All 5 trigger reference */}
        <div className="card">
          <h3 style={{fontSize:15,marginBottom:14}}>All 5 Parametric Trigger Thresholds</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {TRIGGERS_REF.map((t,i) => {
              const isActive = activeTrigger?.type === t.name;
              return (
                <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'12px 14px',borderRadius:9,background:isActive?'var(--red-bg)':'var(--surface2)',border:'1px solid '+(isActive?'var(--red-border)':'var(--border)')}}>
                  <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{t.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{t.name} {isActive&&<span className="badge badge-red" style={{marginLeft:4}}>ACTIVE</span>}</div>
                    <div className="text-xs text-3 mt-4">{t.condition}</div>
                    <div className="text-xs text-3">📡 {t.api} · {t.impact}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}