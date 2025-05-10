//analysisRoutes.js
const express = require('express');
const router = express.Router();
const { analyzeText, getUserAnalyses, checkStatus } = require('../controllers/analyzeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// POST /api/analysis - Analyze text
router.post('/', analyzeText);

// GET /api/analysis - Get user's analysis history
router.get('/', getUserAnalyses);

// GET /api/analysis/status - Check API status (authentication gerekebilir)
router.get('/status', checkStatus);

module.exports = router;