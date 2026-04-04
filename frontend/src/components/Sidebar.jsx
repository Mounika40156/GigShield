import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV = [
  { group: 'Main', items: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/policy', label: 'My Policy' },
    { path: '/claims', label: 'Claims' },
  ]},
  { group: 'Tools', items: [
    { path: '/premium', label: 'Premium Calculator' },
    { path: '/weather', label: 'Live Monitor' },
  ]},
];

const ICONS = {
  '/dashboard': <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  '/policy': <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1z"/><path d="M9 1v5h5"/><path d="M5 9h6M5 11.5h4"/></svg>,
  '/claims': <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M10 6.5 7.5 9 6 7.5"/></svg>,
  '/premium': <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 6h14"/><path d="M5 10h2M9 10h2"/></svg>,
  '/weather': <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 7H11.26A4 4 0 1 0 6 12H12a2.5 2.5 0 0 0 0-5z"/></svg>,
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, policy, logout, theme, setTheme } = useApp();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">🛡️</div>
        <div>
          <div className="sidebar-logo-name">GigShield</div>
        </div>
      </div>

      {user && (
        <div className="sidebar-worker">
          <div className="flex items-center gap-8 mb-8">
            <div style={{width:30,height:30,borderRadius:'50%',background:'var(--brand-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--brand)',flexShrink:0}}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div style={{overflow:'hidden'}}>
              <div className="sidebar-worker-name" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
              <div className="sidebar-worker-sub">{user.platform} · {user.city}</div>
            </div>
          </div>
          {policy
            ? <span className="sidebar-worker-badge"><span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>{policy.plan} Active</span>
            : <span className="badge badge-yellow" style={{fontSize:10}}>No Policy Yet</span>}
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.group}>
            <div className="sidebar-section-label">{section.group}</div>
            {section.items.map(item => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{ICONS[item.path]}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="nav-item"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>

        <button className="nav-item" onClick={logout} style={{color:'var(--red)'}}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}