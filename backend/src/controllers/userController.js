// userController.js
const User = require('../models/User');

/**
 * @route GET /api/user/info
 * @desc Get current user's profile information
 * @access Private
 */
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      user: {
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Kullanıcı bilgileri alınamadı:", error);
    res.status(500).json({ message: "Kullanıcı bilgileri alınırken bir hata oluştu." });
  }
};

/**
 * @route PUT /api/user/updateProfile
 * @desc Update user profile information
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, profileImage } = req.body;

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Kullanıcı adı kontrolü
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
      }
      user.username = username;
    }    // Profil fotoğrafı güncellemesi
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    // User modelini kaydet
    await user.save();
    
    res.status(200).json({
      message: "Profil başarıyla güncellendi.",
      user: {
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    res.status(500).json({ message: "Profil güncellenirken bir hata oluştu." });
  }
};

/**
 * @route GET /api/user/:userId
 * @desc Get specific user's profile information (only for friends)
 * @access Private
 */
exports.getUserDetails = async (req, res) => {
  try {
    const currentUserId = req.userId; // İsteği yapan kullanıcının ID'si
    const targetUserId = req.params.userId; // Hedef kullanıcının ID'si

    // İsteği yapan kullanıcının bilgilerini al
    const currentUser = await User.findById(currentUserId).select('friends');
    if (!currentUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Hedef kullanıcı arkadaş listesinde mi kontrol et
    const isFriend = currentUser.friends.includes(targetUserId);
    
    // Hedef kullanıcı kendisi mi kontrol et
    const isSelf = currentUserId.toString() === targetUserId;

    if (!isFriend && !isSelf) {
      return res.status(403).json({ message: "Bu kullanıcının bilgilerini görüntülemek için arkadaş olmanız gerekiyor." });
    }

    // Hedef kullanıcının bilgilerini al
    const targetUser = await User.findById(targetUserId).select('-password -analyses -friends -friendRequests -sentRequests');
    if (!targetUser) {
      return res.status(404).json({ message: "Hedef kullanıcı bulunamadı." });
    }

    res.status(200).json({
      email: targetUser.email,
      username: targetUser.username,
      profileImage: targetUser.profileImage,
      createdAt: targetUser.createdAt
    });
  } catch (error) {
    console.error("Kullanıcı detayları alınamadı:", error);
    res.status(500).json({ message: "Kullanıcı detayları alınırken bir hata oluştu." });
  }
};
