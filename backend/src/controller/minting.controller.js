const Applicant = require('../models/applicant.model');
const AuditLog = require('../models/auditlog.model');

// Get minting pool (stage 1+ applicants eligible for card)
exports.getMintingPool = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { stage: { $gte: 1 } };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const applicants = await Applicant.find(query).sort({ createdAt: -1 });

    // Map to minting status
    const pool = applicants.map(a => ({
      _id: a._id,
      name: a.name,
      email: a.email,
      score: a.cibil,
      income: a.monthlyIncome * 12,
      limit: a.cardLimit || Math.max(50000, Math.min(3000000, Math.round(a.loanAmount * 0.1))),
      status: a.cardIssued ? 'Minted' : a.cibil >= 750 ? 'Ready to Mint' : a.cibil >= 650 ? 'Review Required' : a.disbursed ? 'Underwriting' : 'Hold',
      area: a.propertyArea,
      lapAppNo: a.lapAppNo,
      cardIssued: a.cardIssued,
      cardNetwork: a.cardNetwork,
      cardSkin: a.cardSkin
    }));

    const filtered = status ? pool.filter(p => p.status === status) : pool;
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mint a card for applicant
exports.mintCard = async (req, res) => {
  try {
    const { applicantId, cardLimit, cardNetwork, cardSkin } = req.body;
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
    if (applicant.cardIssued) return res.status(400).json({ success: false, message: 'Card already issued for this applicant' });

    // Role-based limit check
    const maxLimit = req.user.role === 'officer' ? 1000000 : 3000000;
    if (cardLimit > maxLimit && req.user.role === 'officer') {
      return res.status(403).json({ success: false, message: `Officers cannot mint cards above ₹${maxLimit.toLocaleString('en-IN')}. Escalate to Manager.` });
    }

    applicant.cardIssued = true;
    applicant.cardLimit = cardLimit;
    applicant.cardNetwork = cardNetwork || 'VISA';
    applicant.cardSkin = cardSkin || 'purple';
    applicant.cardMintedAt = new Date();
    await applicant.save();

    await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: `Card minted for ${applicant.name} — ₹${cardLimit.toLocaleString('en-IN')} limit — ${cardNetwork}`, entity: 'Applicant', entityId: applicant._id, ip: req.ip });

    res.json({ success: true, data: applicant, message: `Virtual card issued for ${applicant.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manager decision
exports.managerDecision = async (req, res) => {
  try {
    const { applicantId, decision } = req.body;
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    const action = decision === 'approve' ? 'Manager approved for minting' : 'Manager rejected — placed on hold';
    await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: `${action}: ${applicant.name}`, entity: 'Applicant', entityId: applicant._id, ip: req.ip });

    res.json({ success: true, message: action, decision });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Minting analytics (Manager view)
exports.getMintingAnalytics = async (req, res) => {
  try {
    const [totalMinted, totalPending, avgScore, totalLimitGranted, byArea] = await Promise.all([
      Applicant.countDocuments({ cardIssued: true }),
      Applicant.countDocuments({ stage: { $gte: 1 }, cardIssued: false }),
      Applicant.aggregate([{ $match: { cibil: { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: '$cibil' } } }]),
      Applicant.aggregate([{ $match: { cardIssued: true } }, { $group: { _id: null, total: { $sum: '$cardLimit' } } }]),
      Applicant.aggregate([{ $match: { cardIssued: true } }, { $group: { _id: '$propertyArea', count: { $sum: 1 }, totalLimit: { $sum: '$cardLimit' } } }])
    ]);
    res.json({
      success: true,
      data: {
        totalMinted,
        totalPending,
        avgScore: avgScore[0]?.avg?.toFixed(0) || 0,
        totalLimitGranted: totalLimitGranted[0]?.total || 0,
        byArea,
        approvalRate: totalMinted > 0 ? ((totalMinted / (totalMinted + totalPending)) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};