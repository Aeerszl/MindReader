// friendController.js
const User = require('../models/User');

/**
 * @route GET /api/friends
 * @desc Arkadaş listesini getir
 * @access Private
 */
exports.getFriends = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Kullanıcıyı bul ve arkadaşları popüle et
    const user = await User.findById(userId)
      .populate('friends', 'username email profileImage')
      .select('friends');
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    res.status(200).json({
      friends: user.friends
    });
  } catch (error) {
    console.error("Arkadaş listesi alınamadı:", error);
    res.status(500).json({ message: "Arkadaş listesi alınırken bir hata oluştu." });
  }
};

/**
 * @route GET /api/friends/requests
 * @desc Gelen arkadaşlık isteklerini getir
 * @access Private
 */
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Kullanıcıyı bul ve gelen istekleri popüle et
    const user = await User.findById(userId)
      .populate('friendRequests', 'username email profileImage')
      .select('friendRequests');
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    res.status(200).json({
      friendRequests: user.friendRequests
    });
  } catch (error) {
    console.error("Arkadaşlık istekleri alınamadı:", error);
    res.status(500).json({ message: "Arkadaşlık istekleri alınırken bir hata oluştu." });
  }
};

/**
 * @route GET /api/friends/sent-requests
 * @desc Gönderilen arkadaşlık isteklerini getir
 * @access Private
 */
exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Kullanıcıyı bul ve gönderilen istekleri popüle et
    const user = await User.findById(userId)
      .populate('sentRequests', 'username email profileImage')
      .select('sentRequests');
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    res.status(200).json({
      sentRequests: user.sentRequests
    });
  } catch (error) {
    console.error("Gönderilen istekler alınamadı:", error);
    res.status(500).json({ message: "Gönderilen istekler alınırken bir hata oluştu." });
  }
};

/**
 * @route POST /api/friends/send-request/:targetUserId
 * @desc Arkadaşlık isteği gönder
 * @access Private
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.params;
    
    // Kendisine istek göndermeyi engelle
    if (userId === targetUserId) {
      return res.status(400).json({ message: "Kendinize arkadaşlık isteği gönderemezsiniz." });
    }
    
    // Kullanıcı ve hedef kullanıcıyı bul
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!user || !targetUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Zaten arkadaş mı kontrol et
    if (user.friends.includes(targetUserId)) {
      return res.status(400).json({ message: "Bu kullanıcı zaten arkadaşınız." });
    }
    
    // Zaten istek gönderilmiş mi kontrol et
    if (user.sentRequests.includes(targetUserId) || targetUser.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "Bu kullanıcıya zaten arkadaşlık isteği gönderilmiş." });
    }
    
    // Karşı taraftan gelen istek var mı kontrol et
    if (user.friendRequests.includes(targetUserId)) {
      return res.status(400).json({ 
        message: "Bu kullanıcı size zaten arkadaşlık isteği göndermiş. İsteği kabul edebilirsiniz." 
      });
    }
      // İstek gönderildi olarak kaydet
    user.sentRequests.push(targetUserId);
    targetUser.friendRequests.push(userId);
    
    await Promise.all([
      user.save(),
      targetUser.save()
    ]);
    
    // Socket.IO üzerinden bildirim gönder
    const io = req.app.get('io');
    if (io) {
      // Hedef kullanıcının özel odasına bildirim gönder
      io.to(`user:${targetUserId}`).emit('friendRequest', {
        type: 'new',
        sender: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage
        }
      });
    }
    
    res.status(200).json({ message: "Arkadaşlık isteği başarıyla gönderildi." });
    
  } catch (error) {
    console.error("Arkadaşlık isteği gönderilirken hata:", error);
    res.status(500).json({ message: "Arkadaşlık isteği gönderilirken bir hata oluştu." });
  }
};

/**
 * @route POST /api/friends/accept-request/:requestUserId
 * @desc Arkadaşlık isteğini kabul et
 * @access Private
 */
exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestUserId } = req.params;
    
    // Kullanıcı ve istek gönderen kullanıcıyı bul
    const user = await User.findById(userId);
    const requestUser = await User.findById(requestUserId);
    
    if (!user || !requestUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Gelen istek var mı kontrol et
    if (!user.friendRequests.includes(requestUserId)) {
      return res.status(400).json({ message: "Bu kullanıcıdan gelen bir arkadaşlık isteği bulunmamaktadır." });
    }
      // İsteği kaldır ve arkadaş listelerine ekle
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== requestUserId);
    requestUser.sentRequests = requestUser.sentRequests.filter(id => id.toString() !== userId);
    
    user.friends.push(requestUserId);
    requestUser.friends.push(userId);
    
    await Promise.all([
      user.save(),
      requestUser.save()
    ]);
    
    // Socket.IO üzerinden bildirim gönder
    const io = req.app.get('io');
    if (io) {
      // İstek gönderen kullanıcıya kabul bildirimi gönder
      io.to(`user:${requestUserId}`).emit('friendRequest', {
        type: 'accepted',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage
        }
      });
    }
    
    res.status(200).json({ message: "Arkadaşlık isteği başarıyla kabul edildi." });
    
  } catch (error) {
    console.error("Arkadaşlık isteği kabul edilirken hata:", error);
    res.status(500).json({ message: "Arkadaşlık isteği kabul edilirken bir hata oluştu." });
  }
};

/**
 * @route POST /api/friends/reject-request/:requestUserId
 * @desc Arkadaşlık isteğini reddet
 * @access Private
 */
exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestUserId } = req.params;
    
    // Kullanıcı ve istek gönderen kullanıcıyı bul
    const user = await User.findById(userId);
    const requestUser = await User.findById(requestUserId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Gelen istek var mı kontrol et
    if (!user.friendRequests.includes(requestUserId)) {
      return res.status(400).json({ message: "Bu kullanıcıdan gelen bir arkadaşlık isteği bulunmamaktadır." });
    }
      // İsteği kaldır
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== requestUserId);
    await user.save();
    
    // Karşı taraf mevcutsa onun da gönderilen isteklerinden kaldır
    if (requestUser) {
      requestUser.sentRequests = requestUser.sentRequests.filter(id => id.toString() !== userId);
      await requestUser.save();
      
      // Socket.IO üzerinden bildirim gönder
      const io = req.app.get('io');
      if (io) {
        // İstek gönderen kullanıcıya ret bildirimi gönder
        io.to(`user:${requestUserId}`).emit('friendRequest', {
          type: 'rejected',
          user: {
            _id: user._id,
            username: user.username,
            email: user.email
          }
        });
      }
    }
    
    res.status(200).json({ message: "Arkadaşlık isteği başarıyla reddedildi." });
    
  } catch (error) {
    console.error("Arkadaşlık isteği reddedilirken hata:", error);
    res.status(500).json({ message: "Arkadaşlık isteği reddedilirken bir hata oluştu." });
  }
};

/**
 * @route DELETE /api/friends/remove/:friendId
 * @desc Arkadaşı kaldır
 * @access Private
 */
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    
    // Kullanıcı ve arkadaşı bul
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Arkadaş listesinde var mı kontrol et
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Bu kullanıcı arkadaşınız değil." });
    }
    
    // Arkadaş listelerinden kaldır
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    await user.save();
    
    // Karşı taraf mevcutsa onun da arkadaş listesinden kaldır
    if (friend) {
      friend.friends = friend.friends.filter(id => id.toString() !== userId);
      await friend.save();
    }
    
    res.status(200).json({ message: "Arkadaş başarıyla kaldırıldı." });
    
  } catch (error) {
    console.error("Arkadaş kaldırılırken hata:", error);
    res.status(500).json({ message: "Arkadaş kaldırılırken bir hata oluştu." });
  }
};

/**
 * @route DELETE /api/friends/cancel-request/:targetUserId
 * @desc Gönderilmiş arkadaşlık isteğini iptal et
 * @access Private
 */
exports.cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.params;
    
    // Kullanıcı ve hedef kullanıcıyı bul
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Gönderilen istek var mı kontrol et
    if (!user.sentRequests.includes(targetUserId)) {
      return res.status(400).json({ message: "Bu kullanıcıya gönderilmiş bir arkadaşlık isteği bulunmamaktadır." });
    }
    
    // İsteği kaldır
    user.sentRequests = user.sentRequests.filter(id => id.toString() !== targetUserId);
    await user.save();
    
    // Karşı taraf mevcutsa onun da gelen isteklerinden kaldır
    if (targetUser) {
      targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== userId);
      await targetUser.save();
    }
    
    res.status(200).json({ message: "Arkadaşlık isteği başarıyla iptal edildi." });
    
  } catch (error) {
    console.error("Arkadaşlık isteği iptal edilirken hata:", error);
    res.status(500).json({ message: "Arkadaşlık isteği iptal edilirken bir hata oluştu." });
  }
};

