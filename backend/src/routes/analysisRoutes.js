//analysisRoutes.js
const express = require('express');
const router = express.Router();
const { analyzeText, getUserAnalyses, checkStatus, getWeeklyAnalysis, deleteAnalysis } = require('../controllers/analyzeController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/analysis - Analyze text
router.post('/', verifyToken, analyzeText);

// GET /api/analysis - Get user's analysis history
router.get('/', verifyToken, getUserAnalyses);

// GET /api/analysis/status - Check API status (authentication gerekebilir)
router.get('/status', verifyToken, checkStatus);

// GET /api/analysis/weekly - Get user's weekly analysis data
router.get('/weekly', verifyToken, getWeeklyAnalysis);

// DELETE /api/analysis/:analysisId - Delete a specific analysis
router.delete('/:analysisId', verifyToken, deleteAnalysis);

module.exports = router;