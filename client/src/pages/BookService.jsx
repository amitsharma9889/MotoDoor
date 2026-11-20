import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { getPosition, inr } from '../lib';

const MODELS = ['Hero Splendor', 'Honda Shine', 'Bajaj Pulsar', 'TVS Apache', 'Royal Enfield Classic 350',
  'Yamaha FZ', 'Honda Activa', 'TVS Jupiter', 'Suzuki Access', 'Ola S1'];
const SLOTS = ['09:00 – 11:00', '11:00 – 13:00', '14:00 – 16:00', '16:00 – 18:00', '18:00 – 20:00'];
const LUCKNOW = { lat: 26.8467, lng: 80.9462 }; // fallback centre when the user types an address

const nextDays = () => Array.from({ length: 4 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return { value: d.toISOString().slice(0, 10), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) };
});

export default function BookService() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [step, setStep] = useState(1);
  const [bike, setBike] = useState({ model: '', number: '' });
  const [category, setCategory] = useState('');
  const [picked, setPicked] = useState([]);
  const [loc, setLoc] = useState({ mode: 'gps', address: '', lat: null, lng: null, saveHome: false });
  const [date, setDate] = useState(nextDays()[0].value);
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/services').then((r) => setCatalog(r.data)); }, []);

  const cat = catalog?.categories.find((c) => c.id === category);
  const urgent = category === 'urgent';
  const estimate = useMemo(() => {
    if (!cat) return 0;
    const svc = cat.services.filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.price, 0);
    return svc + catalog.visitCharge + (urgent ? catalog.urgentCharge : 0);
  }, [cat, picked, catalog, urgent]);

  const useGps = async () => {
    setError('');
    try {
      const p = await getPosition();
      setLoc((l) => ({ ...l, mode: 'gps', lat: p.lat, lng: p.lng, address: l.address || 'Current location (GPS)' }));
    } catch (e) { setError(e.message); }
  };
  const useHome = () => {
    const h = user.homeAddress;
    if (!h?.text) return setError('No saved home address yet. Use current location and tick "Save as home address".');
    setLoc({ mode: 'home', address: h.text, lat: h.lat, lng: h.lng, saveHome: false });
  };
  const useManual = () => setLoc((l) => ({ ...l, mode: 'manual', lat: l.lat ?? LUCKNOW.lat, lng: l.lng ?? LUCKNOW.lng }));

  const next = () => {
    setError('');
    if (step === 1 && (!bike.model.trim() || !bike.number.trim())) return setError('Enter your bike model and registration number');
    if (step === 2 && (!category || !picked.length)) return setError('Choose a category and at least one service');
    if (step === 3) {
      if (!loc.address.trim() || loc.lat == null) return setError('Share your location or enter an address');
      if (!urgent && !timeSlot) return setError('Choose a time slot');
    }
    setStep(step + 1);
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/bookings', {
        bike, category, serviceIds: picked, address: loc.address, lat: loc.lat, lng: loc.lng,
        date, timeSlot: urgent ? undefined : timeSlot, notes,
      });
      if (loc.saveHome) {
        const r = await api.patch('/auth/home', { text: loc.address, lat: loc.lat, lng: loc.lng });
        setUser(r.data.user);
      }
      navigate(`/bookings/${data._id}`);
    } catch (e) { setError(errMsg(e)); setBusy(false); }
  };

  if (!catalog) return <p className="p-10 text-center text-ink/60">Loading services…</p>;
  const titles = ['Your bike', 'Service', 'Location & time', 'Review'];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Book a doorstep service</h1>
      <p className="mt-1 text-sm text-ink/60">Step {step} of 4 · {titles[step - 1]}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded bg-forest/10"><div className="h-full bg-teal transition-all" style={{ width: `${step * 25}%` }} /></div>

      <div className="card mt-6 space-y-5">
        {step === 1 && (
          <>
            <div><label className="label">Bike model</label>
              <input className="input" list="models" placeholder="e.g. Honda Shine" value={bike.model} onChange={(e) => setBike({ ...bike, model: e.target.value })} />
              <datalist id="models">{MODELS.map((m) => <option key={m} value={m} />)}</datalist></div>
            <div><label className="label">Registration number</label>
              <input className="input uppercase" placeholder="UP32 AB 1234" value={bike.number} onChange={(e) => setBike({ ...bike, number: e.target.value })} /></div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalog.categories.map((c) => (
                <button key={c.id} type="button" onClick={() => { setCategory(c.id); setPicked([]); }}
                  className={`rounded-xl border p-4 text-left ${category === c.id ? 'border-teal bg-teal-50' : 'border-forest/15 hover:border-teal/50'}`}>
                  <p className="font-semibold">{c.name}</p><p className="mt-1 text-xs text-ink/60">{c.blurb}</p>
                </button>
              ))}
            </div>
            {cat && (
              <fieldset className="space-y-2">
                <legend className="label">Select services</legend>
                {cat.services.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-forest/15 px-3 py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="accent-[#157F72]" checked={picked.includes(s.id)}
                        onChange={() => setPicked((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))} />
                      {s.name}
                    </span>
                    <span className="font-semibold">{inr(s.price)}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <p className="label">Where should the mechanic come?</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={loc.mode === 'gps' && loc.lat != null ? 'btn-dark' : 'btn-ghost'} onClick={useGps}>Use current location</button>
                <button type="button" className={loc.mode === 'home' ? 'btn-dark' : 'btn-ghost'} onClick={useHome}>Home address</button>
                <button type="button" className={loc.mode === 'manual' ? 'btn-dark' : 'btn-ghost'} onClick={useManual}>Type an address</button>
              </div>
            </div>
            {loc.lat != null && (
              <div className="space-y-2">
                <label className="label">Full address / landmark</label>
                <textarea className="input" rows={2} value={loc.address} onChange={(e) => setLoc({ ...loc, address: e.target.value })} />
                {loc.mode === 'manual' && (
                  <p className="text-xs text-ink/50">Demo: typed addresses use central Lucknow coordinates. Plug in a geocoding API (Google / Mapbox) for exact pins.</p>
                )}
                {loc.mode === 'gps' && (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#157F72]" checked={loc.saveHome} onChange={(e) => setLoc({ ...loc, saveHome: e.target.checked })} /> Save as home address</label>
                )}
              </div>
            )}
            {urgent ? (
              <p className="rounded-lg bg-ember-50 p-3 text-sm text-ember">Urgent response is dispatched immediately. No time slot needed.</p>
            ) : (
              <>
                <div><p className="label">Date</p>
                  <div className="flex flex-wrap gap-2">{nextDays().map((d) => (
                    <button type="button" key={d.value} onClick={() => setDate(d.value)} className={date === d.value ? 'btn-dark' : 'btn-ghost'}>{d.label}</button>))}</div></div>
                <div><p className="label">Time slot</p>
                  <div className="grid grid-cols-2 gap-2">{SLOTS.map((s) => (
                    <button type="button" key={s} onClick={() => setTimeSlot(s)} className={timeSlot === s ? 'btn-dark' : 'btn-ghost'}>{s}</button>))}</div></div>
              </>
            )}
            <div><label className="label">Notes for the mechanic (optional)</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bike is in the basement parking" /></div>
          </>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <Row k="Bike" v={`${bike.model} · ${bike.number.toUpperCase()}`} />
            <Row k="Services" v={cat.services.filter((s) => picked.includes(s.id)).map((s) => s.name).join(', ')} />
            <Row k="Location" v={loc.address} />
            <Row k="When" v={urgent ? 'As soon as possible' : `${date} · ${timeSlot}`} />
            <div className="border-t border-forest/10 pt-3">
              <Row k="Doorstep visit charge" v={inr(catalog.visitCharge)} />
              {urgent && <Row k="Urgent response charge" v={inr(catalog.urgentCharge)} />}
              <Row k="Estimated total (before GST)" v={<b>{inr(estimate)}</b>} />
              <p className="mt-2 text-xs text-ink/50">Final invoice includes 18% GST and any parts the mechanic adds.</p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between pt-2">
          <button className="btn-ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button>
          {step < 4 ? <button className="btn-dark" onClick={next}>Continue</button>
            : <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Booking…' : 'Confirm booking'}</button>}
        </div>
      </div>
    </main>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-4"><span className="text-ink/60">{k}</span><span className="text-right">{v}</span></div>
);
