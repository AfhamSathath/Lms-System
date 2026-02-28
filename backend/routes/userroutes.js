const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  getStudentsBySemester,
} = require('../controllers/usercontroller');

// All routes require authentication
router.use(protect);

// Profile routes
router.put('/profile', updateProfile);

// Admin only routes
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.get('/students/semester/:semester', getStudentsBySemester);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;