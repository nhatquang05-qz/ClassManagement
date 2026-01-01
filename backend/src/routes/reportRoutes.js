const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/bulk', reportController.createBulkReports);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/date', reportController.getViolationsByDate);
router.get('/my-logs', reportController.getMyLogs);
router.get('/detailed', reportController.getDetailedReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
