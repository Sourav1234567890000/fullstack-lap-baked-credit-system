const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AuditLog = require('../models/auditlog.model');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role: role || 'officer' });
    const token = signToken(user._id);
    await AuditLog.create({ role: user.role, user: user._id, userName: user.name, action: 'User registered', ip: req.ip });
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = signToken(user._id);
    await AuditLog.create({ role: user.role, user: user._id, userName: user.name, action: 'User logged in', ip: req.ip });
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPasscode = async (req, res) => {
  try {
    const { passcode, context } = req.body;
    if (passcode !== process.env.STAGE_PASSCODE) {
      await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: `Failed passcode attempt: ${context || 'unknown'}`, ip: req.ip });
      return res.status(403).json({ success: false, message: 'Invalid passcode' });
    }
    await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: `Passcode verified: ${context || 'stage advance'}`, ip: req.ip });
    res.json({ success: true, message: 'Passcode verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};