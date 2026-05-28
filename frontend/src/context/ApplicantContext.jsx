import React, { createContext, useContext, useState, useCallback } from 'react';
import { applicantAPI } from '../services/api';
import toast from 'react-hot-toast';

const ApplicantContext = createContext(null);

export const ApplicantProvider = ({ children }) => {
  const [applicants, setApplicants] = useState([]);
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchApplicants = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await applicantAPI.getAll(params);
      setApplicants(res.data);
      return res.data;
    } catch (err) {
      toast.error(err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await applicantAPI.getStats();
      setStats(res.data);
      return res.data;
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  const selectApplicant = useCallback(async (id) => {
    try {
      const res = await applicantAPI.getById(id);
      setActiveApplicant(res.data);
      return res.data;
    } catch (err) {
      toast.error('Failed to load applicant');
    }
  }, []);

  const createApplicant = useCallback(async (data) => {
    try {
      const res = await applicantAPI.create(data);
      setApplicants(prev => [res.data, ...prev]);
      toast.success(`${res.data.name} added — ${res.data.lapAppNo}`);
      return res.data;
    } catch (err) {
      toast.error(err.message || 'Failed to create applicant');
      throw err;
    }
  }, []);

  const updateApplicant = useCallback(async (id, data) => {
    try {
      const res = await applicantAPI.update(id, data);
      setApplicants(prev => prev.map(a => a._id === id ? res.data : a));
      if (activeApplicant?._id === id) setActiveApplicant(res.data);
      toast.success('Applicant updated');
      return res.data;
    } catch (err) {
      toast.error(err.message || 'Update failed');
      throw err;
    }
  }, [activeApplicant]);

  const advanceStage = useCallback(async (id) => {
    try {
      const res = await applicantAPI.advanceStage(id);
      setApplicants(prev => prev.map(a => a._id === id ? res.data : a));
      if (activeApplicant?._id === id) setActiveApplicant(res.data);
      toast.success(`Stage advanced: ${res.message}`);
      return res.data;
    } catch (err) {
      toast.error(err.message || 'Stage advance failed');
      throw err;
    }
  }, [activeApplicant]);

  const verifyCibil = useCallback(async (id, step, extraData = {}) => {
    try {
      const res = await applicantAPI.verifyCibil(id, { step, ...extraData });
      if (res.data) {
        setApplicants(prev => prev.map(a => a._id === id ? res.data : a));
        if (activeApplicant?._id === id) setActiveApplicant(res.data);
      }
      return res;
    } catch (err) {
      toast.error(err.message || 'Verification failed');
      throw err;
    }
  }, [activeApplicant]);

  const addCoApplicant = useCallback(async (id, coAppData) => {
    try {
      const res = await applicantAPI.addCoApplicant(id, coAppData);
      if (activeApplicant?._id === id) setActiveApplicant(res.data);
      toast.success('Co-applicant linked successfully');
      return res.data;
    } catch (err) {
      toast.error(err.message || 'Failed to add co-applicant');
      throw err;
    }
  }, [activeApplicant]);

  return (
    <ApplicantContext.Provider value={{
      applicants, activeApplicant, loading, stats,
      fetchApplicants, fetchStats, selectApplicant,
      createApplicant, updateApplicant, advanceStage,
      verifyCibil, addCoApplicant, setActiveApplicant
    }}>
      {children}
    </ApplicantContext.Provider>
  );
};

export const useApplicants = () => {
  const ctx = useContext(ApplicantContext);
  if (!ctx) throw new Error('useApplicants must be used within ApplicantProvider');
  return ctx;
};