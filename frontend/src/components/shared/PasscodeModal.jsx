import React, { useState, useEffect, useRef } from 'react';

const PasscodeModal = ({ isOpen, config, error, onConfirm, onCancel }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) { setValue(''); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => { e.preventDefault(); onConfirm(value); };

  return (
    <div className="modal-backdrop active" style={{ zIndex: 3000 }}>
      <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{config.icon}</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{config.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>{config.desc}</p>
        {error && <div style={{ color: 'var(--color-rose)', fontSize: 11, marginBottom: 10, padding: '6px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 6 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
              borderRadius: 10, padding: '12px', color: '#fff', fontFamily: 'var(--font-mono)',
              fontSize: 18, letterSpacing: 4, textAlign: 'center', outline: 'none', marginBottom: 16
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onCancel}
              style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 20px', color: 'var(--text-secondary)', fontFamily: 'var(--font-family)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit"
              style={{ flex: 1, background: 'linear-gradient(135deg,var(--color-indigo),var(--color-violet))', border: 'none', color: '#fff', borderRadius: 10, padding: 12, fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasscodeModal;