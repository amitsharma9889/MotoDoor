import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import StatusTracker from '../components/StatusTracker';
import Invoice from '../components/Invoice';
import PaymentPanel from '../components/PaymentPanel';
import FeedbackForm from '../components/FeedbackForm';
import { fmtDate, inr, km, mapsPin, statusLabel, statusTone } from '../lib';

export default function BookingDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api.get(`/bookings/${id}`).then((r) => setB(r.data)).catch((e) => setError(errMsg(e))), [id]);
  useEffect(() => { load(); }, [load]);

  // Live status: poll every 8s until the booking is closed (swap for Socket.io for true push updates)
  const open = b && !['completed', 'cancelled'].includes(b.status);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [open, load]);

  const cancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try { const { data } = await api.patch(`/bookings/${id}/cancel`); setB({ ...b, ...data }); } catch (e) { setError(errMsg(e)); }
  };

  if (error && !b) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!b) return <p className="p-10 text-center text-ink/60">Loading…</p>;

  const mLoc = b.mechanic?.location?.coordinates;
  const away = mLoc && ['assigned', 'reached'].includes(b.status) ? km(mLoc, b.location.coordinates) : null;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-2">
        <Link to="/bookings" className="text-sm text-teal">← All bookings</Link>
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Booking status</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(b.status)}`}>{statusLabel(b.status)}</span>
          </div>
          {b.status === 'cancelled' ? <p className="text-sm text-ink/60">This booking was cancelled.</p>
            : <StatusTracker status={b.status} history={b.statusHistory} />}
          {open && <p className="mt-4 text-xs text-ink/50">Updates automatically every few seconds.</p>}
        </div>

        {b.mechanic && (
          <div className="card">
            <h3 className="font-bold">Your mechanic</h3>
            <p className="mt-1">{b.mechanic.name} <span className="text-sm text-ink/60">· {b.mechanic.experienceYears || 0} yrs</span></p>
            {away != null && <p className="mt-1 text-sm text-teal">About {away < 1 ? 'less than 1' : away.toFixed(1)} km away</p>}
            <div className="mt-3 flex gap-2">
              <a className="btn-dark" href={`tel:${b.mechanic.phone}`}>Call</a>
              {mLoc && <a className="btn-ghost" target="_blank" rel="noreferrer" href={mapsPin(mLoc)}>See on map</a>}
            </div>
          </div>
        )}
        {['confirmed', 'assigned'].includes(b.status) && <button className="btn-ghost w-full" onClick={cancel}>Cancel booking</button>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-6 lg:col-span-3">
        <div className="card space-y-2 text-sm">
          <h2 className="mb-2 text-lg font-bold">Service details</h2>
          <p><span className="text-ink/60">Bike:</span> {b.bike.model} · {b.bike.number}</p>
          <p><span className="text-ink/60">Services:</span> {b.services.map((s) => s.name).join(', ')}</p>
          <p><span className="text-ink/60">Location:</span> {b.address}</p>
          <p><span className="text-ink/60">When:</span> {b.isUrgent ? 'ASAP' : `${new Date(b.slot.date).toLocaleDateString('en-IN')} · ${b.slot.label}`}</p>
          {b.status !== 'completed' && <p><span className="text-ink/60">Estimate:</span> {inr(b.estimate)} + GST</p>}
        </div>

        {b.status === 'completed' && b.invoice && (
          <>
            <Invoice booking={b} />
            {b.payment.status !== 'paid' && <PaymentPanel booking={b} onPaid={(nb) => setB({ ...b, ...nb })} />}
            {b.payment.status === 'paid' && b.mechanic && <FeedbackForm booking={b} onDone={(nb) => setB({ ...b, ...nb })} />}
          </>
        )}
      </div>
    </main>
  );
}
