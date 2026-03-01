const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const{ User } = require('../models/user');
const { validateUser } = require('../middleware/validation');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword
} = authController = require('../controllers/authcontroller');

router.post('/register', validateUser, register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.put('/update-password', protect, updatePassword);

module.exports = router;