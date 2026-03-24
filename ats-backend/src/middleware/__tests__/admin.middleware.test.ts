import prisma from '../../lib/prisma';
import { adminMiddleware } from '../admin.middleware';
import { TestHelpers } from '../../__tests__/helpers';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('adminMiddleware', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockPrisma = prisma as any;
  });

  it('rejects requests without an authenticated user id', async () => {
    const req = TestHelpers.createMockRequest();
    const res = TestHelpers.createMockResponse();
    const next = TestHelpers.createMockNext();

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects non-admin users', async () => {
    const req = TestHelpers.createMockRequest({ userId: 'user-1' });
    const res = TestHelpers.createMockResponse();
    const next = TestHelpers.createMockNext();

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      subscriptionTier: 'free',
      deletedAt: null,
    });

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows admin users and attaches admin context', async () => {
    const req = TestHelpers.createMockRequest({ userId: 'admin-1' });
    const res = TestHelpers.createMockResponse();
    const next = TestHelpers.createMockNext();

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'admin-1',
      email: 'admin@example.com',
      subscriptionTier: 'admin',
      deletedAt: null,
    });

    await adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.adminUser).toEqual({
      id: 'admin-1',
      email: 'admin@example.com',
      subscriptionTier: 'admin',
    });
  });
});
