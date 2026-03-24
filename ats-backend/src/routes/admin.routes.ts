import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware';
import { AdminRequest, adminMiddleware } from '../middleware/admin.middleware';
import { AdminService } from '../services/admin.service';
import { AppError } from '../utils/errors';

const router: Router = Router();
const adminService = new AdminService();

const sendAdminError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message || fallbackMessage });
  }

  return res.status(500).json({ error: fallbackMessage });
};

const getAuditContext = (req: AdminRequest) => ({
  actorUserId: req.adminUser!.id,
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || undefined,
  requestId: (req as any).id,
});

router.use(authMiddleware, adminMiddleware);

router.get(
  '/users',
  [
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid query', details: errors.array() });
      }

      const result = await adminService.listUsers({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return sendAdminError(res, error, 'Failed to load users');
    }
  }
);

router.get('/users/:userId', async (req: AdminRequest, res: Response) => {
  try {
    const result = await adminService.getUserDetail(req.params.userId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendAdminError(res, error, 'Failed to load user details');
  }
});

router.patch(
  '/users/:userId',
  [
    body('email').optional().isEmail(),
    body('firstName').optional({ nullable: true }).isLength({ min: 0, max: 100 }),
    body('lastName').optional({ nullable: true }).isLength({ min: 0, max: 100 }),
    body('phone').optional({ nullable: true }).isLength({ min: 0, max: 30 }),
    body('subscriptionTier').optional().isLength({ min: 1, max: 50 }),
    body('emailVerified').optional().isBoolean(),
    body('deleted').optional().isBoolean(),
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const updatedUser = await adminService.updateUser(
        req.params.userId,
        req.body,
        getAuditContext(req)
      );

      return res.json({
        success: true,
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      return sendAdminError(res, error, 'Failed to update user');
    }
  }
);

router.post(
  '/users/:userId/password',
  [body('password').isLength({ min: 8 })],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const result = await adminService.setUserPassword(
        req.params.userId,
        req.body.password,
        getAuditContext(req)
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return sendAdminError(res, error, 'Failed to reset password');
    }
  }
);

router.post('/users/:userId/revoke-sessions', async (req: AdminRequest, res: Response) => {
  try {
    const result = await adminService.revokeUserSessions(
      req.params.userId,
      getAuditContext(req)
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendAdminError(res, error, 'Failed to revoke sessions');
  }
});

export default router;
