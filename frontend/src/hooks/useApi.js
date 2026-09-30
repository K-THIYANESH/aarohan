import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

export const useApi = () => {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    setError(null);

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);

      if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      if (res.headers.get('content-type')?.includes('application/pdf')) {
        setLoading(false);
        return await res.blob();
      }

      const text = await res.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!res.ok) {
        const errorMsg = data.message || data.detail || `Request failed with status ${res.status}`;
        const err = new Error(errorMsg);
        err.fields = data.fields || null;
        err.status = res.status;
        throw err;
      }

      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, [token, logout]);

  return { request, loading, error };
};
