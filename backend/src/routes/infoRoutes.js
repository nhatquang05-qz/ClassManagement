const express = require('express');
const router = express.Router();
const infoController = require('../controllers/infoController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.get('/', infoController.getAnnouncements);
router.post('/', upload.single('file'), infoController.createAnnouncement);
router.delete('/:id', infoController.deleteAnnouncement);

module.exports = router;