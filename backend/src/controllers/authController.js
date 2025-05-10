//authController.js
const User   = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Kullanıcı zaten var' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = new User({ email, password: hashed });
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
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ token, email: user.email });
  } catch (err) {
    console.error("🔴 LOGIN HATASI:", err);
    return res.status(500).json({ msg: 'Sunucu hatası', error: err.message });
  }
};
