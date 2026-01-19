const express = require('express');
const router = express.Router();
const controller = require('../controllers/specializedController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, controller.getData);
router.post('/', verifyToken, controller.createViolation);
router.delete('/:id', verifyToken, controller.deleteViolation);

module.exports = router;
