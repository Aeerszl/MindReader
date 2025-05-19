// notificationRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Kullanıcının bildirimlerini getir
router.get('/', verifyToken, notificationController.getNotifications);

// Bildirimi okundu olarak işaretle
router.post('/read/:notificationId', verifyToken, notificationController.markAsRead);

// Tüm bildirimleri okundu olarak işaretle
router.post('/read-all', verifyToken, notificationController.markAllAsRead);

// Arkadaşın duygu durumu için bildirim oluştur
router.post('/mood-alert/:friendId', verifyToken, notificationController.createMoodAlert);

module.exports = router;