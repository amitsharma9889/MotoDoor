import { useState } from 'react';
import api, { errMsg } from '../api';
import { inr } from '../lib';

// MOCK payment form (UPI / Card). Hook to Razorpay or Cashfree checkout for real payments.
export default function PaymentPanel({ booking, onPaid }) {
  const [method, setMethod] = useState('upi');
  const [f, setF] = useState({ upiId: '', cardNumber: '', expiry: '', cvv: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`/payments/${booking._id}/pay`, { method, ...f });
      onPaid(data);
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={pay} className="card space-y-4">
      <h3 className="text-lg font-bold">Pay {inr(booking.invoice.total)}</h3>
      <div className="flex gap-2">
        {['upi', 'card'].map((m) => (
          <button type="button" key={m} onClick={() => setMethod(m)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${method === m ? 'border-teal bg-teal-50 text-teal' : 'border-forest/20'}`}>
            {m === 'upi' ? 'UPI' : 'Card'}
          </button>
        ))}
      </div>
      {method === 'upi' ? (
        <div><label className="label">UPI ID</label>
          <input className="input" placeholder="name@okbank" value={f.upiId} onChange={set('upiId')} /></div>
      ) : (
        <div className="space-y-3">
          <div><label className="label">Card number</label>
            <input className="input" inputMode="numeric" maxLength={19} placeholder="4111 1111 1111 1111" value={f.cardNumber} onChange={set('cardNumber')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Expiry</label><input className="input" placeholder="MM/YY" maxLength={5} value={f.expiry} onChange={set('expiry')} /></div>
            <div><label className="label">CVV</label><input className="input" type="password" inputMode="numeric" maxLength={4} value={f.cvv} onChange={set('cvv')} /></div>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Processing…' : `Pay ${inr(booking.invoice.total)}`}</button>
      <p className="text-xs text-ink/50">Demo mode: no real money moves and card details are never stored.</p>
    </form>
  );
}
