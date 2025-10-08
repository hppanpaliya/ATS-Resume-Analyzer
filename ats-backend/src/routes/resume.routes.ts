import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ResumeService } from '../services/resume.service';

const router = Router();
const resumeService = new ResumeService();

// All routes require authentication
router.use(authMiddleware);

// GET /api/resumes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await resumeService.getResumes(
      req.userId!,
      Number(page) || 1,
      Number(limit) || 10,
      status as string
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/resumes
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, content, templateId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const resume = await resumeService.createResume(
      req.userId!,
      title,
      content,
      templateId
    );

    res.status(201).json({ success: true, data: { resume } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/resumes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.userId!);
    res.json({ success: true, data: { resume } });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// PATCH /api/resumes/:id
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const resume = await resumeService.updateResume(
      req.params.id,
      req.userId!,
      req.body
    );
    res.json({ success: true, data: { resume } });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE /api/resumes/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await resumeService.deleteResume(req.params.id, req.userId!);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;