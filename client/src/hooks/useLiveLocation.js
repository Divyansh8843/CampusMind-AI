import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const useLiveLocation = (enabled = true) => {
  const [status, setStatus] = useState('idle');

  const syncLocation = useCallback(async () => {
    if (!enabled || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await axios.post(
            `${API_BASE_URL}/api/auth/location`,
            { latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStatus('active');
        } catch {
          setStatus('error');
        }
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    syncLocation();
    const intervalId = window.setInterval(syncLocation, 60000);
    return () => window.clearInterval(intervalId);
  }, [enabled, syncLocation]);

  return { status, syncLocation };
};
