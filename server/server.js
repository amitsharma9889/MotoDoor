require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { categories, VISIT_CHARGE, URGENT_CHARGE } = require('./config/services');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/services', (_req, res) =>
  res.json({ categories, visitCharge: VISIT_CHARGE, urgentCharge: URGENT_CHARGE })
);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/mechanic', require('./routes/mechanic'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`MotoDoor API on :${PORT}`)));
