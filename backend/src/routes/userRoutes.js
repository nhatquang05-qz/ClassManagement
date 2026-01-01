const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateToken, userController.getUsers);
router.post('/create', authenticateToken, userController.createUser);
router.put('/bulk-group', authenticateToken, userController.bulkUpdateGroup);
router.put('/:id', authenticateToken, userController.updateUser);
router.post('/import', authenticateToken, upload.single('file'), userController.importStudents);

module.exports = router;
