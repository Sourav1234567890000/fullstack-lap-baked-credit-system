import { useState, useEffect, useCallback } from 'react';
import { marketAPI } from '../services/api';

export const useMarket = (pollInterval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevData, setPrevData] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const res = await marketAPI.getLive();
      setPrevData(prev => prev || res.data);
      setData(prev => { setPrevData(prev); return res.data; });
    } catch (err) {
      console.error('Market data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, pollInterval);
    return () => clearInterval(interval);
  }, [fetch, pollInterval]);

  // Helper: determine if value went up/down vs previous
  const getTrend = useCallback((currentVal, prevVal) => {
    if (!prevVal) return 'stable';
    return parseFloat(currentVal) > parseFloat(prevVal) ? 'up' : parseFloat(currentVal) < parseFloat(prevVal) ? 'down' : 'stable';
  }, []);

  return { data, loading, prevData, getTrend, refetch: fetch };
};