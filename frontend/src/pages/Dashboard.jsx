import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--text-2)' }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 500 }}>{p.name}: ₹{p.value}</div>)}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, policy, claims, activeTrigger, autoClaim, refreshAllData, fraudStats, getBCR, FAKE_WORKERS_DB } = useApp();
  const [countdown,  setCountdown]  = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/register'); return; }
    refreshAllData(user.city, user.platform).then(() => setDataLoaded(true));
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!autoClaim) { setCountdown(null); return; }
    setCountdown(4);
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [autoClaim]);

  if (!user) return null;

  const paidClaims    = claims.filter(c => c.status === 'PAID');
  const blockedClaims = claims.filter(c => c.status === 'FRAUD BLOCKED');
  const totalPaid     = paidClaims.reduce((s, c) => s + c.amount, 0);
  const trustScore    = user.trustScore || 42;
  const h             = new Date().getHours();
  const greeting      = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  // BCR Calculation
  const { bcr, totalPremium, totalClaims } = getBCR();
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const earningsData = days.map((day, i) => {
  const claim = claims.find(c => {
    const d = new Date(c.date);
    return d.getDay() === (i + 1) % 7 && c.status === 'PAID';
  });
  const base = parseFloat(user?.dailyEarnings) || 800;
  const actual = claim ? Math.max(base - claim.amount, base * 0.15) : base;
  return { day, actual: Math.round(actual), protected: Math.round(base) };
});
  const bcrNum     = parseFloat(bcr);
  const bcrHealthy = bcrNum <= 0.70;
  const bcrColor   = bcrNum <= 0.55 ? 'var(--green)' : bcrNum <= 0.70 ? 'var(--yellow)' : 'var(--red)';
  const lossRatio  = totalPremium > 0 ? Math.round((totalClaims / totalPremium) * 100) : 0;

  // Fraud detection summary from fake DB
  const cleanWorkers   = FAKE_WORKERS_DB.filter(w => !w.fraudFlag).length;
  const fraudWorkers   = FAKE_WORKERS_DB.filter(w => w.fraudFlag).length;
  const fraudBlockRate = fraudStats.totalChecked > 0
    ? Math.round((fraudStats.fraudBlocked / fraudStats.totalChecked) * 100)
    : 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content fade-up">

        {/* AUTO-PAYOUT BANNER */}
        {autoClaim && (
          <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px rgba(5,150,105,0.25)' }} className="fade-up">
            <div style={{ fontSize: 28 }}>💸</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 3 }}>Zero-Touch Claim Initiated — {autoClaim.triggerLabel}</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                Claim {autoClaim.id} · ₹{autoClaim.amount} · AI fraud check running
                {countdown > 0 ? ` · UPI transfer in ${countdown}s…` : ' · Transfer complete ✓'}
              </div>
            </div>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} onClick={() => navigate('/claims')}>
              View Claim →
            </button>
          </div>
        )}

        {/* ACTIVE TRIGGER BANNER */}
        {activeTrigger && !autoClaim && (
          <div className="trigger-banner">
            <div className="trigger-dot" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--red)', fontSize: 13 }}>Parametric Trigger Active — {activeTrigger.type}</div>
              <div className="text-sm text-2 mt-4">Current: {activeTrigger.value} | Threshold: {activeTrigger.threshold} | AI fraud check running...</div>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white', flexShrink: 0 }} onClick={() => navigate('/claims')}>View Claim →</button>
          </div>
        )}

        <div className="page-header">
          <h1>{greeting}, {user.name?.split(' ')[0]} 👋</h1>
          <p>Here's your GigShield protection overview for this week</p>
        </div>

        {/* Top Metrics */}
        <div className="grid-4 mb-20">
          {[
            { label: 'Trust Score',    value: trustScore + ' / 100',            sub: 'Grows weekly with activity',      icon: '🏅', iconBg: '#EFF6FF' },
            { label: 'Total Paid Out', value: '₹' + totalPaid.toLocaleString(), sub: paidClaims.length + ' claims',     icon: '💸', iconBg: '#ECFDF5' },
            { label: 'Active Policy',  value: policy ? policy.plan + ' Plan' : 'None', sub: policy ? '₹' + policy.premium + '/week' : 'Click to activate', icon: '🛡️', iconBg: policy ? '#ECFDF5' : '#FFFBEB' },
            { label: 'Fraud Blocked',  value: blockedClaims.length + ' claims',  sub: fraudStats.fraudBlocked + ' detected this session', icon: '🚫', iconBg: '#FEF2F2' },
          ].map((m, i) => (
            <div className="metric-card" key={i}>
              <div className="metric-icon" style={{ background: m.iconBg }}>{m.icon}</div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value" style={{ fontSize: 18 }}>{m.value}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── BCR + FRAUD SUMMARY PANEL ── */}
        <div className="card mb-20">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 2 }}>Actuarial Health — BCR & Fraud Summary</h3>
              <p className="text-sm text-2">Burning Cost Ratio = total claims ÷ total premium collected</p>
            </div>
            <span className={`badge ${bcrHealthy ? 'badge-green' : 'badge-red'}`}>{bcrHealthy ? '✓ HEALTHY' : '⚠ HIGH RISK'}</span>
          </div>

          <div className="grid-4">
            {/* BCR */}
            <div style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: `1.5px solid ${bcrColor}` }}>
              <div className="text-xs text-3 mb-6">Burning Cost Ratio</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: bcrColor }}>{bcr}</div>
              <div className="text-xs text-3 mt-4">
                Target: 0.55–0.70
                {bcrNum > 0.85 && <span style={{ color: 'var(--red)', display: 'block', marginTop: 4 }}>⚠ Suspend new enrolments</span>}
              </div>
            </div>

            {/* Loss Ratio */}
            <div style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div className="text-xs text-3 mb-6">Loss Ratio</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: lossRatio > 85 ? 'var(--red)' : 'var(--green)' }}>{lossRatio}%</div>
              <div className="text-xs text-3 mt-4">Suspend enrolments if &gt; 85%</div>
            </div>

            {/* Fraud Block Rate */}
            <div style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div className="text-xs text-3 mb-6">Fraud Block Rate</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)' }}>
                {fraudStats.totalChecked > 0 ? fraudBlockRate + '%' : '—'}
              </div>
              <div className="text-xs text-3 mt-4">{fraudStats.fraudBlocked} blocked / {fraudStats.totalChecked} checked</div>
            </div>

            {/* Premium vs Claims */}
            <div style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div className="text-xs text-3 mb-6">Premium Collected</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>₹{totalPremium.toLocaleString()}</div>
              <div className="text-xs text-3 mt-4">Claims paid: ₹{totalClaims.toLocaleString()}</div>
            </div>
          </div>

          {/* BCR bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
              <span>0.0 — Too cheap</span>
              <span>0.55 — 0.70 Target zone</span>
              <span>0.85+ — Danger</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'linear-gradient(90deg, var(--green), var(--yellow), var(--red))', width: '100%', opacity: 0.3, borderRadius: 4 }} />
              <div style={{ position: 'absolute', left: `${Math.min(bcrNum * 100, 100)}%`, top: -2, bottom: -2, width: 3, background: bcrColor, borderRadius: 2, transform: 'translateX(-50%)' }} />
            </div>
          </div>
        </div>

        {/* Fake Worker DB Preview */}
        <div className="card mb-20">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Worker Database — Fraud Detection Status</h3>
          <p className="text-sm text-2 mb-16">Registered workers with GPS + platform login verification status</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Worker ID</th><th>Name</th><th>City</th><th>Platform</th><th>Trust Score</th><th>GPS Check</th><th>Login Check</th><th>Fraud Flag</th></tr>
              </thead>
              <tbody>
                {FAKE_WORKERS_DB.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand)' }}>{w.id}</td>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td className="text-2">{w.city}</td>
                    <td className="text-2">{w.platform}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: w.trustScore + '%', height: '100%', background: w.trustScore >= 60 ? 'var(--green)' : w.trustScore >= 40 ? 'var(--yellow)' : 'var(--red)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{w.trustScore}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${w.gpsActive ? 'badge-green' : 'badge-red'}`}>{w.gpsActive ? '✓ Match' : '✗ Mismatch'}</span></td>
                    <td><span className={`badge ${w.loginActive ? 'badge-green' : 'badge-red'}`}>{w.loginActive ? '✓ Active' : '✗ Inactive'}</span></td>
                    <td>
                      {w.fraudFlag
                        ? <span className="badge badge-red">🚨 FRAUD</span>
                        : <span className="badge badge-green">✓ CLEAN</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Status Row */}
        <div className="grid-3 mb-20">
          {[
            { label: 'Weather Status',  icon: '🌦️', value: activeTrigger && ['Heavy Rain','Heatwave','Severe AQI'].includes(activeTrigger.type) ? activeTrigger.value : 'All Clear', status: activeTrigger && ['Heavy Rain','Heatwave','Severe AQI'].includes(activeTrigger.type) ? 'TRIGGERED' : 'NORMAL', color: activeTrigger ? 'var(--red)' : 'var(--green)', bg: activeTrigger ? 'var(--red-bg)' : 'var(--green-bg)' },
            { label: 'Flood Advisory',  icon: '🌊', value: activeTrigger?.type === 'Flood Alert' ? activeTrigger.value : 'No Advisory', status: activeTrigger?.type === 'Flood Alert' ? 'ADVISORY' : 'CLEAR', color: activeTrigger?.type === 'Flood Alert' ? 'var(--red)' : 'var(--green)', bg: activeTrigger?.type === 'Flood Alert' ? 'var(--red-bg)' : 'var(--green-bg)' },
            { label: 'Platform Status', icon: '⚡', value: activeTrigger?.type === 'Platform Outage' ? activeTrigger.value : user.platform + ' Online', status: activeTrigger?.type === 'Platform Outage' ? 'OUTAGE' : 'ONLINE', color: activeTrigger?.type === 'Platform Outage' ? 'var(--red)' : 'var(--green)', bg: activeTrigger?.type === 'Platform Outage' ? 'var(--red-bg)' : 'var(--green-bg)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div className="text-xs text-3" style={{ marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: s.color }}>{s.value}</div>
              </div>
              <span className={`badge ${s.status === 'NORMAL' || s.status === 'CLEAR' || s.status === 'ONLINE' ? 'badge-green' : 'badge-red'}`}>{s.status}</span>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-20">
          {/* Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-16">
              <div><h3 style={{ fontSize: 15, marginBottom: 2 }}>Weekly Earnings</h3><p className="text-sm text-2">Actual vs GigShield-protected income</p></div>
              <span className="badge badge-blue">This Week</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={earningsData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gProt"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#1A56DB" stopOpacity={0.15} /><stop offset="95%" stopColor="#1A56DB" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#059669" stopOpacity={0.15} /><stop offset="95%" stopColor="#059669" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Area type="monotone" dataKey="protected" stroke="#1A56DB" strokeWidth={2} fill="url(#gProt)"   name="Protected" />
                <Area type="monotone" dataKey="actual"    stroke="#059669" strokeWidth={2} fill="url(#gActual)" name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Verification */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>Worker Verification</h3>
            <p className="text-sm text-2 mb-16">4-level progressive identity system</p>
            {[
              { label: 'Document Upload',     done: true,           note: 'Partner ID verified via AI OCR'                         },
              { label: 'OTP Authentication',  done: true,           note: 'Phone number confirmed'                                  },
              { label: 'GPS Validation',      done: true,           note: 'Zone: ' + user.city + ' Metro'                          },
              { label: 'Movement Pattern AI', done: trustScore > 60, note: trustScore > 60 ? 'Delivery pattern confirmed' : 'Building baseline (' + trustScore + '/100 trust)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: item.done ? 'var(--green-bg)' : 'var(--surface2)', border: '1.5px solid ' + (item.done ? 'var(--green-border)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: item.done ? 'var(--green)' : 'var(--text-3)', fontWeight: 700, marginTop: 1 }}>
                  {item.done ? '✓' : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: item.done ? 'var(--text)' : 'var(--text-2)' }}>{item.label}</div>
                  <div className="text-xs text-3">{item.note}</div>
                </div>
              </div>
            ))}
            <div className="divider" />
            <div className="flex items-center justify-between mb-6"><span className="text-sm" style={{ fontWeight: 600 }}>Trust Score</span><span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 13 }}>{trustScore} / 100</span></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: trustScore + '%' }} /></div>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="card">
          <div className="flex items-center justify-between mb-16">
            <h3 style={{ fontSize: 15 }}>Recent Claims</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/claims')}>View All →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Claim ID</th><th>Date</th><th>Trigger</th><th>Amount</th><th>Channel</th><th>Auto?</th><th>Status</th></tr></thead>
              <tbody>
                {claims.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>No claims yet — simulate one on the Claims page</td></tr>
                ) : claims.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand)' }}>{c.id}</td>
                    <td className="text-2">{c.date}</td>
                    <td style={{ fontWeight: 500 }}>{c.trigger}</td>
                    <td style={{ fontWeight: 600, color: c.status === 'FRAUD BLOCKED' ? 'var(--red)' : 'var(--green)' }}>
                      {c.status === 'FRAUD BLOCKED' ? '₹0 (Blocked)' : '₹' + c.amount}
                    </td>
                    <td className="text-2">{c.channel || '—'}</td>
                    <td><span className={`badge ${c.autoTriggered ? 'badge-green' : 'badge-gray'}`}>{c.autoTriggered ? '⚡ Auto' : 'Manual'}</span></td>
                    <td><span className={`badge ${c.status === 'PAID' ? 'badge-green' : c.status === 'FRAUD BLOCKED' ? 'badge-red' : c.status === 'PROCESSING' ? 'badge-blue' : 'badge-yellow'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}