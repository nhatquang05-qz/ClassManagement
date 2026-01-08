const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, classController.getClasses);
router.get('/:id', verifyToken, classController.getClassById);
router.post('/', verifyToken, classController.createClass);
router.put('/:id', verifyToken, classController.updateClass);
router.delete('/:id', verifyToken, classController.deleteClass);

module.exports = router;
