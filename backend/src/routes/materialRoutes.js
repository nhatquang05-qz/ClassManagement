const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/:classId', verifyToken, materialController.getMaterials);
router.get('/:classId/search', verifyToken, materialController.searchMaterials);
router.post('/:classId', verifyToken, upload.single('file'), materialController.createMaterial);
router.put('/:id', verifyToken, materialController.updateMaterial);
router.delete('/:id', verifyToken, materialController.deleteMaterial);

module.exports = router;
