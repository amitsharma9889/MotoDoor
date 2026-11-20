import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }) => `text-sm font-medium ${isActive ? 'text-ember' : 'text-ink/70 hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold text-forest">
          Moto<span className="text-ember">Door</span>
        </Link>
        <div className="flex items-center gap-5">
          {user?.role === 'customer' && (
            <>
              <NavLink to="/book" className={link}>Book service</NavLink>
              <NavLink to="/bookings" className={link}>My bookings</NavLink>
            </>
          )}
          {user?.role === 'mechanic' && <NavLink to="/mechanic" className={link}>Jobs</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={link}>Admin</NavLink>}
          {user ? (
            <button className="btn-ghost !py-1.5" onClick={() => { logout(); navigate('/'); }}>
              Log out ({user.name.split(' ')[0]})
            </button>
          ) : (
            <>
              <NavLink to="/login" className={link}>Log in</NavLink>
              <Link to="/signup" className="btn-primary !py-1.5">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
