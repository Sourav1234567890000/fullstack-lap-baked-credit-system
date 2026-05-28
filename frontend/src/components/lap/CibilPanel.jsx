import React, { useEffect, useState } from 'react';

const CibilPanel = ({ applicant }) => {
  const [needleDeg, setNeedleDeg] = useState(-90);

  useEffect(() => {
    if (applicant?.cibil > 0) {
      const pct = (applicant.cibil - 300) / 600;
      setNeedleDeg(-90 + pct * 180);
    } else {
      setNeedleDeg(-90);
    }
  }, [applicant?.cibil]);

  const getLabel = (score) => {
    if (score >= 750) return { text: 'EXCELLENT', cls: 'cibil-excellent' };
    if (score >= 650) return { text: 'GOOD CREDIT', cls: 'cibil-good' };
    if (score > 0)   return { text: 'FAIR RISK', cls: 'cibil-fair' };
    return { text: 'NO DATA', cls: 'cibil-poor' };
  };

  if (!applicant) {
    return (
      <div className="dashboard-panel">
        <div className="panel-title">CIBIL Score Radar <span>Bureau</span></div>
        <div className="cibil-empty-state">
          <div style={{ fontSize: 38, opacity: 0.28 }}>📊</div>
          <p>Select an applicant to view CIBIL analysis.</p>
        </div>
      </div>
    );
  }

  const label = getLabel(applicant.cibil);

  return (
    <div className="dashboard-panel">
      <div className="panel-title">CIBIL Score Radar <span>Bureau Info</span></div>

      <div className="cibil-panel-content">
        {/* Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="cibil-gauge-wrapper">
            <div className="cibil-gauge" />
            <div className="cibil-pointer" style={{ transform: `rotate(${needleDeg}deg)` }} />
          </div>
          <div className="cibil-score-val">{applicant.cibil > 0 ? applicant.cibil : '---'}</div>
          <span className={`cibil-label ${label.cls}`} style={{ marginTop: 8 }}>{label.text}</span>
        </div>

        {/* Details box */}
        <div className="cibil-details-box">
          <div className="cibil-detail-row">
            <span>BUREAU PULL</span>
            <span>{applicant.cibil > 0 ? 'Today, ' + new Date().toLocaleTimeString() : 'Never Pulled'}</span>
          </div>
          <div className="cibil-detail-row">
            <span>ACTIVE INQUIRIES</span>
            <span>{applicant.cibil >= 750 ? '1 (Optimal)' : applicant.cibil >= 650 ? '3 (Standard)' : applicant.cibil > 0 ? '5 (High)' : '—'}</span>
          </div>
          <div className="cibil-detail-row">
            <span>REPAYMENT DELAY</span>
            <span style={{ color: applicant.cibil >= 750 ? 'var(--color-emerald)' : applicant.cibil >= 650 ? 'var(--color-cyan)' : 'var(--color-rose)' }}>
              {applicant.cibil >= 750 ? '0 DPD (Impeccable)' : applicant.cibil >= 650 ? '0 DPD (Clear)' : applicant.cibil > 0 ? '12 DPD' : '—'}
            </span>
          </div>
          <div className="cibil-detail-row">
            <span>CC UTILIZATION</span>
            <span>{applicant.cibil >= 750 ? '18.4% (Optimal)' : applicant.cibil >= 650 ? '32.1%' : applicant.cibil > 0 ? '67.8%' : '—'}</span>
          </div>
          <div className="cibil-detail-row">
            <span>OTP VERIFIED</span>
            <span style={{ color: applicant.otpVerified ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
              {applicant.otpVerified ? '✔ YES' : '✗ PENDING'}
            </span>
          </div>
          <div className="cibil-detail-row">
            <span>BIOMETRIC</span>
            <span style={{ color: applicant.faceVerified ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
              {applicant.faceVerified ? '✔ VERIFIED' : '✗ PENDING'}
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, textAlign: 'left', width: '100%' }}>
          <span style={{ fontSize: 14, color: 'var(--color-amber)', flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Underwriting Recommendation</div>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
              {applicant.cibil >= 750
                ? 'Strong profile. Auto-clearance eligible. LTV within safe band.'
                : applicant.cibil >= 650
                ? 'Moderate profile. Standard terms apply. Property collateral as primary security.'
                : applicant.cibil > 0
                ? 'Elevated risk. Supervisor approval required. Consider co-applicant.'
                : 'No bureau data. Fetch CIBIL inside Edit panel to proceed.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CibilPanel;