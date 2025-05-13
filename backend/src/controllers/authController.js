//authController.js
const User   = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Email kontrolü
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Kullanıcı zaten var' });
    
    // Username kontrolü
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ msg: 'Bu kullanıcı adı kullanılıyor' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = new User({ 
      email, 
      username, 
      password: hashed,
      createdAt: new Date()
    });
    
    await user.save();
    res.status(201).json({ msg: 'Kayıt başarılı' });
  } catch (err) {
    console.error('REGISTER HATASI:', err);
    res.status(500).json({ msg: 'Sunucu hatası', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("LOGIN REQUEST BODY:", req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.warn("Kullanıcı bulunamadı:", email);
      return res.status(401).json({ msg: 'Kullanıcı bulunamadı' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.warn("Şifre uyuşmadı:", email);
      return res.status(401).json({ msg: 'Şifre yanlış' });
    }    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Kullanıcı verilerini gönder (şifre hariç)
    return res.status(200).json({ 
      token, 
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("🔴 LOGIN HATASI:", err);
    return res.status(500).json({ msg: 'Sunucu hatası', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId; // Auth middleware'den gelen userId
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Mevcut şifre ve yeni şifre gereklidir." });
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mevcut şifre yanlış." });
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Şifreyi güncelle
    user.password = hashedPassword;
    await user.save();

    console.log(`Şifre başarıyla güncellendi. Kullanıcı: ${user.email}`);
    res.status(200).json({ message: "Şifre başarıyla güncellendi." });
  } catch (error) {
    console.error("Şifre değiştirme hatası:", error);
    res.status(500).json({ message: "Şifre değiştirilirken bir hata oluştu." });
  }
};
