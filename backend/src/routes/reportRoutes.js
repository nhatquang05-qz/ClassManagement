const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/bulk', reportController.createBulkReports);
router.get('/', reportController.getViolationsByDate);

module.exports = router;