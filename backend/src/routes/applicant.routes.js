const express = require('express');
const router = express.Router();
const ctrl = require('../controller/applicant.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/stats', ctrl.getDashboardStats);
router.get('/', ctrl.getApplicants);
router.get('/:id', ctrl.getApplicant);
router.post('/', ctrl.createApplicant);
router.put('/:id', ctrl.updateApplicant);
router.delete('/:id', authorize('admin', 'underwriter'), ctrl.deleteApplicant);

// Stage & verification
router.post('/:id/advance-stage', ctrl.advanceStage);
router.post('/:id/verify-cibil', ctrl.verifyCibil);
router.post('/:id/co-applicant', ctrl.addCoApplicant);

module.exports = router;