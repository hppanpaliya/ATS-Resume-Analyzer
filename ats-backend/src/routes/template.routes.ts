import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { TemplateService } from '../services/template.service';

const router = Router();
const templateService = new TemplateService();

// All routes require authentication
router.use(authMiddleware);

// GET /api/templates
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { category } = req.query;
    const templates = await templateService.getTemplates(category as string);
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.json({ success: true, data: template });
  } catch (error: any) {
    if (error.message === 'Template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/templates/seed - Seed default templates (admin only)
router.post('/seed', async (req: AuthRequest, res) => {
  try {
    // TODO: Add admin check
    const templates = await templateService.seedDefaultTemplates();
    res.json({ success: true, data: templates, message: `Seeded ${templates.length} templates` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;