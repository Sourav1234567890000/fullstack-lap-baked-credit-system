const AuditLog = require('../models/auditlog.model');

exports.getLogs = async (req, res) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;
    const query = role ? { role } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);
    res.json({ success: true, data: logs, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearLogs = async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: 'Audit logs cleared by admin', ip: req.ip });
    res.json({ success: true, message: 'Audit logs cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};