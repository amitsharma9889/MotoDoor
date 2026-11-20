import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../lib';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-10 text-center text-ink/60">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}
