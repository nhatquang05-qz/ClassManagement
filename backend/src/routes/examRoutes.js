const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.post('/', authMiddleware, examController.createExam);
router.put('/:id', authMiddleware, examController.updateExam);
router.delete('/:id', authMiddleware, examController.deleteExam);
router.get('/class/:classId', authMiddleware, examController.getExamsByClass);

router.post(
    '/upload-media',
    authMiddleware,
    uploadMiddleware.single('file'),
    examController.uploadExamMedia
);

router.get('/:id/submissions', authMiddleware, examController.getExamSubmissions);

router.get('/:id', authMiddleware, examController.getExamById);
router.post('/start', authMiddleware, examController.startExam);
router.post('/submit', authMiddleware, examController.submitExam);
router.get('/review/:submissionId', authMiddleware, examController.getSubmissionDetail);

module.exports = router;
