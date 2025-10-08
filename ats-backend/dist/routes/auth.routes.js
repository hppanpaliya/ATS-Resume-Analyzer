"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
const authService = new auth_service_1.AuthService();
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('lastName').optional().isLength({ min: 1, max: 100 }),
], async (req, res) => {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }
        const { email, password, firstName, lastName } = req.body;
        const result = await authService.register(email, password, firstName, lastName);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                },
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            },
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 1 }),
], async (req, res) => {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                },
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            },
        });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
router.post('/refresh', [
    (0, express_validator_1.body)('refreshToken').isLength({ min: 1 }),
], async (req, res) => {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        res.json({
            success: true,
            data: {
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            },
        });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
router.get('/me', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Get user from database
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                subscriptionTier: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map