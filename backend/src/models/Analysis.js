// models/Analysis.js
const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // userId üzerinde indeks oluştur
    },
    text: {
        type: String,
        required: true
    },
    translatedText: {
        type: String
    },
    language: {
        type: String,
        default: 'auto'
    },
    sentiment: {
        score: Number,
        label: String,
        positive: Number,
        negative: Number,
        neutral: Number
    },
    recommendations: [{
        type: String
    }]
}, {
    timestamps: true
});

// Sorgulama performansını artırmak için bileşik indeks
analysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);