import { Router, Request } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AIService } from '../services/ai.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const aiService = new AIService();
const prisma = new PrismaClient();

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
router.post('/analyze', authMiddleware, upload.single('resume'), async (req: AuthRequest & { file?: Express.Multer.File }, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const jobDescription = req.body.jobDescription;
        const jobTitle = req.body.jobTitle || 'Untitled Job';
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

        // Save to database in a transaction
        const savedData = await prisma.$transaction(async (tx) => {
            // Create or find job description
            let jobDesc = await tx.jobDescription.findFirst({
                where: {
                    userId: req.userId!,
                    title: jobTitle
                }
            });

            if (!jobDesc) {
                jobDesc = await tx.jobDescription.create({
                    data: {
                        userId: req.userId!,
                        title: jobTitle,
                        description: jobDescription
                    }
                });
            } else {
                // Update existing job description
                jobDesc = await tx.jobDescription.update({
                    where: { id: jobDesc.id },
                    data: {
                        description: jobDescription,
                        updatedAt: new Date()
                    }
                });
            }

            // Create resume record
            const resume = await tx.resume.create({
                data: {
                    userId: req.userId!,
                    title: `Resume for ${jobTitle}`,
                    content: text,
                    extractedText: text,
                    status: 'analyzed'
                }
            });

            // Save analysis result
            const analysis = await tx.analysis.create({
                data: {
                    userId: req.userId!,
                    resumeId: resume.id,
                    jobDescriptionId: jobDesc.id,
                    analysisType: 'ats_analysis',
                    aiProvider: analysisResult.modelUsed?.provider || 'unknown',
                    modelUsed: analysisResult.modelUsed?.id || selectedModel || 'unknown',
                    results: JSON.stringify(analysisResult),
                    status: 'completed',
                    completedAt: new Date(),
                    processingTimeMs: analysisResult.processingTime || null,
                    tokensUsed: analysisResult.tokensUsed || null
                }
            });

            return { jobDesc, resume, analysis };
        });

        res.json({
            success: true,
            data: {
                ...analysisResult,
                savedAnalysisId: savedData.analysis.id,
                savedResumeId: savedData.resume.id,
                savedJobDescriptionId: savedData.jobDesc.id
            }
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

// GET /api/analyses - Get user's analysis history
router.get('/analyses', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [analyses, totalCount] = await Promise.all([
            prisma.analysis.findMany({
                where: { userId: req.userId },
                include: {
                    resume: {
                        select: { id: true, title: true, createdAt: true }
                    },
                    jobDescription: {
                        select: { id: true, title: true, company: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.analysis.count({
                where: { userId: req.userId }
            })
        ]);

        // Parse the results JSON for each analysis
        const formattedAnalyses = analyses.map(analysis => {
            const parsedResults = analysis.results ? JSON.parse(analysis.results) : null;
            return {
                id: analysis.id,
                analysisType: analysis.analysisType,
                aiProvider: analysis.aiProvider,
                modelUsed: analysis.modelUsed,
                status: analysis.status,
                createdAt: analysis.createdAt,
                completedAt: analysis.completedAt,
                processingTimeMs: analysis.processingTimeMs,
                tokensUsed: analysis.tokensUsed,
                resume: analysis.resume,
                jobDescription: analysis.jobDescription,
                jobTitle: analysis.jobDescription?.title || 'Untitled Analysis',
                overallScore: parsedResults?.overallScore || parsedResults?.overall_match_score || null,
                results: parsedResults
            };
        });

        res.json({
            success: true,
            data: {
                analyses: formattedAnalyses,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Get analyses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analyses',
            details: error.message
        });
    }
});

// GET /api/analyses/:id - Get specific analysis
router.get('/analyses/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const analysis = await prisma.analysis.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId
            },
            include: {
                resume: {
                    select: { id: true, title: true, content: true, createdAt: true }
                },
                jobDescription: {
                    select: { id: true, title: true, company: true, description: true }
                }
            }
        });

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: 'Analysis not found'
            });
        }

        const parsedResults = analysis.results ? JSON.parse(analysis.results) : null;

        res.json({
            success: true,
            data: {
                id: analysis.id,
                analysisType: analysis.analysisType,
                aiProvider: analysis.aiProvider,
                modelUsed: analysis.modelUsed,
                status: analysis.status,
                createdAt: analysis.createdAt,
                completedAt: analysis.completedAt,
                processingTimeMs: analysis.processingTimeMs,
                tokensUsed: analysis.tokensUsed,
                resume: analysis.resume,
                jobDescription: analysis.jobDescription,
                jobTitle: analysis.jobDescription?.title || 'Untitled Analysis',
                overallScore: parsedResults?.overallScore || parsedResults?.overall_match_score || null,
                ...parsedResults
            }
        });
    } catch (error: any) {
        console.error('Get analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analysis',
            details: error.message
        });
    }
});

