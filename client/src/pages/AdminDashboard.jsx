import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { fmtDate, inr, statusLabel, statusTone } from '../lib';

const FILTERS = ['', 'confirmed', 'assigned', 'reached', 'in_progress', 'completed', 'cancelled'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('bookings');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, b, m] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/bookings', { params: { status: filter || undefined } }), api.get('/admin/mechanics'),
      ]);
      setStats(s.data); setBookings(b.data); setMechanics(m.data);
    } catch (e) { setError(errMsg(e)); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => { try { setError(''); await fn(); load(); } catch (e) { setError(errMsg(e)); } };
  const approved = mechanics.filter((m) => m.isApproved);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Revenue (paid)" value={inr(stats.revenue)} />
          <Stat label="Open bookings" value={(stats.byStatus.confirmed || 0) + (stats.byStatus.assigned || 0) + (stats.byStatus.reached || 0) + (stats.byStatus.in_progress || 0)} />
          <Stat label="Completed" value={stats.byStatus.completed || 0} />
          <Stat label="Customers" value={stats.customers} />
          <Stat label="Mechanics" value={`${stats.mechanics}${stats.pendingMechanics ? ` (+${stats.pendingMechanics} pending)` : ''}`} />
        </div>
      )}

      <div className="mt-8 flex gap-2">
        <button className={tab === 'bookings' ? 'btn-dark' : 'btn-ghost'} onClick={() => setTab('bookings')}>Bookings</button>
        <button className={tab === 'mechanics' ? 'btn-dark' : 'btn-ghost'} onClick={() => setTab('mechanics')}>Mechanics</button>
      </div>

      {tab === 'bookings' && (
        <>
          <select className="input mt-4 max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
            {FILTERS.map((f) => <option key={f} value={f}>{f ? statusLabel(f) : 'All statuses'}</option>)}
          </select>
          <div className="card mt-4 overflow-x-auto !p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-forest/10 bg-forest/5 text-xs text-ink/60">
                <tr><th className="p-3">Booked</th><th>Customer</th><th>Service</th><th>Status</th><th>Mechanic</th><th>Amount</th><th /></tr>
              </thead>
              <tbody>
                {bookings.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-ink/60">No bookings found.</td></tr>}
                {bookings.map((b) => (
                  <tr key={b._id} className="border-b border-forest/5 align-top">
                    <td className="p-3 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                    <td>{b.customer?.name}<br /><span className="text-xs text-ink/50">{b.customer?.phone}</span></td>
                    <td className="max-w-[220px]">{b.services.map((s) => s.name).join(', ')}<br /><span className="text-xs text-ink/50">{b.bike.model} · {b.bike.number}</span></td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(b.status)}`}>{statusLabel(b.status)}</span></td>
                    <td>
                      {['confirmed', 'assigned'].includes(b.status) ? (
                        <select className="input !py-1.5" value={b.mechanic?._id || ''}
                          onChange={(e) => e.target.value && act(() => api.patch(`/admin/bookings/${b._id}/assign`, { mechanicId: e.target.value }))}>
                          <option value="">Assign…</option>
                          {approved.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                      ) : (b.mechanic?.name || '—')}
                    </td>
                    <td>{inr(b.invoice?.total ?? b.estimate)}<br /><span className="text-xs text-ink/50">{b.payment?.status}</span></td>
                    <td className="pr-3">
                      {!['completed', 'cancelled'].includes(b.status) &&
                        <button className="text-xs font-semibold text-red-600" onClick={() => window.confirm('Cancel this booking?') && act(() => api.patch(`/admin/bookings/${b._id}/cancel`))}>Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'mechanics' && (
        <div className="card mt-4 overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-forest/10 bg-forest/5 text-xs text-ink/60">
              <tr><th className="p-3">Name</th><th>Contact</th><th>Skills</th><th>Jobs</th><th>Rating</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {mechanics.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-ink/60">No mechanics have signed up yet.</td></tr>}
              {mechanics.map((m) => (
                <tr key={m._id} className="border-b border-forest/5">
                  <td className="p-3">{m.name}<br /><span className="text-xs text-ink/50">{m.experienceYears} yrs</span></td>
                  <td>{m.phone}<br /><span className="text-xs text-ink/50">{m.email}</span></td>
                  <td className="max-w-[200px] text-xs">{m.skills?.join(', ') || '—'}</td>
                  <td>{m.jobs}</td>
                  <td>{m.avgRating ? `${m.avgRating} ★` : '—'}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.isApproved ? 'bg-teal-50 text-teal' : 'bg-ember-50 text-ember'}`}>{m.isApproved ? 'Approved' : 'Pending'}</span></td>
                  <td className="pr-3"><button className="btn-ghost !py-1 text-xs" onClick={() => act(() => api.patch(`/admin/mechanics/${m._id}`, { isApproved: !m.isApproved }))}>{m.isApproved ? 'Suspend' : 'Approve'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const Stat = ({ label, value }) => (
  <div className="card"><p className="text-xs text-ink/60">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
);
