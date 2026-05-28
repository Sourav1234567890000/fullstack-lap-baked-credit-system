import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jetro_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState(null); // runtime role override

  useEffect(() => {
    const token = localStorage.getItem('jetro_token');
    if (token) {
      authAPI.getMe()
        .then(res => { setUser(res.user); setCurrentRole(res.user.role); })
        .catch(() => { localStorage.removeItem('jetro_token'); localStorage.removeItem('jetro_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

 const login = useCallback(async (email, password) => {
  try {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('jetro_token', res.token);
    localStorage.setItem('jetro_user', JSON.stringify(res.user));
    setUser(res.user);
    setCurrentRole(res.user.role);
    return res;
  } catch (error) {
    // CRITICAL: Clear any corrupted state on failure
    localStorage.removeItem('jetro_token');
    localStorage.removeItem('jetro_user');
    setUser(null);
    throw error; // Let the LoginPage catch this
  }
}, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('jetro_token', res.token);
    localStorage.setItem('jetro_user', JSON.stringify(res.user));
    setUser(res.user);
    setCurrentRole(res.user.role);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jetro_token');
    localStorage.removeItem('jetro_user');
    setUser(null);
    setCurrentRole(null);
  }, []);

  const verifyPasscode = useCallback(async (passcode, context) => {
    const res = await authAPI.verifyPasscode(passcode, context);
    return res.success;
  }, []);

  const switchRole = useCallback(async (role, passcode) => {
    const ok = await verifyPasscode(passcode, `Switch role to ${role}`);
    if (ok) setCurrentRole(role);
    return ok;
  }, [verifyPasscode]);

  return (
    <AuthContext.Provider value={{ user, loading, currentRole, login, register, logout, verifyPasscode, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};