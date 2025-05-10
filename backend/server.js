const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const analysisRoutes = require('./src/routes/analysisRoutes'); // ✅ yeni satır

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes); // ✅ yeni satır

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB bağlantısı başarılı');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server ${process.env.PORT} portunda çalışıyor`);
    });
  })
  .catch(err => console.log('❌ Mongo bağlantı hatası:', err));
