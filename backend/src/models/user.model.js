const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['officer', 'underwriter', 'admin'], default: 'officer' },
  employeeId: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  avatar: { type: String, default: '' },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate employee ID
userSchema.pre('save', function (next) {
  if (!this.employeeId) {
    this.employeeId = `EMP-${Date.now().toString().slice(-6)}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);