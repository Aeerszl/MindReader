// notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @route GET /api/notifications
 * @desc Kullanıcının bildirimlerini getir
 * @access Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    // Kullanıcının bildirimlerini getir ve göndereni populate et
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    res.status(500).json({ message: 'Bildirimler alınırken bir hata oluştu' });
  }
};

/**
 * @route POST /api/notifications/read/:notificationId
 * @desc Bildirimi okundu olarak işaretle
 * @access Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ message: 'Bildirim okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Bildirim işaretlenirken hata:', error);
    res.status(500).json({ message: 'Bildirim işaretlenirken bir hata oluştu' });
  }
};

/**
 * @route POST /api/notifications/read-all
 * @desc Tüm bildirimleri okundu olarak işaretle
 * @access Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { recipient: userId },
      { $set: { read: true } }
    );

    res.status(200).json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Tüm bildirimler işaretlenirken hata:', error);
    res.status(500).json({ message: 'Bildirimler işaretlenirken bir hata oluştu' });
  }
};

/**
 * @route POST /api/notifications/mood-alert/:friendId
 * @desc Arkadaşın duygu durumu için bildirim oluştur
 * @access Private
 */
exports.createMoodAlert = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    const { moodValue } = req.body;

    // Arkadaşlık durumunu kontrol et
    const user = await User.findById(userId);
    
    if (!user || !user.friends.includes(friendId)) {
      return res.status(403).json({ message: 'Bu kullanıcı arkadaş listenizde değil' });
    }

    // Son 24 saat içinde aynı arkadaştan duygu bildirimi var mı kontrol et
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const existingNotification = await Notification.findOne({
      recipient: userId,
      sender: friendId,
      type: 'MOOD_NEGATIVE',
      createdAt: { $gte: oneDayAgo }
    });

    if (existingNotification) {
      return res.status(200).json({ message: 'Bu arkadaş için zaten bir duygu durumu bildirimi mevcut' });
    }

    // Yeni bildirim oluştur
    const newNotification = new Notification({
      recipient: userId,
      sender: friendId,
      type: 'MOOD_NEGATIVE',
      extraData: { moodValue }
    });

    await newNotification.save();

    res.status(201).json({ 
      message: 'Duygu durumu bildirimi oluşturuldu',
      notification: newNotification
    });
  } catch (error) {
    console.error('Duygu bildirimi oluşturulurken hata:', error);
    res.status(500).json({ message: 'Bildirim oluşturulurken bir hata oluştu' });
  }
};