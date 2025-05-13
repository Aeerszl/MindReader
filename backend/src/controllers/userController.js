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
