const mongoose = require('mongoose');
const { Schema } = mongoose;

const STATUSES = ['confirmed', 'assigned', 'reached', 'in_progress', 'completed', 'cancelled'];
const itemSchema = new Schema({ name: String, amount: Number }, { _id: false });

const bookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mechanic: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    bike: {
      model: { type: String, required: true, trim: true },
      number: { type: String, required: true, uppercase: true, trim: true },
    },
    category: { type: String, enum: ['routine', 'core', 'electrical', 'urgent'], required: true },
    services: [{ _id: false, id: String, name: String, price: Number }],
    isUrgent: { type: Boolean, default: false },
    notes: String,

    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    slot: { date: Date, label: String },

    status: { type: String, enum: STATUSES, default: 'confirmed', index: true },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],

    estimate: Number,
    invoice: {
      number: String,
      items: [itemSchema],
      subtotal: Number,
      gst: Number,
      total: Number,
      generatedAt: Date,
    },
    payment: {
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
      method: { type: String, enum: ['upi', 'card'] },
      txnId: String,
      paidAt: Date,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      at: Date,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.STATUSES = STATUSES;
