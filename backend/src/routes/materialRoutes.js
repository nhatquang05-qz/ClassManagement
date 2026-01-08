const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/detail/:id', verifyToken, materialController.getMaterialDetail);
router.get('/search', verifyToken, materialController.searchMaterials);
router.get('/', verifyToken, materialController.getMaterials);
router.post('/', verifyToken, upload.single('file'), materialController.createMaterial);
router.put('/move/:id', verifyToken, materialController.moveMaterial);
router.post('/copy/:id', verifyToken, materialController.copyMaterial);
router.put('/:id', verifyToken, materialController.updateMaterial);
router.delete('/:id', verifyToken, materialController.deleteMaterial);

module.exports = router;
