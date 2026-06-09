const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const perfilController = require('../controllers/perfilController');
const upload = require('../config/upload');

router.get('/', authenticate, perfilController.showPerfil);
router.post('/avatar', authenticate, upload.single('avatar'), perfilController.uploadAvatar);
router.post('/post', authenticate, perfilController.createPost);
router.post('/post/:id/delete', authenticate, perfilController.deletePost);

module.exports = router;
