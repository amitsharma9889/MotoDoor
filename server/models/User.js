const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    role: { type: String, enum: ['customer', 'mechanic', 'admin'], default: 'customer' },

    // customer
    homeAddress: { text: String, lat: Number, lng: Number },

    // mechanic
    skills: [String],
    experienceYears: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false }, // admin must approve mechanics
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' }, { sparse: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
