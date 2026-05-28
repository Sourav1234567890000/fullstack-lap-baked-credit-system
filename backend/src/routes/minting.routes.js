const express = require('express');
const router = express.Router();
const ctrl = require('../controller/minting.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/pool', ctrl.getMintingPool);
router.get('/analytics', authorize('underwriter', 'admin'), ctrl.getMintingAnalytics);
router.post('/mint', ctrl.mintCard);
router.post('/decision', authorize('underwriter', 'admin'), ctrl.managerDecision);

module.exports = router;