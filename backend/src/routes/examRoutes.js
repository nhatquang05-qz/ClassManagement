const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/create', verifyToken, examController.createExam);
router.get('/:id', verifyToken, examController.getExamById);
router.get('/class/:classId', verifyToken, examController.getExamsByClass);
router.post('/start', verifyToken, examController.startExam);
router.post('/submit', verifyToken, examController.submitExam);
router.get('/review/:submissionId', verifyToken, examController.getSubmissionDetail);
router.get('/:id/submissions', verifyToken, examController.getExamSubmissions);

router.put('/:id', verifyToken, examController.updateExam);
router.delete('/:id', verifyToken, examController.deleteExam);

module.exports = router;
