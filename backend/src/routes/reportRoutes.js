const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middleware/authMiddleware'); // Import middleware

// Route ghi lỗi (Tổ trưởng dùng)
router.post('/bulk', verifyToken, reportController.createBulkReports);

// Route xem lỗi cá nhân (Học sinh dùng) - MỚI
router.get('/my-logs', verifyToken, reportController.getMyLogs);

// Route admin xem (đã có)
router.get('/', reportController.getViolationsByDate);

module.exports = router;