const express = require('express');
const router = express.Router();
const ctrl = require('../controller/audit.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
router.use(protect);
router.get('/', ctrl.getLogs);
router.delete('/clear', authorize('admin'), ctrl.clearLogs);
module.exports = router;