import { inr, fmtDate } from '../lib';

export default function Invoice({ booking }) {
  const inv = booking.invoice;
  if (!inv) return null;
  return (
    <div id="invoice" className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">Invoice {inv.number}</h3>
          <p className="text-xs text-ink/60">{fmtDate(inv.generatedAt)} · {booking.bike.model} ({booking.bike.number})</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${booking.payment.status === 'paid' ? 'bg-teal-50 text-teal' : 'bg-ember-50 text-ember'}`}>
          {booking.payment.status === 'paid' ? 'Paid' : 'Payment due'}
        </span>
      </div>
      <table className="mt-4 w-full text-sm">
        <tbody>
          {inv.items.map((i, idx) => (
            <tr key={idx} className="border-b border-forest/10">
              <td className="py-2">{i.name}</td>
              <td className="py-2 text-right">{inr(i.amount)}</td>
            </tr>
          ))}
          <tr><td className="pt-3 text-ink/60">Subtotal</td><td className="pt-3 text-right">{inr(inv.subtotal)}</td></tr>
          <tr><td className="text-ink/60">GST (18%)</td><td className="text-right">{inr(inv.gst)}</td></tr>
          <tr className="font-bold"><td className="pt-2 text-base">Total</td><td className="pt-2 text-right text-base">{inr(inv.total)}</td></tr>
        </tbody>
      </table>
      {booking.payment.status === 'paid' && (
        <p className="mt-3 text-xs text-ink/60">
          Paid via {booking.payment.method.toUpperCase()} · Ref {booking.payment.txnId} · {fmtDate(booking.payment.paidAt)}
        </p>
      )}
      <button className="btn-ghost mt-4 print:hidden" onClick={() => window.print()}>Download / print invoice</button>
    </div>
  );
}
