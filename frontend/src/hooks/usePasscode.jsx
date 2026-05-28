import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePasscode = () => {
  const { verifyPasscode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({ title: '', desc: '', icon: '🔐' });
  const [resolver, setResolver] = useState(null);
  const [error, setError] = useState('');

  const ask = useCallback((title, desc, icon = '🔐') => {
    return new Promise((resolve) => {
      setConfig({ title, desc, icon });
      setError('');
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const confirm = useCallback(async (passcode) => {
    try {
      const ok = await verifyPasscode(passcode, config.title);
      if (ok) {
        setIsOpen(false);
        resolver && resolver(true);
      } else {
        setError('Incorrect passcode. Access denied.');
      }
    } catch {
      setError('Incorrect passcode. Access denied.');
    }
  }, [verifyPasscode, config.title, resolver]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setError('');
    resolver && resolver(false);
  }, [resolver]);

  return { isOpen, config, error, ask, confirm, cancel };
};