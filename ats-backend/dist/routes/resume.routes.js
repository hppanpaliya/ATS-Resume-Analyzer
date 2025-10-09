"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const resume_service_1 = require("../services/resume.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const resumeService = new resume_service_1.ResumeService();
const prisma = new client_1.PrismaClient();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// GET /api/resumes
router.get('/', async (req, res) => {
    try {
        const { page, limit, status } = req.query;
        const result = await resumeService.getResumes(req.userId, Number(page) || 1, Number(limit) || 10, status);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/resumes
router.post('/', async (req, res) => {
    try {
        const { title, content, templateId } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content required' });
        }
        const resume = await resumeService.createResume(req.userId, title, content, templateId);
        res.status(201).json({ success: true, data: { resume } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/resumes/:id
router.get('/:id', async (req, res) => {
    try {
        const resume = await resumeService.getResumeById(req.params.id, req.userId);
        res.json({ success: true, data: { resume } });
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
});
// PATCH /api/resumes/:id
router.patch('/:id', async (req, res) => {
    try {
        const resume = await resumeService.updateResume(req.params.id, req.userId, req.body);
        res.json({ success: true, data: { resume } });
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
});
// DELETE /api/resumes/:id
router.delete('/:id', async (req, res) => {
    try {
        await resumeService.deleteResume(req.params.id, req.userId);
        res.status(204).send();
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
});
// GET /api/resumes/:id/export/pdf
router.get('/:id/export/pdf', async (req, res) => {
    try {
        const pdfBuffer = await resumeService.exportToPDF(req.params.id, req.userId);
        console.log('Sending PDF buffer, length:', pdfBuffer.length);
        // Set headers for binary response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume-${req.params.id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        // Send the buffer directly without any transformation
        res.status(200).end(pdfBuffer);
    }
    catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/resumes/:id/export/word
router.get('/:id/export/word', async (req, res) => {
    try {
        const wordBuffer = await resumeService.exportToWord(req.params.id, req.userId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="resume-${req.params.id}.docx"`);
        res.send(wordBuffer);
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
});
// POST /api/resumes/parse
router.post('/parse', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Resume text is required' });
        }
        const parsedResume = await resumeService.parseResumeWithAI(text, req.userId);
        res.json({ success: true, data: parsedResume });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/resumes/:id/preview
router.get('/:id/preview', async (req, res) => {
    try {
        const resume = await prisma.resume.findFirst({
            where: { id: req.params.id, userId: req.userId, deletedAt: null },
            include: { template: true },
        });
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        // Try to parse content as JSON, fallback to plain text
        let structuredContent;
        try {
            structuredContent = typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content;
        }
        catch {
            structuredContent = { text: resume.content };
        }
        const html = resumeService.generateFormattedHTML(structuredContent, resume.template);
        res.send(html);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/resumes/preview
router.post('/preview', async (req, res) => {
    try {
        const { content, templateId } = req.body;
        // Find template if specified
        const template = templateId ? await prisma.template.findUnique({
            where: { id: templateId },
        }) : null;
        const html = resumeService.generateFormattedHTML(content, template);
        res.send(html);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=resume.routes.js.map