/**
 * @route GET /api/friends/search/:query
 * @desc Kullanıcı ara
 * @access Private
 */
exports.searchUsers = async (req, res) => {
  try {
    const userId = req.userId;
    const { query } = req.params;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: "Arama sorgusu boş olamaz." });
    }
    
    // Regex kullanarak kullanıcı adına veya e-postaya göre ara
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Kendisi hariç
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email profileImage')
    .limit(10);
    
    res.status(200).json({ users });
    
  } catch (error) {
    console.error("Kullanıcı arama hatası:", error);
    res.status(500).json({ message: "Kullanıcılar aranırken bir hata oluştu." });
  }
};

/**
 * @route GET /api/friends/:friendId/profile
 * @desc Arkadaş profilini getir
 * @access Private
 */
exports.getFriendProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Bu kişinin arkadaşı mı kontrol et
    if (!user.friends.includes(friendId)) {
      return res.status(403).json({ message: "Bu kullanıcının profilini görüntüleme izniniz yok." });
    }
    
    // Arkadaşın profilini getir
    const friend = await User.findById(friendId).select('username email profileImage createdAt');
    
    if (!friend) {
      return res.status(404).json({ message: "Arkadaş bulunamadı." });
    }
    
    res.status(200).json({ user: friend });
    
  } catch (error) {
    console.error("Arkadaş profili getirme hatası:", error);
    res.status(500).json({ message: "Arkadaş profili getirilirken bir hata oluştu." });
  }
};

/**
 * @route GET /api/friends/:friendId/analytics
 * @desc Arkadaş analiz verilerini getir
 * @access Private
 */
exports.getFriendAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    
    // Bu kişinin arkadaşı mı kontrol et
    if (!user.friends.includes(friendId)) {
      return res.status(403).json({ message: "Bu kullanıcının analizlerini görüntüleme izniniz yok." });
    }
    
    // Arkadaşı bul ve analizlerini getir
    const friend = await User.findById(friendId);
    
    if (!friend) {
      return res.status(404).json({ message: "Arkadaş bulunamadı." });
    }
    
    // Toplam analiz sayısı
    const totalAnalyses = friend.analyses.length;
    
    // Son 7 günün analiz sayısı
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const lastWeekAnalyses = friend.analyses.filter(analysis => 
      new Date(analysis.createdAt) >= oneWeekAgo
    ).length;
    
    // Son analizler (en son 10 analiz)
    const recentAnalyses = friend.analyses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(analysis => ({
        _id: analysis._id,
        text: analysis.text,
        translatedText: analysis.translatedText,
        sentiment: analysis.sentiment,
        createdAt: analysis.createdAt
      }));
    
    // Duygu dağılımı
    const sentiments = friend.analyses.map(a => a.sentiment);
    const positiveCount = sentiments.filter(s => s === "Pozitif").length;
    const neutralCount = sentiments.filter(s => s === "Nötr").length;
    const negativeCount = sentiments.filter(s => s === "Negatif").length;
    
    const sentimentDistribution = [
      { name: 'Pozitif', value: positiveCount },
      { name: 'Nötr', value: neutralCount },
      { name: 'Negatif', value: negativeCount }
    ];
    
    // Haftalık veri
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayAnalyses = friend.analyses.filter(analysis => {
        const analysisDate = new Date(analysis.createdAt);
        return analysisDate >= date && analysisDate < nextDate;
      });
      
      const dayPositive = dayAnalyses.filter(a => a.sentiment === "Pozitif").length;
      const dayNeutral = dayAnalyses.filter(a => a.sentiment === "Nötr").length;
      const dayNegative = dayAnalyses.filter(a => a.sentiment === "Negatif").length;
      
      weeklyData.push({
        date: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
        positive: dayPositive,
        neutral: dayNeutral,
        negative: dayNegative
      });
    }
    
    const analyticsData = {
      totalAnalyses,
      lastWeekAnalyses,
      sentimentDistribution,
      weeklyData,
      recentAnalyses
    };
    
    res.status(200).json(analyticsData);
    
  } catch (error) {
    console.error("Arkadaş analitik verisi getirme hatası:", error);
    res.status(500).json({ message: "Arkadaş analiz verileri getirilirken bir hata oluştu." });
  }
};
