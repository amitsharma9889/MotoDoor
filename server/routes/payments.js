const router = require('express').Router();
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const ah = require('../utils/asyncHandler');

// MOCK payment gateway. Replace with Razorpay / Cashfree / Stripe in production.
// POST /api/payments/:bookingId/pay
//   { method: 'upi', upiId: 'name@bank' }  or
//   { method: 'card', cardNumber, expiry: 'MM/YY', cvv }
router.post('/:bookingId/pay', protect, authorize('customer'), ah(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.bookingId, customer: req.user._id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (b.status !== 'completed') return res.status(400).json({ message: 'Pay after the service is completed' });
  if (b.payment.status === 'paid') return res.status(409).json({ message: 'Already paid' });

  const { method, upiId, cardNumber, expiry, cvv } = req.body;
  if (method === 'upi') {
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId || ''))
      return res.status(400).json({ message: 'Enter a valid UPI ID, e.g. name@okbank' });
  } else if (method === 'card') {
    const num = String(cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(num)) return res.status(400).json({ message: 'Card number must be 16 digits' });
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry || '')) return res.status(400).json({ message: 'Expiry must be MM/YY' });
    if (!/^\d{3,4}$/.test(cvv || '')) return res.status(400).json({ message: 'Invalid CVV' });
  } else {
    return res.status(400).json({ message: 'Choose UPI or card' });
  }

  // Never store card details. Only the mock transaction reference is saved.
  b.payment = {
    status: 'paid', method,
    txnId: 'MOCK' + crypto.randomBytes(5).toString('hex').toUpperCase(),
    paidAt: new Date(),
  };
  await b.save();
  res.json(b);
}));

module.exports = router;
