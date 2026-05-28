const express = require('express');
const router = express.Router();
const ctrl = require('../controller/dag.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
router.use(protect);
router.get('/', ctrl.getWorkflow);
router.post('/save', authorize('admin'), ctrl.saveWorkflow);
router.post('/reset', authorize('admin'), ctrl.resetWorkflow);
module.exports = router;