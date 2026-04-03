import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [form, setForm] = useState({ phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const sendOtp = () => {
    if (!form.phone) { setError('Please enter your registered mobile number.'); return; }
    setLoading(true);
    setTimeout(() => { setOtpSent(true); setLoading(false); }, 1200);
  };

  const login = () => {
    if (!form.otp || form.otp.length < 4) { setError('Enter the 4-digit OTP sent to your number.'); return; }
    setLoading(true);

    // Check localStorage for a registered user matching this phone
    setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('gs_user'));
        if (saved && (saved.phone === form.phone || form.phone.replace(/\s/g, '').endsWith(saved.phone?.slice(-10)))) {
          setUser(saved);
          navigate('/dashboard');
        } else {
          setError('No account found for this number. Please register first.');
          setLoading(false);
        }
      } catch {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap fade-up" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark">🛡️</div>
          <span className="auth-logo-name">GigShield</span>
        </div>

        <div className="card">
          <div className="mb-20">
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Welcome back</h2>
            <p className="text-sm text-2">Login with your registered mobile number</p>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              disabled={otpSent}
            />
          </div>

          {/* OTP */}
          {otpSent && (
            <div className="form-group fade-up">
              <label className="form-label">One-Time Password</label>
              <input
                className="form-input"
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                value={form.otp}
                onChange={e => set('otp', e.target.value)}
                autoFocus
              />
              <div className="text-xs text-3 mt-4">
                OTP sent to {form.phone}.{' '}
                <span
                  style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => { setOtpSent(false); setForm(p => ({ ...p, otp: '' })); }}
                >
                  Change number?
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-red mb-16 fade-up">
              <span className="alert-icon">⚠️</span>
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          {/* CTA */}
          {!otpSent ? (
            <button className="btn btn-primary w-full btn-lg" onClick={sendOtp} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Sending OTP…' : 'Send OTP →'}
            </button>
          ) : (
            <button className="btn btn-primary w-full btn-lg" onClick={login} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Logging in…' : 'Login to Dashboard →'}
            </button>
          )}

          <div className="divider" />

          <p className="text-center text-sm text-2">
            New to GigShield?{' '}
            <span
              style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/register')}
            >
              Create an account
            </span>
          </p>
        </div>

        <p className="text-center text-xs text-3 mt-16">
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>← Back to Home</span>
        </p>
      </div>
    </div>
  );
}