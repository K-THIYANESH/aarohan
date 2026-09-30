import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('aarohan_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      if (token.startsWith('demo_bypass_token_')) {
        // Instant bypass token loaded from previous session
        const savedUser = JSON.parse(localStorage.getItem('aarohan_user_mock') || 'null');
        if (savedUser) {
          setUser(savedUser);
        } else {
          setUser({
            id: 1,
            name: "Field Officer Anoop Kumar",
            email: "anoop.kumar@aarohan.gov.in",
            role: "FIELD_OFFICER",
            district: "Wayanad",
            state: "Kerala"
          });
        }
        setLoading(false);
        return;
      }

      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          if (!res.ok) throw new Error('Session expired');
          const text = await res.text();
          if (!text) throw new Error('Empty response from server');
          return JSON.parse(text);
        })
        .then(userData => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (networkErr) {
      throw new Error('Cannot connect to backend server. Please ensure the backend server is running.');
    }

    let text = '';
    try {
      text = await res.text();
    } catch {
      throw new Error(`Server returned invalid response (HTTP ${res.status}).`);
    }

    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON response (HTTP ${res.status}).`);
      }
    } else if (!res.ok) {
      throw new Error(`Authentication failed with server HTTP status ${res.status}.`);
    }

    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Login failed');
    }

    localStorage.setItem('aarohan_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const loginAsRole = (roleType) => {
    const mockUsers = {
      field_officer: {
        id: 1,
        name: "Field Officer Anoop Kumar",
        email: "anoop.kumar@aarohan.gov.in",
        role: "FIELD_OFFICER",
        district: "Wayanad",
        state: "Kerala"
      },
      revenue_officer: {
        id: 2,
        name: "District Revenue Officer",
        email: "revenue.wayanad@aarohan.gov.in",
        role: "REVENUE_OFFICER",
        district: "Wayanad",
        state: "Kerala"
      },
      disaster_control: {
        id: 3,
        name: "Disaster Management Control Officer",
        email: "disaster.control@aarohan.gov.in",
        role: "REVENUE_OFFICER",
        district: "Bay of Bengal & Coastal APAC Cell",
        state: "National Disaster Authority"
      }
    };
    const mockUser = mockUsers[roleType] || mockUsers.field_officer;
    const fakeToken = "demo_bypass_token_" + Date.now();
    localStorage.setItem('aarohan_token', fakeToken);
    localStorage.setItem('aarohan_user_mock', JSON.stringify(mockUser));
    setToken(fakeToken);
    setUser(mockUser);
    return mockUser;
  };

  const logout = () => {
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem('aarohan_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginAsRole, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
