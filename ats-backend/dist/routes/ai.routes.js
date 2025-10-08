"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const ai_service_1 = require("../services/ai.service");
const router = (0, express_1.Router)();
const aiService = new ai_service_1.AIService();
// Configure multer for file uploads (store in memory)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
        }
    }
});
// GET /api/models - Get available AI models
router.get('/models', async (req, res) => {
    try {
        const models = await aiService.getAvailableModels();
        res.json({
            success: true,
            data: models
        });
    }
    catch (error) {
        console.error('Models fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch models',
            details: error.message
        });
    }
});
// POST /api/models/refresh - Refresh model cache
router.post('/models/refresh', async (req, res) => {
    try {
        const models = await aiService.refreshModelsCache();
        res.json({
            success: true,
            data: models,
            message: 'Model cache refreshed'
        });
    }
    catch (error) {
        console.error('Models refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh models',
            details: error.message
        });
    }
});
// POST /api/analyze - Analyze resume
router.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const jobDescription = req.body.jobDescription;
        const selectedModel = req.body.selectedModel;
        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                error: 'Job description is required'
            });
        }
        // Extract text from file
        let text = '';
        try {
            if (req.file.mimetype === 'application/pdf') {
                const data = await (0, pdf_parse_1.default)(req.file.buffer);
                text = data.text;
            }
            else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth_1.default.extractRawText({ buffer: req.file.buffer });
                text = result.value;
            }
            else {
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported file type'
                });
            }
        }
        catch (error) {
            console.error('File parsing error:', error);
            return res.status(400).json({
                success: false,
                error: 'Failed to parse file',
                details: error.message
            });
        }
        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: 'Resume text is too short or could not be extracted'
            });
        }
        // Analyze with AI
        const analysisResult = await aiService.analyzeResume(text, jobDescription, selectedModel);
        res.json({
            success: true,
            data: analysisResult
        });
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            details: error.message
        });
    }
});
// GET /health - Health check
router.get('/health', async (req, res) => {
    try {
        const health = await aiService.checkHealth();
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai.routes.js.map