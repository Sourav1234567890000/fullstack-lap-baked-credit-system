import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApplicants } from '../context/ApplicantContext';

import toast from 'react-hot-toast';

const CardMintingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { applicants } = useApplicants();
  const { state: routerState } = useLocation();

  // Role tracking based on your header tabs
  const [currentRoleView, setCurrentRoleView] = useState('admin'); // 'officer' | 'underwriter' | 'admin'
  
  // Selection States matching your Virtual Card Console design
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [creditLimit, setCreditLimit] = useState(16000);
  const [cardNetwork, setCardNetwork] = useState('Visa Premium');
  const [cardSkin, setCardSkin] = useState('Cyber Neon');
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Administrative Parameters state matching "Screenshot from 2026-05-27 16-26-09.jpg"
  const [enforceAutoUnderwrite, setEnforceAutoUnderwrite] = useState(true);
  const [enableBiometricKYC, setEnableBiometricKYC] = useState(false);
  const [limitOverrideSwitch, setLimitOverrideSwitch] = useState(false);
  const [maxAutoLimit, setMaxAutoLimit] = useState(10000);

  // Sync initial routing applicant parameter if passed from LAP workspace
  useEffect(() => {
    if (routerState?.lapApplicantId) {
      setSelectedApplicantId(routerState.lapApplicantId);
      const app = applicants.find(a => a._id === routerState.lapApplicantId);
      if (app?.requestedAmount) setCreditLimit(app.requestedAmount);
    } else if (applicants && applicants.length > 0) {
      setSelectedApplicantId(applicants[0]._id);
    }
  }, [routerState, applicants]);

  const currentSelectedApplicant = applicants.find(a => a._id === selectedApplicantId) || {
    name: 'SOURAV NEGI',
    cibil: 760,
    ltv: 65.3,
    idTag: 'LAP-082'
  };

  const handleMintExecute = () => {
    setIsMinting(true);
    setTimeout(() => {
      setIsMinting(false);
      setShowSuccessOverlay(true);
      toast.success('Asset credit line successfully provisioned!');
    }, 2000);
  };

  return (
    <div className="viewport-screen active" style={{ backgroundColor: '#070a13', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SUCCESS OVERLAY (Matches "Screenshot from 2026-05-27 16-26-33.png") */}
      {showSuccessOverlay && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(7, 10, 19, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ textAlign: 'center', background: '#0e1322', padding: '40px', borderRadius: '12px', border: '1px solid #1e293b', maxWidth: '400px', width: '100%' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10b981', fontSize: '32px' }}>✓</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Card Minted Successfully!</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              Virtual card minted for {currentSelectedApplicant.name} with ₹{creditLimit.toLocaleString()} limit.
            </p>
            <button onClick={() => setShowSuccessOverlay(false)} style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Dismiss Entry
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION (Matches your shared dynamic dashboards layout) */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>J</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Jetro Credit Hub</h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Commercial Underwriting &amp; Card Generation Panel</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/lap')} style={{ backgroundColor: '#111827', color: '#94a3b8', border: '1px solid #1f2937', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            ← Return to LAP Portal
          </button>
          
          {/* Role switcher panel matches top-right layout options */}
          <div style={{ display: 'flex', backgroundColor: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button onClick={() => setCurrentRoleView('officer')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', backgroundColor: currentRoleView === 'officer' ? '#3b82f6' : 'transparent', color: '#fff' }}>👤 Loan Officer</button>
            <button onClick={() => setCurrentRoleView('underwriter')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', backgroundColor: currentRoleView === 'underwriter' ? '#10b981' : 'transparent', color: '#fff' }}>🛡️ Manager / Underwriter</button>
            <button onClick={() => setCurrentRoleView('admin')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', backgroundColor: currentRoleView === 'admin' ? '#8b5cf6' : 'transparent', color: '#fff' }}>⚙️ System Admin</button>
          </div>
        </div>
      </header>

      {/* LIVE DATA FEED ALERT BAR */}
      <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '10px 16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '12px' }}>
        <div>
          <span style={{ color: '#06b6d4', fontWeight: 700 }}>🔗 Live LAP Data Feed Active:</span>
          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>Cardholder, approved limits, and property metrics are auto-populated from the LAP Underwriting Portal.</span>
        </div>
        <div style={{ fontWeight: 600 }}>
          — {currentSelectedApplicant.name} ({currentSelectedApplicant.idTag || 'LAP-082'}) 
          <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontSize: '10px' }}>
            CIBIL {currentSelectedApplicant.cibil} · LTV {currentSelectedApplicant.ltv}%
          </span>
        </div>
      </div>

      {/* TOP METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'STAGE 1 APPLICANTS', value: '4', change: '▲ 12% vs last week', color: '#10b981' },
          { label: 'CARDS MINTED TODAY', value: '14', change: '▲ 8% today', color: '#10b981' },
          { label: 'TOTAL LIMIT GRANTED', value: '₹3,90,000', change: '▲ ₹45,000 this session', color: '#10b981' },
          { label: 'SYSTEM LOAD', value: '0.08ms', change: 'Active Nodes Healthy', color: '#10b981' }
        ].map((m, idx) => (
          <div key={idx} style={{ backgroundColor: '#0e1322', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.5px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0' }}>{m.value}</div>
            <div style={{ fontSize: '10px', color: m.color }}>{m.change}</div>
          </div>
        ))}
      </div>

      {/* CORE CONTROL AND MINTING LAYOUT SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* LEFT WORKSPACE: CONDITIONAL BASED ON HEADER TAB */}
        <div style={{ backgroundColor: '#0e1322', padding: '24px', borderRadius: '8px', border: '1px solid #1e293b', minHeight: '440px' }}>
          
          {currentRoleView === 'admin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>System Administration</h2>
                <span style={{ fontSize: '10px', backgroundColor: '#ec4899', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Root Node</span>
              </div>

              {/* Credit Core Param Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { title: 'Enforce Auto-Underwrite', desc: 'Approve without credit pull for >750 Score', state: enforceAutoUnderwrite, setter: setEnforceAutoUnderwrite },
                  { title: 'Enable Biometric KYC', desc: 'Requirement for virtual card display', state: enableBiometricKYC, setter: setEnableBiometricKYC },
                  { title: 'Limit Override Switch', desc: 'Allows Loan Officers to exceed standard card limits', state: limitOverrideSwitch, setter: setLimitOverrideSwitch }
                ].map((toggle, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{toggle.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{toggle.desc}</div>
                    </div>
                    <input type="checkbox" checked={toggle.state} onChange={(e) => toggle.setter(e.target.checked)} style={{ width: '36px', height: '20px', cursor: 'pointer' }} />
                  </div>
                ))}

                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Maximum Default Auto-Approve Limit ($)</label>
                  <input type="number" value={maxAutoLimit} onChange={(e) => setMaxAutoLimit(e.target.value)} style={{ backgroundColor: '#070a13', border: '1px solid #1e293b', color: '#fff', padding: '8px', borderRadius: '4px', width: '100%', maxWidth: '200px' }} />
                </div>

                {/* Audit Terminal View log */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    <span>Security Audit Log</span>
                    <span style={{ color: '#ec4899', cursor: 'pointer' }}>CLEAR</span>
                  </div>
                  <div style={{ backgroundColor: '#070a13', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b', height: '120px', overflowY: 'auto', fontSize: '11px', lineHeight: '1.6' }}>
                    <p style={{ margin: 0, color: '#ec4899' }}>[4:26:04 PM] ADMIN Switched dashboard control context to active role.</p>
                    <p style={{ margin: 0, color: '#10b981' }}>[4:25:58 PM] UNDERWRITER Switched dashboard control context to active role.</p>
                    <p style={{ margin: 0, color: '#3b82f6' }}>[4:25:37 PM] OFFICER LAP transition: Sourav Negi (LAP-082) advanced. Card data synced.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentRoleView === 'underwriter' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Manager Analytics &amp; Approvals</h2>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Underwriter operational dashboard queue loaded. Access to verified files ready for high-limit pool allocation matches configuration controls.</p>
              {/* Optional verification item rows can be mapped here similarly */}
            </div>
          )}

          {currentRoleView === 'officer' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Stage 1 Applicants Pool</h2>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Standard origination lookup desk active. Selection defaults values straight into the right panel console allocation pipeline mapping.</p>
            </div>
          )}

        </div>

        {/* RIGHT WORKSPACE: VIRTUAL CARD MINTING CONSOLE */}
        <div style={{ backgroundColor: '#0e1322', padding: '24px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Virtual Card Minting Console</h3>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {currentRoleView === 'admin' ? 'Admin Override Enabled' : 'Authorized Underwriter View'}
            </span>
          </div>

          {/* DYNAMIC METAMORPHIC CREDIT CARD INTERFACE */}
          <div style={{ 
            width: '100%', 
            height: '180px', 
            background: cardSkin === 'Cyber Neon' ? 'linear-gradient(135deg, #a21caf 0%, #6366f1 100%)' : cardSkin === 'Obsidian' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
            borderRadius: '12px', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)', 
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>JETRO PLATINUM</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', fontStyle: 'italic' }}>{cardNetwork.split(' ')[0].toUpperCase()}</span>
            </div>
            <div style={{ width: '40px', height: '30px', backgroundColor: '#f59e0b', borderRadius: '4px', opacity: 0.8 }} />
            <div>
              <div style={{ fontSize: '18px', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '6px' }}>
                •••• •••• •••• {currentSelectedApplicant.idTag?.split('-')[1] || '082'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                <div>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>CARDHOLDER NAME</div>
                  <strong>{currentSelectedApplicant.name.toUpperCase()}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>EXPIRY DATE</div>
                  <strong>08 / 31</strong>
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', margin: '0 0 16px 0' }}>
            💡 Click card to flip and view secure CVV. Hover to tilt in 3D.
          </p>

          {/* CONTROL FIELDS CONFIGURATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Select Target Applicant</label>
              <select value={selectedApplicantId} onChange={(e) => setSelectedApplicantId(e.target.value)} style={{ width: '100%', backgroundColor: '#070a13', border: '1px solid #1e293b', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px' }}>
                {applicants.map(a => (
                  <option key={a._id} value={a._id}>{a.name} (Ready to Mint)</option>
                ))}
                {applicants.length === 0 && <option value="">Sourav Negi (Ready to Mint)</option>}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Credit Limit Selection</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{creditLimit.toLocaleString()}</span>
              </div>
              <input type="range" min="5000" max="50000" step="1000" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Choose Network</label>
              <select value={cardNetwork} onChange={(e) => setCardNetwork(e.target.value)} style={{ width: '100%', backgroundColor: '#070a13', border: '1px solid #1e293b', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px' }}>
                <option value="Visa Premium">Visa Premium</option>
                <option value="Mastercard World">Mastercard Elite</option>
                <option value="Rupay Select">RuPay Select</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Select Aesthetic Skin</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['Cyber Neon', 'Obsidian', 'Emerald'].map(skin => (
                  <button key={skin} onClick={() => setSkin(skin)} style={{ padding: '6px', borderRadius: '4px', fontSize: '11px', border: cardSkin === skin ? '1px solid #ec4899' : '1px solid #1e293b', backgroundColor: cardSkin === skin ? 'rgba(236, 72, 153, 0.1)' : '#070a13', color: '#fff', cursor: 'pointer' }}>
                    {skin}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleMintExecute} disabled={isMinting} style={{ marginTop: '8px', width: '100%', padding: '12px', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
              {isMinting ? '⚙️ PROVISIONING ENGINE...' : '🛡️ EXECUTE HIGH-LIMIT MINT'}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CardMintingPage;