const express = require('express');
const router = express.Router();

const {
    getClasses,
    createClass,
    deleteClass,
    updateClass,
} = require('../controllers/classController');

const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getClasses);
router.post('/', verifyToken, createClass);
router.put('/:id', verifyToken, updateClass);
router.delete('/:id', verifyToken, deleteClass);

module.exports = router;
