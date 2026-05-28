const express = require('express');
const router = express.Router();
const ctrl = require('../controller/marketData.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/live', ctrl.getMarketData);
router.get('/credit-analysis', ctrl.getCreditAnalysis);

module.exports = router;