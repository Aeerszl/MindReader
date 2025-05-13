const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.get('/info', verifyToken, userController.getUserInfo);
router.put('/updateProfile', verifyToken, userController.updateProfile);

module.exports = router;