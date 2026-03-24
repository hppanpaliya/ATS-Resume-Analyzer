import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { TemplateService } from '../services/template.service';
import prisma from '../lib/prisma';

const router: Router = Router();
const templateService = new TemplateService();

// All routes require authentication
router.use(authMiddleware);

// GET /api/templates
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { category } = req.query;
    const templates = await templateService.getTemplates(category as string);
    res.json({ success: true, data: templates });
  } catch (_error: any) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const template = await templateService.getTemplateById((req.params.id as string));
    res.json({ success: true, data: template });
  } catch (error: any) {
    if (error.message === 'Template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  }
});

// POST /api/templates/seed - Seed default templates (admin only)
router.post('/seed', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId as string }, // Fixed param cast for req.userId
      select: { subscriptionTier: true },
    });

    if (!user || user.subscriptionTier !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const templates = await templateService.seedDefaultTemplates();
    res.json({ success: true, data: templates, message: `Seeded ${templates.length} templates` });
  } catch (_error: any) {
    res.status(500).json({ error: 'Failed to seed templates' });
  }
});

export default router;
