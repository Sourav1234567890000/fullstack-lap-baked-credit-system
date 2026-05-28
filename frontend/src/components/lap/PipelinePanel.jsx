import React from 'react';
import { LAP_STAGES } from '../../utils/finance';

const stageClass = ['in-prinicipal', 'property-appraisal', 'legal-tech', 'final-underwriting', 'disbursed'];

const PipelinePanel = ({ applicants, loading, activeId, onSelect, onStageAdvance, onStartNew }) => {
  const grouped = LAP_STAGES.slice(0, 4).map((stage, i) => ({
    ...stage,
    items: applicants.filter(a => a.stage === i)
  })).filter(g => g.items.length > 0);

  return (
    <div className="dashboard-panel">
       <button 
        className="btn-teal" 
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
        onClick={onStartNew}
      >
        + New Application
      </button>
      <div className="panel-title">
        LAP Pipeline <span>{applicants.length} Active</span>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Loading pipeline...</div>
      ) : (
        <div className="pipeline-scroll">
          {grouped.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>📭</div>
              <p style={{ marginTop: 8, fontSize: 12 }}>No active applications</p>
            </div>
          ) : grouped.map(group => (
            <div className="stage-section" key={group.id}>
              <div className="stage-name">{group.name}</div>
              {group.items.map(app => (
                <ApplicantCard
                  key={app._id}
                  app={app}
                  stageClass={stageClass[app.stage]}
                  isActive={activeId === app._id}
                  onRead={() => onSelect(app._id, 'read')}
                  onEdit={() => onSelect(app._id, 'edit')}
                  onStage={() => onStageAdvance(app._id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ApplicantCard = ({ app, stageClass, isActive, onRead, onEdit, onStage }) => {
  const isReady = app.cibil > 0 && app.otpVerified && app.faceVerified;
  return (
    <div className={`applicant-card ${stageClass} ${isActive ? 'active' : ''}`} onClick={() => onEdit()}>
      <div className="card-header">
        <span className="card-name">{app.name}</span>
        <span className="card-app-no">{app.lapAppNo}</span>
      </div>
      <div className="card-meta">
        <span>📞 {app.phone}</span>
        <span>🏠 {app.propertyType}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-teal)' }}>
          ₹{((app.loanAmount || 0) / 100000).toFixed(1)}L req.
        </span>
      </div>
      <div className="card-actions">
        <button className="card-btn btn-read" onClick={e => { e.stopPropagation(); onRead(); }}>👁 Read</button>
        <button className="card-btn btn-edit" onClick={e => { e.stopPropagation(); onEdit(); }}>✏ Edit</button>
        <button
          className={`card-btn btn-next ${isReady ? 'stage-ready' : ''}`}
          onClick={e => { e.stopPropagation(); onStage(); }}
        >
          ➔ Stage
        </button>
      </div>
    </div>
  );
};

export default PipelinePanel;