import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('motodoor_token')) return setLoading(false);
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('motodoor_token'))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback(async (path, body) => {
    const { data } = await api.post(path, body);
    localStorage.setItem('motodoor_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const signup = (payload) => authenticate('/auth/signup', payload);
  const logout = () => { localStorage.removeItem('motodoor_token'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
