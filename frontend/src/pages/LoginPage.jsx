import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"; 
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: 'officer.sourav@jetro.ai', password: 'password123', role: 'officer' });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🚀 Form submitted! Attempting to hit authentication context API...");
  setLoading(true);
  try {
    if (tab === 'login') {
      await login(form.email, form.password);
      console.log("🎯 API Success! Global auth user state should now be set.");
      toast.success('Welcome back!');
    } else {
      await register(form);
      toast.success('Account created!');
    }
    
    console.log("➡️ Attempting route transition to /lap now...");
    navigate('/lap');
  } catch (err) {
    console.error("❌ Authentication caught error block:", err);
    toast.error(err.message || 'Authentication failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">J</div>
        <h2 className="auth-title">Jetro Credit Hub</h2>
        <p className="auth-subtitle">Loan Against Property (LAP) Underwriting Suite</p>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Create Account</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <>
              <div className="input-group">
                <label>Full Legal Name</label>
                <input name="name" type="text" className="auth-input" value={form.name} onChange={handleChange} placeholder="e.g. Sourav Negi" required />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select name="role" className="auth-input" value={form.role} onChange={handleChange}>
                  <option value="officer">Loan Officer</option>
                  <option value="underwriter">Manager / Underwriter</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
            </>
          )}
          <div className="input-group">
            <label>Employee ID / Email</label>
            <input name="email" type="email" className="auth-input" value={form.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input name="password" type="password" className="auth-input" value={form.password} onChange={handleChange} required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Authenticating...' : tab === 'login' ? 'Authenticate Session' : 'Register Profile'}
          </button>
          {tab === 'login' && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Demo: officer.sourav@jetro.ai / password123
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;