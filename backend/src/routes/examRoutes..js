
const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');



router.post('/create', authenticateToken, examController.createExam);


router.get('/:id', authenticateToken, examController.getExamById);

module.exports = router;