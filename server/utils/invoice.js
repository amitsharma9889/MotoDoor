const { VISIT_CHARGE, URGENT_CHARGE } = require('../config/services');

// Builds the digital invoice when the mechanic marks a job completed.
exports.buildInvoice = (booking, extraItems = []) => {
  const items = booking.services.map((s) => ({ name: s.name, amount: s.price }));
  items.push({ name: 'Doorstep visit charge', amount: VISIT_CHARGE });
  if (booking.isUrgent) items.push({ name: 'Urgent response charge', amount: URGENT_CHARGE });
  (Array.isArray(extraItems) ? extraItems : [])
    .filter((i) => i && i.name && Number(i.amount) > 0)
    .forEach((i) => items.push({ name: `Parts: ${String(i.name).slice(0, 60)}`, amount: Number(i.amount) }));

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  return {
    number: `MD-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`,
    items,
    subtotal,
    gst,
    total: Math.round((subtotal + gst) * 100) / 100,
    generatedAt: new Date(),
  };
};
