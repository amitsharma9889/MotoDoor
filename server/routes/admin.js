const router = require('express').Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const ah = require('../utils/asyncHandler');

router.use(protect, authorize('admin'));

// GET /api/admin/stats
router.get('/stats', ah(async (_req, res) => {
  const [byStatus, revenue, customers, mechanics, pendingMechanics] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$invoice.total' } } },
    ]),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'mechanic', isApproved: true }),
    User.countDocuments({ role: 'mechanic', isApproved: false }),
  ]);
  res.json({
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    revenue: revenue[0]?.total || 0,
    customers, mechanics, pendingMechanics,
  });
}));

// GET /api/admin/bookings?status=
router.get('/bookings', ah(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const bookings = await Booking.find(filter)
    .populate('customer', 'name phone').populate('mechanic', 'name phone')
    .sort('-createdAt').limit(200);
  res.json(bookings);
}));

// PATCH /api/admin/bookings/:id/assign  { mechanicId }
router.patch('/bookings/:id/assign', ah(async (req, res) => {
  const mech = await User.findOne({ _id: req.body.mechanicId, role: 'mechanic', isApproved: true });
  if (!mech) return res.status(400).json({ message: 'Choose an approved mechanic' });
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (!['confirmed', 'assigned'].includes(b.status))
    return res.status(400).json({ message: 'Only confirmed or assigned bookings can be reassigned' });
  if (b.status === 'confirmed') b.statusHistory.push({ status: 'assigned' });
  b.mechanic = mech._id;
  b.status = 'assigned';
  await b.save();
  res.json(b);
}));

// PATCH /api/admin/bookings/:id/cancel
router.patch('/bookings/:id/cancel', ah(async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (['completed', 'cancelled'].includes(b.status))
    return res.status(400).json({ message: 'Booking is already closed' });
  b.status = 'cancelled';
  b.statusHistory.push({ status: 'cancelled' });
  await b.save();
  res.json(b);
}));

// GET /api/admin/mechanics
router.get('/mechanics', ah(async (_req, res) => {
  const mechanics = await User.find({ role: 'mechanic' }).sort('-createdAt');
  const done = await Booking.aggregate([
    { $match: { status: 'completed', mechanic: { $ne: null } } },
    { $group: { _id: '$mechanic', jobs: { $sum: 1 }, avgRating: { $avg: '$feedback.rating' } } },
  ]);
  const stats = Object.fromEntries(done.map((d) => [String(d._id), d]));
  res.json(mechanics.map((m) => ({
    ...m.toObject(),
    jobs: stats[String(m._id)]?.jobs || 0,
    avgRating: stats[String(m._id)]?.avgRating ? Math.round(stats[String(m._id)].avgRating * 10) / 10 : null,
  })));
}));

// PATCH /api/admin/mechanics/:id  { isApproved: true|false }
router.patch('/mechanics/:id', ah(async (req, res) => {
  const m = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'mechanic' }, { isApproved: !!req.body.isApproved }, { new: true }
  );
  if (!m) return res.status(404).json({ message: 'Mechanic not found' });
  res.json(m);
}));

module.exports = router;
