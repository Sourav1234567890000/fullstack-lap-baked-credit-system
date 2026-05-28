import React, { useState, useEffect } from 'react';
import { useApplicants } from '../../context/ApplicantContext';
import { LAP_STAGES, calcEMI, calcLTV, calcFOIR, formatINR } from '../../utils/finance';
import toast from 'react-hot-toast';

const WorkspacePanel = ({ applicant, mode, navStep, onModeChange }) => {
  if (!applicant) {
    return (
      <div className="dashboard-panel workspace-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text-muted)', textAlign: 'center' }}>
        <div style={{ fontSize: 44, opacity: 0.3 }}>📂</div>
        <h3 style={{ color: '#fff', fontSize: 14 }}>Core Workspace Desk</h3>
        <p style={{ fontSize: 11, maxWidth: 200, lineHeight: 1.5 }}>Select an applicant and click Read or Edit to load workspace.</p>
      </div>
    );
  }

 

  const pct = Math.round((applicant.fieldsFilled / applicant.fieldsTotal) * 100);
  const stage = LAP_STAGES[navStep] || LAP_STAGES[applicant.stage];

  return (
    <div className="dashboard-panel workspace-panel">
      {/* {added the button here} */}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{applicant.name} — {stage?.name}</h2>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{applicant.lapAppNo} · {applicant.propertyType} · {formatINR(applicant.loanAmount)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="card-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => onModeChange(mode === 'read' ? 'edit' : 'read')}>
            {mode === 'read' ? '✏ Edit' : '👁 Read'}
          </button>
          <span className={`cibil-label ${applicant.cibil >= 750 ? 'cibil-excellent' : applicant.cibil >= 650 ? 'cibil-good' : applicant.cibil > 0 ? 'cibil-fair' : 'cibil-poor'}`}>
            {applicant.cibil > 0 ? `CIBIL ${applicant.cibil}` : 'CIBIL Pending'}
          </span>
        </div>
      </div>

      {/* Completion Bar */}
      <div className="completion-bar-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
          <span>Application Integrity</span>
          <span style={{ color: 'var(--color-teal)' }}>{pct}% Complete</span>
        </div>
        <div className="completion-bar">
          <div className="completion-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
          {applicant.fieldsTotal - applicant.fieldsFilled} fields pending · Stage {navStep + 1} of 5
        </div>
      </div>

      {/* Stage Forms */}
      {mode === 'read' ? <ReadView applicant={applicant} navStep={navStep} /> : <EditView applicant={applicant} navStep={navStep} />}
    </div>
  );
};

/* ── READ MODE ─────────────────────────────────────────── */
const ReadView = ({ applicant, navStep }) => (
  <>
    {Array.from({ length: navStep + 1 }).map((_, i) => (
      <StageReadBlock key={i} applicant={applicant} stageIndex={i} />
    ))}
  </>
);

const StageReadBlock = ({ applicant, stageIndex }) => {
  const stages = [
    // Stage 1
    <div className="stage-section-form" key={0}>
      <h4>📋 Stage 1: In-Principle Sanction Summary</h4>
      <div className="read-summary-grid">
        <div className="read-summary-card"><label>Applicant</label><p>{applicant.name}</p></div>
        <div className="read-summary-card"><label>Mobile</label><p>{applicant.phone}</p></div>
        <div className="read-summary-card"><label>Email</label><p style={{ fontSize: 10 }}>{applicant.email}</p></div>
        <div className="read-summary-card"><label>Property Value</label><p style={{ color: 'var(--color-emerald)' }}>{formatINR(applicant.propertyValue)}</p></div>
        <div className="read-summary-card"><label>Loan Requested</label><p style={{ color: 'var(--color-cyan)' }}>{formatINR(applicant.loanAmount)}</p></div>
        <div className="read-summary-card"><label>LTV Ratio</label><p style={{ color: applicant.ltv > 65 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>{applicant.ltv}%</p></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10 }}>
        {[['KYC Verification', true], ['CIBIL Pull', applicant.cibil > 0], ['Biometric Scan', applicant.faceVerified]].map(([label, done]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{done ? '✔' : '☐'} {label}</span>
            <span style={{ color: done ? 'var(--color-emerald)' : 'var(--color-rose)' }}>{done ? 'COMPLETED' : 'PENDING'}</span>
          </div>
        ))}
      </div>
    </div>,
    // Stage 2
    <div className="stage-section-form" key={1}>
      <h4>🏠 Stage 2: Property Appraisal Summary</h4>
      <div className="form-grid-2">
        <div className="read-summary-card"><label>Appraised Value</label><p style={{ color: 'var(--color-emerald)' }}>{formatINR(applicant.appraisedValue || applicant.propertyValue)}</p></div>
        <div className="read-summary-card"><label>Valuer Name</label><p>{applicant.valuerName || 'Ramesh Gupta & Associates'}</p></div>
        <div className="read-summary-card"><label>Valuation Method</label><p>{applicant.valuationMethod || 'Market Comparison'}</p></div>
        <div className="read-summary-card"><label>Built-up Area</label><p>{applicant.builtUpArea || '1850'} sq.ft.</p></div>
      </div>
    </div>,
    // Stage 3
    <div className="stage-section-form" key={2}>
      <h4>⚖️ Stage 3: Legal & Technical Summary</h4>
      <div className="form-grid-2">
        <div className="read-summary-card"><label>Title Search</label><p style={{ color: 'var(--color-emerald)' }}>{applicant.titleSearchStatus || 'Clear'}</p></div>
        <div className="read-summary-card"><label>Encumbrance Cert</label><p>{applicant.encumbranceCert || 'Obtained'}</p></div>
        <div className="read-summary-card"><label>Legal Opinion</label><p>{applicant.legalOpinion || 'Affirmative'}</p></div>
        <div className="read-summary-card"><label>Technical Valuation</label><p>{formatINR(applicant.technicalValuation || Math.round((applicant.propertyValue || 0) * 0.95))}</p></div>
      </div>
    </div>,
    // Stage 4
    <div className="stage-section-form" key={3}>
      <h4>✅ Stage 4: Final Underwriting Summary</h4>
      <div className="form-grid-3">
        <div className="read-summary-card"><label>LTV Ratio</label><p style={{ fontSize: 16, color: applicant.ltv > 65 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>{applicant.ltv}%</p></div>
        <div className="read-summary-card"><label>CIBIL Score</label><p style={{ fontSize: 16, color: 'var(--color-emerald)' }}>{applicant.cibil || 'PENDING'}</p></div>
        <div className="read-summary-card"><label>Sanction Amount</label><p style={{ fontSize: 14, color: 'var(--color-teal)' }}>{formatINR(applicant.loanAmount)}</p></div>
      </div>
      <div style={{ marginTop: 10, padding: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 10, color: 'var(--text-secondary)' }}>
        ✅ All conditions satisfied. Ready for disbursement.
      </div>
    </div>
  ];
  return stages[stageIndex] || null;
};

/* ── EDIT MODE ─────────────────────────────────────────── */
const EditView = ({ applicant, navStep }) => (
  <>
    {Array.from({ length: navStep + 1 }).map((_, i) => (
      <StageEditBlock key={i} applicant={applicant} stageIndex={i} />
    ))}
  </>
);

const StageEditBlock = ({ applicant, stageIndex }) => {
  const { updateApplicant, verifyCibil, addCoApplicant } = useApplicants();
  const [emiData, setEmiData] = useState({ emi: 0, total: 0, foir: 0 });
  const [loanAmt, setLoanAmt]   = useState(applicant.loanAmount || 0);
  const [propVal, setPropVal]   = useState(applicant.propertyValue || 0);
  const [rate, setRate]         = useState(applicant.interestRate || 9.5);
  const [tenure, setTenure]     = useState(applicant.tenureMonths || 120);
  const [cibilStep, setCibilStep] = useState(() => {
    if (applicant.faceVerified) return 'success';
    if (applicant.otpVerified) return 'face';
    if (applicant.cibil > 0 || applicant._cibilFetched) return 'otp';
    return 'trigger';
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [coApp, setCoApp] = useState({ name: '', income: 50000, cibil: 760, relation: 'Spouse' });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const { emi, total } = calcEMI(loanAmt, rate, tenure);
    const ltv = calcLTV(loanAmt, propVal);
    const foir = calcFOIR(emi, applicant.monthlyObligations || 0, applicant.monthlyIncome || 1);
    setEmiData({ emi, total, foir, ltv });
  }, [loanAmt, propVal, rate, tenure, applicant]);

  const handleCibilFetch = async () => {
    await verifyCibil(applicant._id, 'fetch');
    setCibilStep('otp');
  };

  const handleOtpVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter 6-digit OTP'); return; }
    await verifyCibil(applicant._id, 'otp', { otpCode: code });
    setCibilStep('face');
  };

  const handleFaceScan = async () => {
    setScanning(true);
    setTimeout(async () => {
      await verifyCibil(applicant._id, 'face');
      setCibilStep('success');
      setScanning(false);
    }, 2000);
  };

  const handleSaveFinancials = () => {
    updateApplicant(applicant._id, { loanAmount: loanAmt, propertyValue: propVal, interestRate: rate, tenureMonths: tenure, emi: emiData.emi, ltv: emiData.ltv });
  };

  const handleLinkCoApp = async () => {
    if (!coApp.name) { toast.error('Enter co-applicant name'); return; }
    await addCoApplicant(applicant._id, coApp);
    setCoApp({ name: '', income: 50000, cibil: 760, relation: 'Spouse' });
  };

  const blocks = [
    // STAGE 1 EDIT
    <div key={0}>
      {/* CIBIL Verification Block */}
      <div className="cibil-flow-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-indigo)' }}>🛡️ CIBIL Generation & KYC Desk</span>
          <span className={`cibil-label ${cibilStep === 'success' ? 'cibil-excellent' : cibilStep === 'face' ? 'cibil-good' : cibilStep === 'otp' ? 'cibil-fair' : 'cibil-poor'}`}>
            {cibilStep === 'success' ? `PASSED: ${applicant.cibil}` : cibilStep === 'face' ? 'BIOMETRIC REQ.' : cibilStep === 'otp' ? 'OTP PENDING' : 'PENDING'}
          </span>
        </div>
        {cibilStep === 'trigger' && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 10 }}>Fetch applicant credit history and generate dynamic risk scorecard.</p>
            <button className="btn-teal" onClick={handleCibilFetch}>⚡ Fetch & Generate CIBIL</button>
          </div>
        )}
        {cibilStep === 'otp' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Enter Verification OTP</p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 8 }}>6-digit code sent to {applicant.phone}</p>
            <div className="otp-grid">
              {otp.map((v, i) => <input key={i} type="text" className="otp-cell" maxLength={1} value={v} onChange={e => { const n = [...otp]; n[i] = e.target.value; setOtp(n); if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus(); }} />)}
            </div>
            <button className="btn-teal" onClick={handleOtpVerify} style={{ margin: '0 auto', display: 'block' }}>Verify Passcode</button>
          </div>
        )}
        {cibilStep === 'face' && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Face Biometric Scan</p>
            <div className="camera-wrap">
              {scanning && <div className="laser-line" />}
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
              </svg>
              {scanning && (
                <div style={{ position: 'absolute', bottom: 6, left: 6, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-emerald)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, zIndex: 3 }}>
                  SCANNING...
                </div>
              )}
            </div>
            <button className="btn-teal" onClick={handleFaceScan} style={{ margin: '10px auto 0', display: 'block' }} disabled={scanning}>
              {scanning ? '⏳ Processing...' : 'Capture & Process Face'}
            </button>
          </div>
        )}
        {cibilStep === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-emerald)', marginBottom: 4 }}>CIBIL Approval Success</div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Score: <b>{applicant.cibil} — {applicant.cibil >= 750 ? 'Excellent' : 'Good'}</b>. All checks complete.</p>
          </div>
        )}
      </div>

      {/* Basic Info Form */}
      <div className="stage-section-form">
        <h4>📋 Stage 1 — In-Principle Application</h4>
        <div className="form-grid-4" style={{ marginBottom: 10 }}>
          <div className="form-group-custom"><label>Series</label>
            <select className="form-select-custom"><option>LAP-REGULAR</option><option>LAP-CORPORATE</option><option>LAP-AFFORDABLE</option></select>
          </div>
          <div className="form-group-custom"><label>App No</label><input className="form-input-custom" value={applicant.lapAppNo} readOnly /></div>
          <div className="form-group-custom"><label>Category</label>
            <select className="form-select-custom"><option>General Class</option><option>Business Owner</option><option>Self Employed</option></select>
          </div>
          <div className="form-group-custom"><label>Area Type</label>
            <select className="form-select-custom" defaultValue={applicant.propertyArea}><option>Residential</option><option>Commercial</option><option>Industrial</option></select>
          </div>
        </div>
        <div className="form-grid-2" style={{ marginBottom: 10 }}>
          <div className="form-group-custom"><label>Applicant Name</label><input className="form-input-custom" defaultValue={applicant.name} /></div>
          <div className="form-group-custom"><label>Mobile</label><input className="form-input-custom" defaultValue={applicant.phone} /></div>
          <div className="form-group-custom"><label>Email</label><input className="form-input-custom" defaultValue={applicant.email} /></div>
          <div className="form-group-custom"><label>PAN</label><input className="form-input-custom" defaultValue={applicant.pan} /></div>
          <div className="form-group-custom"><label>Aadhaar UID</label><input className="form-input-custom" defaultValue={applicant.aadhaar} /></div>
          <div className="form-group-custom"><label>Monthly Income (₹)</label><input className="form-input-custom" type="number" defaultValue={applicant.monthlyIncome} /></div>
        </div>

        {/* Financials accordion */}
        <div className="form-accordion">
          <div>
            <div className="accordion-header" onClick={e => { e.currentTarget.classList.toggle('collapsed'); }}>Loan & Deposit Details</div>
            <div className="accordion-content">
              <div className="form-group-custom"><label>Property Value (₹)</label><input type="number" className="form-input-custom" value={propVal} onChange={e => setPropVal(+e.target.value)} /></div>
              <div className="form-group-custom"><label>Loan Amount (₹)</label><input type="number" className="form-input-custom" value={loanAmt} onChange={e => setLoanAmt(+e.target.value)} /></div>
              <div className="form-group-custom"><label>Tenure (Months)</label>
                <select className="form-select-custom" value={tenure} onChange={e => setTenure(+e.target.value)}>
                  <option value={36}>36 Months</option><option value={60}>60 Months</option><option value={120}>120 Months</option><option value={180}>180 Months</option>
                </select>
              </div>
              <div className="form-group-custom"><label>Interest % (p.a.)</label><input type="number" step="0.1" className="form-input-custom" value={rate} onChange={e => setRate(+e.target.value)} /></div>
              <div className="form-group-custom"><label>Monthly EMI (₹)</label><input className="form-input-custom" value={emiData.emi?.toLocaleString('en-IN')} readOnly style={{ color: 'var(--color-emerald)', fontWeight: 700 }} /></div>
              <div className="form-group-custom"><label>LTV Ratio</label><input className="form-input-custom" value={`${emiData.ltv}%`} readOnly style={{ color: emiData.ltv > 65 ? 'var(--color-rose)' : 'var(--color-emerald)', fontWeight: 700 }} /></div>
              <div className="form-group-custom"><label>Total Repayment (₹)</label><input className="form-input-custom" value={emiData.total?.toLocaleString('en-IN')} readOnly /></div>
              <div className="form-group-custom"><label>FOIR</label><input className="form-input-custom" value={`${emiData.foir}%`} readOnly style={{ color: emiData.foir > 55 ? 'var(--color-rose)' : 'var(--color-emerald)', fontWeight: 700 }} /></div>
            </div>
          </div>
          <div>
            <div className="accordion-header collapsed" onClick={e => e.currentTarget.classList.toggle('collapsed')}>Nominee Details</div>
            <div className="accordion-content">
              <div className="form-group-custom"><label>Nominee Name</label><input className="form-input-custom" defaultValue={applicant.nomineeName} placeholder="e.g. Ramesh Negi" /></div>
              <div className="form-group-custom"><label>Relationship</label><input className="form-input-custom" defaultValue={applicant.nomineeRelation} placeholder="Father / Spouse" /></div>
            </div>
          </div>
          <div>
            <div className="accordion-header collapsed" onClick={e => e.currentTarget.classList.toggle('collapsed')}>Payment / ECS Details</div>
            <div className="accordion-content">
              <div className="form-group-custom"><label>Payment Mode</label><select className="form-select-custom"><option>ECS</option><option>Standing Instruction</option></select></div>
              <div className="form-group-custom"><label>Clearing Bank</label><input className="form-input-custom" defaultValue={applicant.clearingBank || 'Jetro National Bank'} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn-teal" onClick={handleSaveFinancials}>💾 Save Financials</button>
        </div>

        {/* Co-applicant section (only after CIBIL cleared) */}
        {applicant.faceVerified && (
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(14,148,168,0.2)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-teal)', marginBottom: 10 }}>➕ Co-Applicant Register</div>
            {applicant.coApplicants?.length > 0 && (
              <div className="summary-table-wrap" style={{ marginBottom: 10 }}>
                <table className="summary-table">
                  <thead><tr><th>Name</th><th>Relation</th><th>Income</th><th>CIBIL</th></tr></thead>
                  <tbody>
                    {applicant.coApplicants.map((co, i) => (
                      <tr key={i}>
                        <td>{co.name}</td><td>{co.relation}</td>
                        <td>₹{(co.income || 0).toLocaleString('en-IN')}</td>
                        <td style={{ color: co.cibil >= 750 ? 'var(--color-emerald)' : 'var(--color-cyan)' }}>{co.cibil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="form-grid-4" style={{ marginBottom: 8 }}>
              <div className="form-group-custom"><label>Name</label><input className="form-input-custom" value={coApp.name} onChange={e => setCoApp(p => ({ ...p, name: e.target.value }))} placeholder="Co-applicant name" /></div>
              <div className="form-group-custom"><label>Income (₹/mo)</label><input type="number" className="form-input-custom" value={coApp.income} onChange={e => setCoApp(p => ({ ...p, income: +e.target.value }))} /></div>
              <div className="form-group-custom"><label>CIBIL</label><input type="number" className="form-input-custom" value={coApp.cibil} onChange={e => setCoApp(p => ({ ...p, cibil: +e.target.value }))} /></div>
              <div className="form-group-custom"><label>Relation</label><input className="form-input-custom" value={coApp.relation} onChange={e => setCoApp(p => ({ ...p, relation: e.target.value }))} /></div>
            </div>
            <button className="btn-teal" onClick={handleLinkCoApp}>Verify & Link Co-Applicant</button>
          </div>
        )}
      </div>
    </div>,

    // STAGE 2 EDIT
    <div className="stage-section-form" key={1}>
      <h4>🏠 Stage 2 — Property Appraisal & Valuation</h4>
      <div className="form-grid-2">
        <div className="form-group-custom"><label>Property Address</label><input className="form-input-custom" defaultValue="Survey No. 45, Sec-12, Gurugram, HR" /></div>
        <div className="form-group-custom"><label>PIN Code</label><input className="form-input-custom" defaultValue="122001" /></div>
        <div className="form-group-custom"><label>Built-up Area (sq.ft)</label><input type="number" className="form-input-custom" defaultValue={applicant.builtUpArea || 1850} /></div>
        <div className="form-group-custom"><label>Construction Year</label><input type="number" className="form-input-custom" defaultValue={applicant.constructionYear || 2012} /></div>
        <div className="form-group-custom"><label>Market Value (₹)</label><input type="number" className="form-input-custom" defaultValue={applicant.propertyValue} /></div>
        <div className="form-group-custom"><label>Distress Value (₹)</label><input type="number" className="form-input-custom" defaultValue={Math.round((applicant.propertyValue || 0) * 0.75)} /></div>
        <div className="form-group-custom"><label>Valuer Name</label><input className="form-input-custom" defaultValue={applicant.valuerName || 'Ramesh Gupta & Associates'} /></div>
        <div className="form-group-custom"><label>Valuer Reg. No</label><input className="form-input-custom" defaultValue={applicant.valuerRegNo || 'RV-2024-01234'} /></div>
        <div className="form-group-custom"><label>Valuation Method</label>
          <select className="form-select-custom" defaultValue={applicant.valuationMethod}><option>Market Comparison</option><option>Income Approach</option><option>Cost Approach</option></select>
        </div>
        <div className="form-group-custom"><label>Appraisal Date</label><input type="date" className="form-input-custom" /></div>
      </div>
      <div style={{ marginTop: 10, padding: 10, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, fontSize: 10, color: 'var(--text-secondary)' }}>
        ⚠️ Approved valuer confirmation + site visit docs required before stage advance.
      </div>
      <button className="btn-teal" style={{ marginTop: 10 }} onClick={() => toast.success('Property appraisal details saved')}>💾 Save Appraisal</button>
    </div>,

    // STAGE 3 EDIT
    <div className="stage-section-form" key={2}>
      <h4>⚖️ Stage 3 — Legal & Technical Due Diligence</h4>
      <div className="form-grid-2">
        <div className="form-group-custom"><label>Title Search Status</label><select className="form-select-custom" defaultValue={applicant.titleSearchStatus}><option>Clear</option><option>Encumbered</option><option>In Progress</option></select></div>
        <div className="form-group-custom"><label>Encumbrance Certificate</label><select className="form-select-custom" defaultValue={applicant.encumbranceCert}><option>Obtained</option><option>Applied</option><option>Pending</option></select></div>
        <div className="form-group-custom"><label>Legal Opinion</label><select className="form-select-custom" defaultValue={applicant.legalOpinion}><option>Affirmative</option><option>Conditional</option><option>Negative</option></select></div>
        <div className="form-group-custom"><label>Technical Valuation (₹)</label><input type="number" className="form-input-custom" defaultValue={applicant.technicalValuation || Math.round((applicant.propertyValue || 0) * 0.95)} /></div>
        <div className="form-group-custom"><label>Approved Advocate</label><input className="form-input-custom" defaultValue="Sharma & Associates, Delhi" /></div>
        <div className="form-group-custom"><label>Legal Opinion Date</label><input type="date" className="form-input-custom" /></div>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Escrow & Charge Creation</div>
      <div className="form-grid-3">
        <div className="form-group-custom"><label>Stamp Duty (₹)</label><input type="number" className="form-input-custom" defaultValue={applicant.stampDuty || 24000} /></div>
        <div className="form-group-custom"><label>Reg. Charges (₹)</label><input type="number" className="form-input-custom" defaultValue={applicant.registrationCharges || 8000} /></div>
        <div className="form-group-custom"><label>Processing Fee (₹)</label><input type="number" className="form-input-custom" defaultValue={applicant.processingFee || 15000} /></div>
      </div>
      <button className="btn-teal" style={{ marginTop: 10 }} onClick={() => toast.success('Legal details saved')}>💾 Save Legal Details</button>
    </div>,

    // STAGE 4 EDIT
    <div className="stage-section-form" key={3}>
      <h4>✅ Stage 4 — Final Underwriting & Sanction</h4>
      <div className="form-grid-3">
        <div className="form-group-custom"><label>LTV Ratio</label><input className="form-input-custom" value={`${applicant.ltv}%`} readOnly style={{ color: applicant.ltv > 65 ? 'var(--color-rose)' : 'var(--color-emerald)', fontWeight: 700 }} /></div>
        <div className="form-group-custom"><label>CIBIL Score</label><input className="form-input-custom" value={applicant.cibil || 'PENDING'} readOnly style={{ color: 'var(--color-emerald)', fontWeight: 700 }} /></div>
        <div className="form-group-custom"><label>Final Sanction (₹)</label><input type="number" className="form-input-custom" defaultValue={applicant.loanAmount} /></div>
        <div className="form-group-custom"><label>Interest Rate (%)</label><input type="number" step="0.1" className="form-input-custom" defaultValue={applicant.interestRate} /></div>
        <div className="form-group-custom"><label>Monthly EMI (₹)</label><input className="form-input-custom" value={(applicant.emi || 0).toLocaleString('en-IN')} readOnly style={{ color: 'var(--color-emerald)', fontWeight: 700 }} /></div>
        <div className="form-group-custom"><label>FOIR</label><input className="form-input-custom" value={`${(applicant.foir || 0).toFixed(1)}%`} readOnly /></div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10 }}>
        {[['KYC & CIBIL', true], ['Property Appraisal', true], ['Legal Opinion', true], ['Disbursement Authorization', false]].map(([label, done]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 5 }}>
            <span>{done ? '✔' : '☐'} {label}</span>
            <span style={{ color: done ? 'var(--color-emerald)' : 'var(--color-amber)' }}>{done ? 'VERIFIED' : 'AWAITING'}</span>
          </div>
        ))}
      </div>
    </div>
  ];
  return blocks[stageIndex] || null;
};

export default WorkspacePanel;