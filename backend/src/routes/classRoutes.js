const express = require('express');
const router = express.Router();
const { getMyClasses, createClass, deleteClass } = require('../controllers/classController');

const authenticateToken = require('../middleware/authMiddleware'); 

router.get('/', authenticateToken, getMyClasses);
router.post('/', authenticateToken, createClass);
router.delete('/:id', authenticateToken, deleteClass);

module.exports = router;