const express = require('express');
const router = express.Router();
const lapCtrl = require('../controller/lap.controller');
const { protect, authorize } = require('../middlewares/auth.middleware'); // Adjust path to your auth middleware

// All LAP operations require a logged-in session
router.use(protect);

// Core Property Collateral & Valuation
router.put('/:id/property-details', lapCtrl.updatePropertyDetails);
router.post('/:id/initiate-valuation', lapCtrl.initiateValuation);

// Legal & Title Verification
router.put('/:id/legal-status', lapCtrl.updateLegalStatus);

// Card Issuance & Credit Line Linking
router.post('/:id/issue-card', authorize('admin', 'underwriter'), lapCtrl.issueLapCard);
router.get('/:id/card-metrics', lapCtrl.getCardMetrics);
    
module.exports = router;