// socketService.js
import { io } from 'socket.io-client';

// Socket.IO bağlantı nesnesi
let socket = null;

/**
 * Socket.IO sunucusuna bağlan
 * @param {string} userId - Mevcut kullanıcının ID'si
 * @returns {Object} - Socket.IO bağlantı nesnesi
 */
export const connectSocket = (userId) => {
  if (!socket) {
    // Socket.IO sunucusuna bağlan
    socket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Bağlantı olayları
    socket.on('connect', () => {
      console.log('Socket.IO sunucusuna bağlandı');
      
      // Kullanıcı odasına katıl
      if (userId) {
        socket.emit('joinUserRoom', userId);
      }
    });

    // Bağlantı hatası
    socket.on('connect_error', (error) => {
      console.error('Socket.IO bağlantı hatası:', error);
    });

    // Bağlantı kesildi
    socket.on('disconnect', () => {
      console.log('Socket.IO sunucusu ile bağlantı kesildi');
    });
  }
  
  return socket;
};

/**
 * Socket.IO bağlantısını döndür (eğer varsa)
 * @returns {Object|null} - Socket.IO bağlantı nesnesi
 */
export const getSocket = () => {
  return socket;
};

/**
 * Socket.IO bağlantısını kapat
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Belirli bir olayı dinle
 * @param {string} eventName - Dinlenecek olay adı
 * @param {Function} callback - Olay gerçekleştiğinde çalıştırılacak fonksiyon
 */
export const onSocketEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

/**
 * Bir olayı dinlemeyi bırak
 * @param {string} eventName - Dinlenmeyi bırakılacak olay adı
 * @param {Function} callback - Orijinal callback fonksiyonu
 */
export const offSocketEvent = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
  }
};
