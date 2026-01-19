const express = require('express');
const router = express.Router();
const dutyController = require('../controllers/dutyController');

const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, dutyController.getDutyData);
router.post('/schedule', verifyToken, dutyController.toggleSchedule);
router.post('/violation', verifyToken, dutyController.createViolation);
router.delete('/violation/:id', verifyToken, dutyController.deleteViolation);

module.exports = router;
