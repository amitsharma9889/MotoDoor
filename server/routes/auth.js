const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const ah = require('../utils/asyncHandler');

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({
  _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role,
  isApproved: u.isApproved, homeAddress: u.homeAddress, skills: u.skills,
});

// POST /api/auth/signup  { name, email, phone, password, role: customer|mechanic, skills?, experienceYears? }
router.post('/signup', ah(async (req, res) => {
  const { name, email, phone, password, role = 'customer', skills, experienceYears } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ message: 'Name, email, phone and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (!['customer', 'mechanic'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await User.create({
    name, email, phone, password, role,
    ...(role === 'mechanic' && {
      skills: Array.isArray(skills) ? skills : [],
      experienceYears: Number(experienceYears) || 0,
      isApproved: false,
    }),
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

// POST /api/auth/login  { email, password }
router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || '')))
    return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(user), user: publicUser(user) });
}));

// POST /api/auth/forgot-password  { email }
router.post('/forgot-password', ah(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email });

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        message: 'Password reset link created.',
        resetToken: token,
      });
    }
  }

  res.json({ message: 'If an account exists for that email, password reset instructions will be sent.' });
}));

// POST /api/auth/reset-password  { token, password }
router.post('/reset-password', ah(async (req, res) => {
  const { token, password } = req.body;
  if (!token) return res.status(400).json({ message: 'Reset token is required' });
  if (!password || password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) return res.status(400).json({ message: 'Reset token is invalid or has expired' });

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in.' });
}));

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

// PATCH /api/auth/home  { text, lat, lng }  (customer saves home address)
router.patch('/home', protect, authorize('customer'), ah(async (req, res) => {
  const { text, lat, lng } = req.body;
  if (!text) return res.status(400).json({ message: 'Address is required' });
  req.user.homeAddress = { text, lat: Number(lat), lng: Number(lng) };
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

module.exports = router;
