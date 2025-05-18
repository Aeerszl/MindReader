const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Debug environment variables
console.log('Environment Variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI);

const authRoutes = require('./src/routes/authRoutes');
const analysisRoutes = require('./src/routes/analysisRoutes');
const userRoutes = require('./src/routes/userRoutes');
const friendRoutes = require('./src/routes/friendRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React app default port
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// İstek boyutu sınırlamasını artır
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/user', userRoutes);
app.use('/api/friends', friendRoutes);

// Socket.IO bağlantı işleyicisi
io.on('connection', (socket) => {
  console.log('⚡ Yeni bir kullanıcı bağlandı:', socket.id);
  
  // Kullanıcıyı belirli bir odaya katılmak için
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`🔌 ${socket.id} kullanıcısı 'user:${userId}' odasına katıldı`);
    }
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    console.log('🔴 Kullanıcı bağlantısı kesildi:', socket.id);
  });
});

// Socket.IO nesnesini dışa aktar
app.set('io', io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB bağlantısı başarılı');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server ${process.env.PORT} portunda çalışıyor`);
    });
  })
  .catch(err => console.log('❌ Mongo bağlantı hatası:', err));