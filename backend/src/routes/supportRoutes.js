const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', verifyToken, supportController.createSupportRequest);

router.get('/', verifyToken, supportController.getAllRequests);
router.delete('/:id', verifyToken, supportController.deleteRequest);

module.exports = router;
