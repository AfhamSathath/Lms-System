const express = require('express');
const router = express.Router();
const{ User } = require('../models/user');
// Debug imports
try {
  const auth = require('../middleware/auth');
  console.log('✅ Auth middleware loaded:', Object.keys(auth));
  
  const validation = require('../middleware/validation');
  console.log('✅ Validation middleware loaded:', Object.keys(validation));
  
  const upload = require('../middleware/upload');
  console.log('✅ Upload middleware loaded:', Object.keys(upload));
  
  const userController = require('../controllers/usercontroller');
  console.log('✅ User controller loaded:', Object.keys(userController));
  
  // Destructure with error checking
  const { protect, authorize } = auth;
  const { validateUser } = validation;
  const { uploadProfilePicture } = upload;
  const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    bulkImportUsers,
    updateProfile,
    uploadProfilePicture: uploadPicture,
    removeProfilePicture,
    getStudentsByYearAndSemester,
    getLecturersByDepartment,
    getUserStats,
    getStudentTranscript,
    getLecturerWorkload
  }  = userController;

  // Check if any are undefined
  console.log('Checking route handlers:');
  console.log('- getUsers:', typeof getUsers);
  console.log('- protect:', typeof protect);
  console.log('- authorize:', typeof authorize);
  console.log('- validateUser:', typeof validateUser);
  
  // All routes require authentication
  router.use(protect);

  // Profile routes (accessible by authenticated users)
  router.put('/profile', updateProfile);
  router.post('/profile/picture', uploadProfilePicture, uploadPicture);
  router.delete('/profile/picture', removeProfilePicture);

  // Statistics
  router.get('/stats', authorize('admin', 'hod', 'dean'), getUserStats);

  // Student and lecturer filter routes
  router.get('/students/year/:year/semester/:semester', 
    authorize('admin', 'hod', 'lecturer', 'dean'), 
    getStudentsByYearAndSemester
  );
  router.get('/lecturers/department/:department', 
    authorize('admin', 'hod', 'dean'), 
    getLecturersByDepartment
  );

  // Transcript and workload
  router.get('/student/:id/transcript', getStudentTranscript);
  router.get('/lecturer/:id/workload', getLecturerWorkload);

  // Bulk import
  router.post('/bulk-import', 
    authorize('admin', 'registrar'), 
    bulkImportUsers
  );

  // Admin only routes
  router.use(authorize('admin', 'hod', 'dean', 'registrar'));

  router.route('/')
    .get(getUsers)
    .post(validateUser, createUser);

  router.route('/:id')
    .get(getUser)
    .put(validateUser, updateUser)
    .delete(authorize('admin'), deleteUser);

  module.exports = router;
  
} catch (error) {
  console.error('❌ Error in userroutes.js:', error.message);
  console.error(error.stack);
  
  // Export a fallback router for debugging
  const fallbackRouter = express.Router();
  fallbackRouter.get('/', (req, res) => {
    res.json({ message: 'Fallback route - user routes not properly configured' });
  });
  module.exports = fallbackRouter;
}