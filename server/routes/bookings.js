const router = require('express').Router();
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const { findService, VISIT_CHARGE, URGENT_CHARGE } = require('../config/services');
const ah = require('../utils/asyncHandler');

router.use(protect);

// POST /api/bookings  (customer creates a booking -> status "confirmed")
router.post('/', authorize('customer'), ah(async (req, res) => {
  const { bike, category, serviceIds, address, lat, lng, date, timeSlot, notes } = req.body;

  if (!bike?.model || !bike?.number)
    return res.status(400).json({ message: 'Bike model and registration number are required' });

  const services = (serviceIds || []).map((id) => findService(category, id)).filter(Boolean)
    .map((s) => ({ id: s.id, name: s.name, price: s.price }));
  if (!services.length) return res.status(400).json({ message: 'Select at least one service' });

  const latN = Number(lat), lngN = Number(lng);
  if (!address || Number.isNaN(latN) || Number.isNaN(lngN))
    return res.status(400).json({ message: 'Service location is required' });

  const isUrgent = category === 'urgent';
  const slot = isUrgent ? { date: new Date(), label: 'ASAP' } : { date: new Date(date), label: timeSlot };
  if (!isUrgent && (Number.isNaN(slot.date.getTime()) || !timeSlot))
    return res.status(400).json({ message: 'Choose a date and time slot' });

  const estimate = services.reduce((s, x) => s + x.price, 0) + VISIT_CHARGE + (isUrgent ? URGENT_CHARGE : 0);

  const booking = await Booking.create({
    customer: req.user._id, bike, category, services, isUrgent, notes, address,
    location: { type: 'Point', coordinates: [lngN, latN] },
    slot, estimate, statusHistory: [{ status: 'confirmed' }],
  });
  res.status(201).json(booking);
}));

// GET /api/bookings/my
router.get('/my', authorize('customer'), ah(async (req, res) => {
  const bookings = await Booking.find({ customer: req.user._id })
    .populate('mechanic', 'name phone').sort('-createdAt');
  res.json(bookings);
}));

// GET /api/bookings/:id  (owner customer, assigned mechanic, or admin)
router.get('/:id', ah(async (req, res) => {
  const b = await Booking.findById(req.params.id)
    .populate('mechanic', 'name phone skills experienceYears location')
    .populate('customer', 'name phone');
  if (!b) return res.status(404).json({ message: 'Booking not found' });

  const uid = String(req.user._id);
  const allowed =
    req.user.role === 'admin' ||
    String(b.customer._id) === uid ||
    (b.mechanic && String(b.mechanic._id) === uid);
  if (!allowed) return res.status(403).json({ message: 'Not your booking' });
  res.json(b);
}));

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', authorize('customer'), ah(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (!['confirmed', 'assigned'].includes(b.status))
    return res.status(400).json({ message: 'This booking can no longer be cancelled' });
  b.status = 'cancelled';
  b.statusHistory.push({ status: 'cancelled' });
  await b.save();
  res.json(b);
}));

// POST /api/bookings/:id/feedback  { rating 1-5, comment }
router.post('/:id/feedback', authorize('customer'), ah(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'Rating must be 1 to 5' });
  const b = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (b.status !== 'completed') return res.status(400).json({ message: 'Service is not completed yet' });
  if (b.feedback?.rating) return res.status(409).json({ message: 'Feedback already submitted' });
  b.feedback = { rating, comment: (req.body.comment || '').slice(0, 500), at: new Date() };
  await b.save();
  res.json(b);
}));

module.exports = router;
