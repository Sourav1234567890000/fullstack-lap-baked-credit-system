const Applicant = require('../models/applicant.model'); // Adjust path based on your setup
const AuditLog = require('../models/auditlog.model');     // Adjust path based on your setup

// 1. Update Property details and calculate LTV
exports.updatePropertyDetails = async (req, res) => {
  try {
    const { propertyType, propertyArea, propertyValue, loanAmount } = req.body;
    const applicant = await Applicant.findById(req.params.id);

    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (propertyType) applicant.propertyType = propertyType;
    if (propertyArea) applicant.propertyArea = propertyArea;
    if (propertyValue) applicant.propertyValue = propertyValue;
    if (loanAmount) applicant.loanAmount = loanAmount;

    if (applicant.loanAmount && applicant.propertyValue) {
      applicant.ltv = parseFloat(((applicant.loanAmount / applicant.propertyValue) * 100).toFixed(1));
    }

    await applicant.save();
    res.json({ success: true, message: 'Property details updated successfully', data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Automated Property Valuation Engine
exports.initiateValuation = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (!applicant.propertyArea || !applicant.propertyType) {
      return res.status(400).json({ success: false, message: 'Missing property characteristics to run valuation' });
    }

    // Simulating automated desk valuation algorithm based on parameters
    const baseRatePerSqFt = applicant.propertyType.toLowerCase().includes('commercial') ? 4500 : 3200;
    const simulatedAreaSize = Math.floor(Math.random() * 500) + 1200; // 1200-1700 SqFt
    
    const finalValuation = simulatedAreaSize * baseRatePerSqFt;
    applicant.propertyValue = finalValuation;
    
    if (applicant.loanAmount) {
      applicant.ltv = parseFloat(((applicant.loanAmount / finalValuation) * 100).toFixed(1));
    }

    await applicant.save();

    await AuditLog.create({
      role: req.user.role,
      user: req.user._id,
      userName: req.user.name,
      action: `Automated property valuation calculated: ₹${finalValuation} for ${applicant.name}`,
      entity: 'Applicant',
      entityId: applicant._id,
      ip: req.ip
    });

    res.json({ success: true, message: 'Valuation engine completed successfully', valuation: finalValuation, data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Legal & Title Verification
exports.updateLegalStatus = async (req, res) => {
  try {
    const { titleSearchStatus, encumbranceCert } = req.body;
    const applicant = await Applicant.findById(req.params.id);

    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (titleSearchStatus) applicant.titleSearchStatus = titleSearchStatus; // e.g., 'Clear', 'Disputed', 'Pending'
    if (encumbranceCert) applicant.encumbranceCert = encumbranceCert;     // e.g., 'Clear', 'Has Liens'

    await applicant.save();
    res.json({ success: true, message: 'Legal title status updated', data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Issue Asset-Backed Credit Card (Admin/Underwriter Only)
exports.issueLapCard = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (!applicant.ltv || applicant.ltv > 70) {
      return res.status(400).json({ 
        success: false, 
        message: `LTV ratio (${applicant.ltv || 0}%) is outside safe credit parameters (>70%). Card issuance denied.` 
      });
    }

    applicant.cardIssued = true;
    applicant.cardSkin = req.body.cardSkin || 'dark-premium';
    applicant.cardNetwork = req.body.cardNetwork || 'VISA';
    
    await applicant.save();

    await AuditLog.create({
      role: req.user.role,
      user: req.user._id,
      userName: req.user.name,
      action: `Issued asset-backed ${applicant.cardNetwork} card to ${applicant.name}`,
      entity: 'Applicant',
      entityId: applicant._id,
      ip: req.ip
    });

    res.json({ success: true, message: 'Asset-backed credit card successfully issued', data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Live Card Metrics Calculator for Dashboard
exports.getCardMetrics = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    if (!applicant.cardIssued) {
      return res.status(400).json({ success: false, message: 'No card active on this asset pool profile.' });
    }

    // Dynamic calculations based on original approved loan amount
    const totalCreditLimit = applicant.loanAmount || 500000;
    const utilizedLimit = Math.floor(totalCreditLimit * 0.28); // Simulate 28% card consumption rate
    const availableBalance = totalCreditLimit - utilizedLimit;

    res.json({
      success: true,
      metrics: {
        cardNetwork: applicant.cardNetwork,
        cardSkin: applicant.cardSkin,
        totalLimit: totalCreditLimit,
        utilized: utilizedLimit,
        available: availableBalance,
        ltvCap: applicant.ltv
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};