// GET /api/job-descriptions - Get user's job descriptions
router.get('/job-descriptions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const jobDescriptions = await prisma.jobDescription.findMany({
            where: { 
                userId: req.userId,
                deletedAt: null
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json({
            success: true,
            data: jobDescriptions
        });
    } catch (error: any) {
        console.error('Get job descriptions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch job descriptions',
            details: error.message
        });
    }
});

// POST /api/job-descriptions - Create job description
router.post('/job-descriptions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { title, company, location, description, sourceUrl } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        const jobDescription = await prisma.jobDescription.create({
            data: {
                userId: req.userId,
                title,
                company,
                location,
                description,
                sourceUrl
            }
        });

        res.status(201).json({
            success: true,
            data: jobDescription
        });
    } catch (error: any) {
        console.error('Create job description error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create job description',
            details: error.message
        });
    }
});

// PUT /api/job-descriptions/:id - Update job description
router.put('/job-descriptions/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { title, company, location, description, sourceUrl } = req.body;

        const jobDescription = await prisma.jobDescription.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!jobDescription) {
            return res.status(404).json({
                success: false,
                error: 'Job description not found'
            });
        }

        const updatedJobDescription = await prisma.jobDescription.update({
            where: { id: req.params.id },
            data: {
                title,
                company,
                location,
                description,
                sourceUrl,
                updatedAt: new Date()
            }
        });

        res.json({
            success: true,
            data: updatedJobDescription
        });
    } catch (error: any) {
        console.error('Update job description error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update job description',
            details: error.message
        });
    }
});

// DELETE /api/job-descriptions/:id - Delete job description
router.delete('/job-descriptions/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const jobDescription = await prisma.jobDescription.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!jobDescription) {
            return res.status(404).json({
                success: false,
                error: 'Job description not found'
            });
        }

        await prisma.jobDescription.update({
            where: { id: req.params.id },
            data: { deletedAt: new Date() }
        });

        res.json({
            success: true,
            message: 'Job description deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete job description error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete job description',
            details: error.message
        });
    }
});

// GET /api/resumes - Get user's resumes
router.get('/resumes', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const resumes = await prisma.resume.findMany({
            where: { 
                userId: req.userId,
                deletedAt: null
            },
            include: {
                _count: {
                    select: { analyses: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json({
            success: true,
            data: resumes
        });
    } catch (error: any) {
        console.error('Get resumes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resumes',
            details: error.message
        });
    }
});

// GET /api/resumes/:id - Get specific resume
router.get('/resumes/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const resume = await prisma.resume.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                error: 'Resume not found'
            });
        }

        res.json({
            success: true,
            data: resume
        });
    } catch (error: any) {
        console.error('Get resume error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resume',
            details: error.message
        });
    }
});

// PUT /api/resumes/:id - Update resume
router.put('/resumes/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { title, content } = req.body;

        const resume = await prisma.resume.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                error: 'Resume not found'
            });
        }

        const updatedResume = await prisma.resume.update({
            where: { id: req.params.id },
            data: {
                title,
                content,
                extractedText: content,
                updatedAt: new Date()
            }
        });

        res.json({
            success: true,
            data: updatedResume
        });
    } catch (error: any) {
        console.error('Update resume error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update resume',
            details: error.message
        });
    }
});

// DELETE /api/resumes/:id - Delete resume
router.delete('/resumes/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const resume = await prisma.resume.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                error: 'Resume not found'
            });
        }

        await prisma.resume.update({
            where: { id: req.params.id },
            data: { deletedAt: new Date() }
        });

        res.json({
            success: true,
            message: 'Resume deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete resume error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete resume',
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