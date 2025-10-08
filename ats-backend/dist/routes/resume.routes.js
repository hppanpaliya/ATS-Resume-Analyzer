"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const resume_service_1 = require("../services/resume.service");
const router = (0, express_1.Router)();
const resumeService = new resume_service_1.ResumeService();
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
exports.default = router;
//# sourceMappingURL=resume.routes.js.map