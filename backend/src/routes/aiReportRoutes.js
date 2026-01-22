const express = require('express');
const router = express.Router();
const aiReportController = require('../controllers/aiReportController');

router.post('/review', aiReportController.getAIReview);

module.exports = router;