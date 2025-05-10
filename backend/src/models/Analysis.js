// models/Analysis.js
const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    sentiment: {
        score: Number,
        label: String
    },
    recommendations: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Analysis', analysisSchema);