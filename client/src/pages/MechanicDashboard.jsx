import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { fmtDate, getPosition, inr, mapsDir, statusLabel, statusTone } from '../lib';

const ACTION = { assigned: 'I have reached the location', reached: 'Start service', in_progress: 'Mark completed & generate invoice' };

export default function MechanicDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [pos, setPos] = useState(null);
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [msg, setMsg] = useState('');
  const [extra, setExtra] = useState({}); // jobId -> {name, amount}

  const loadJobs = useCallback(() => api.get('/mechanic/jobs').then((r) => setJobs(r.data)).catch(() => {}), []);
  const loadRequests = useCallback((p) => {
    if (!p) return;
    api.get('/mechanic/requests', { params: { lat: p.lat, lng: p.lng, radius: 15 } })
      .then((r) => setRequests(r.data)).catch((e) => setMsg(errMsg(e)));
  }, []);

  const locate = useCallback(async () => {
    try {
      const p = await getPosition();
      setPos(p); setMsg('');
      api.patch('/mechanic/location', p).catch(() => {});
      loadRequests(p);
    } catch (e) { setMsg(e.message); }
  }, [loadRequests]);

  useEffect(() => { locate(); loadJobs(); }, [locate, loadJobs]);

  // Refresh requests + push live location every 15s
  useEffect(() => {
    const t = setInterval(() => { locate(); loadJobs(); }, 15000);
    return () => clearInterval(t);
  }, [locate, loadJobs]);

  const accept = async (id) => {
    try { await api.post(`/mechanic/requests/${id}/accept`); setTab('jobs'); loadJobs(); loadRequests(pos); }
    catch (e) { setMsg(errMsg(e)); loadRequests(pos); }
  };

  const advance = async (job) => {
    const x = extra[job._id];
    try {
      await api.patch(`/mechanic/jobs/${job._id}/status`, {
        extraItems: job.status === 'in_progress' && x?.name ? [{ name: x.name, amount: x.amount }] : [],
      });
      loadJobs();
    } catch (e) { setMsg(errMsg(e)); }
  };

  const active = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status));
  const past = jobs.filter((j) => ['completed', 'cancelled'].includes(j.status));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Mechanic dashboard</h1>
      {!user.isApproved && (
        <p className="mt-4 rounded-lg bg-ember-50 p-3 text-sm text-ember">Your account is awaiting admin approval. You can browse requests but cannot accept jobs yet.</p>
      )}
      {msg && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

      <div className="mt-6 flex gap-2">
        <button className={tab === 'requests' ? 'btn-dark' : 'btn-ghost'} onClick={() => setTab('requests')}>Nearby requests ({requests.length})</button>
        <button className={tab === 'jobs' ? 'btn-dark' : 'btn-ghost'} onClick={() => setTab('jobs')}>My jobs ({active.length})</button>
        <button className="btn-ghost ml-auto" onClick={locate}>Refresh location</button>
      </div>

      {tab === 'requests' && (
        <ul className="mt-6 space-y-3">
          {requests.length === 0 && <li className="card text-center text-ink/60">{pos ? 'No open requests within 15 km right now.' : 'Share your location to see requests near you.'}</li>}
          {requests.map((r) => (
            <li key={r._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {r.isUrgent && <span className="mb-1 inline-block rounded-full bg-ember px-2 py-0.5 text-xs font-bold text-white">URGENT</span>}
                  <p className="font-semibold">{r.services.map((s) => s.name).join(', ')}</p>
                  <p className="text-sm text-ink/60">{r.bike.model} · {r.bike.number}</p>
                  <p className="mt-1 text-sm">{r.address}</p>
                  <p className="text-xs text-ink/50">{r.isUrgent ? 'ASAP' : `${new Date(r.slot.date).toLocaleDateString('en-IN')} · ${r.slot.label}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-teal">{r.distanceKm} km</p>
                  <p className="text-sm">{inr(r.estimate)}</p>
                  <button className="btn-primary mt-2" disabled={!user.isApproved} onClick={() => accept(r._id)}>Accept job</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'jobs' && (
        <div className="mt-6 space-y-3">
          {active.length === 0 && <p className="card text-center text-ink/60">No active jobs. Accept a request to get started.</p>}
          {active.map((j) => (
            <div key={j._id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{j.services.map((s) => s.name).join(', ')}</p>
                  <p className="text-sm text-ink/60">{j.bike.model} · {j.bike.number}</p>
                  <p className="mt-1 text-sm">{j.address}</p>
                  {j.notes && <p className="text-xs text-ink/60">Note: {j.notes}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(j.status)}`}>{statusLabel(j.status)}</span>
              </div>
              <p className="text-sm">Customer: <b>{j.customer?.name}</b></p>
              <div className="flex flex-wrap gap-2">
                <a className="btn-ghost" target="_blank" rel="noreferrer" href={mapsDir(j.location.coordinates)}>Navigate to customer</a>
                {j.customer?.phone && <a className="btn-ghost" href={`tel:${j.customer.phone}`}>Call customer</a>}
              </div>
              {j.status === 'in_progress' && (
                <div className="grid grid-cols-3 gap-2">
                  <input className="input col-span-2" placeholder="Parts used (optional)" value={extra[j._id]?.name || ''} onChange={(e) => setExtra({ ...extra, [j._id]: { ...extra[j._id], name: e.target.value } })} />
                  <input className="input" type="number" min="0" placeholder="₹" value={extra[j._id]?.amount || ''} onChange={(e) => setExtra({ ...extra, [j._id]: { ...extra[j._id], amount: e.target.value } })} />
                </div>
              )}
              {ACTION[j.status] && <button className="btn-dark w-full" onClick={() => advance(j)}>{ACTION[j.status]}</button>}
            </div>
          ))}

          {past.length > 0 && <h2 className="pt-4 text-lg font-bold">Past jobs</h2>}
          {past.map((j) => (
            <div key={j._id} className="card flex items-center justify-between text-sm">
              <div><p className="font-semibold">{j.services.map((s) => s.name).join(', ')}</p><p className="text-ink/60">{fmtDate(j.updatedAt)}</p></div>
              <div className="text-right">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(j.status)}`}>{statusLabel(j.status)}</span>
                {j.invoice && <p className="mt-1 font-semibold">{inr(j.invoice.total)} · {j.payment.status}</p>}
                {j.feedback?.rating && <p className="text-ember">{'★'.repeat(j.feedback.rating)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
