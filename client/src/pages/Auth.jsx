import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { homeFor } from '../lib';
import api from '../api';

const Shell = ({ title, children }) => (
  <main className="mx-auto max-w-md px-4 py-12">
    <h1 className="mb-6 text-3xl font-bold">{title}</h1>
    <div className="card space-y-4">{children}</div>
  </main>
);

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { navigate(homeFor(await login(f.email, f.password))); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Shell title="Log in">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="text-center text-sm"><Link to="/forgot-password" className="font-semibold text-teal">Forgot password?</Link></p>
      <p className="text-center text-sm text-ink/70">New here? <Link to="/signup" className="font-semibold text-teal">Create an account</Link></p>
    </Shell>
  );
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`);
        return;
      }
      setMessage(data.message);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Forgot password">
      <p className="text-sm text-ink/70">Enter your account email to request a password reset.</p>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {message && <p className="text-sm text-teal">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Requesting…' : 'Reset password'}</button>
      </form>
      <p className="text-center text-sm"><Link to="/login" className="font-semibold text-teal">Back to log in</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const token = params.get('token');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('This password reset link is missing a token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Reset password">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">New password (min 6 characters)</label><input className="input" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div><label className="label">Confirm new password</label><input className="input" type="password" minLength={6} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
        {message && <p className="text-sm text-teal">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Resetting…' : 'Set new password'}</button>
      </form>
    </Shell>
  );
}

const SKILLS = ['General service', 'Brakes', 'Battery', 'Tyres & puncture', 'Chain', 'Electrical'];

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'mechanic' ? 'mechanic' : 'customer');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', experienceYears: '' });
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (s) => setSkills((x) => (x.includes(s) ? x.filter((i) => i !== s) : [...x, s]));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { navigate(homeFor(await signup({ ...f, role, skills }))); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Shell title="Create your account">
      <div className="grid grid-cols-2 gap-2">
        {['customer', 'mechanic'].map((r) => (
          <button type="button" key={r} onClick={() => setRole(r)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${role === r ? 'border-teal bg-teal-50 text-teal' : 'border-forest/20'}`}>
            I am a {r}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
        <div><label className="label">Phone</label><input className="input" type="tel" required value={f.phone} onChange={set('phone')} /></div>
        <div><label className="label">Password (min 6 characters)</label><input className="input" type="password" minLength={6} required value={f.password} onChange={set('password')} /></div>
        {role === 'mechanic' && (
          <>
            <div><label className="label">Years of experience</label><input className="input" type="number" min="0" value={f.experienceYears} onChange={set('experienceYears')} /></div>
            <div>
              <p className="label">Skills</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <button type="button" key={s} onClick={() => toggle(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${skills.includes(s) ? 'border-teal bg-teal-50 text-teal' : 'border-forest/20'}`}>{s}</button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/60">An admin approves new mechanics before they can accept jobs.</p>
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p className="text-center text-sm text-ink/70">Already registered? <Link to="/login" className="font-semibold text-teal">Log in</Link></p>
    </Shell>
  );
}
