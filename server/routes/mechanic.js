const router = require('express').Router();
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const { buildInvoice } = require('../utils/invoice');
const { distanceKm } = require('../utils/geo');
const ah = require('../utils/asyncHandler');

router.use(protect, authorize('mechanic'));

// PATCH /api/mechanic/location  { lat, lng }  -> powers live tracking for the customer
router.patch('/location', ah(async (req, res) => {
  const lat = Number(req.body.lat), lng = Number(req.body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ message: 'Invalid coordinates' });
  req.user.location = { type: 'Point', coordinates: [lng, lat], updatedAt: new Date() };
  await req.user.save();
  res.json({ ok: true });
}));

// GET /api/mechanic/requests?lat=&lng=&radius=10   nearby unassigned bookings, nearest first
router.get('/requests', ah(async (req, res) => {
  let lat = Number(req.query.lat), lng = Number(req.query.lng);
  if ((Number.isNaN(lat) || Number.isNaN(lng)) && req.user.location?.coordinates?.length === 2)
    [lng, lat] = req.user.location.coordinates;
  if (Number.isNaN(lat) || Number.isNaN(lng))
    return res.status(400).json({ message: 'Share your location to see nearby requests' });

  const radiusKm = Math.min(Number(req.query.radius) || 10, 50);
  const list = await Booking.find({
    status: 'confirmed', mechanic: null,
    location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radiusKm * 1000 } },
  }).populate('customer', 'name').limit(30);

  res.json(list.map((b) => ({
    ...b.toObject(),
    distanceKm: Math.round(distanceKm([lng, lat], b.location.coordinates) * 10) / 10,
  })));
}));

// POST /api/mechanic/requests/:id/accept  (atomic: first mechanic wins)
router.post('/requests/:id/accept', ah(async (req, res) => {
  if (!req.user.isApproved)
    return res.status(403).json({ message: 'Your account is awaiting admin approval' });
  const b = await Booking.findOneAndUpdate(
    { _id: req.params.id, status: 'confirmed', mechanic: null },
    { mechanic: req.user._id, status: 'assigned', $push: { statusHistory: { status: 'assigned' } } },
    { new: true }
  );
  if (!b) return res.status(409).json({ message: 'Another mechanic already took this job' });
  res.json(b);
}));

// GET /api/mechanic/jobs  my jobs
router.get('/jobs', ah(async (req, res) => {
  const jobs = await Booking.find({ mechanic: req.user._id })
    .populate('customer', 'name phone').sort('-updatedAt');
  res.json(jobs);
}));

// PATCH /api/mechanic/jobs/:id/status  { extraItems?: [{name, amount}] }
// Moves to the next step: assigned -> reached -> in_progress -> completed (invoice generated)
const NEXT = { assigned: 'reached', reached: 'in_progress', in_progress: 'completed' };
router.patch('/jobs/:id/status', ah(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, mechanic: req.user._id });
  if (!b) return res.status(404).json({ message: 'Job not found' });
  const next = NEXT[b.status];
  if (!next) return res.status(400).json({ message: `Cannot move from "${b.status}"` });

  b.status = next;
  b.statusHistory.push({ status: next });
  if (next === 'completed') b.invoice = buildInvoice(b, req.body.extraItems);
  await b.save();
  res.json(b);
}));

module.exports = router;
