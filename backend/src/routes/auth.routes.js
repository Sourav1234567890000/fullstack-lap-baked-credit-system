const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyPasscode } = require('../controller/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/verify-passcode', protect, verifyPasscode);

module.exports = router;