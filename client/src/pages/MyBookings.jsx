import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { fmtDate, inr, statusLabel, statusTone } from '../lib';

export default function MyBookings() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/bookings/my').then((r) => setList(r.data)); }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My bookings</h1>
        <Link to="/book" className="btn-primary">New booking</Link>
      </div>
      {!list ? <p className="mt-8 text-ink/60">Loading…</p> : list.length === 0 ? (
        <div className="card mt-8 text-center"><p>No bookings yet.</p><Link to="/book" className="btn-dark mt-4">Book your first service</Link></div>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((b) => (
            <li key={b._id}>
              <Link to={`/bookings/${b._id}`} className="card flex items-center justify-between gap-4 hover:border-teal">
                <div>
                  <p className="font-semibold">{b.services.map((s) => s.name).join(', ')}</p>
                  <p className="text-sm text-ink/60">{b.bike.model} · {b.bike.number} · {fmtDate(b.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(b.status)}`}>{statusLabel(b.status)}</span>
                  <p className="mt-1 text-sm font-semibold">{inr(b.invoice?.total ?? b.estimate)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
