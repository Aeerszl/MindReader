//User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  analyses: [
    {
      text: String,
      translatedText: String,
      sentiment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  // Arkadaşlık sistemi için yeni alanlar
  friends: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  friendRequests: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    createdAt: { type: Date, default: Date.now }
  }],
  sentRequests: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', userSchema);
