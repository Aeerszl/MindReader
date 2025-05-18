// friendRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getFriends, 
  getFriendRequests, 
  getSentRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend, 
  cancelFriendRequest, 
  searchUsers 
} = require('../controllers/friendController');
const { verifyToken } = require('../middleware/authMiddleware');

// Tüm rotaları kimlik doğrulama middleware'i ile koruyoruz
router.use(verifyToken);

// Arkadaş listesini getir
router.get('/', getFriends);

// Gelen arkadaşlık isteklerini getir
router.get('/requests', getFriendRequests);

// Gönderilen arkadaşlık isteklerini getir
router.get('/sent-requests', getSentRequests);

// Kullanıcı ara
router.get('/search/:query', searchUsers);

// Arkadaşlık isteği gönder
router.post('/send-request/:targetUserId', sendFriendRequest);

// Arkadaşlık isteğini kabul et
router.post('/accept-request/:requestUserId', acceptFriendRequest);

// Arkadaşlık isteğini reddet
router.post('/reject-request/:requestUserId', rejectFriendRequest);

// Arkadaşı kaldır
router.delete('/remove/:friendId', removeFriend);

// Gönderilen arkadaşlık isteğini iptal et
router.delete('/cancel-request/:targetUserId', cancelFriendRequest);

module.exports = router;
