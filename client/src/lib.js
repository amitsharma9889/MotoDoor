export const STEPS = [
  { key: 'confirmed', label: 'Booking confirmed', hint: 'We are finding a mechanic near you' },
  { key: 'assigned', label: 'Mechanic assigned', hint: 'Your mechanic is on the way' },
  { key: 'reached', label: 'Reached location', hint: 'Your mechanic has arrived' },
  { key: 'in_progress', label: 'Service in progress', hint: 'Work is under way' },
  { key: 'completed', label: 'Completed', hint: 'Invoice ready for payment' },
];

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const statusLabel = (s) => (s === 'cancelled' ? 'Cancelled' : STEPS.find((x) => x.key === s)?.label || s);

export const statusTone = (s) =>
  ({ confirmed: 'bg-ember-50 text-ember', assigned: 'bg-teal-50 text-teal', reached: 'bg-teal-50 text-teal',
     in_progress: 'bg-teal-50 text-teal', completed: 'bg-forest text-white', cancelled: 'bg-ink/10 text-ink/60' }[s]);

export const mapsDir = ([lng, lat]) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
export const mapsPin = ([lng, lat]) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const km = ([lng1, lat1], [lng2, lat2]) => {
  const r = (d) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not supported on this device'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Could not get your location. Allow location access or enter an address.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

export const homeFor = (user) => (user.role === 'admin' ? '/admin' : user.role === 'mechanic' ? '/mechanic' : '/bookings');
