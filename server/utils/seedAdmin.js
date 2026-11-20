require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL || 'admin@motodoor.in';
  if (await User.findOne({ email })) {
    console.log('Admin already exists:', email);
  } else {
    await User.create({
      name: 'MotoDoor Admin', email, phone: '0000000000',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin', isApproved: true,
    });
    console.log('Admin created:', email);
  }
  await mongoose.disconnect();
})();
