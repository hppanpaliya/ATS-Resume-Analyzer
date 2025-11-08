import { Router, Request } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AIService } from '../services/ai.service';

const router = Router();
const aiService = new AIService();

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
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
    } catch (error: any) {
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
    } catch (error: any) {
        console.error('Models refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh models',
            details: error.message
        });
    }
});

// POST /api/analyze - Analyze resume
router.post('/analyze', upload.single('resume'), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const jobDescription = req.body.jobDescription;
        const selectedModel = req.body.selectedModel;

        // Extract model parameters from request body (simplified)
        const modelParameters = {
            temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
            max_tokens: req.body.max_tokens ? parseInt(req.body.max_tokens) : undefined,
            include_reasoning: req.body.include_reasoning === 'true' || req.body.include_reasoning === true
        };

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
                const data = await pdfParse(req.file.buffer);
                text = data.text;
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                text = result.value;
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported file type'
                });
            }
        } catch (error: any) {
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
        const analysisResult = await aiService.analyzeResume(text, jobDescription, selectedModel, modelParameters);

        res.json({
            success: true,
            data: analysisResult
        });

    } catch (error: any) {
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
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
});

export default router;